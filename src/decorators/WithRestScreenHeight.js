// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import getDisplayName from 'react-display-name';

type Props = {};

type State = {
  height: number,
};

export default function withRestScreenHeight(Component) {
  class WrappedComponent extends React.Component<Props, State> {
    constructor(props) {
      super(props);

      this.elemRef = React.createRef();
      this.state = {height: 0};
    }

    componentDidMount() {
      window.addEventListener('resize', this.handleResize);

      const height = this.calcRestScreenHeight();
      this.setState({height});
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize);
      clearTimeout(this.resizeTaskTimer);
    }

    handleResize = (): void => {
      const recalcState = () => {
        this.resizeTaskTimer = null;
        const height = this.calcRestScreenHeight();
        if (height !== this.state.height) {
          this.setState({height});
        }
      }

      const delay = 500;

      if (!this.resizeTaskTimer) {
        this.resizeTaskTimer = setTimeout(recalcState, delay);
      }
    }

    calcRestScreenHeight = (): number => {
      const node = ReactDOM.findDOMNode(this.elemRef.current);
      const { top } = node.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const screenHeight = document.documentElement.clientHeight;
      const restScreenHeight = screenHeight - (scrollTop + top);
      return restScreenHeight > 0 ? restScreenHeight : 0;
    }

    render() {
      return (
        <Component {...this.props} restScreenHeight={this.state.height} ref={this.elemRef} />
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    WrappedComponent.displayName = `withRestScreenHeight(${getDisplayName(Component)})`;
  }
  return WrappedComponent;
}