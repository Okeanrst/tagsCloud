import React from 'react';
import { withModalWindowLayout } from './withModalWindowLayout';
import withModalWindowContainer from './withModalWindowContainer';

type PropsT = {
  style?: React.CSSProperties;
  children: React.ReactNode;
  onContainerClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

const FullScreenModalWindow = React.forwardRef<HTMLDivElement, PropsT>(
  ({ style, children }: PropsT, ref) => {
    return (
      <div className="fullScreenModalWindow" style={style} ref={ref}>
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
