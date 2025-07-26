import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { createStyles, Theme, withStyles } from '@material-ui/core';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from 'store/actions/tagsCloud';
import { loadFont } from 'store/actions/loadFont';
import SvgTagsCloud from 'components/SvgTagsCloud';
import CanvasTagsCloud from 'components/CanvasTagsCloud';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { QueryStatuses } from 'constants/queryStatuses';
import { Checkbox } from 'ui/checkbox/Checkbox';
import { TextButton } from 'ui/buttons/TextButton';
import { Collapse } from 'components/Collapse';
import downloadIconSrc from 'assets/download.svg';

import { PrimaryButton } from 'ui/buttons/PrimaryButton';
import type { NavigateFunction } from 'react-router-dom';
import type { RootStateT, AppDispatchT } from 'store/types';
import { ClassesT, TagDataT } from 'types/types';

const { PENDING, PRISTINE, SUCCESS } = QueryStatuses;

const mapStateToProps = (state: RootStateT) => {
  const { tagsCloud, useCanvas, fontLoaded, tagsData, incrementalBuild, settings: { fontFamily } } = state;
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
  }
});

const connector = connect(mapStateToProps, mapDispatchToProps);

const styles = (theme: Theme) => createStyles({
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
  downloadButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  downloadIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  actionMainButton: {
    marginLeft: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    }
  },
  debugSettingsControls: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  toggleIsSettingsControlsButton: {
    width: '20px',
    minWidth: '20px!important',
    height: '16px',
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
    padding: theme.spacing(1),
    textAlign: 'left',
    backgroundColor: '#d2d2d2',
    whiteSpace: 'nowrap',
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
  };

  tagsCloudSceneRef = React.createRef<HTMLDivElement>();
  svgTagsCloudRef = React.createRef<{ play: () => void }>();

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

    if (
      fontLoaded.status === SUCCESS &&
      tagsData.status === SUCCESS &&
      tagsCloud.status === PRISTINE
    ) {
      buildTagsCloud(tagsData.data);
    } else if (fontLoaded.status === SUCCESS &&
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

    const tagsCloudSceneSize = this.calcTagsCloudSize(
      this.tagsCloudSceneRef.current,
    );

    this.setState({ tagsCloudSceneSize });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

    this.resizeTaskTimer && clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps: PropsT, prevState: StateT) {
    const { fontLoaded, tagsData, tagsCloud, buildTagsCloud, observerLoadFont } = this.props;

    if (prevProps.fontLoaded.status !== PRISTINE && fontLoaded.status === PRISTINE) {
      observerLoadFont();
    }

    if (
      fontLoaded.data &&
      tagsData.status === SUCCESS &&
      tagsCloud.status === PRISTINE
    ) {
      buildTagsCloud(tagsData.data);
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
        const tagsCloudSceneSize = this.calcTagsCloudSize(
          this.tagsCloudSceneRef.current,
        );
        this.setState({ tagsCloudSceneSize });
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

  renderLoader = () => (
    <div className={this.props.classes.loaderContainer}>
      <FadeLoader
        loading
        color="#123abc"
      />
    </div>
  );

  renderActionButtons = (disabled: boolean) => {
    const { classes, triggerRebuild, shouldUseCanvas } = this.props;
    return (
      <div className={classes.actionControls}>
        <button
          className={classes.downloadButton}
          disabled={disabled}
          onClick={this.onDownloadClick}
        >
          <img
            alt="download"
            className={classes.downloadIcon}
            src={downloadIconSrc}
          />
        </button>
        <PrimaryButton
          classes={{ root: classes.actionMainButton }}
          disabled={disabled}
          onClick={triggerRebuild}
        >
          Rebuild
        </PrimaryButton>
        <PrimaryButton
          classes={{ root: classes.actionMainButton }}
          disabled={disabled || shouldUseCanvas}
          onClick={() => this.svgTagsCloudRef.current?.play()}
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
      toggleIsVacanciesShown
    } = this;
    const { classes, shouldUseCanvas } = this.props;
    const { isSettingsControlsShown, isCoordinateGridShown, isReactAreasShown, isVacanciesShown } = this.state;
    return (
      <div className={classes.debugSettingsControls}>
        <TextButton
          classes={{ root: classes.toggleIsSettingsControlsButton }}
          onClick={toggleIsSettingsControlsShown}
        >
          {isSettingsControlsShown ? '-' : '+'}
        </TextButton>
        <Collapse
          className={classes.debugMenuCollapse}
          isOpen={isSettingsControlsShown}
        >
          <div className={classes.debugMenu}>
            {!shouldUseCanvas && (
              <Checkbox
                checked={isCoordinateGridShown}
                label="draw coordinate grid"
                onChange={toggleIsCoordinateGridShown}
              />
            )}
            <Checkbox
              checked={isReactAreasShown}
              label="draw react areas"
              onChange={toggleIsReactAreasShown}
            />
            {!shouldUseCanvas && (
              <Checkbox
                checked={isVacanciesShown}
                label="draw vacancies"
                onChange={toggleIsVacanciesShown}
              />
            )}
          </div>
        </Collapse>
      </div>
    );
  };

  renderControls = (loading: boolean) => {
    const { shouldUseCanvas, classes, tagsCloud } = this.props;
    return (
      <div className={classes.controls}>
        <div className={classes.controlsBox}>
          <Checkbox
            checked={shouldUseCanvas}
            label="use canvas"
            onChange={this.onShouldUseCanvasChange}
          />
        </div>
        <div className={classes.controlsBox}>
          {this.renderActionButtons(loading)}
        </div>
        <div className={classes.controlsBox}>
          {tagsCloud.status === SUCCESS && this.renderDebugSettings()}
        </div>
      </div>
    );
  };

  renderTagsCloud = () => {
    const { tagsCloudSceneSize, downloadCloudCounter, isVacanciesShown, isReactAreasShown, isCoordinateGridShown } = this.state;
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
          isVacanciesShown={isVacanciesShown}
          ref={this.svgTagsCloudRef}
          width={tagsCloudSceneSize.width}
          onTagClick={this.onTagClick}
        />
      );
    }
  };

  render() {
    const { tagsCloudSceneSize } = this.state;
    const { tagsData, tagsCloud, fontLoaded, incrementalBuild, fontFamily, classes } = this.props;

    const loading = [
      tagsData.status,
      tagsCloud.status,
      fontLoaded.status,
      incrementalBuild.status,
    ].includes(PENDING);

    return (
      <div className={classes.pageContainer}>
        <div style={{ fontFamily, visibility: 'hidden' }} />
        {loading && this.renderLoader()}
        {this.renderControls(loading)}
        <div
          className={classes.tagsCloudScene}
          ref={this.tagsCloudSceneRef}
        >
          {tagsCloudSceneSize && tagsCloud.status === SUCCESS && this.renderTagsCloud()}
        </div>
      </div>
    );
  }
}

export default connector(withStyles(styles)(withTriggerGettingRawData<PropsT>(TagsCloud)));
