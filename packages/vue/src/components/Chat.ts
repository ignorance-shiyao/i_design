import {
  createId, isAtBottom, useChatMessage, useCodeBlock, usePromptInput, useSuggestions,
  useThinkingBlock, useTypingIndicator,
  type ChatRole, type ChatStatus,
} from '@i-design/core';
import { defineComponent, h, nextTick, onMounted, onUpdated, ref, type PropType } from 'vue';
import { toProps } from '../utils.js';

const ROLE_INITIAL: Record<ChatRole, string> = { user: '你', assistant: 'AI', system: '·' };

export const ChatMessage = defineComponent({
  name: 'IChatMessage',
  props: {
    role: { type: String as PropType<ChatRole>, required: true },
    status: { type: String as PropType<ChatStatus>, default: 'complete' },
    name: String,
    time: String,
    plain: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useChatMessage(props);
      return h('div', toProps(behavior.root), [
        props.role !== 'system'
          ? h('span', toProps(behavior.avatar), slots.avatar?.() ?? ROLE_INITIAL[props.role])
          : null,
        h('div', toProps(behavior.body), [
          props.name || props.time
            ? h('div', toProps(behavior.header), [props.name, props.time ? h('span', props.time) : null])
            : null,
          h('div', toProps(behavior.bubble), slots.default?.()),
          slots.actions ? h('div', toProps(behavior.actions), slots.actions()) : null,
        ]),
      ]);
    };
  },
});

export const ChatAction = defineComponent({
  name: 'IChatAction',
  props: { label: { type: String, required: true } },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => {
      const behavior = useChatMessage({ role: 'assistant' });
      return h(
        'button',
        toProps(behavior.action(props.label, () => emit('click'))),
        slots.default?.() ?? props.label,
      );
    };
  },
});

export const TypingIndicator = defineComponent({
  name: 'ITypingIndicator',
  props: { label: String },
  setup(props) {
    return () => {
      const behavior = useTypingIndicator(props);
      return h('span', toProps(behavior.root), [0, 1, 2].map((index) => h('span', toProps(behavior.dot(index)))));
    };
  },
});

export const ThinkingBlock = defineComponent({
  name: 'IThinkingBlock',
  props: {
    label: { type: String, default: '推理过程' },
    defaultOpen: Boolean,
  },
  setup(props, { slots }) {
    const open = ref(props.defaultOpen);
    const id = createId('i-thinking');
    return () => {
      const behavior = useThinkingBlock({ open: open.value, id, onToggle: () => (open.value = !open.value) });
      return h('div', toProps(behavior.root), [
        h('button', toProps(behavior.trigger), [h('span', open.value ? '▾' : '▸'), props.label]),
        h('div', toProps(behavior.panel), slots.default?.()),
      ]);
    };
  },
});

export const CodeBlock = defineComponent({
  name: 'ICodeBlock',
  props: {
    code: { type: String, required: true },
    language: { type: String, default: 'text' },
  },
  setup(props) {
    const copied = ref(false);
    return () => {
      const behavior = useCodeBlock({
        language: props.language,
        copied: copied.value,
        onCopy: () => {
          void navigator.clipboard?.writeText(props.code);
          copied.value = true;
          setTimeout(() => (copied.value = false), 1600);
        },
      });
      return h('div', toProps(behavior.root), [
        h('div', toProps(behavior.header), [
          h('span', props.language),
          h('button', toProps(behavior.copy), copied.value ? '已复制' : '复制'),
        ]),
        h('pre', toProps(behavior.pre), [h('code', props.code)]),
      ]);
    };
  },
});

export const Suggestions = defineComponent({
  name: 'ISuggestions',
  props: { items: { type: Array as PropType<string[]>, required: true } },
  emits: ['pick'],
  setup(props, { emit }) {
    return () => {
      const behavior = useSuggestions({ onPick: (value: string) => emit('pick', value) });
      return h(
        'div',
        toProps(behavior.root),
        props.items.map((item) => h('button', toProps(behavior.item(item)), item)),
      );
    };
  },
});

export const PromptInput = defineComponent({
  name: 'IPromptInput',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '' },
    placeholder: String,
    disabled: Boolean,
    busy: Boolean,
    maxlength: Number,
    minRows: { type: Number, default: 1 },
    maxRows: { type: Number, default: 10 },
    hint: String,
  },
  emits: ['update:modelValue', 'submit', 'stop'],
  setup(props, { slots, emit }) {
    const internal = ref(props.defaultValue);
    const el = ref<HTMLTextAreaElement | null>(null);
    const current = () => props.modelValue ?? internal.value;

    const setValue = (next: string): void => {
      if (props.modelValue === undefined) internal.value = next;
      emit('update:modelValue', next);
    };

    // Kept from the last render so the mount hook can size the box exactly the
    // way React's effect does — otherwise the two adapters differ on first paint.
    let autosizeHeight: ((scrollHeight: number, lineHeight: number) => number) | null = null;

    const resize = (measure = autosizeHeight): void => {
      const node = el.value;
      if (!node || !measure) return;
      node.style.height = 'auto';
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight) || 22;
      node.style.height = `${measure(node.scrollHeight, lineHeight)}px`;
    };

    onMounted(() => resize());

    return () => {
      const behavior = usePromptInput({
        value: current(),
        placeholder: props.placeholder,
        disabled: props.disabled,
        busy: props.busy,
        maxlength: props.maxlength,
        minRows: props.minRows,
        maxRows: props.maxRows,
        onInput: (next: string) => {
          setValue(next);
          nextTick(() => resize());
        },
        onSubmit: (text: string) => {
          emit('submit', text);
          setValue('');
          nextTick(() => resize());
        },
        onStop: () => emit('stop'),
      });

      autosizeHeight = behavior.autosizeHeight;

      return h('div', toProps(behavior.root), [
        h('textarea', { ...toProps(behavior.textarea), ref: el }),
        h('div', toProps(behavior.toolbar), [
          h('span', { class: 'i-prompt__hint' }, slots.hint?.() ?? props.hint),
          h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } }, [
            slots.toolbar?.(),
            h('button', toProps(behavior.send), props.busy ? '■' : '↑'),
          ]),
        ]),
      ]);
    };
  },
});

export const Chat = defineComponent({
  name: 'IChat',
  setup(_, { slots }) {
    const scroller = ref<HTMLElement | null>(null);
    let stick = true;

    const scrollToEnd = (): void => {
      const node = scroller.value;
      if (node && stick) node.scrollTop = node.scrollHeight;
    };
    onUpdated(() => nextTick(scrollToEnd));

    return () =>
      h('div', { class: 'i-chat' }, [
        h(
          'div',
          {
            class: 'i-chat__scroll',
            ref: scroller,
            onScroll: (event: Event) => {
              const node = event.currentTarget as HTMLElement;
              // Following stops the moment the reader scrolls up, and resumes at the bottom.
              stick = isAtBottom({
                scrollTop: node.scrollTop,
                scrollHeight: node.scrollHeight,
                clientHeight: node.clientHeight,
              });
            },
          },
          slots.default?.(),
        ),
        slots.footer ? h('div', { class: 'i-chat__footer' }, slots.footer()) : null,
      ]);
  },
});
