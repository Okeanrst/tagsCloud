import React, { ChangeEventHandler } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

const useStyles = makeStyles({
  root: {
    marginBottom: 0,
  },
  label: {
    marginLeft: '8px',
  },
});

export type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  name?: string;
  label?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  classes?: Partial<ReturnType<typeof useStyles>>;
};

export const Checkbox = ({ label = '', classes, ...restProps }: PropsT) => {
  const ownClasses = useStyles();
  return (
    <label className={cx(ownClasses.root, classes?.root)}>
      <span>
        <input
          {...restProps}
          type="checkbox"
        />
      </span>
      <span className={cx(ownClasses.label, classes?.label)}>
        {label}
      </span>
    </label>
  );
};
