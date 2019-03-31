import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import WithRawData from '../../decorators/WithRawData';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from '../../redux/actions';
import styles from './styles';
import SmallModalWindow from '../../components/modalWindows/SmallModalWindow';
import { downloadCloudRawDataFile, uploadCloudRawDataFile } from '../../redux/actions/tagsCloudConfFile';

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

  uploadCloudRawDataFile = e => {
    this.props.uploadCloudRawDataFile(e.target.files[0]);
  }

  renderFileUploader = () => (
    <div style={styles.fileUploader} >
      <label htmlFor="cloud_conf_upload" style={styles.fileUploaderLabel} >
        Choose tags cloud configuration file (*.json)
      </label>
      <input id="cloud_conf_upload" type="file" onChange={this.uploadCloudRawDataFile} accept=".json" />
    </div>
  )

  downloadCloudRawDataFile = () => {
    const tagsCloudData = this.props.rawData.data;
    if (!tagsCloudData) return;
    downloadCloudRawDataFile(tagsCloudData);
  }

  renderFileDownloader = () => (
    <button onClick={this.downloadCloudRawDataFile} >
      Download tags cloud as a file
    </button>
  )

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

  onEdit = (e) => {
    //TODO
    const id = e.target.dataset.id;
    console.log('edit id: ', id);
  }

  renderList = (data) => {
    return (
      <ul style={styles.tagsList} >
        {data.map(item => (
          <li key={item.id} style={styles.tagsListRow} >
            <span key="label" style={styles.tagsListLabel} >{item.label}</span>
            <span key="sentimentScore" >{item.sentimentScore}</span>
            <button data-id={item.id} onClick={this.onEdit} style={styles.tagsListButton} >edit</button>
            <button data-id={item.id} onClick={this.onDelete} style={styles.tagsListButton} >delete</button>
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
        {!loading && (
          <div key="cloudConfFiles" style={styles.cloudConfFiles}>
            {this.renderFileUploader()}
            {rawData.data && this.renderFileDownloader()}
          </div>
        )}
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
  uploadCloudRawDataFile: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { rawData } = state;
  return {rawData};
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  deleteTag(id) {
    dispatch(actions.deleteDataItem(id));
  },
  uploadCloudRawDataFile(...args) {
    dispatch(uploadCloudRawDataFile(...args));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(WithRawData(TagsListEditor));