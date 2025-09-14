import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { saveAs } from 'file-saver';
import { withStyles } from '@material-ui/core';
import { drawOnCanvas } from 'utilities/tagsCloud/drawOnCanvas';
import { getBorderCoordinates } from 'utilities/tagsCloud/getBorderCoordinates';
import { RenderSceneT } from 'types/types';
import { RootStateT } from 'store/types';

const mapStateToProps = (state: RootStateT) => {
  const {
    tagsCloud: { tagsPositions },
    settings,
  } = state;
  return { tagsPositions, settings };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsT = PropsFromRedux & {
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  classes: {
    container: string;
  };
  downloadCloudCounter: number;
  isReactAreasShown: boolean;
  isTagsCloudInteractionDisabled: boolean;
  scale: number;
  renderScene: RenderSceneT;
};

type StateT = {
  sizeFactor: number;
  offsetLeft: number;
  offsetTop: number;
  restoreCoords: [number, number] | null;
  clearParams: [number, number, number, number] | null;
};

const styles = {
  container: {
    lineHeight: 0,
  },
};

class CanvasTagsCloud extends React.Component<PropsT, StateT> {
  tagCloudCanvasRef = React.createRef<HTMLCanvasElement>();
  state: StateT = {
    sizeFactor: 1,
    offsetLeft: 0,
    offsetTop: 0,
    restoreCoords: null,
    clearParams: null,
  };

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate(prevProps: PropsT) {
    const { width, height, tagsPositions, settings, downloadCloudCounter, isReactAreasShown, renderScene } = this.props;
    if (
      prevProps.width !== width ||
      prevProps.height !== height ||
      prevProps.tagsPositions !== tagsPositions ||
      prevProps.settings !== settings ||
      prevProps.isReactAreasShown !== isReactAreasShown ||
      prevProps.renderScene !== renderScene
    ) {
      this.draw();
    }
    if (prevProps.downloadCloudCounter !== downloadCloudCounter) {
      this.downloadCloudImage();
    }
  }

  onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!(e.target instanceof HTMLCanvasElement)) {
      return;
    }

    const { tagsPositions, isTagsCloudInteractionDisabled } = this.props;
    if (!tagsPositions || isTagsCloudInteractionDisabled) {
      return;
    }

    const { left, top } = e.target.getBoundingClientRect();
    const sceneX = e.clientX - left;
    const sceneY = e.clientY - top;
    if (sceneX < 0 || sceneY < 0) return;

    const { sizeFactor, offsetLeft, offsetTop } = this.state;
    const borderCoordinates = getBorderCoordinates(tagsPositions);

    if (!borderCoordinates) {
      return;
    }

    const { top: maxTop, left: minLeft } = borderCoordinates;

    for (let y = tagsPositions.length - 1; y >= 0; y--) {
      const i = tagsPositions[y];
      if (
        (maxTop - i.rectTop) * sizeFactor < offsetTop + sceneY &&
        (maxTop - i.rectBottom) * sizeFactor > offsetTop + sceneY &&
        -(minLeft - i.rectLeft) * sizeFactor < offsetLeft + sceneX &&
        -(minLeft - i.rectRight) * sizeFactor > offsetLeft + sceneX
      ) {
        this.props.onTagClick(i.id);
        break;
      }
    }
  };

  downloadCloudImage = () => {
    const canvas = this.tagCloudCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      saveAs(blob, 'tagCloud.png');
    });
  };

  draw = () => {
    const { width, height, tagsPositions, settings, isReactAreasShown, scale, renderScene } = this.props;

    if (!tagsPositions) {
      return;
    }

    const canvas = this.tagCloudCanvasRef.current;

    if (!canvas) {
      return;
    }

    const { fontFamily } = settings;

    const ctx = canvas.getContext('2d');

    if (ctx && this.state.clearParams) {
      ctx.clearRect(...this.state.clearParams);
    }
    if (ctx && this.state.restoreCoords) {
      ctx.translate(...this.state.restoreCoords);
    }

    const drawingResult = drawOnCanvas({
      data: tagsPositions,
      targetCanvas: canvas,
      availableSize: { width, height },
      scale,
      renderScene,
      options: { fontFamily, shouldDrawReactAreas: isReactAreasShown },
    });

    if (!drawingResult) {
      this.setState({
        sizeFactor: 1,
        offsetLeft: 0,
        offsetTop: 0,
        restoreCoords: null,
        clearParams: null,
      });
      return;
    }

    const { clearParams, restoreCoords, sizeFactor, offsetLeft, offsetTop } = drawingResult;

    this.setState({ clearParams, restoreCoords, sizeFactor, offsetLeft, offsetTop });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <canvas ref={this.tagCloudCanvasRef} onClick={this.onCanvasClick} />
      </div>
    );
  }
}

export default connector(withStyles(styles)(CanvasTagsCloud));
