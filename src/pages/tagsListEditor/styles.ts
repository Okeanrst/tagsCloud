import { createStyles, Theme } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: 'relative',
    },
    actionsBlock: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      [theme.breakpoints.down('sm')]: {
        flexWrap: 'wrap',
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
    addNewLabel: {
      marginRight: '8px',
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
    addNewIcon: {
      width: '28px',
      height: '28px',
    },
    downloadLabel: {
      marginRight: '8px',
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
    downloadIcon: {
      width: '28px',
      height: '28px',
    },
    leanUpButton: {
      [theme.breakpoints.down('sm')]: {
        marginTop: '8px',
      },
    },
    leanUpLabel: {
      marginRight: '8px',
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
    leanUpIcon: {
      width: '28px',
      height: '28px',
    },
    loaderContainer: {
      position: 'absolute',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    },
    tagsList: {
      marginTop: '24px', // TAGS_LIST_MARGIN_TOP
    },
    tagsListRow: {
      display: 'flex',
      alignItems: 'center',
    },
    tagsListLabel: {
      flexGrow: 12,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
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
