import { createStyles, Theme } from '@material-ui/core';

const styles = (theme: Theme) => createStyles({
  cloudConfFiles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    [theme.breakpoints.down('sm')]: {
      flexWrap: 'wrap'
    },
  },
  fileUploader: {
    maxWidth: '100%',
  },
  fileUploaderLabel: {
    display: 'block',
  },
  downloadButton: {
    [theme.breakpoints.down('sm')]: {
      marginTop: '8px',
    },
  },
  addNewButton: {
    [theme.breakpoints.down('sm')]: {
      marginTop: '8px',
    },
  },
  loaderContainer: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  confirmDeleteButton: { marginLeft: '24px' },
  confirmDeleteQuestion: {},
  confirmDeleteButtons: {
    marginTop: '100px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  tagsList: {
    marginTop: '24px',
  },
  tagsListRow: {
    display: 'flex',
    alignItems: 'center',
  },
  tagsListLabel: {
    flexGrow: 12,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  tagsListScore: { flexShrink: 0, width: '24px', marginLeft: '12px' },
  tagsListButton: {
    height: '32px',
    width: '32px',
    flexShrink: 0,
    marginLeft: '12px',
    border: 'none',
    backgroundColor: 'transparent',
  },
  deleteButton: {
    color: 'var(--danger-color)',
    fill: 'currentColor',
  },
  editButton: {
    color: 'var(--green900-color)',
  },
  cloneButton: {
    color: 'var(--blue900-color)',
  },
});


export default styles;
