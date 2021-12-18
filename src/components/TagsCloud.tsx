import { withStyles } from '@material-ui/core';
import { Transition, TransitionGroup } from 'react-transition-group';
import { getTagsSvgData } from 'utilities/tagsCloud/tagsCloud';
import { getSuitableSize } from 'utilities/tagsCloud/getSuitableSize';
import { FONT_FAMILY } from 'constants/index';

import type { PositionedTagRectT } from 'types/types';
import React from 'react';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  classes: {
    container: string;
    text: string;
  };
};

const PADDING = 16;

const DURATION = 500;

const DEFAULT_STYLE = {
  transition: `all ${DURATION}ms ease-in-out`,
  opacity: 0,
};

const BASE_WIDTH = 1000;

const styles = {
  container: { padding: `${PADDING}px` },
  text: {
    'white-space': 'pre',
  },
};

const TagsCloud = ({ tagData, width, height, onTagClick, classes }: PropsT) => {
  const tagsSvgData = getTagsSvgData(tagData, BASE_WIDTH);

  if (!tagsSvgData) {
    return null;
  }

  const {
    viewBox,
    transform,
    aspectRatio,
    data: positionedTagSvgData,
  } = tagsSvgData;

  const availableWidth = width - PADDING * 2;
  const availableHeight = height - PADDING * 2;

  const svgSize = getSuitableSize(
    { width: availableWidth, height: availableHeight },
    aspectRatio,
  );

  return (
    <div className={classes.container}>
      <svg
        id="small_cloud"
        {...svgSize}
        viewBox={viewBox}
      >
        <g transform={transform}>
          <TransitionGroup
            appear
            enter
            className="tagsCloud"
            component={null}
            exite={false}
          >
            {positionedTagSvgData.map((i, index: number) => {
              const style = {
                fontSize: `${i.adaptFontSize}px`,
                fontFamily: FONT_FAMILY,
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
                  // classNames="tagText"
                >
                  {state => {
                    return (
                      <text
                        className={classes.text}
                        key={`${i.id}_${index}`}
                        style={{
                          ...style,
                          ...DEFAULT_STYLE,
                          ...transitionStyles[state],
                        }}
                        // transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                        textAnchor="middle"
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

function drawAxles(fontFamily = FONT_FAMILY) {
  const style = {
    fontSize: `${2}px`,
    fontFamily,
    fill: 'rgb(0, 0, 0)',
  };
  return [
    <text
      key={`x`}
      style={style}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${0})`}
    >
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    </text>,
    <text
      key={`y`}
      style={style}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${90})`}
    >
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    </text>,
  ];
}

export default withStyles(styles)(TagsCloud);
