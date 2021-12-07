import React, { useRef, useCallback } from 'react';
import getDisplayName from 'react-display-name';
import ReactDOM from 'react-dom';

type EnhancedComponentPropsT = {
  onContainerClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

export default function withModalWindowContainer<P>(
  WrappedComponent: React.ComponentType<Omit<P, 'onContainerClick'>>,
) {
  const EnhancedComponent = React.forwardRef<any, P & EnhancedComponentPropsT>(
    ({ onContainerClick, ...props }: P & EnhancedComponentPropsT, ref) => {
      const modalWindowRef = useRef<any>(null);

      const setComponentRef = useCallback(
        elem => {
          modalWindowRef.current = elem;
          if (typeof ref === 'function') {
            ref(elem);
          } else if (ref) {
            ref.current = elem;
          }
        },
        [ref],
      );

      const onClick = useCallback(
        (e: React.SyntheticEvent<EventTarget>) => {
          if (!onContainerClick) {
            return;
          }
          if (!(e.target instanceof HTMLElement)) {
            return;
          }

          const wrappedComponentNode =
            modalWindowRef.current &&
            modalWindowRef.current instanceof HTMLElement
              ? modalWindowRef.current
              : ReactDOM.findDOMNode(modalWindowRef.current);
          if (
            wrappedComponentNode &&
            !wrappedComponentNode.contains(e.target)
          ) {
            onContainerClick(e);
          }
        },
        [onContainerClick],
      );

      return (
        <div
          key="modalWindowContainer"
          className="modalWindowContainer"
          onClick={onClick}
        >
          <WrappedComponent {...props} ref={setComponentRef} />
        </div>
      );
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    EnhancedComponent.displayName = `withModalWindowContainer(${getDisplayName(
      WrappedComponent,
    )})`;
  }

  return EnhancedComponent;
}
