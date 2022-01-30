import React from 'react';
import getDisplayName from 'react-display-name';
import ModalWindowLayout from './ModalWindowLayout';

type EnhancedComponentPropsT = {
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

export function withModalWindowLayout<P>({
  layoutStyle,
  layoutClassName,
}: {
  layoutClassName?: string;
  layoutStyle?: React.CSSProperties;
} = {}) {
  return (WrappedComponent: React.ComponentType<Omit<P, 'onBackdropClick'>>) => {
    const EnhancedComponent = ({ onBackdropClick, ...props }: P & EnhancedComponentPropsT) => {
      return (
        <ModalWindowLayout
          className={layoutClassName}
          style={layoutStyle}
          onBackdropClick={onBackdropClick}
        >
          <WrappedComponent {...props} />
        </ModalWindowLayout>
      );
    };
    if (process.env.NODE_ENV !== 'production') {
      EnhancedComponent.displayName = `withModalWindowLayout(${getDisplayName(
        WrappedComponent,
      )})`;
    }
    return EnhancedComponent;
  };
}
