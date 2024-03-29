import { withStyles, createStyles } from '@material-ui/core';
import { SearchWithAutocomplete } from 'components/searchWithAutocomplete/searchWithAutocomplete';

import type { Theme } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: 250,
      [theme.breakpoints.down('sm')]: {
        marginTop: '8px',
      },
    },
    container: {
      flexGrow: 1,
      position: 'relative',
    },
    paper: {
      position: 'absolute',
      zIndex: 1,
      marginTop: theme.spacing(1),
      left: 0,
      right: 0,
    },
    inputRoot: {
      flexWrap: 'wrap',
    },
    inputInput: {
      width: 'auto',
      flexGrow: 1,
    },
  });

export default withStyles(styles)(SearchWithAutocomplete);
