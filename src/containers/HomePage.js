import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../redux/actions';
import { Link } from 'react-router-dom';
import TagsCloud from '../components/TagsCloud';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.tagsCloudScene = React.createRef();
    this.state = {tagsCloudSceneSize: {width: 1, height: 1}};
  }

  componentDidMount() {
    if (!this.props.rawData.data) {
      this.props.getData();
    } else if (!this.props.tagsCloud) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
    window.addEventListener('resize', this.handleResize);

    const tagsCloudSceneSize = this.calcTagsCloudScene(this.tagsCloudScene.current)
    this.setState({tagsCloudSceneSize})
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.rawData.data && this.props.rawData.data) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
  }

  calcTagsCloudScene(elem) {
    const {left, right, top, bottom} = elem.getBoundingClientRect();
    const width = right - left;
    const height = top - bottom;
    return {width, height};
  }

  handleResize = () => {
    const recalcState = () => {
      this.resizeTaskTimer = null;
      if (this.tagsCloudScene && this.tagsCloudScene.current) {
        const tagsCloudSceneSize = this.calcTagsCloudScene(this.tagsCloudScene.current);
        this.setState({tagsCloudSceneSize})
      }
    }

    const delay = 500

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalcState, delay)
    }
  }

  onTagClick = (id) => this.props.history.push('/' + id);

  renderTagsList = () => {return null;
    const list = this.props.rawData.data.map(i => {
      return (
        <li key={i.id} ><Link to={`/${i.id}`} >{i.label}</Link></li>
      );
    });
    return (<ul>{list}</ul>)
  }

  render() {
    const { tagsCloudSceneSize } = this.state;

    return (
      <div>
        {this.props.rawData.isFetching && ('...fetching')}
        <div ref={this.tagsCloudScene} style={styles.tagsCloudScene} >
          {this.props.tagsCloud.data && (
            <TagsCloud
              width={tagsCloudSceneSize.width}
              height={tagsCloudSceneSize.height}
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
};

const mapStateToProps = (state, ownProps) => {
  const { tagsCloud, rawData } = state;
  return {tagsCloud, rawData}
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getData() {
    dispatch(actions.getData());
  },
  buildTagsCloud(...args) {
    dispatch(actions.buildTagsCloud(...args));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);

const styles = {
  tagsCloudScene: {width: '100%', height: '100%', },
};