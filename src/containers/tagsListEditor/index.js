import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import WithRawData from '../../decorators/WithRawData';
import withRestScreenHeight from '../../decorators/WithRestScreenHeight';
import FadeLoader from 'react-spinners/FadeLoader';
import * as actions from '../../redux/actions';
import styles from './styles';
import SmallModalWindow from '../../components/modalWindows/SmallModalWindow';
import FullScreenModalWindow from '../../components/modalWindows/FullScreenModalWindow';
import { downloadCloudRawDataFile, uploadCloudRawDataFile } from '../../redux/actions/tagsCloudConfFile';
import { FixedSizeList as List } from 'react-window';
import TagForm from './tagForm';

const tagsListRowHeight = 35;

class TagsListEditor extends Component {
  constructor(props) {
    super(props);

    this.confFiles = React.createRef();
    this.state = {tagsListHeight: tagsListRowHeight * 1};
  }

  componentDidMount() {
    this.confFiles.current.addEventListener('resize', this.confFilesHandleResize);

    const tagsListHeight = this.calcTagsListHeight();
    this.setState({tagsListHeight});
  }

  componentWillUnmount() {
    if (this.confFiles.current) {
      this.confFiles.current.removeEventListener('resize', this.confFilesHandleResize);
    }
    clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.restScreenHeight !== this.props.restScreenHeight) {
      const tagsListHeight = this.calcTagsListHeight();
      if (tagsListHeight !== this.state.tagsListHeight) {
        this.setState({tagsListHeight});
      }
    }
  }

  confFilesHandleResize = () => {
    const recalcState = () => {
      this.resizeTaskTimer = null;
      const tagsListHeight = this.calcTagsListHeight();
      if (tagsListHeight !== this.state.tagsListHeight) {
        this.setState({tagsListHeight});
      }
    }

    const delay = 500;

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(recalcState, delay);
    }
  }

  calcTagsListHeight = () => {
    const { top, bottom } = this.confFiles.current.getBoundingClientRect();
    const restScreenHeight = this.props.restScreenHeight - (bottom - top);
    return restScreenHeight > tagsListRowHeight ? restScreenHeight : tagsListRowHeight;
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

  renderFileUploader = (disabled) => (
    <div style={styles.fileUploader} >
      <label htmlFor="cloud_conf_upload" style={styles.fileUploaderLabel} >
        Choose tags cloud configuration file (*.json)
      </label>
      <input
        id="cloud_conf_upload"
        type="file"
        onChange={this.uploadCloudRawDataFile}
        accept=".json"
        disabled={disabled}
      />
    </div>
  )

  downloadCloudRawDataFile = () => {
    const tagsCloudData = this.props.rawData.data;
    if (!tagsCloudData) return;
    downloadCloudRawDataFile(tagsCloudData);
  }

  renderFileDownloader = (disabled) => (
    <button onClick={this.downloadCloudRawDataFile} disabled={disabled} >
      Download tags cloud as a file
    </button>
  )

  resetIdForDelete = () => this.setState({id: undefined})

  renderConfirmDelete = (id) => {
    const onConfirm = () => {
      this.resetIdForDelete();
      this.props.deleteTag(id);
    };

    const modalWindowBody = [
      <span key="question" style={styles.confirmDeleteQuestion} >
        Are you sure you want to delete tag "{id}"?
      </span>,
      <div key="buttons" style={styles.confirmDeleteButtons} >
        <button onClick={this.resetIdForDelete} key="cancel" >cancel</button>
        <button onClick={onConfirm} key="delete" style={{marginLeft: '24px'}}>delete</button>
      </div>
    ];

    return (
      <SmallModalWindow onContainerClick={this.resetIdForDelete} >
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

  onTagChange = (data) => {
    //TODO
    this.setState({editedTagData: undefined});
  }

  onTagAdd = (data) => {
    //озможно id нужно генерировать не в форме, а в редьюсере
  }

  onEdit = (e) => {
    const id = e.target.dataset.id;
    const { rawData } = this.props;
    const editedTagData = rawData.data.find(item => item.id === id);
    this.setState({editedTagData});
  }

  closeTagForm = () => {
    this.setState({editedTagData: undefined});
  }

  renderTagForm = (data) => (
    <FullScreenModalWindow onContainerClick={this.closeTagForm} >
      <TagForm onSubmit={this.onTagChange} data={data} />
    </FullScreenModalWindow>
  )

  renderListRow  = (data) => ({ index, style }) => {
    const item = data[index];
    return (
      <li style={{...styles.tagsListRow, ...style}} >
        <span key="label" style={styles.tagsListLabel} >{item.label}</span>
        <span key="sentimentScore" >{item.sentimentScore}</span>
        <button data-id={item.id} onClick={this.onEdit} style={styles.tagsListButton} >edit</button>
        <button data-id={item.id} onClick={this.onDelete} style={styles.tagsListButton} >delete</button>
      </li>
    );
  }

  renderList = (data, height) => {
    return (
      <List
        height={height}
        itemCount={data.length}
        itemSize={tagsListRowHeight}
        width="100%"
      >
        {this.renderListRow(data)}
      </List>
    );
  }

  render() {
    const { rawData } = this.props;
    const { tagsListHeight, editedTagData } = this.state;
    const loading = rawData.isFetching;

    return (
      <div>
        {this.renderLoader(loading)}
        <div key="cloudConfFiles" style={styles.cloudConfFiles} ref={this.confFiles} >
          {this.renderFileUploader(loading)}
          {this.renderFileDownloader(!!(!rawData.data || loading))}
        </div>
        {editedTagData && this.renderTagForm(editedTagData)}
        {rawData.data && this.renderList(rawData.data, tagsListHeight)}
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
  restScreenHeight: PropTypes.number.isRequired,
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

export default connect(mapStateToProps, mapDispatchToProps)(WithRawData(withRestScreenHeight(TagsListEditor)));