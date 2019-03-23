import React from 'react';
import getDisplayName from 'react-display-name';
import {connect} from 'react-redux';
import {compose} from "redux";
import * as actions from '../redux/actions'
import PropTypes from 'prop-types'

function withRawData(Component) {
  class WrappedComponent extends React.Component {
    static propTypes = {
      getData: PropTypes.func.isRequired,
      rawData: PropTypes.shape({
        data: PropTypes.array,
        isFetching: PropTypes.bool.isRequired,
      }).isRequired,
    }

    componentDidMount() {
      const { rawData, fontLoaded } = this.props;
      if (fontLoaded.data && !rawData.data && !rawData.isFetching) {
        this.props.getData();
      }
    }

    componentDidUpdate(prevProps) {
      const { rawData, fontLoaded } = this.props;
      if (!prevProps.fontLoaded.data && fontLoaded.data && !rawData.data && !rawData.isFetching) {
        this.props.getData();
      }
    }

    render() {
      return (
        <Component {...this.props} />
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    WrappedComponent.displayName = `withRawData(${getDisplayName(Component)})`;
  }
  return WrappedComponent;
}

const mapStateToProps = (state, ownProps) => {
  const { rawData, fontLoaded } = state;
  return {rawData, fontLoaded};
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getData() {
    dispatch(actions.getData());
  },
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRawData
);