import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './style.css';

type PropsT = { children: React.ReactNode };

const modalWindowsIds: Array<number> = [];

export default class RootModal extends Component<PropsT> {
  container: HTMLDivElement = document.createElement('div');
  modalWindowsId?: number;
  modalRoot?: HTMLElement | null;
  overflow?: string;

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    const modalRoot = document.getElementById('modal-root');

    if (!modalRoot) {
      return;
    }

    modalRoot.classList.add('active-modal-root');
    modalRoot.appendChild(this.container);
    this.hideScroll();
    this.modalWindowsId = performance.now();
    modalWindowsIds.push(this.modalWindowsId);
  }

  componentWillUnmount() {
    const modalRoot = document.getElementById('modal-root');

    if (modalRoot) {
      modalRoot.removeChild(this.container);
    }

    modalWindowsIds.splice(
      modalWindowsIds.findIndex((id) => id === this.modalWindowsId),
      1,
    );
    if (!modalWindowsIds.length && modalRoot) {
      modalRoot.classList.remove('active-modal-root');
      this.restoreScroll();
    }
  }

  hideScroll = () => {
    if (modalWindowsIds.length) {
      return;
    }
    this.overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  restoreScroll = () => {
    document.body.style.overflow = this.overflow || 'auto';
  };

  render() {
    return ReactDOM.createPortal(this.props.children, this.container);
  }
}
