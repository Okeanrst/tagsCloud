import React from 'react';
import PropTypes from 'prop-types';
import {randomColor, scaleData} from '../utilities/tagsCloud';

const TagsCloud = ({width, height, data}) => {
  const preparedData = data;
  return (
    <svg id="small_cloud" width={width} height={height} >
      <g transform="translate(0, 0)">
        {preparedData.map(i => (
          <text
            text-anchor="middle"
            transform="translate(34,-5)rotate(90)"
            style={`font-size: ${60}px; font-family: Open Sans; fill: rgb(57, 59, 121);`}
          >
            {i.label}
          </text>
        ))}
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
};

export default TagsCloud;