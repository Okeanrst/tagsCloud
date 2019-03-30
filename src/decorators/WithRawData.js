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
      const { rawData } = this.props;
      if (!rawData.data && !rawData.isFetching) {
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

withRawData.propTypes = {
  rawData: PropTypes.shape({
    data: PropTypes.array,
    isFetching: PropTypes.bool.isRequired,
  }),
};

const mapStateToProps = (state, ownProps) => {
  const { rawData } = state;
  return {rawData};
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