// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { getTagDataType } from '../../types';

const tagDataType = getTagDataType(false);

const styles = {
  buttons: {
    marginTop: '100px', display: 'flex', justifyContent: 'flex-end',
  },
};

class TagForm extends Component {
  constructor(props) {
    super(props);

    const {
      id, label = '', volume = 0, type = '', sentiment, sentimentScore = 0,
      burst, days, pageType
    } = props.data;
    this.state = {id, label, volume, type, sentiment, sentimentScore, burst, days, pageType};
  }

  handleChange = (event) => {
    const { name, value, type } = event.target;
    this.setState({
      [name]: type === 'number' ? parseInt(value) : value,
    });
  }

  onSubmit = (e) => {
    e.preventDefault();
    const { onSubmit } = this.props;
    //TODO add validation
    const { id, label, volume, type, sentiment, sentimentScore, burst, days, pageType } = this.state;
    const data = {id, label, volume, type, sentiment, sentimentScore, burst, days, pageType};
    onSubmit(data);
  }

  render() {
    const { onCancel } = this.props;
    const { id, label, volume, type, sentiment, sentimentScore, burst, days, pageType } = this.state;
    return (
      <form onSubmit={this.onSubmit} >
        <input
          type="text"
          name="label"
          value={label}
          onChange={this.handleChange}
          placeholder="Label"
          required={true}
        />
        <br />
        <input
          name="volume"
          value={volume}
          onChange={this.handleChange}
          placeholder="Volume"
          type="number"
          required={true}
        />
        <br />
        <input
          type="text"
          name="type"
          value={type}
          onChange={this.handleChange}
          placeholder="Type"
          required={true}
        />
        <br />
        <input
          name="sentimentScore"
          value={sentimentScore}
          onChange={this.handleChange}
          placeholder="SentimentScore"
          type="number"
          required={true}
        />
        <div key="buttons" style={styles.buttons} >
          <button type="button" onClick={onCancel} key="cancel" >cancel</button>
          <input type="submit" value="submit" style={{marginLeft: '24px'}} />
        </div>
      </form>
    );
  }
}

TagForm.propTypes = {
  data: tagDataType,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default TagForm;
