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
  form: {
    width: '400px',
    maxWidth: '100%',
  },
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
    // TODO add validation
    const { initValues: { id } = {} } = this.props;
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    onSubmit({ id, label, volume: Number(volume), type, sentimentScore: Number(sentimentScore) });
  };

  render() {
    const { onCancel } = this.props;
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    return (
      <form
        style={styles.form}
        onSubmit={this.onSubmit}
      >
        <input
          required
          name={InputFieldName.LABEL}
          placeholder="Label"
          type={inputByTypes.label}
          value={label}
          onChange={this.handleInputChange}
        />
        <br />
        <input
          required
          name={InputFieldName.VOLUME}
          placeholder="Volume"
          type={inputByTypes.volume}
          value={volume}
          onChange={this.handleInputChange}
        />
        <br />
        <input
          name={InputFieldName.TYPE}
          placeholder="Type"
          type={inputByTypes.type}
          value={type}
          onChange={this.handleInputChange}
        />
        <br />
        <input
          required
          name={InputFieldName.SENTIMENT_SCORE}
          placeholder="SentimentScore"
          type={inputByTypes.sentimentScore}
          value={sentimentScore}
          onChange={this.handleInputChange}
        />
        <div
          key="buttons"
          style={styles.buttons}
        >
          <button
            key="cancel"
            type="button"
            onClick={onCancel}
          >
            cancel
          </button>
          <input
            style={styles.submitButton}
            type="submit"
            value="submit"
          />
        </div>
      </form>
    );
  }
}
