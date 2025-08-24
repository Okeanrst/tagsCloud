import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { createStyles, Theme, withStyles } from '@material-ui/core';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from 'store/actions/tagsCloud';
import { loadFont } from 'store/actions/loadFont';
import SvgTagsCloud from 'components/SvgTagsCloud/SvgTagsCloud';
import CanvasTagsCloud from 'components/CanvasTagsCloud';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { QueryStatuses } from 'constants/queryStatuses';
import { Checkbox } from 'ui/checkbox/Checkbox';
import { IconButton } from 'ui/buttons/IconButton';
import { DownloadCloudIcon } from 'ui/icons/DownloadCloudIcon';
import { Collapse } from 'components/Collapse';
import { TagsCloudBuildProgress } from 'components/TagsCloudBuildProgress';
import { Scale } from 'utilities/hooks/useScale';
import { PrimaryButton } from 'ui/buttons/PrimaryButton';
import { OutlinedButton } from 'ui/buttons/OutlinedButton';
import type { NavigateFunction } from 'react-router-dom';
import type { RootStateT, AppDispatchT } from 'store/types';
import { ClassesT, TagDataT, ScaleT } from 'types/types';

const { PENDING, PRISTINE, SUCCESS } = QueryStatuses;

const MIN_SCALE = 1;
const MAX_SCALE = 10;

const mapStateToProps = (state: RootStateT) => {
  const {
    tagsCloud,
    useCanvas,
    fontLoaded,
    tagsData,
    incrementalBuild,
    settings: { fontFamily },
  } = state;
  return { tagsCloud, shouldUseCanvas: useCanvas, fontLoaded, tagsData, incrementalBuild, fontFamily };
};

const mapDispatchToProps = (dispatch: AppDispatchT) => ({
  buildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
    dispatch(actions.buildTagsCloud(tagsData));
  },
  toggleUseCanvas() {
    dispatch(actions.toggleUseCanvas());
  },
  incrementallyBuildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
    dispatch(actions.incrementallyBuildTagsCloud(tagsData));
  },
  triggerRebuild() {
    dispatch(actions.resetTagsCloud());
  },
  observerLoadFont() {
    dispatch(loadFont());
  },
});

const connector = connect(mapStateToProps, mapDispatchToProps);

const styles = (theme: Theme) =>
  createStyles({
    pageContainer: {
      position: 'relative',
      minHeight: '250px',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 12,
    },
    loaderContainer: {
      position: 'absolute',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 6,
    },
    loader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'var(--primary-main-color)',
    },
    controls: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      '& > *:not(:first-child)': {
        marginLeft: theme.spacing(1),
      },
    },
    controlsBox: {
      display: 'flex',
      alignItems: 'center',
    },
    downloadIcon: {
      width: theme.spacing(4),
      height: theme.spacing(4),
    },
    actionMainButton: {
      marginLeft: theme.spacing(2),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1),
      },
    },
    debugSettingsControls: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      height: '100%',
    },
    toggleIsSettingsControlsIcon: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: 20,
      height: 44,
      lineHeight: '16px',
    },
    debugMenuCollapse: {
      position: 'absolute',
      right: 0,
      top: '100%',
      zIndex: 3,
    },
    debugMenu: {
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: theme.spacing(1),
      textAlign: 'left',
      backgroundColor: '#d2d2d2',
      listStyleType: 'none',
      whiteSpace: 'nowrap',
      '& > *:not(:first-child)': {
        marginTop: theme.spacing(1),
      },
    },
    actionControls: {
      display: 'flex',
      justifyContent: 'center',
    },
    tagsCloudScene: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
      flexGrow: 12,
      marginTop: theme.spacing(1),
    },
    tagsCloudInteractionButton: {
      position: 'absolute',
      bottom: 5,
      left: 10,
      zIndex: 2,
    },
  });

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsT = PropsFromRedux & {
  navigate: NavigateFunction;
  classes: ClassesT;
};

type StateT = {
  tagsCloudSceneSize: { width: number; height: number } | null;
  downloadCloudCounter: number;
  isSettingsControlsShown: boolean;
  isCoordinateGridShown: boolean;
  isReactAreasShown: boolean;
  isVacanciesShown: boolean;
  scale: ScaleT | null;
  isTagsCloudInteractionDisabled: boolean;
};

const getTagsDataByTagsIds = (tagsIds: string[], tagsData: ReadonlyArray<TagDataT>) => {
  const targetTagsIds = new Set(tagsIds);
  return tagsData.filter(({ id }) => targetTagsIds.has(id));
};

class TagsCloud extends Component<PropsT, StateT> {
  state: StateT = {
    tagsCloudSceneSize: null,
    downloadCloudCounter: 0,
    isSettingsControlsShown: false,
    isCoordinateGridShown: false,
    isReactAreasShown: false,
    isVacanciesShown: false,
    scale: null,
    isTagsCloudInteractionDisabled: false,
  };

  tagsCloudSceneRef = React.createRef<HTMLDivElement>();
  svgTagsCloudRef = React.createRef<{ oneByOne: () => void }>();

  resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    const {
      tagsData,
      tagsCloud,
      fontLoaded,
      buildTagsCloud,
      incrementallyBuildTagsCloud,
      incrementalBuild,
      observerLoadFont,
    } = this.props;

    if (fontLoaded.status === PRISTINE) {
      observerLoadFont();
    }

    if (fontLoaded.status === SUCCESS && tagsData.status === SUCCESS && tagsCloud.status === PRISTINE) {
      buildTagsCloud(tagsData.data);
    } else if (
      fontLoaded.status === SUCCESS &&
      tagsData.status === SUCCESS &&
      tagsCloud.status === SUCCESS &&
      incrementalBuild.tagsIds.length
    ) {
      incrementallyBuildTagsCloud(getTagsDataByTagsIds(incrementalBuild.tagsIds, tagsData.data));
    }

    window.addEventListener('resize', this.handleResize);

    if (!this.tagsCloudSceneRef.current) {
      return;
    }

    const tagsCloudSceneSize = this.calcTagsCloudSize(this.tagsCloudSceneRef.current);

    this.setState({ tagsCloudSceneSize });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

    this.resizeTaskTimer && clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps: PropsT, prevState: StateT) {
    const { fontLoaded, tagsData, tagsCloud, buildTagsCloud, observerLoadFont } = this.props;
    const { scale } = this.state;

    if (prevProps.fontLoaded.status !== PRISTINE && fontLoaded.status === PRISTINE) {
      observerLoadFont();
    }

    if (fontLoaded.data && tagsData.status === SUCCESS && tagsCloud.status === PRISTINE) {
      buildTagsCloud(tagsData.data);
    }

    if (scale && prevProps.tagsCloud.status !== SUCCESS && tagsCloud.status === SUCCESS) {
      this.setState({ scale: null });
    }
  }

  calcTagsCloudSize(elem: HTMLDivElement) {
    const clientRect = elem.getBoundingClientRect();
    const { left, right, top, bottom } = clientRect;
    const width = right - left;
    const height = bottom - top;
    return { width, height };
  }

  handleResize = () => {
    const recalculateState = () => {
      this.resizeTaskTimer = null;
      if (this.tagsCloudSceneRef && this.tagsCloudSceneRef.current) {
        const tagsCloudSceneSize = this.calcTagsCloudSize(this.tagsCloudSceneRef.current);
        this.setState({ tagsCloudSceneSize, scale: null });
      }
    };

    const delay = 500;

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalculateState, delay);
    }
  };

  onTagClick = (id: string) => {
    this.props.navigate('/tag/' + encodeURIComponent(id));
  };

  onDownloadClick = () => {
    this.setState(({ downloadCloudCounter }) => ({ downloadCloudCounter: downloadCloudCounter + 1 }));
  };

  toggleIsSettingsControlsShown = () => {
    this.setState(({ isSettingsControlsShown }) => ({ isSettingsControlsShown: !isSettingsControlsShown }));
  };

  toggleIsVacanciesShown = () => {
    this.setState(({ isVacanciesShown }) => ({ isVacanciesShown: !isVacanciesShown }));
  };

  toggleIsReactAreasShown = () => {
    this.setState(({ isReactAreasShown }) => ({ isReactAreasShown: !isReactAreasShown }));
  };

  toggleIsCoordinateGridShown = () => {
    this.setState(({ isCoordinateGridShown }) => ({ isCoordinateGridShown: !isCoordinateGridShown }));
  };

  onShouldUseCanvasChange = () => {
    const { toggleUseCanvas } = this.props;
    this.setState({ isSettingsControlsShown: false });
    toggleUseCanvas();
  };

  setScale = (fn: (scale: ScaleT | null) => ScaleT | null) => {
    this.setState(({ scale }) => ({
      scale: fn(scale),
    }));
  };

  toggleIsTagsCloudInteractionDisabled = () => {
    this.setState(({ isTagsCloudInteractionDisabled }) => ({
      isTagsCloudInteractionDisabled: !isTagsCloudInteractionDisabled,
    }));
  };

  renderLoader = () => (
    <div className={this.props.classes.loaderContainer}>
      <div className={this.props.classes.loader}>
        <FadeLoader loading color="var(--primary-main-color)" />
        <TagsCloudBuildProgress />
      </div>
    </div>
  );

  renderActionButtons = (disabled: boolean) => {
    const { classes, triggerRebuild, shouldUseCanvas } = this.props;
    return (
      <div className={classes.actionControls}>
        <IconButton disabled={disabled} onClick={this.onDownloadClick}>
          <DownloadCloudIcon className={classes.downloadIcon} />
        </IconButton>
        <PrimaryButton classes={{ root: classes.actionMainButton }} disabled={disabled} onClick={triggerRebuild}>
          Rebuild
        </PrimaryButton>
        <PrimaryButton
          classes={{ root: classes.actionMainButton }}
          disabled={disabled || shouldUseCanvas}
          onClick={() => this.svgTagsCloudRef.current?.oneByOne()}
        >
          One by one
        </PrimaryButton>
      </div>
    );
  };

  renderDebugSettings = () => {
    const {
      toggleIsSettingsControlsShown,
      toggleIsCoordinateGridShown,
      toggleIsReactAreasShown,
      toggleIsVacanciesShown,
    } = this;
    const { classes, shouldUseCanvas } = this.props;
    const { isSettingsControlsShown, isCoordinateGridShown, isReactAreasShown, isVacanciesShown } = this.state;
    return (
      <div className={classes.debugSettingsControls}>
        <IconButton onClick={toggleIsSettingsControlsShown}>
          <div className={classes.toggleIsSettingsControlsIcon}>{isSettingsControlsShown ? '-' : '+'}</div>
        </IconButton>
        <Collapse className={classes.debugMenuCollapse} isOpen={isSettingsControlsShown}>
          <ul className={classes.debugMenu}>
            {!shouldUseCanvas && (
              <li>
                <Checkbox
                  checked={isCoordinateGridShown}
                  label="draw coordinate grid"
                  onChange={toggleIsCoordinateGridShown}
                />
              </li>
            )}
            <li>
              <Checkbox checked={isReactAreasShown} label="draw react areas" onChange={toggleIsReactAreasShown} />
            </li>
            {!shouldUseCanvas && (
              <li>
                <Checkbox checked={isVacanciesShown} label="draw vacancies" onChange={toggleIsVacanciesShown} />
              </li>
            )}
          </ul>
        </Collapse>
      </div>
    );
  };

  renderControls = (loading: boolean) => {
    const { shouldUseCanvas, classes, tagsCloud } = this.props;
    return (
      <div className={classes.controls}>
        <div className={classes.controlsBox}>
          <Checkbox checked={shouldUseCanvas} label="use canvas" onChange={this.onShouldUseCanvasChange} />
        </div>
        <div className={classes.controlsBox}>{this.renderActionButtons(loading)}</div>
        <div className={classes.controlsBox}>{tagsCloud.status === SUCCESS && this.renderDebugSettings()}</div>
      </div>
    );
  };

  renderTagsCloud = () => {
    const {
      tagsCloudSceneSize,
      downloadCloudCounter,
      isVacanciesShown,
      isReactAreasShown,
      isCoordinateGridShown,
      scale,
      isTagsCloudInteractionDisabled,
    } = this.state;
    const { shouldUseCanvas } = this.props;

    if (!tagsCloudSceneSize) {
      return null;
    }

    if (shouldUseCanvas) {
      return (
        <CanvasTagsCloud
          downloadCloudCounter={downloadCloudCounter}
          height={tagsCloudSceneSize.height}
          isReactAreasShown={isReactAreasShown}
          width={tagsCloudSceneSize.width}
          onTagClick={this.onTagClick}
        />
      );
    } else {
      return (
        <SvgTagsCloud
          downloadCloudCounter={downloadCloudCounter}
          height={tagsCloudSceneSize.height}
          isCoordinateGridShown={isCoordinateGridShown}
          isReactAreasShown={isReactAreasShown}
          isTagsCloudInteractionDisabled={isTagsCloudInteractionDisabled}
          isVacanciesShown={isVacanciesShown}
          ref={this.svgTagsCloudRef}
          scale={scale}
          width={tagsCloudSceneSize.width}
          onTagClick={this.onTagClick}
        />
      );
    }
  };

  renderCloudInteractionDisabledButton = () => {
    const { isTagsCloudInteractionDisabled } = this.state;
    const { classes } = this.props;
    const Button = isTagsCloudInteractionDisabled ? PrimaryButton : OutlinedButton;
    return (
      <Button
        classes={{ root: classes.tagsCloudInteractionButton }}
        onClick={this.toggleIsTagsCloudInteractionDisabled}
      >
        CloudInteractionDisabled
      </Button>
    );
  };

  render() {
    const { tagsCloudSceneSize, scale, isTagsCloudInteractionDisabled } = this.state;
    const { tagsData, tagsCloud, fontLoaded, incrementalBuild, fontFamily, classes } = this.props;

    const loading = [tagsData.status, tagsCloud.status, fontLoaded.status, incrementalBuild.status].includes(PENDING);

    return (
      <div className={classes.pageContainer}>
        <div style={{ fontFamily, visibility: 'hidden' }} />
        {loading && this.renderLoader()}
        {this.renderControls(loading)}
        <div className={classes.tagsCloudScene} ref={this.tagsCloudSceneRef}>
          {tagsCloudSceneSize && tagsCloud.status === SUCCESS && (
            <>
              {this.renderTagsCloud()}
              {(scale?.value ?? 1) > 1 && this.renderCloudInteractionDisabledButton()}
            </>
          )}
        </div>
        <Scale
          isFrameMovable={isTagsCloudInteractionDisabled}
          maxScale={MAX_SCALE}
          minScale={MIN_SCALE}
          setScale={this.setScale}
          targetElementRef={this.tagsCloudSceneRef}
        />
      </div>
    );
  }
}

export default connector(withStyles(styles)(withTriggerGettingRawData<PropsT>(TagsCloud)));
