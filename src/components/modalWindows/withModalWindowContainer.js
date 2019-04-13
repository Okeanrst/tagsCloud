import React from 'react';
import getDisplayName from 'react-display-name';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

export default function withModalWindowContainer(Component) {
  const WrappedComponent = ({ children, onContainerClick, ...props }) => {
    const modalWindow = React.createRef();

    const onClick = (e) => {
      if (!onContainerClick) return;
      const node = ReactDOM.findDOMNode(modalWindow.current);
      if (node && !node.contains(e.target)) {
        onContainerClick(e);
      }
    }

    return (
      <div key="modalWindowContainer" className="modalWindowContainer" onClick={onClick} >
        <Component ref={modalWindow} {...props} >
          {children}
        </Component>
      </div>
    );
  };

  if (process.env.NODE_ENV !== 'production') {
    WrappedComponent.displayName = `withModalWindowContainer(${getDisplayName(Component)})`;
  }

  return WrappedComponent;
}

withModalWindowContainer.propTypes = {
  onContainerClick: PropTypes.func,
};
