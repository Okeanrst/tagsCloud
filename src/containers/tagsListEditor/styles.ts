import { createStyles, Theme } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    cloudConfFiles: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px',
    },
    fileUploader: {},
    fileUploaderLabel: {
      display: 'block',
    },
    loaderContainer: {
      position: 'absolute',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    },
    tagsCloudScene: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    confirmDelete: {},
    confirmDeleteQuestion: {},
    confirmDeleteButtons: {
      marginTop: '100px',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    tagsList: {
      listStyleType: 'none',
      paddingLeft: 0,
    },
    tagsListRow: {
      display: 'flex',
      alignItems: 'center',
    },
    tagsListLabel: {
      flexGrow: 12,
      textOverflow: 'ellipsis',
    },
    tagsListScore: { flexShrink: 0, width: '24px', marginLeft: '12px' },
    tagsListButton: {
      flexShrink: 0,
      marginLeft: '12px',
      minWidth: '100px',
    },
  });

export default styles;
