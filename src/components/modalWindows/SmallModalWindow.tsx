import React from 'react';
import { withModalWindowLayout } from './withModalWindowLayout';
import withModalWindowContainer from './withModalWindowContainer';

type PropsT = {
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const SmallModalWindow = React.forwardRef<HTMLDivElement, PropsT>(({ style, children }: PropsT, ref) => {
  return (
    <div
      className="fullScreenModalWindow"
      ref={ref}
      style={style}
    >
      {children}
    </div>
  );
});

const SmallModalWindowWithModalWindowContainer =
  withModalWindowContainer<PropsT>(SmallModalWindow);

type SmallModalWindowWithModalWindowContainerPropsT = React.ComponentProps<
  typeof SmallModalWindowWithModalWindowContainer
>;

export default withModalWindowLayout<SmallModalWindowWithModalWindowContainerPropsT>()(
  SmallModalWindowWithModalWindowContainer,
);
