import React from 'react';
import getDisplayName from 'react-display-name';

type StateT = {
  height: number;
};

type WithRestScreenHeightPropsT = {
  restScreenHeight: number;
};

export default function withRestScreenHeight<
  T extends WithRestScreenHeightPropsT,
>(WrappedComponent: React.ComponentType<T>) {
  class EnhancedComponent extends React.Component<
    Omit<T, 'restScreenHeight'>,
    StateT
  > {
    state = { height: 0 };
    wrapperRef = React.createRef<HTMLDivElement>();
    resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

    public static displayName = `withRestScreenHeight(${getDisplayName(
      WrappedComponent,
    )})`;

    componentDidMount() {
      window.addEventListener('resize', this.handleResize);

      const height = this.calcRestScreenHeight();
      this.setState({ height });
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize);

      this.resizeTaskTimer && clearTimeout(this.resizeTaskTimer);
    }

    handleResize = (): void => {
      const recalculateState = () => {
        this.resizeTaskTimer = null;
        const height = this.calcRestScreenHeight();
        if (height !== this.state.height) {
          this.setState({ height });
        }
      };

      const delay = 500;

      if (!this.resizeTaskTimer) {
        this.resizeTaskTimer = setTimeout(recalculateState, delay);
      }
    };

    calcRestScreenHeight = (): number => {
      if (!this.wrapperRef.current) {
        return 0;
      }

      const node = this.wrapperRef.current;

      const { top } = node.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const screenHeight = document.documentElement.clientHeight;
      const restScreenHeight = screenHeight - (scrollTop + top);
      return restScreenHeight > 0 ? restScreenHeight : 0;
    };

    render() {
      const { children } = this.props;

      return (
        <div ref={this.wrapperRef}>
          // TODO
          {/* @ts-ignore */}
          <WrappedComponent
            {...this.props}
            restScreenHeight={this.state.height}
          >
            {children}
          </WrappedComponent>
        </div>
      );
    }
  }

  return EnhancedComponent;
}
