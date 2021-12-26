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

type PropsT = {
  checked?: boolean;
  label?: string;
  onChange?: () => void;
  classes?: ReturnType<typeof useStyles>;
};

export const Checkbox = ({ checked = false, label = '', onChange, classes }: PropsT) => {
  const styles = useStyles();
  return (
    <label className={cx(styles.root, classes?.root)}>
      <span>
        <input
          checked={checked}
          type="checkbox"
          onChange={onChange}
        />
      </span>
      <span className={cx(styles.label, classes?.label)}>
        {label}
      </span>
    </label>
  );
};
