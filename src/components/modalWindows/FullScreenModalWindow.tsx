import React from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import { withModalWindowBackdrop } from './withModalWindowBackdrop';

type PropsT = {
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'inline-block',
    position: 'relative',
    zIndex: 1010,
    padding: '24px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    overflow: 'auto',
    backgroundColor: 'white',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      height: '100%',
    },
  },
}));

const FullScreenModalWindow = React.forwardRef<HTMLDivElement, PropsT>(({ style, children }: PropsT, ref) => {
  const classes = useStyles();
  return (
    <div className={classes.root} ref={ref} style={style}>
      {children}
    </div>
  );
});

export default withModalWindowBackdrop<PropsT>()(FullScreenModalWindow);
