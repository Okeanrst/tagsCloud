import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from 'store/actions/tagsCloud';
import TagsCloud from 'components/TagsCloud';
import TagsCloudCanvas from 'components/TagsCloudCanvas';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';

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
  tagsCloudSceneWidth: number;
};

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: { position: 'relative', minHeight: '250px' },
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
  },
  checkbox: { position: 'absolute', top: '20px', left: '20px' },
};

class HomePage extends Component<PropsT, StateT> {
  state: StateT = { tagsCloudSceneWidth: 1 };

  tagsCloudSceneRef = React.createRef<HTMLDivElement>();

  resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    //!prevProps.fontLoaded.data && fontLoaded.data
    const { rawData, tagsCloud } = this.props;
    if (rawData.data && !tagsCloud.data && !tagsCloud.isFetching) {
      this.props.buildTagsCloud(rawData.data);
    }
    window.addEventListener('resize', this.handleResize);

    if (!this.tagsCloudSceneRef.current) {
      return;
    }

    const tagsCloudSceneWidth = this.calcTagsCloudWidth(
      this.tagsCloudSceneRef.current,
    );
    this.setState({ tagsCloudSceneWidth });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

    this.resizeTaskTimer && clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps: PropsT, prevState: StateT) {
    if (
      this.props.rawData.data &&
      ((!prevProps.rawData.data &&
        this.props.rawData.data &&
        !this.props.tagsCloud.data) ||
        (prevProps.rawData.data &&
          prevProps.rawData.data !== this.props.rawData.data))
    ) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
  }

  calcTagsCloudWidth(elem: HTMLDivElement) {
    const { left, right } = elem.getBoundingClientRect();
    const width = right - left;
    return width;
  }

  handleResize = () => {
    const recalcState = () => {
      this.resizeTaskTimer = null;
      if (this.tagsCloudSceneRef && this.tagsCloudSceneRef.current) {
        const tagsCloudSceneWidth = this.calcTagsCloudWidth(
          this.tagsCloudSceneRef.current,
        );
        this.setState({ tagsCloudSceneWidth });
      }
    };

    const delay = 500;

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalcState, delay);
    }
  };

  onTagClick = (id: string) => {
    this.props.navigate('/tag/' + encodeURIComponent(id));
  };

  renderLoader = (loading: boolean) => (
    <div style={styles.loaderContainer}>
      <FadeLoader color="#123abc" loading={loading} />
    </div>
  );

  render() {
    const { tagsCloudSceneWidth } = this.state;
    const { useCanvas, rawData, tagsCloud, toggleUseCanvas, fontLoaded } =
      this.props;
    const loading =
      rawData.isFetching || tagsCloud.isFetching || fontLoaded.isFetching;
    const TagsCloudComponent = useCanvas ? TagsCloudCanvas : TagsCloud;
    return (
      <div style={styles.pageContainer}>
        {this.renderLoader(loading)}
        <div ref={this.tagsCloudSceneRef} style={styles.tagsCloudScene}>
          <div style={styles.checkbox} className="form-group form-check">
            <input
              type="checkbox"
              checked={useCanvas}
              onChange={toggleUseCanvas}
              id="useCanvas"
              className="form-check-input"
            />
            <label htmlFor="useCanvas">use canvas</label>
          </div>
          {tagsCloud.data && (
            <TagsCloudComponent
              width={tagsCloudSceneWidth}
              tagData={tagsCloud.data}
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
