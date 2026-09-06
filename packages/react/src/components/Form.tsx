import { FormStore, type FormState, type FormStoreOptions } from '@i-design/core';
import {
  createContext, useContext, useMemo, useRef, useSyncExternalStore,
  type FormEvent, type ReactNode,
} from 'react';
import { FormItem } from './FormItem.js';

export interface UseFormResult<Values extends Record<string, unknown>> {
  store: FormStore<Values>;
  state: FormState<Values>;
  submit: () => Promise<boolean>;
  reset: (values?: Partial<Values>) => void;
  isDirty: boolean;
}

/**
 * The store lives in core; this hook only wires it to React's scheduler through
 * `useSyncExternalStore`, so validation semantics are identical to Vue's.
 */
export function useForm<Values extends Record<string, unknown>>(
  options: FormStoreOptions<Values>,
): UseFormResult<Values> {
  const ref = useRef<FormStore<Values>>();
  ref.current ??= new FormStore<Values>(options);
  const store = ref.current;

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  return useMemo(
    () => ({ store, state, submit: store.submit, reset: store.reset, isDirty: store.isDirty() }),
    [store, state],
  );
}

const FormContext = createContext<FormStore<Record<string, unknown>> | null>(null);

export interface FormProps<Values extends Record<string, unknown>> {
  form: UseFormResult<Values>;
  className?: string;
  children?: ReactNode;
}

export function Form<Values extends Record<string, unknown>>({ form, className, children }: FormProps<Values>) {
  return (
    <FormContext.Provider value={form.store as unknown as FormStore<Record<string, unknown>>}>
      <form
        className={className}
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void form.submit();
        }}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

export interface FieldRenderProps<V> {
  value: V;
  error?: string;
  onChange: (value: V) => void;
  onBlur: () => void;
}

export interface FormFieldProps<V> {
  name: string;
  label?: ReactNode;
  help?: ReactNode;
  required?: boolean;
  children: (field: FieldRenderProps<V>) => ReactNode;
}

/**
 * Render-prop field: it owns the wiring (value, error, blur) and leaves the
 * control entirely to the caller, so any component — ours or theirs — can be used.
 */
export function FormField<V = unknown>({ name, label, help, required, children }: FormFieldProps<V>) {
  const store = useContext(FormContext);
  if (!store) throw new Error('<FormField> must be used inside a <Form>');

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const error = state.touched[name] ? state.errors[name] : undefined;

  return (
    <FormItem label={label} help={help} error={error} required={required}>
      {children({
        value: state.values[name] as V,
        error,
        onChange: (value: V) => store.setFieldValue(name, value as never),
        onBlur: () => store.touch(name),
      }) as never}
    </FormItem>
  );
}
