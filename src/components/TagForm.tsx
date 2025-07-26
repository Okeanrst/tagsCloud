import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import { RgbaColorPicker } from "react-colorful";
import { PrimaryButton } from 'ui/buttons/PrimaryButton';
import { TextButton } from 'ui/buttons/TextButton';
import { InputFormField } from 'ui/InputFormField';
import { getRandomRGBColor } from 'utilities/common/getRandomRGBColor';

import { ClassesT, TagDataT } from 'types/types';

enum InputFieldName {
  LABEL = 'label',
  SENTIMENT_SCORE = 'sentimentScore',
}

type SubmitValuesT = Pick<TagDataT, 'label' | 'color' | 'sentimentScore'>;
type FormValuesT = {
  sentimentScore: string | number;
  label: string;
  color: string;
};

type FormErrorsT = Partial<{[key in keyof FormValuesT]: string}> | null;

export type TagFormPropsT = {
  initValues?: Partial<TagDataT>;
  onCancel: () => void;
  onSubmit: (data: SubmitValuesT) => void;
};

type PropsT = TagFormPropsT & {classes: ClassesT;}

type StateT = {
  values: FormValuesT;
  errors: FormErrorsT;
};

const styles = {
  form: {
    width: '400px',
    maxWidth: '100%',
  },
  notFirstFormControl: {
    marginTop: '8px',
  },
  buttons: {
    marginTop: '100px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitButton: {
    marginLeft: '24px',
  },
  helperText: {
    minHeight: '23px',
    marginTop: '2px',
    fontSize: '14px',
    color: 'var(--danger-color)',
  },
};

const parseRGBaColor = (color: string): { r: number, g: number, b: number, a: number } => {
  const [r = 1, g = 1, b = 1, a = 1] = color.slice(color.indexOf('(') + 1, color.indexOf(')')).split(',').map(i => Number(i));
  return { r, g, b, a };
};

const prepareValues = (values: FormValuesT): SubmitValuesT => {
  const { sentimentScore, label, color } = values;
  return { sentimentScore: Number(sentimentScore), label: label.trim(), color: color.trim() };
};

const validate = (values: FormValuesT): FormErrorsT => {
  const { sentimentScore, label, color } = values;
  if (!label) {
    return { label: 'required' };
  }
  if (!sentimentScore) {
    return { sentimentScore: 'required' };
  }
  if (!color) {
    return { color: 'required' };
  }
  return null;
};

class TagForm extends Component<PropsT, StateT> {
  constructor(props: PropsT) {
    super(props);

    const {
      label = '',
      color,
      sentimentScore = 1,
    } = props.initValues ?? {};
    this.state = {
      errors: null,
      values: {
        label,
        color: color ?? getRandomRGBColor(),
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
    this.setState(({ values: currentValues }) => {
      return { values: { ...currentValues, [fieldName]: value }, errors: null };
    });
  };

  handleColorChange = ({ r, g, b, a }: { r: number, g: number, b: number, a: number }) => {
    this.setState(({ values: currentValues }) => {
      return { values: { ...currentValues, color: `rgba(${r},${g},${b},${a})` }, errors: null };
    });
  };

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { values } = this.state;

    const { label, color, sentimentScore } = prepareValues(values);

    const errors = validate({ label, color, sentimentScore });

    if (errors) {
      this.setState({ errors });
    } else {
      onSubmit({ label, color, sentimentScore });
    }
  };

  render() {
    const { onCancel, classes } = this.props;
    const {
      values: { label, color, sentimentScore },
      errors,
    } = this.state;
    return (
      <form
        className={classes.form}
        onSubmit={this.onSubmit}
      >
        <InputFormField
          required
          classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
          helperText={errors?.label}
          name={InputFieldName.LABEL}
          placeholder="Label"
          type="text"
          value={label}
          onChange={this.handleInputChange}
        />
        <InputFormField
          required
          classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
          helperText={errors?.sentimentScore}
          min={1}
          name={InputFieldName.SENTIMENT_SCORE}
          placeholder="SentimentScore"
          type="number"
          value={sentimentScore}
          onChange={this.handleInputChange}
        />
        <RgbaColorPicker
          className={classes.notFirstFormControl}
          color={parseRGBaColor(color)}
          onChange={this.handleColorChange}
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
