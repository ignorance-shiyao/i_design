import { createBem, createId, cx } from '@i-design/core';
import { defineComponent, h, type VNode } from 'vue';

const bem = createBem('form-item');

export const FormItem = defineComponent({
  name: 'IFormItem',
  props: {
    label: String,
    help: String,
    error: String,
    required: Boolean,
    htmlFor: String,
  },
  setup(props, { slots }) {
    const generated = createId('i-field');

    return () => {
      const controlId = props.htmlFor ?? generated;
      const helpId = `${controlId}-help`;
      const message = props.error ?? props.help;
      const children = (slots.default?.() ?? []) as VNode[];

      // Push the id / aria-describedby down onto the single control child,
      // mirroring what the React FormItem does with cloneElement.
      const control = children.map((child) =>
        typeof child.type === 'object'
          ? { ...child, props: { ...child.props, id: child.props?.id ?? controlId, describedBy: message ? helpId : undefined } }
          : child,
      );

      return h('div', { class: cx(bem(), { [bem(null, 'error')]: !!props.error }) }, [
        props.label
          ? h('label', { class: cx(bem('label'), { [bem('label', 'required')]: props.required }), for: controlId }, props.label)
          : null,
        control,
        message
          ? h('div', { class: bem('help'), id: helpId, role: props.error ? 'alert' : undefined }, message)
          : null,
      ]);
    };
  },
});
