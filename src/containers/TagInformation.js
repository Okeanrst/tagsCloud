import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
//import {withRouter} from 'react-router-dom';

class TagInformation extends Component {

  render() {
    return (
      <div>
        TagInformation
        {this.props.data && (this.props.data.label)}
      </div>
    );
  }
}

TagInformation.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    //"volume": 165,
    //"type": "topic",
    sentiment: PropTypes.shape({
      negative: PropTypes.number,
      neutral: PropTypes.number,
      positive: PropTypes.number,
    }),

  }),
};

const mapStateToProps = (state, ownProps) => {
  const id = ownProps.match.params.id;
  let data;
  if (state.rawData.data) {
    data = state.rawData.data.find(i => i.id === id);
  }
  return {data};
};

/*export default withRouter(connect(
  mapStateToProps,
)(TagInformation));*/

export default connect(mapStateToProps)(TagInformation);