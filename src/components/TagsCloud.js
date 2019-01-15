import React from 'react';
import PropTypes from 'prop-types';
import {randomColor, adaptDataToScene} from '../utilities/tagsCloud';

const TagsCloud = ({width, /*height,*/ data, onTagClick}) => {
  const height = 1500;
  let { maxRight, minLeft, minBottom, maxTop, data: preparedData } = adaptDataToScene(data, width);

  console.log(/*minLeft, maxRight*/ minBottom, maxTop)
  //preparedData = preparedData.filter((i, ind) => !i.rotate);
  // preparedData = preparedData.map((i, ind) => {
  //   const {rectTranslateX, rectTranslateY} = i;
  //   //i.rectTranslateX = i.rotate ? rectTranslateY : rectTranslateX
  //   //i.rectTranslateY = i.rotate ? rectTranslateX : rectTranslateY;
  //   //i.rectTranslateX = i.rotate ? rectTranslateX : -rectTranslateX;
  //   //i.rotate = 0//ind === 0 ? 0 : 90;
  //   //i.label = ind
  //   if (i.rotate) {
  //     i.rectTranslateY *= -1;
  //   }
  //   return i
  // });
  const drawAxises = () => {
    const style = {fontSize: `${16}px`, fontFamily: 'OpenSans', fill: 'rgb(0, 0, 0)'};
    return [
      <text
        key={`x`}
        textAnchor="middle"
        transform={`translate(${0},${0})rotate(${0})`}
        style={style}
      >
        --------------------------------------------------------------------------------------------
      </text>,
      <text
        key={`y`}
        textAnchor="middle"
        transform={`translate(${0},${0})rotate(${90})`}
        style={style}
      >
        --------------------------------------------------------------------------------------------
      </text>,
    ];
  }
  const axisYOffset = width / 2 - (Math.abs(maxRight) - Math.abs(minLeft))/2
  return (
    <svg id="small_cloud" width={width} height={height} >
      <g transform={`translate(${axisYOffset}, ${maxTop + 20})`}>
        {preparedData.map((i, ind) => {
          const style = {fontSize: `${i.adaptFontSize}px`, fontFamily: 'OpenSans', fill: randomColor()};
          if (i.rotate) {
            //style.writingMode = 'tb';
          }
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
        {drawAxises()}
      </g>
    </svg>
  )
}

TagsCloud.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,

  }).isRequired).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onTagClick: PropTypes.func.isRequired,
};

export default TagsCloud;