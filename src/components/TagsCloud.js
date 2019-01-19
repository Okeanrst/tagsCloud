import React from 'react';
import PropTypes from 'prop-types';
import {adaptDataToScene, calcAllowedWidth} from '../utilities/tagsCloud';

const TagsCloud = ({width, data, onTagClick}) => {
  const allowedWidth = calcAllowedWidth(width);

  const { maxRight, minLeft, minBottom, maxTop, data: preparedData } = adaptDataToScene(data, allowedWidth);
  const padding = 1.1;
  const sceneWidth = (maxRight - minLeft) * padding;
  const sceneHeight = (maxTop - minBottom) * padding;

  const axisXOffset = - minLeft + sceneWidth * (padding - 1)/2;
  const axisYOffset = maxTop + sceneHeight * (padding - 1)/2;

  return (
    <div style={{display: 'inline-block'}} >
      <svg id="small_cloud" width={sceneWidth} height={sceneHeight} >
        <g transform={`translate(${axisXOffset}, ${axisYOffset})`}>
          {preparedData.map((i, ind) => {
            const style = {fontSize: `${i.adaptFontSize}px`, fontFamily: 'OpenSans', fill: i.fill};
            return (
              <text
                key={`${i.id}_${ind}`}
                textAnchor="middle"
                transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                style={style}
                onClick={() => onTagClick(i.id)}
              >
                {i.label}
              </text>
            )
          })}
          {false && drawAxises()}
        </g>
      </svg>
    </div>
  )
}

function drawAxises () {
  const style = {fontSize: `${2}px`, fontFamily: 'OpenSans', fill: 'rgb(0, 0, 0)'};
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

export default TagsCloud;