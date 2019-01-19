import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../redux/actions';
import { Link } from 'react-router-dom';
import TagsCloud from '../components/TagsCloud';
import TagsCloudCanvas from '../components/TagsCloudCanvas';
import WithRawData from '../decorators/WithRawData';
import FadeLoader from 'react-spinners/FadeLoader';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.tagsCloudScene = React.createRef();
    this.state = {tagsCloudSceneWidth: 1, useCanvas: false};
  }

  componentDidMount() {
    if (this.props.rawData.data && !this.props.tagsCloud.data && !this.props.tagsCloud.isFetching) {
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
    if (!prevProps.rawData.data && this.props.rawData.data && !this.props.tagsCloud.data) {
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

    const delay = 500

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalcState, delay)
    }
  }

  onTagClick = (id) => this.props.history.push('/' + id);

  onToggleCheckbox = () => this.setState(({useCanvas}) => ({useCanvas: !useCanvas}))

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

  renderTagsList = () => {return null;
    const list = this.props.rawData.data.map(i => {
      return (
        <li key={i.id} ><Link to={`/${i.id}`} >{i.label}</Link></li>
      );
    });
    return (<ul>{list}</ul>)
  }

  render() {
    const { tagsCloudSceneWidth, useCanvas } = this.state;
    const loading = this.props.rawData.isFetching || this.props.tagsCloud.isFetching;
    const TagsCloudComponent = useCanvas ?  TagsCloudCanvas : TagsCloud;
    return (
      <div>
        {this.renderLoader(loading)}
        <div style={styles.checkbox}>
          <input type="checkbox" value={useCanvas} onChange={this.onToggleCheckbox} />
          <span>use canvas</span>
        </div>
        <div ref={this.tagsCloudScene} style={styles.tagsCloudScene} >
          {this.props.tagsCloud.data && (
            <TagsCloudComponent
              width={tagsCloudSceneWidth}
              data={this.props.tagsCloud.data}
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
  buildTagsCloud: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { tagsCloud } = state;
  return {tagsCloud}
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  buildTagsCloud(...args) {
    dispatch(actions.buildTagsCloud(...args));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(WithRawData(HomePage));

const styles = {
  loaderContainer: {
    position: 'absolute', display: 'flex', justifyContent: 'center',
    width: '100%'
  },
  tagsCloudScene: {width: '100%', display: 'flex', justifyContent: 'center',},
  checkbox: {display: 'inline-block', position: 'absolute', top: '20px', left: '20px'}
};