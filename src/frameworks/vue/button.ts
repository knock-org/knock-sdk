import { defineComponent, h, type PropType } from 'vue';
import { useKnock } from './use-knock.js';

export const KnockButton = defineComponent({
  name: 'KnockButton',
  inheritAttrs: false,
  props: {
    /** Omit to open your workspace's default Knock modal. */
    magicLinkId: { type: String as PropType<string | undefined>, default: undefined },
    email: { type: String as PropType<string | undefined>, default: undefined },
  },
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const knock = useKnock();

    /** Hover or focus loads the scheduling modal, so a click opens it with times already there. */
    function prewarm(): void {
      if (props.magicLinkId) knock.scheduling.load({ magicLinkId: props.magicLinkId, email: props.email });
    }

    function onClick(event: MouseEvent): void {
      emit('click', event);
      knock.modal.open({ magicLinkId: props.magicLinkId, email: props.email });
    }

    return () =>
      h('button', { type: 'button', ...attrs, onClick, onPointerenter: prewarm, onFocus: prewarm }, slots.default ? slots.default() : undefined);
  },
});
