import React, { memo, useRef } from 'react';
import { Transition } from 'react-transition-group';
import type { TransitionProps } from 'react-transition-group/Transition';
import { PositionedTagSvgDataT } from 'types/types';
import { formTagTransformStyle } from './styleUtils';

const ANIMATION_DURATION = 300;

const staticStyle: React.CSSProperties = {
  transition: `all ${ANIMATION_DURATION}ms ease-in-out`,
  opacity: 0,
};

const getTagCursorStyle = (isTagDraggingDisabled: boolean): React.CSSProperties => ({
  cursor: isTagDraggingDisabled ? 'default' : 'grab',
});

type Props = {
  tag: PositionedTagSvgDataT;
  className: string;
  isHidden: boolean;
  isTagDraggingDisabled: boolean;
};

type TransitionGroupInjectedProps = Omit<TransitionProps, 'timeout' | 'nodeRef' | 'children'>;

export const TagTextTransition = memo(
  ({
    tag,
    className,
    isHidden,
    isTagDraggingDisabled,
    ...transitionGroupProps
  }: Props & TransitionGroupInjectedProps) => {
    const nodeRef = useRef<SVGTextElement | null>(null);

    const style: React.CSSProperties = {
      fontSize: `${tag.fontSize}px`,
      fill: tag.color,
      ...(isHidden ? { visibility: 'hidden' } : null),
    };

    const transitionStyles: Record<string, React.CSSProperties> = {
      exited: {
        opacity: 0,
        transform: formTagTransformStyle({
          translateX: tag.rectTranslateX,
          translateY: tag.rectTranslateY,
          isRotated: tag.rotate,
        }),
      },
      entering: {
        opacity: 0,
        transform: formTagTransformStyle({
          translateX: tag.rectTranslateX,
          translateY: tag.rectTranslateY,
          isRotated: tag.rotate,
          scale: 0.1,
        }),
      },
      entered: {
        opacity: 1,
        transform: formTagTransformStyle({
          translateX: tag.rectTranslateX,
          translateY: tag.rectTranslateY,
          isRotated: tag.rotate,
        }),
      },
    };

    return (
      <Transition
        nodeRef={nodeRef as unknown as React.RefObject<HTMLElement>}
        timeout={ANIMATION_DURATION}
        {...transitionGroupProps}
      >
        {(state) => (
          <text
            className={className}
            data-id={tag.id}
            data-state={state}
            ref={nodeRef}
            style={{
              ...style,
              ...staticStyle,
              ...transitionStyles[state],
              ...getTagCursorStyle(isTagDraggingDisabled),
            }}
            textAnchor="middle"
          >
            {tag.label}
          </text>
        )}
      </Transition>
    );
  },
);

TagTextTransition.displayName = 'TagTextTransition';
