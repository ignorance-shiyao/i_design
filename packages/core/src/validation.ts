/**
 * Validation rules. Deliberately data-shaped rather than a schema DSL: rules are
 * serialisable, so the same array can come from a config file or a server.
 */
export interface Rule<V = unknown, Values = Record<string, unknown>> {
  required?: boolean;
  /** Minimum length for strings/arrays, minimum value for numbers. */
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  /** Return an error string (or a Promise of one) to fail; `null`/`undefined` passes. */
  validator?: (value: V, values: Values) => string | null | undefined | Promise<string | null | undefined>;
  message?: string;
  /** When this rule runs. Defaults to both. */
  trigger?: 'change' | 'blur' | 'submit';
}

export interface ValidationMessages {
  required: string;
  min: string;
  max: string;
  len: string;
  pattern: string;
}

export const defaultMessages: ValidationMessages = {
  required: '此项为必填项',
  min: '不能少于 {min}',
  max: '不能多于 {max}',
  len: '长度必须为 {len}',
  pattern: '格式不正确',
};

export const enMessages: ValidationMessages = {
  required: 'This field is required',
  min: 'Must be at least {min}',
  max: 'Must be at most {max}',
  len: 'Must be exactly {len}',
  pattern: 'Invalid format',
};

const format = (template: string, params: Record<string, unknown>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

const sizeOf = (value: unknown): number =>
  typeof value === 'number' ? value : Array.isArray(value) ? value.length : String(value ?? '').length;

/** Runs one field's rules in order and returns the first error, or null. */
export async function validateValue<V, Values>(
  value: V,
  rules: Rule<V, Values>[],
  values: Values,
  messages: ValidationMessages = defaultMessages,
  trigger?: Rule['trigger'],
): Promise<string | null> {
  for (const rule of rules) {
    if (trigger && rule.trigger && rule.trigger !== trigger) continue;

    if (rule.required && isEmpty(value)) return rule.message ?? messages.required;
    // Every other rule is skipped for empty values: "optional but must be an
    // email if present" is the common case, and requiring it is `required`'s job.
    if (isEmpty(value)) continue;

    if (rule.min !== undefined && sizeOf(value) < rule.min) {
      return rule.message ?? format(messages.min, { min: rule.min });
    }
    if (rule.max !== undefined && sizeOf(value) > rule.max) {
      return rule.message ?? format(messages.max, { max: rule.max });
    }
    if (rule.len !== undefined && sizeOf(value) !== rule.len) {
      return rule.message ?? format(messages.len, { len: rule.len });
    }
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return rule.message ?? messages.pattern;
    }
    if (rule.validator) {
      const result = await rule.validator(value, values);
      if (result) return result;
    }
  }
  return null;
}

export type FormRules<Values> = { [K in keyof Values]?: Rule<Values[K], Values>[] };

export interface FormState<Values> {
  values: Values;
  errors: Partial<Record<keyof Values, string>>;
  touched: Partial<Record<keyof Values, boolean>>;
  validating: boolean;
  submitting: boolean;
}

export interface FormStoreOptions<Values> {
  initialValues: Values;
  rules?: FormRules<Values>;
  messages?: ValidationMessages;
  /** Validate a field as soon as it changes, instead of only on blur/submit. */
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: Values) => void | Promise<void>;
}

/**
 * A tiny observable store. React subscribes with `useSyncExternalStore`, Vue with
 * a `shallowRef` — the validation logic, dirty tracking and submit flow are shared,
 * which is what keeps the two Form implementations honest.
 */
export class FormStore<Values extends Record<string, unknown>> {
  private state: FormState<Values>;
  private readonly listeners = new Set<() => void>();
  private readonly options: FormStoreOptions<Values>;
  private readonly initial: Values;

  constructor(options: FormStoreOptions<Values>) {
    this.options = options;
    this.initial = { ...options.initialValues };
    this.state = {
      values: { ...options.initialValues },
      errors: {},
      touched: {},
      validating: false,
      submitting: false,
    };
  }

  getState = (): FormState<Values> => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(patch: Partial<FormState<Values>>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  getFieldValue = <K extends keyof Values>(name: K): Values[K] => this.state.values[name];

  setFieldValue = <K extends keyof Values>(name: K, value: Values[K]): void => {
    this.emit({ values: { ...this.state.values, [name]: value } });
    if (this.options.validateOnChange ?? true) void this.validateField(name, 'change');
  };

  setFieldError = <K extends keyof Values>(name: K, error: string | null): void => {
    const errors = { ...this.state.errors };
    if (error) errors[name] = error;
    else delete errors[name];
    this.emit({ errors });
  };

  /** Call from a field's blur handler. */
  touch = <K extends keyof Values>(name: K): void => {
    this.emit({ touched: { ...this.state.touched, [name]: true } });
    if (this.options.validateOnBlur ?? true) void this.validateField(name, 'blur');
  };

  validateField = async <K extends keyof Values>(name: K, trigger?: Rule['trigger']): Promise<string | null> => {
    const rules = this.options.rules?.[name];
    if (!rules?.length) return null;
    this.emit({ validating: true });
    const error = await validateValue(
      this.state.values[name],
      rules as Rule<Values[K], Values>[],
      this.state.values,
      this.options.messages,
      trigger,
    );
    this.setFieldError(name, error);
    this.emit({ validating: false });
    return error;
  };

  validate = async (): Promise<boolean> => {
    const names = Object.keys(this.options.rules ?? {}) as (keyof Values)[];
    this.emit({ validating: true });
    const results = await Promise.all(
      names.map(async (name) => {
        const rules = this.options.rules?.[name] as Rule<Values[keyof Values], Values>[] | undefined;
        if (!rules?.length) return [name, null] as const;
        const error = await validateValue(
          this.state.values[name],
          rules,
          this.state.values,
          this.options.messages,
        );
        return [name, error] as const;
      }),
    );

    const errors: Partial<Record<keyof Values, string>> = {};
    const touched: Partial<Record<keyof Values, boolean>> = { ...this.state.touched };
    for (const [name, error] of results) {
      if (error) errors[name] = error;
      touched[name] = true;
    }
    this.emit({ errors, touched, validating: false });
    return Object.keys(errors).length === 0;
  };

  submit = async (): Promise<boolean> => {
    this.emit({ submitting: true });
    try {
      const valid = await this.validate();
      if (valid) await this.options.onSubmit?.(this.state.values);
      return valid;
    } finally {
      this.emit({ submitting: false });
    }
  };

  reset = (values?: Partial<Values>): void => {
    this.state = {
      values: { ...this.initial, ...values },
      errors: {},
      touched: {},
      validating: false,
      submitting: false,
    };
    for (const listener of this.listeners) listener();
  };

  /** True when any value differs from the initial one. */
  isDirty = (): boolean =>
    (Object.keys(this.state.values) as (keyof Values)[]).some(
      (key) => this.state.values[key] !== this.initial[key],
    );
}
