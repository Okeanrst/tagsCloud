import React from 'react';
import { drawOnCanvas } from 'utilities/tagsCloud/drawOnCanvas';
import {
  calcAllowedWidth,
  getBorderCoordinates,
} from 'utilities/tagsCloud/tagsCloud';
import { PADDING } from '../constants';

import type { PositionedTagRectT } from 'types/types';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  width: number;
  onTagClick: (id: string) => void;
};

type StateT = {
  scale: number;
  restoreCoords?: [number, number];
  clearParams?: [number, number, number, number];
};

class TagsCloudCanvas extends React.Component<PropsT, StateT> {
  tagCloudCanvas = React.createRef<HTMLCanvasElement>();
  state: StateT = { scale: 1 };

  componentDidMount() {
    this.draw();
  }

  shouldComponentUpdate(nextProps: PropsT) {
    return (
      this.props.width !== nextProps.width ||
      this.props.tagData !== nextProps.tagData
    );
  }

  componentDidUpdate() {
    this.draw();
  }

  onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!(e.target instanceof HTMLCanvasElement)) {
      return;
    }

    const { left, right, top, bottom } = e.target.getBoundingClientRect();
    const width = right - left;
    const height = bottom - top;
    const sceneX = e.clientX - left - (width * (PADDING - 1)) / 2;
    const sceneY = e.clientY - top - (height * (PADDING - 1)) / 2;
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
    const allowedWidth = calcAllowedWidth(this.props.width);

    const canvas = this.tagCloudCanvas.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (ctx && this.state.clearParams && this.state.restoreCoords) {
      ctx.clearRect(...this.state.clearParams);
      ctx.translate(...this.state.restoreCoords);
    }

    const drawResult = drawOnCanvas(this.props.tagData, canvas, allowedWidth, {
      padding: PADDING,
    });

    if (!drawResult) {
      return;
    }

    const { clearParams, restoreCoords, scale } = drawResult;

    this.setState({ clearParams, restoreCoords, scale });
  };

  render() {
    return (
      <canvas
        ref={this.tagCloudCanvas}
        id="tagCloudCanvas"
        onClick={this.onCanvasClick}
      />
    );
  }
}

export default TagsCloudCanvas;
