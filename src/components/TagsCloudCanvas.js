import React from 'react';
import PropTypes from 'prop-types';
import drawOnCanvas from '../utilities/tagsCloud/drawOnCanvas';
import {calcAllowedWidth} from "../utilities/tagsCloud";

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

  draw = () => {
    const allowedWidth = calcAllowedWidth(this.props.width);

    const canvas = this.tagCloudCanvas.current;

    if (this.state.clearParams) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(...this.state.clearParams);
      ctx.translate(...this.state.restoreCoords);
    }

    const {clearParams, restoreCoords} = drawOnCanvas(this.props.data, canvas, allowedWidth);
    this.setState({clearParams, restoreCoords});
  }

  render() {
    return (
      <div>
        <canvas ref={this.tagCloudCanvas} id="tagCloudCanvas" />
      </div>
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