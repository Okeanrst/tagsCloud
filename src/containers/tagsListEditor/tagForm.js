// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { tagDataType } from '../TagInformation';


class TagForm extends Component {
  constructor(props) {
    super(props);

    const { label, volume, type, sentiment, sentimentScore, burst, days, pageType } = props.data;
    this.state = {label, volume, type, sentiment, sentimentScore, burst, days, pageType};
  }

  handleChange = (event) => {
    const {name, value} = event.target;
    this.setState({
      [name]: value
    })
  }

  render() {
    const { id, label, volume, type, sentiment, sentimentScore, burst, days, pageType } = this.state;
    return (
      <form>
        <input type="hidden" value={id} />
        <input
          name="label"
          value={label}
          onChange={this.handleChange}
          placeholder="Label"
        />
        <br />
        <input
          name="volume"
          value={volume}
          onChange={this.handleChange}
          placeholder="Volume"
          type="number"
        />
        <br />
        <input
          name="type"
          value={type}
          onChange={this.handleChange}
          placeholder="Type"
        />
        <br />
        <input
          name="sentimentScore"
          value={sentimentScore}
          onChange={this.handleChange}
          placeholder="SentimentScore"
          type="number"
        />
      </form>
    );
  }
}

TagForm.propTypes = {
  data: tagDataType,
  onSubmit: PropTypes.func.isRequired,
};

export default TagForm;
