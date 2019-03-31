import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../redux/actions';
import TagsCloud from '../components/TagsCloud';
import TagsCloudCanvas from '../components/TagsCloudCanvas';
import WithRawData from '../decorators/WithRawData';
import FadeLoader from 'react-spinners/FadeLoader';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.tagsCloudScene = React.createRef();
    this.state = {tagsCloudSceneWidth: 1};
  }

  componentDidMount() {
    //!prevProps.fontLoaded.data && fontLoaded.data
    const { rawData, tagsCloud,  } = this.props;
    if (rawData.data && !tagsCloud.data && !tagsCloud.isFetching) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
    window.addEventListener('resize', this.handleResize);

    const tagsCloudSceneWidth = this.calcTagsCloudWidth(this.tagsCloudScene.current)
    this.setState({tagsCloudSceneWidth})
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !prevProps.rawData.data && this.props.rawData.data && !this.props.tagsCloud.data ||
      prevProps.rawData.data && prevProps.rawData.data !== this.props.rawData.data
    ) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
  }

  calcTagsCloudWidth(elem) {
    const {left, right} = elem.getBoundingClientRect();
    const width = right - left;

    return width;
  }

  handleResize = () => {
    const recalcState = () => {
      this.resizeTaskTimer = null;
      if (this.tagsCloudScene && this.tagsCloudScene.current) {
        const tagsCloudSceneWidth = this.calcTagsCloudWidth(this.tagsCloudScene.current);
        this.setState({tagsCloudSceneWidth})
      }
    }

    const delay = 500;

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalcState, delay);
    }
  }

  onTagClick = (id) => this.props.history.push('/tag/' + encodeURIComponent(id));

  renderLoader = (loading) => (
    <div style={styles.loaderContainer} >
      <FadeLoader
        sizeUnit={"px"}
        size={50}
        color={'#123abc'}
        loading={loading}
      />
    </div>
  )
  render() {
    const { tagsCloudSceneWidth } = this.state;
    const { useCanvas, rawData, tagsCloud, toggleUseCanvas, fontLoaded } = this.props;
    const loading = rawData.isFetching || tagsCloud.isFetching || fontLoaded.isFetching;
    const TagsCloudComponent = useCanvas ?  TagsCloudCanvas : TagsCloud;
    return (
      <div>
        {this.renderLoader(loading)}
        <div ref={this.tagsCloudScene} style={styles.tagsCloudScene} >
          <div style={styles.checkbox} className="form-group form-check" >
            <input
              type="checkbox"
              checked={useCanvas}
              onChange={toggleUseCanvas}
              id="useCanvas"
              className="form-check-input"
            />
            <label htmlFor="useCanvas" >use canvas</label >
          </div>
          {tagsCloud.data && (
            <TagsCloudComponent
              width={tagsCloudSceneWidth}
              data={tagsCloud.data}
              onTagClick={this.onTagClick}
            />
          )}
        </div>
      </div>
    );
  }
}

HomePage.propTypes = {
  history: PropTypes.object.isRequired,
  tagsCloud: PropTypes.shape({
    data: PropTypes.array,
    isFetching: PropTypes.bool.isRequired,
  }),
  rawData: PropTypes.shape({
    data: PropTypes.array,
    isFetching: PropTypes.bool.isRequired,
  }),
  fontLoaded: PropTypes.shape({
    data: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }),
  buildTagsCloud: PropTypes.func.isRequired,
  toggleUseCanvas: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { tagsCloud, useCanvas, fontLoaded, rawData } = state;
  return {tagsCloud, useCanvas, fontLoaded, rawData };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  buildTagsCloud(...args) {
    dispatch(actions.buildTagsCloud(...args));
  },
  toggleUseCanvas() {
    dispatch(actions.toggleUseCanvas());
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(WithRawData(HomePage));

const styles = {
  loaderContainer: {
    position: 'absolute', display: 'flex', justifyContent: 'center',
    width: '100%'
  },
  tagsCloudScene: {
    width: '100%', display: 'flex', justifyContent: 'center',
    position: 'relative'
  },
  checkbox: {position: 'absolute', top: '20px', left: '20px'}
};