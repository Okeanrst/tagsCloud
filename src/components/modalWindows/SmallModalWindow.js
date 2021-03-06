import React from 'react';
import withModalWindowLayout from './withModalWindowLayout';
import PropTypes from 'prop-types';
import withModalWindowContainer from './withModalWindowContainer';

class SmallModalWindow extends React.PureComponent {
  render() {
    const { style, children } = this.props;
    return (
      <div className="fullScreenModalWindow" style={style} >
        {children}
      </div>
    );
  }
}

SmallModalWindow.propTypes = {
  style: PropTypes.object,
};
export default withModalWindowLayout()(withModalWindowContainer(SmallModalWindow));
