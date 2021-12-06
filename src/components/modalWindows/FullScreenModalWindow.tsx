import React from 'react';
import { withModalWindowLayout } from './withModalWindowLayout';
import withModalWindowContainer from './withModalWindowContainer';

type PropsT = {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onContainerClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

const FullScreenModalWindow = ({ style, children }: PropsT) => {
  return (
    <div className="fullScreenModalWindow" style={style}>
      {children}
    </div>
  );
};

const FullScreenModalWindowWithModalWindowContainer =
  withModalWindowContainer<PropsT>(FullScreenModalWindow);

export default withModalWindowLayout<PropsT>()(
  FullScreenModalWindowWithModalWindowContainer,
);
