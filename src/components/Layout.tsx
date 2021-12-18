import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  navbar: {
    backgroundColor: 'var(--navbar-color)',
  },
  main: {
    flexGrow: 12,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
  },
  footer: {
    padding: `${theme.spacing(2)}px ${theme.spacing(4)}px`,
    backgroundColor: 'var(--footer-color)',
  },
  header: {
    maxWidth: '1440px',
    margin: '0px auto',
  },
}));

export const Layout = () => {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <nav
        className={['navbar', 'navbar-light', classes.navbar].join(' ')}
        key="nav"
      >
        <div className="container">
          <Link
            className="navbar-brand"
            to="/"
          >
            Home page
          </Link>
          <Link to="/tagsListEditor">Tags list editor</Link>
        </div>
      </nav>
      <main className={['container', classes.main].join(' ')}>
        <Outlet />
      </main>
      <footer className={classes.footer}>
        <div className="container">
          Okeanrst
          {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};
