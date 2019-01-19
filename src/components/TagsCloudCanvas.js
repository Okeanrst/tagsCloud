import React from 'react';
import PropTypes from 'prop-types';
import drawOnCanvas from '../utilities/tagsCloud/drawOnCanvas';
import {calcAllowedWidth, getBorderCoordinates} from '../utilities/tagsCloud';

import { PADDING } from '../constants';

class TagsCloudCanvas extends React.Component {
  constructor(props) {
    super(props);

    this.tagCloudCanvas = React.createRef();
    this.state = {};
  }

  componentDidMount() {
    this.draw();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.width !== nextProps.width || this.props.data !== nextProps.data;
  }

  componentDidUpdate(prevProps, prevState) {
    this.draw();
  }

  onCanvasClick = (e) => {
    const {left, right, top, bottom} = e.target.getBoundingClientRect();
    const width = right - left;
    const height = bottom - top;
    const sceneX = e.clientX - left - width * (PADDING - 1) / 2;
    const sceneY = e.clientY - top - height * (PADDING - 1) / 2;
    if (sceneX < 0 || sceneY < 0) return;

    const scale = this.state.scale;
    const { top: maxTop, left: minLeft } = getBorderCoordinates(this.props.data);
    for (let y = this.props.data.length - 1; y >= 0; y--) {
      const i = this.props.data[y];
      if ((maxTop - i.rectTop) * scale < sceneY && (maxTop - i.rectBottom) * scale > sceneY
      && (-(minLeft - i.rectLeft)) * scale < sceneX && (-(minLeft - i.rectRight)) * scale > sceneX) {
        this.props.onTagClick(i.id);
      }
    }
  }

  draw = () => {
    const allowedWidth = calcAllowedWidth(this.props.width);

    const canvas = this.tagCloudCanvas.current;

    if (this.state.clearParams) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(...this.state.clearParams);
      ctx.translate(...this.state.restoreCoords);
    }

    const {clearParams, restoreCoords, scale} = drawOnCanvas(this.props.data, canvas, allowedWidth, {padding: PADDING});
    this.setState({clearParams, restoreCoords, scale});
  }

  render() {
    return (
      <canvas ref={this.tagCloudCanvas} id="tagCloudCanvas" onClick={this.onCanvasClick} />
    )
  }
}

TagsCloudCanvas.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,

  }).isRequired).isRequired,
  width: PropTypes.number.isRequired,
  onTagClick: PropTypes.func.isRequired,
};

export default TagsCloudCanvas;