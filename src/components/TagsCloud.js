import React from 'react';
import PropTypes from 'prop-types';
import {adaptDataToScene, calcAllowedWidth} from '../utilities/tagsCloud';
import { Transition, TransitionGroup } from 'react-transition-group';
import { withStyles } from '@material-ui/core';
import { PADDING } from '../constants';

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

const TagsCloud = ({width, data, onTagClick, classes}) => {
  const allowedWidth = calcAllowedWidth(width);

  const { maxRight, minLeft, minBottom, maxTop, data: preparedData } = adaptDataToScene(data, allowedWidth);
  const sceneWidth = (maxRight - minLeft) * PADDING;
  const sceneHeight = (maxTop - minBottom) * PADDING;

  const axisXOffset = - minLeft + sceneWidth * (PADDING - 1)/2;
  const axisYOffset = maxTop + sceneHeight * (PADDING - 1)/2;

  return (
    <div style={{display: 'inline-block'}}>
      <svg id="small_cloud" width={sceneWidth} height={sceneHeight}>
        <g transform={`translate(${axisXOffset}, ${axisYOffset})`}>
          <TransitionGroup className="tagsCloud" component={null} enter appear exite={false} >
            {preparedData.map((i, ind) => {
              const style = {fontSize: `${i.adaptFontSize}px`, fontFamily: 'Open Sans', fill: i.fill};
              const transitionStyles = {
                exited: { opacity: 0, transform: `translate(${i.rectTranslateX}px,${i.rectTranslateY}px) rotate(${i.rotate ? 90 : 0}deg) scale(1)` },
                entering: { opacity: 0, transform: `translate(${i.rectTranslateX}px,${i.rectTranslateY}px) rotate(${i.rotate ? 90 : 0}deg) scale(0.1)` },
                entered:  { opacity: 1, transform: `translate(${i.rectTranslateX}px,${i.rectTranslateY}px) rotate(${i.rotate ? 90 : 0}deg) scale(1)` },
              };

              return (
                <Transition
                  key={i.id}
                  timeout={DURATION}
                  //classNames="tagText"
                >
                  {(state) => {
                    return (
                      <text
                        key={`${i.id}_${ind}`}
                        textAnchor="middle"
                        className={classes.text}
                        //transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                        style={{...style, ...DEFAULT_STYLE, ...transitionStyles[state]}}
                        onClick={() => onTagClick(i.id)}
                      >
                        {i.label}
                      </text>
                    )
                  }}
                </Transition>
              )
            })}
          </TransitionGroup>
          {false && drawAxises()}
        </g>
      </svg>
    </div>
  )
}

function drawAxises () {
  const style = {fontSize: `${2}px`, fontFamily: 'Open Sans', fill: 'rgb(0, 0, 0)'};
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

TagsCloud.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,

  }).isRequired).isRequired,
  width: PropTypes.number.isRequired,
  onTagClick: PropTypes.func.isRequired,
};

export default withStyles(styles)(TagsCloud);
