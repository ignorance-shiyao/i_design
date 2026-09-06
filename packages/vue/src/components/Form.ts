import { FormStore, type FormState, type FormStoreOptions } from '@i-design/core';
import {
  computed, defineComponent, h, inject, onScopeDispose, provide, shallowRef,
  type ComputedRef, type PropType,
} from 'vue';
import { FormItem } from './FormItem.js';

export interface UseFormResult<Values extends Record<string, unknown>> {
  store: FormStore<Values>;
  state: ComputedRef<FormState<Values>>;
  submit: () => Promise<boolean>;
  reset: (values?: Partial<Values>) => void;
  isDirty: ComputedRef<boolean>;
}

/**
 * Vue side of the same core store: a `shallowRef` mirrors the snapshot, so the
 * validation rules, triggers and submit flow are byte-identical to React's.
 */
export function useForm<Values extends Record<string, unknown>>(
  options: FormStoreOptions<Values>,
): UseFormResult<Values> {
  const store = new FormStore<Values>(options);
  const snapshot = shallowRef(store.getState());
  const unsubscribe = store.subscribe(() => {
    snapshot.value = store.getState();
  });
  onScopeDispose(() => unsubscribe());

  return {
    store,
    state: computed(() => snapshot.value),
    submit: store.submit,
    reset: store.reset,
    isDirty: computed(() => {
      void snapshot.value;
      return store.isDirty();
    }),
  };
}

const FORM_KEY = Symbol('i-design-form');

export const Form = defineComponent({
  name: 'IForm',
  props: {
    form: { type: Object as PropType<UseFormResult<Record<string, unknown>>>, required: true },
  },
  setup(props, { slots }) {
    provide(FORM_KEY, props.form);
    return () =>
      h(
        'form',
        {
          novalidate: true,
          onSubmit: (event: Event) => {
            event.preventDefault();
            void props.form.submit();
          },
        },
        slots.default?.(),
      );
  },
});

export const FormField = defineComponent({
  name: 'IFormField',
  props: {
    name: { type: String, required: true },
    label: String,
    help: String,
    required: Boolean,
  },
  setup(props, { slots }) {
    const form = inject<UseFormResult<Record<string, unknown>> | null>(FORM_KEY, null);
    if (!form) throw new Error('<IFormField> must be used inside an <IForm>');

    return () => {
      const state = form.state.value;
      const error = state.touched[props.name] ? state.errors[props.name] : undefined;

      return h(
        FormItem,
        { label: props.label, help: props.help, error, required: props.required },
        () =>
          slots.default?.({
            value: state.values[props.name],
            error,
            onChange: (value: unknown) => form.store.setFieldValue(props.name, value),
            onBlur: () => form.store.touch(props.name),
          }),
      );
    };
  },
});
