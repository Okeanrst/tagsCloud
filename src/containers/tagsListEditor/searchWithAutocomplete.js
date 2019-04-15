import SearchWithAutocomplete from '../../components/searchWithAutocomplete';
import {withStyles} from '@material-ui/core';

const styles = theme => ({
  root: {
    //height: 250,
    width: 250,
  },
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
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
