import React, { Component } from 'react';

import { TagDataT } from 'types/types';

enum InputFieldName {
  LABEL = 'label',
  VOLUME = 'volume',
  TYPE = 'type',
  SENTIMENT_SCORE = 'sentimentScore',
}

type PropsT = {
  initValues?: Partial<TagDataT>;
  onCancel: () => void;
  onSubmit: (
    data: Omit<TagDataT, 'id'> & Readonly<{ id?: TagDataT['id'] }>,
  ) => void;
};

type StateT = {
  id?: ThisParameterType<Pick<TagDataT, 'id'>>;
  values: Pick<TagDataT, 'label' | 'volume' | 'type' | 'sentimentScore'>;
};

const styles = {
  buttons: {
    marginTop: '100px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitButton: { marginLeft: '24px' },
};

const inputByTypes = {
  volume: 'number',
  sentimentScore: 'number',
  label: 'text',
  type: 'text',
};

export class TagForm extends Component<PropsT, StateT> {
  constructor(props: PropsT) {
    super(props);

    const {
      id,
      label = '',
      volume = 0,
      type = '',
      sentimentScore = 0,
    } = props.initValues ?? {};
    this.state = {
      id,
      values: {
        label,
        volume,
        type,
        sentimentScore,
      },
    };
  }

  handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (!(e.target instanceof HTMLInputElement)) {
      return;
    }

    const { name, value } = e.target;
    const fieldName = name as InputFieldName;
    const { values: currentValues } = this.state;
    this.setState({ values: { ...currentValues, [fieldName]: value } });
  };

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { onSubmit } = this.props;
    //TODO add validation
    const { initValues: { id } = {} } = this.props;
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    onSubmit({ id, label, volume, type, sentimentScore });
  };

  render() {
    const { onCancel } = this.props;
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    return (
      <form onSubmit={this.onSubmit}>
        <input
          type={inputByTypes.label}
          name={InputFieldName.LABEL}
          value={label}
          onChange={this.handleInputChange}
          placeholder="Label"
          required={true}
        />
        <br />
        <input
          name={InputFieldName.VOLUME}
          value={volume}
          onChange={this.handleInputChange}
          placeholder="Volume"
          type={inputByTypes.volume}
          required={true}
        />
        <br />
        <input
          type={inputByTypes.type}
          name={InputFieldName.TYPE}
          value={type}
          onChange={this.handleInputChange}
          placeholder="Type"
          required={true}
        />
        <br />
        <input
          name={InputFieldName.SENTIMENT_SCORE}
          value={sentimentScore}
          onChange={this.handleInputChange}
          placeholder="SentimentScore"
          type={inputByTypes.sentimentScore}
          required={true}
        />
        <div key="buttons" style={styles.buttons}>
          <button type="button" onClick={onCancel} key="cancel">
            cancel
          </button>
          <input type="submit" value="submit" style={styles.submitButton} />
        </div>
      </form>
    );
  }
}
