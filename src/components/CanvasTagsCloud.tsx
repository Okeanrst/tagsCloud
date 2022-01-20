import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { saveAs } from 'file-saver';
import { withStyles } from '@material-ui/core';
import { drawOnCanvas } from 'utilities/tagsCloud/drawOnCanvas';
import { getBorderCoordinates } from 'utilities/tagsCloud/tagsCloud';
import { RootStateT } from 'store/types';

const mapStateToProps = (state: RootStateT) => {
  const { tagsCloud: { tagsPositions }, settings } = state;
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

  componentDidUpdate(prevProps: PropsT) {
    const { width, height, tagsPositions, settings, downloadCloudCounter, isReactAreasShown } = this.props;
    if (prevProps.width !== width || prevProps.height !== height || prevProps.tagsPositions !== tagsPositions
      || prevProps.settings !== settings || prevProps.isReactAreasShown !== isReactAreasShown) {
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

    const { tagsPositions } = this.props;
    if (!tagsPositions) {
      return;
    }

    const { left, top } = e.target.getBoundingClientRect();
    const sceneX = e.clientX - left;
    const sceneY = e.clientY - top;
    if (sceneX < 0 || sceneY < 0) return;

    const scale = this.state.scale;
    const borderCoordinates = getBorderCoordinates(tagsPositions);

    if (!borderCoordinates) {
      return;
    }

    const { top: maxTop, left: minLeft } = borderCoordinates;

    for (let y = tagsPositions.length - 1; y >= 0; y--) {
      const i = tagsPositions[y];
      if (
        (maxTop - i.rectTop) * scale < sceneY &&
        (maxTop - i.rectBottom) * scale > sceneY &&
        -(minLeft - i.rectLeft) * scale < sceneX &&
        -(minLeft - i.rectRight) * scale > sceneX
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
    const { width, height, tagsPositions, settings, isReactAreasShown } = this.props;

    if (!tagsPositions) {
      return;
    }

    const canvas = this.tagCloudCanvasRef.current;

    if (!canvas) {
      return;
    }

    const { fontFamily } = settings;

    const ctx = canvas.getContext('2d');

    if (ctx && this.state.clearParams && this.state.restoreCoords) {
      ctx.clearRect(...this.state.clearParams);
      ctx.translate(...this.state.restoreCoords);
    }

    const drawResult = drawOnCanvas(tagsPositions, canvas, { width, height }, { fontFamily, shouldDrawReactAreas: isReactAreasShown });

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

export default connector(withStyles(styles)(CanvasTagsCloud));
