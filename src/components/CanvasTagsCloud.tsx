import React from 'react';
import { withStyles } from '@material-ui/core';
import { drawOnCanvas } from 'utilities/tagsCloud/drawOnCanvas';
import { getBorderCoordinates } from 'utilities/tagsCloud/tagsCloud';

import type { PositionedTagRectT } from 'types/types';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  classes: {
    container: string;
  };
};

type StateT = {
  scale: number;
  restoreCoords?: [number, number];
  clearParams?: [number, number, number, number];
};

const styles = {
  container: {
    lineHeight: 0,
  },
};

class CanvasTagsCloud extends React.Component<PropsT, StateT> {
  tagCloudCanvasRef = React.createRef<HTMLCanvasElement>();
  state: StateT = { scale: 1 };

  componentDidMount() {
    this.draw();
  }

  shouldComponentUpdate(nextProps: PropsT) {
    return (
      this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      this.props.tagData !== nextProps.tagData ||
      this.props.onTagClick !== nextProps.onTagClick
    );
  }

  componentDidUpdate() {
    this.draw();
  }

  onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!(e.target instanceof HTMLCanvasElement)) {
      return;
    }

    const { left, top } = e.target.getBoundingClientRect();
    const sceneX = e.clientX - left;
    const sceneY = e.clientY - top;
    if (sceneX < 0 || sceneY < 0) return;

    const scale = this.state.scale;
    const borderCoordinates = getBorderCoordinates(this.props.tagData);

    if (!borderCoordinates) {
      return;
    }

    const { top: maxTop, left: minLeft } = borderCoordinates;

    for (let y = this.props.tagData.length - 1; y >= 0; y--) {
      const i = this.props.tagData[y];
      if (
        (maxTop - i.rectTop) * scale < sceneY &&
        (maxTop - i.rectBottom) * scale > sceneY &&
        -(minLeft - i.rectLeft) * scale < sceneX &&
        -(minLeft - i.rectRight) * scale > sceneX
      ) {
        this.props.onTagClick(i.id);
      }
    }
  };

  draw = () => {
    const { width, height } = this.props;

    const canvas = this.tagCloudCanvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (ctx && this.state.clearParams && this.state.restoreCoords) {
      ctx.clearRect(...this.state.clearParams);
      ctx.translate(...this.state.restoreCoords);
    }

    const drawResult = drawOnCanvas(this.props.tagData, canvas, { width, height });

    if (!drawResult) {
      return;
    }

    const { clearParams, restoreCoords, scale } = drawResult;

    this.setState({ clearParams, restoreCoords, scale });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <canvas
          id="tagCloudCanvasRef"
          ref={this.tagCloudCanvasRef}
          onClick={this.onCanvasClick}
        />
      </div>
    );
  }
}

export default withStyles(styles)(CanvasTagsCloud);
