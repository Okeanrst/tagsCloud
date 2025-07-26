import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import settingsIconSrc from 'assets/settings.svg';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  navbar: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${theme.spacing(1)}px ${theme.spacing(4)}px`,
    zIndex: 20,
    backgroundColor: 'var(--navbar-color)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    }
  },
  navbarContent: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '20px',
    [theme.breakpoints.up('lg')]: {
      maxWidth: '1140px',
    },
  },
  main: {
    width: '100%',
    flexGrow: 12,
    marginRight: 'auto',
    marginLeft: 'auto',
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    paddingRight: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('lg')]: {
      maxWidth: '1140px',
    },
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${theme.spacing(2)}px ${theme.spacing(4)}px`,
    backgroundColor: 'var(--footer-color)',
  },
  footerContent: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    [theme.breakpoints.up('lg')]: {
      maxWidth: '1140px',
    },
  },
  link: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    }
  },
  settingsLink: {
    marginLeft: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      marginLeft: theme.spacing(1),
    }
  },
  settingsLinkLabel: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    }
  },
  settingsLinkIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    }
  },
}));

export const Layout = () => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <nav className={classes.navbar}>
        <div className={classes.navbarContent}>
          <Link
            className={classes.link}
            to="/"
          >
            Tags cloud
          </Link>
          <div>
            <Link
              className={classes.link}
              to="/tagsListEditor"
            >
              Tags editor
            </Link>
            <Link
              className={cx(classes.link, classes.settingsLink)}
              to="/settings"
            >
              <span className={classes.settingsLinkLabel}>Settings</span>
              <img
                alt="settings icon"
                className={classes.settingsLinkIcon}
                src={settingsIconSrc}
              />
            </Link>
          </div>
        </div>
      </nav>
      <main className={classes.main}>
        <Outlet />
      </main>
      <footer className={classes.footer}>
        <div className={classes.footerContent}>
          Okeanrst©
          {' '}
          {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};
