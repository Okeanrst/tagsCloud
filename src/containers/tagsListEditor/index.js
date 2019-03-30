import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import WithRawData from '../../decorators/WithRawData';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from '../../redux/actions';
import styles from './styles';
import SmallModalWindow from "../../components/modalWindows/SmallModalWindow";

class TagsListEditor extends Component {
  constructor(props) {
    super(props);

    this.tagsCloudScene = React.createRef();
    this.state = {tagsCloudSceneWidth: 1};
  }

  renderLoader = (loading) => (
    <div style={styles.loaderContainer} >
      <FadeLoader
        sizeUnit={"px"}
        size={50}
        color={'#123abc'}
        loading={loading}
      />
    </div>
  )

  renderFileUploader = () => null;

  renderConfirmDelete = (id) => {
    const resetId = () => this.setState({id: undefined});
    const onConfirm = () => {
      resetId();
      this.props.deleteTag(id);
    };
    const onCancel = () => resetId();

    const modalWindowBody = [
      <span key="question" style={styles.confirmDeleteQuestion} >
        Are you sure you want to delete tag "{id}"?
      </span>,
      <div key="buttons" style={styles.confirmDeleteButtons} >
        <button onClick={onCancel} key="cancel" >cancel</button>
        <button onClick={onConfirm} key="delete" style={{marginLeft: '24px'}}>delete</button>
      </div>
    ];

    return (
      <SmallModalWindow>
        <div style={styles.confirmDelete}>
          {modalWindowBody}
        </div>
      </SmallModalWindow>
    );
  }

  onDelete = (e) => {
    if (this.state.id !== undefined) return;
    const id = e.target.dataset.id;
    if (id !== undefined) {
      this.setState({id});
    }
  }

  renderList = (data) => {
    return (
      <ul>
        {data.map(item => (
          <li key={item.id} >
            <span key="label" >{item.label}</span>
            <span key="sentimentScore" >{item.sentimentScore}</span>
            <button data-id={item.id} onClick={this.onDelete} >delete</button>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const { rawData } = this.props;
    const loading = rawData.isFetching;

    return (
      <div>
        {this.renderLoader(loading)}
        {!loading && this.renderFileUploader()}
        {rawData.data && this.renderList(rawData.data)}
        {this.state.id !== undefined && this.renderConfirmDelete(this.state.id)}
      </div>
    );
  }
}

TagsListEditor.propTypes = {
  rawData: PropTypes.shape({
    data: PropTypes.array,
    isFetching: PropTypes.bool.isRequired,
  }),
  deleteTag: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { rawData } = state;
  return {rawData};
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  deleteTag(id) {
    dispatch(actions.deleteDataItem(id));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(WithRawData(TagsListEditor));