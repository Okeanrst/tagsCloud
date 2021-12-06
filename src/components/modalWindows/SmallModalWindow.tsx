import React from 'react';
import { withModalWindowLayout } from './withModalWindowLayout';
import withModalWindowContainer from './withModalWindowContainer';

type PropsT = {
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const SmallModalWindow = ({ style, children }: PropsT) => {
  return (
    <div className="fullScreenModalWindow" style={style}>
      {children}
    </div>
  );
};

const SmallModalWindowWithModalWindowContainer =
  withModalWindowContainer<PropsT>(SmallModalWindow);

type SmallModalWindowWithModalWindowContainerProps = React.ComponentProps<
  typeof SmallModalWindowWithModalWindowContainer
>;

export default withModalWindowLayout<SmallModalWindowWithModalWindowContainerProps>()(
  SmallModalWindowWithModalWindowContainer,
);
