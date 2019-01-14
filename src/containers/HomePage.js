import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../redux/actions';
import { Link, } from 'react-router-dom';

class HomePage extends Component {
  componentDidMount() {
    if (!this.props.rawData.data) {
      this.props.getData();
    } else if (!this.props.tagsCloud) {
      this.props.buildTagsCloud(this.props.rawData.data);
    }
  }

  renderTagsList = () => {
    const list = this.props.rawData.data.map(i => {
      return (
        <li><Link to={`/${i.id}`} >{i.label}</Link></li>
      );
    });
    return (<ul>{list}</ul>)
  }

  render() {
    return (
      <div>
        HomePage
        {this.props.rawData.isFetching && ('...fetching')}
        {this.props.rawData.data && (this.renderTagsList())}
      </div>
    );
  }
}

HomePage.propTypes = {
  tagsCloud: PropTypes.shape({
    data: PropTypes.array.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }),
  rawData: PropTypes.shape({
    data: PropTypes.array.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }),
};

const mapStateToProps = (state, ownProps) => {
  //const activity = ownProps.match.params.val
  const { tagsCloud, rawData } = state;
  return {tagsCloud, rawData}
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getData() {
    dispatch(actions.getData());
  },
  buildTagsCloud() {
    dispatch(actions.buildTagsCloud());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);