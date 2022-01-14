import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import { PrimaryButton } from 'ui/buttons/PrimaryButton';
import { TextButton } from 'ui/buttons/TextButton';

import { TagDataT, ClassesT } from 'types/types';

enum InputFieldName {
  LABEL = 'label',
  VOLUME = 'volume',
  TYPE = 'type',
  SENTIMENT_SCORE = 'sentimentScore',
}

type FormValuesT = Pick<TagDataT, 'label' | 'volume' | 'type' | 'sentimentScore'>;

export type TagFormPropsT = {
  initValues?: Partial<TagDataT>;
  onCancel: () => void;
  onSubmit: (data: FormValuesT) => void;
};

type PropsT = TagFormPropsT & {classes: ClassesT;}

type StateT = {
  id?: ThisParameterType<Pick<TagDataT, 'id'>>;
  values: FormValuesT;
};

const styles = {
  form: {
    width: '400px',
    maxWidth: '100%',
  },
  inputMarginTop: {
    marginTop: '8px',
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

class TagForm extends Component<PropsT, StateT> {
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
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    onSubmit({ label, volume: Number(volume), type, sentimentScore: Number(sentimentScore) });
  };

  render() {
    const { onCancel, classes } = this.props;
    const {
      values: { label, volume, type, sentimentScore },
    } = this.state;
    return (
      <form
        className={classes.form}
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
          className={classes.inputMarginTop}
          name={InputFieldName.VOLUME}
          placeholder="Volume"
          type={inputByTypes.volume}
          value={volume}
          onChange={this.handleInputChange}
        />
        <br />
        <input
          className={classes.inputMarginTop}
          name={InputFieldName.TYPE}
          placeholder="Type"
          type={inputByTypes.type}
          value={type}
          onChange={this.handleInputChange}
        />
        <br />
        <input
          required
          className={classes.inputMarginTop}
          name={InputFieldName.SENTIMENT_SCORE}
          placeholder="SentimentScore"
          type={inputByTypes.sentimentScore}
          value={sentimentScore}
          onChange={this.handleInputChange}
        />
        <div className={classes.buttons}>
          <TextButton onClick={onCancel}>
            Cancel
          </TextButton>
          <PrimaryButton
            classes={{ root: classes.submitButton }}
            type="submit"
          >
            Submit
          </PrimaryButton>
        </div>
      </form>
    );
  }
}

export default withStyles(styles)(TagForm);
