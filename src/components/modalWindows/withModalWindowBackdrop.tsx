import React from 'react';
import getDisplayName from 'react-display-name';
import { ModalWindowBackdrop } from './ModalWindowBackdrop';

type EnhancedComponentPropsT = {
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

export function withModalWindowBackdrop<P>({
  layoutStyle,
  layoutClassName,
}: {
  layoutClassName?: string;
  layoutStyle?: React.CSSProperties;
} = {}) {
  return (WrappedComponent: React.ComponentType<Omit<P, 'onBackdropClick'>>) => {
    const EnhancedComponent = ({ onBackdropClick, ...props }: P & EnhancedComponentPropsT) => {
      return (
        <ModalWindowBackdrop className={layoutClassName} style={layoutStyle} onBackdropClick={onBackdropClick}>
          <WrappedComponent {...props} />
        </ModalWindowBackdrop>
      );
    };
    if (!import.meta.env.PROD) {
      EnhancedComponent.displayName = `withModalWindowLayout(${getDisplayName(WrappedComponent)})`;
    }
    return EnhancedComponent;
  };
}
