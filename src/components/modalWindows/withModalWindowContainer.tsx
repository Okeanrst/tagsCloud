import React, { useRef, useCallback } from 'react';
import getDisplayName from 'react-display-name';
import ReactDOM from 'react-dom';

type EnhancedComponentPropsT = {
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

export default function withModalWindowContainer<P>(
  WrappedComponent: React.ComponentType<Omit<P, 'onBackdropClick'>>,
) {
  const EnhancedComponent = React.forwardRef<any, P & EnhancedComponentPropsT>(
    ({ onBackdropClick, ...props }: P & EnhancedComponentPropsT, ref) => {
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
          if (!onBackdropClick) {
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
            onBackdropClick(e);
          }
        },
        [onBackdropClick],
      );

      return (
        <div
          className="modalWindowContainer"
          key="modalWindowContainer"
          onClick={onClick}
        >
          <WrappedComponent
            {...props}
            ref={setComponentRef}
          />
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
