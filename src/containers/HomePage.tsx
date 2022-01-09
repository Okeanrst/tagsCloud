import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from 'store/actions/tagsCloud';
import SvgTagsCloud from 'components/SvgTagsCloud';
import CanvasTagsCloud from 'components/CanvasTagsCloud';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { QueryStatuses } from 'constants/queryStatuses';
import { Checkbox } from 'ui/checkbox/Checkbox';

import type { NavigateFunction } from 'react-router-dom';
import type { RootStateT, AppDispatchT } from 'store/types';
import { TagDataT } from 'types/types';

const { PENDING, PRISTINE, SUCCESS } = QueryStatuses;

const mapStateToProps = (state: RootStateT) => {
  const { tagsCloud, useCanvas, fontLoaded, tagsData, incrementalBuild } = state;
  return { tagsCloud, useCanvas, fontLoaded, tagsData, incrementalBuild };
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
  }
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsT = PropsFromRedux & {
  navigate: NavigateFunction;
};

type StateT = {
  tagsCloudSceneSize: { width: number; height: number } | null;
};

const styles: { [key: string]: React.CSSProperties } = {
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
    width: '100%',
  },
  tagsCloudScene: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    flexGrow: 12,
  },
  controls: {
    position: 'absolute',
    top: '20px',
    zIndex: 5,
  },
  rebuildButtonContainer: {
    justifyContent: 'center',
    display: 'flex',
    position: 'absolute',
    top: '20px',
    left: '50%',
    right: '50%',
    zIndex: 3,
  }
};

const getTagsDataByTagsIds = (tagsIds: string[], tagsData: ReadonlyArray<TagDataT>) => {
  const targetTagsIds = new Set(tagsIds);
  return tagsData.filter(({ id }) => targetTagsIds.has(id));
};

class HomePage extends Component<PropsT, StateT> {
  state: StateT = { tagsCloudSceneSize: null };

  tagsCloudSceneRef = React.createRef<HTMLDivElement>();

  resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    const {
      tagsData,
      tagsCloud,
      fontLoaded,
      buildTagsCloud,
      incrementallyBuildTagsCloud,
      incrementalBuild,
    } = this.props;

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
    const { fontLoaded, tagsData, tagsCloud, buildTagsCloud } = this.props;

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

  renderLoader = (loading: boolean) => (
    <div style={styles.loaderContainer}>
      <FadeLoader
        color="#123abc"
        loading={loading}
      />
    </div>
  );

  renderRebuildButton = (onClick: () => void, disabled: boolean) => (
    <div style={styles.rebuildButtonContainer}>
      <button
        disabled={disabled}
        onClick={onClick}
      >
        Rebuild
      </button>
    </div>
  );

  render() {
    const { tagsCloudSceneSize } = this.state;
    const { useCanvas, tagsData, tagsCloud, toggleUseCanvas, fontLoaded, incrementalBuild, triggerRebuild } =
      this.props;
    const loading = [
      tagsData.status,
      tagsCloud.status,
      fontLoaded.status,
      incrementalBuild.status,
    ].includes(PENDING);
    const TagsCloudComponent = useCanvas ? CanvasTagsCloud : SvgTagsCloud;

    return (
      <div style={styles.pageContainer}>
        {this.renderLoader(loading)}
        {this.renderRebuildButton(triggerRebuild, loading)}
        <div style={styles.controls}>
          <Checkbox
            checked={useCanvas}
            label="use canvas"
            onChange={toggleUseCanvas}
          />
        </div>
        <div
          ref={this.tagsCloudSceneRef}
          style={styles.tagsCloudScene}
        >
          {tagsCloudSceneSize && tagsCloud.status === SUCCESS && (
            <TagsCloudComponent
              height={tagsCloudSceneSize.height}
              width={tagsCloudSceneSize.width}
              onTagClick={this.onTagClick}
            />
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTriggerGettingRawData<PropsT>(HomePage));
