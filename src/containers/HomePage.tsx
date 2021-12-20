import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from 'store/actions/tagsCloud';
import TagsCloud from 'components/TagsCloud';
import TagsCloudCanvas from 'components/TagsCloudCanvas';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { PENDING, PRISTINE, SUCCESS } from 'constants/queryStatuses';

import type { NavigateFunction } from 'react-router-dom';
import type { RootStateT, AppDispatchT } from 'store/types';

const mapStateToProps = (state: RootStateT) => {
  const { tagsCloud, useCanvas, fontLoaded, rawData } = state;
  return { tagsCloud, useCanvas, fontLoaded, rawData };
};

const mapDispatchToProps = (dispatch: AppDispatchT) => ({
  buildTagsCloud(rawData: NonNullable<RootStateT['rawData']['data']>) {
    dispatch(actions.buildTagsCloud(rawData));
  },
  toggleUseCanvas() {
    dispatch(actions.toggleUseCanvas());
  },
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
  checkbox: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 3,
  },
};

class HomePage extends Component<PropsT, StateT> {
  state: StateT = { tagsCloudSceneSize: null };

  tagsCloudSceneRef = React.createRef<HTMLDivElement>();

  resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    const { rawData, tagsCloud, fontLoaded, buildTagsCloud } = this.props;

    if (
      fontLoaded.status === SUCCESS &&
      fontLoaded.data &&
      rawData.status === SUCCESS &&
      rawData.data &&
      tagsCloud.status === PRISTINE
    ) {
      buildTagsCloud(rawData.data);
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
    const { fontLoaded, rawData, tagsCloud, buildTagsCloud } = this.props;

    if (
      fontLoaded.data &&
      rawData.status === SUCCESS &&
      rawData.data &&
      !tagsCloud.data &&
      tagsCloud.status === PRISTINE
    ) {
      buildTagsCloud(rawData.data);
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

  render() {
    const { tagsCloudSceneSize } = this.state;
    const { useCanvas, rawData, tagsCloud, toggleUseCanvas, fontLoaded } =
      this.props;
    const loading = [
      rawData.status,
      tagsCloud.status,
      fontLoaded.status,
    ].includes(PENDING);
    const TagsCloudComponent = useCanvas ? TagsCloudCanvas : TagsCloud;

    return (
      <div style={styles.pageContainer}>
        {this.renderLoader(loading)}
        <div
          className="form-group form-check"
          style={styles.checkbox}
        >
          <input
            checked={useCanvas}
            className="form-check-input"
            id="useCanvas"
            type="checkbox"
            onChange={toggleUseCanvas}
          />
          <label htmlFor="useCanvas">use canvas</label>
        </div>
        <div
          ref={this.tagsCloudSceneRef}
          style={styles.tagsCloudScene}
        >
          {tagsCloudSceneSize && tagsCloud.data && (
            <TagsCloudComponent
              height={tagsCloudSceneSize.height}
              tagData={tagsCloud.data}
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
