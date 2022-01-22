import React from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import cx from 'classnames';
import { withModalWindowLayout } from './withModalWindowLayout';
import withModalWindowContainer from './withModalWindowContainer';

type PropsT = {
  style?: React.CSSProperties;
  children: React.ReactNode;
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      height: '100%',
    },
  }
}));

const FullScreenModalWindow = React.forwardRef<HTMLDivElement, PropsT>(
  ({ style, children }: PropsT, ref) => {
    const classes = useStyles();
    return (
      <div
        className={cx('fullScreenModalWindow', classes.root)}
        ref={ref}
        style={style}
      >
        {children}
      </div>
    );
  },
);

const FullScreenModalWindowWithModalWindowContainer =
  withModalWindowContainer<PropsT>(FullScreenModalWindow);

export default withModalWindowLayout<PropsT>()(
  FullScreenModalWindowWithModalWindowContainer,
);
