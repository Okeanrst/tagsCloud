import React, { useRef } from 'react';
import { Transition, TransitionGroup } from 'react-transition-group';
import { makeStyles, Theme } from '@material-ui/core';
import { FontFamilies } from 'constants/index';
import { PositionedTagSvgDataT, SizeT, ViewBoxT } from 'types/types';
import { formTagTransformStyle } from './styleUtils';
import { TAGS_CLOUD_CANVAS_Z_INDEX } from './constants';
import { DraggableTagT } from './types';

type StylesOptionsT = { fontFamily: FontFamilies };
type PropsT = {
  fontFamily: FontFamilies;
  viewBox: ViewBoxT;
  transform: string;
  svgSize: SizeT;
  tagEndIndexToShow: number;
  positionedTagSvgData: ReadonlyArray<PositionedTagSvgDataT>;
  draggableTag: DraggableTagT | null;
};

const ANIMATION_DURATION = 300;

const tagStyle = {
  transition: `all ${ANIMATION_DURATION}ms ease-in-out`,
  opacity: 0,
  cursor: 'pointer',
};

const useStyles = makeStyles<Theme, StylesOptionsT>({
  root: {
    position: 'relative',
    zIndex: TAGS_CLOUD_CANVAS_Z_INDEX,
    fontFamily: ({ fontFamily }) => fontFamily,
  },
  text: {
    'white-space': 'pre',
    'user-select': 'none',
    '-webkit-user-select': 'none',
  },
});

export const Tags = ({
  fontFamily,
  viewBox,
  transform,
  svgSize,
  tagEndIndexToShow,
  positionedTagSvgData,
  draggableTag,
}: PropsT) => {
  const classes = useStyles({ fontFamily });
  const textRefs = useRef<Record<string, { current: SVGTextElement | null }>>({});
  return (
    <svg {...svgSize} className={classes.root} viewBox={viewBox.join(' ')}>
      <g transform={transform}>
        <TransitionGroup appear enter className="tagsCloud" component={null} exite={false}>
          {(tagEndIndexToShow === -1 ? positionedTagSvgData : positionedTagSvgData.slice(0, tagEndIndexToShow)).map(
            (i, index: number) => {
              const style: React.CSSProperties = {
                fontSize: `${i.fontSize}px`,
                fill: i.color,
              };
              if (draggableTag && draggableTag.id === i.id) {
                style.visibility = 'hidden';
              }
              const transitionStyles: { [key: string]: React.CSSProperties } = {
                exited: {
                  opacity: 0,
                  transform: formTagTransformStyle({
                    translateX: i.rectTranslateX,
                    translateY: i.rectTranslateY,
                    isRotated: i.rotate,
                  }),
                },
                entering: {
                  opacity: 0,
                  transform: formTagTransformStyle({
                    translateX: i.rectTranslateX,
                    translateY: i.rectTranslateY,
                    isRotated: i.rotate,
                    scale: 0.1,
                  }),
                },
                entered: {
                  opacity: 1,
                  transform: formTagTransformStyle({
                    translateX: i.rectTranslateX,
                    translateY: i.rectTranslateY,
                    isRotated: i.rotate,
                  }),
                },
              };

              const key = i.id + i.rectLeft + i.rectTop;

              if (!textRefs.current[key]) {
                textRefs.current[key] = { current: null };
              }
              const nodeRef = textRefs.current[key];

              return (
                <Transition
                  key={key}
                  // @ts-ignore
                  nodeRef={nodeRef}
                  timeout={ANIMATION_DURATION}
                >
                  {(state) => {
                    return (
                      <text
                        className={classes.text}
                        data-id={i.id}
                        key={`${i.id}_${index}`}
                        ref={nodeRef}
                        style={{
                          ...style,
                          ...tagStyle,
                          ...transitionStyles[state],
                        }}
                        textAnchor="middle"
                      >
                        {i.label}
                      </text>
                    );
                  }}
                </Transition>
              );
            },
          )}
        </TransitionGroup>
      </g>
    </svg>
  );
};
