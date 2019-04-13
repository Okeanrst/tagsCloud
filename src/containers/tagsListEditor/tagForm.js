// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { tagDataType } from '../TagInformation';

const styles = {
  buttons: {
    marginTop: '100px', display: 'flex', justifyContent: 'flex-end',
  },
};

class TagForm extends Component {
  constructor(props) {
    super(props);

    const { id, label, volume, type, sentiment, sentimentScore, burst, days, pageType } = props.data;
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
      <form>
        <input type="hidden" value={id} />
        <input
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
          <button onClick={onCancel} key="cancel" >cancel</button>
          <button onClick={this.onSubmit} key="submit" style={{marginLeft: '24px'}}>submit</button>
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
