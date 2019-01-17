import React from 'react';
import PropTypes from 'prop-types';
import {adaptDataToScene} from '../utilities/tagsCloud';

const TagsCloud = ({width, data, onTagClick}) => {
  const aspectRatio = document.documentElement.clientWidth / document.documentElement.clientHeight;
  let adaptedWidth = width * 0.9;
  if (aspectRatio >= 1) {
    adaptedWidth = width / aspectRatio * 2;
  }

  let { maxRight, minLeft, minBottom, maxTop, data: preparedData } = adaptDataToScene(data, adaptedWidth);

  const height = (maxTop - minBottom) * adaptedWidth / (maxRight - minLeft) * 1.25;
  const axisYOffset = width / 2 - (Math.abs(maxRight) - Math.abs(minLeft))/2;
  const axisXOffset = (height / 2 - (Math.abs(maxTop) - Math.abs(minBottom))/2) * 1.25;

  return (
    <svg id="small_cloud" width={width} height={height} >
      <g transform={`translate(${axisYOffset}, ${axisXOffset})`}>
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