import { withStyles } from '@material-ui/core';
import { Transition, TransitionGroup } from 'react-transition-group';
import {
  getTagsSvgData,
  calcAllowedWidth,
} from 'utilities/tagsCloud/tagsCloud';
import { PADDING } from '../constants';

import type { PositionedTagRectT } from 'types/types';
import React from 'react';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  width: number;
  onTagClick: (id: string) => void;
  classes: {
    text: string;
  };
};

const styles = {
  text: {
    'white-space': 'pre',
  },
};

const DURATION = 500;

const DEFAULT_STYLE = {
  transition: `all ${DURATION}ms ease-in-out`,
  opacity: 0,
};

const TagsCloud = ({ tagData, width, onTagClick, classes }: PropsT) => {
  const allowedWidth = calcAllowedWidth(width);

  const result = getTagsSvgData(tagData, allowedWidth);

  if (!result) {
    return null;
  }

  const {
    maxRight,
    minLeft,
    minBottom,
    maxTop,
    data: positionedTagSvgData,
  } = result;

  const sceneWidth = (maxRight - minLeft) * PADDING;
  const sceneHeight = (maxTop - minBottom) * PADDING;

  const axisXOffset = -minLeft + (sceneWidth * (PADDING - 1)) / 2;
  const axisYOffset = maxTop + (sceneHeight * (PADDING - 1)) / 2;

  return (
    <div style={{ display: 'inline-block' }}>
      <svg id="small_cloud" width={sceneWidth} height={sceneHeight}>
        <g transform={`translate(${axisXOffset}, ${axisYOffset})`}>
          <TransitionGroup
            className="tagsCloud"
            component={null}
            enter
            appear
            exite={false}
          >
            {positionedTagSvgData.map((i, index: number) => {
              const style = {
                fontSize: `${i.adaptFontSize}px`,
                fontFamily: 'Open Sans',
                fill: i.fill,
              };
              const transitionStyles: { [key: string]: React.CSSProperties } = {
                exited: {
                  opacity: 0,
                  transform: `translate(${i.rectTranslateX}px,${
                    i.rectTranslateY
                  }px) rotate(${i.rotate ? 90 : 0}deg) scale(1)`,
                },
                entering: {
                  opacity: 0,
                  transform: `translate(${i.rectTranslateX}px,${
                    i.rectTranslateY
                  }px) rotate(${i.rotate ? 90 : 0}deg) scale(0.1)`,
                },
                entered: {
                  opacity: 1,
                  transform: `translate(${i.rectTranslateX}px,${
                    i.rectTranslateY
                  }px) rotate(${i.rotate ? 90 : 0}deg) scale(1)`,
                },
              };

              return (
                <Transition
                  key={i.id}
                  timeout={DURATION}
                  //classNames="tagText"
                >
                  {state => {
                    return (
                      <text
                        key={`${i.id}_${index}`}
                        textAnchor="middle"
                        className={classes.text}
                        //transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                        style={{
                          ...style,
                          ...DEFAULT_STYLE,
                          ...transitionStyles[state],
                        }}
                        onClick={() => onTagClick(i.id)}
                      >
                        {i.label}
                      </text>
                    );
                  }}
                </Transition>
              );
            })}
          </TransitionGroup>
          {false && drawAxles()}
        </g>
      </svg>
    </div>
  );
};

function drawAxles(fontFamily = 'Open Sans') {
  const style = {
    fontSize: `${2}px`,
    fontFamily,
    fill: 'rgb(0, 0, 0)',
  };
  return [
    <text
      key={`x`}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${0})`}
      style={style}
    >
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    </text>,
    <text
      key={`y`}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${90})`}
      style={style}
    >
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    </text>,
  ];
}

export default withStyles(styles)(TagsCloud);
