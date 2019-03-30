import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const modalWindowsIds = [];

export default class RootModal extends Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

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
    modalRoot.classList.add('active-modal-root');
    modalRoot.appendChild(this.el);
    this.hideScroll();
    this.modalWindowsId = performance.now();
    modalWindowsIds.push(this.modalWindowsId);
  }

  componentWillUnmount() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.removeChild(this.el);
    modalWindowsIds.splice(modalWindowsIds.findIndex(id => id === this.modalWindowsId), 1);
    if (!modalWindowsIds.length) {
      modalRoot.classList.remove('active-modal-root');
      this.resetScroll();
    }
  }

  hideScroll = () => {
    this._overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  resetScroll = () => {
    document.body.style.overflow = this._overflow || 'auto';
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}
