import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import { useDarkLightTheme } from 'contexts/DarkLightThemeContext';
import { IconButton } from 'ui/buttons/IconButton';
import { LogoIcon } from 'ui/icons/LogoIcon';
import { SettingsIcon } from 'ui/icons/SettingsIcon';
import { LightModeIcon } from 'ui/icons/LightModeIcon';
import { DarkModeIcon } from 'ui/icons/DarkModeIcon';

const useStyles = makeStyles((theme) => ({
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
    },
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
  navbarContentRightGroup: {
    marginLeft: theme.spacing(3),
    '& > *:not(:first-child)': {
      marginLeft: theme.spacing(3),
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
    [`${theme.breakpoints.down('sm')} and (orientation: landscape)`]: {
      paddingBottom: theme.spacing(2),
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
    lineHeight: `${theme.spacing(6)}px`,
    backgroundColor: 'transparent',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
  logoIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    color: 'var(--primary-main-color)',
  },
  settingsLinkLabel: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  settingsLinkIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  themeIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    color: 'var(--primary-main-color)',
  },
}));

export const Layout = () => {
  const classes = useStyles();
  const { theme, toggleTheme } = useDarkLightTheme();
  return (
    <div className={classes.root}>
      <nav className={classes.navbar}>
        <div className={classes.navbarContent}>
          <Link className={classes.link} to="/">
            <span className={classes.settingsLinkLabel}>Tags cloud</span>
            <LogoIcon className={classes.logoIcon} />
          </Link>
          <div className={classes.navbarContentRightGroup}>
            <Link className={classes.link} to="/tagsListEditor">
              Tags editor
            </Link>
            <Link className={classes.link} to="/settings">
              <span className={classes.settingsLinkLabel}>Settings</span>
              <SettingsIcon className={classes.settingsLinkIcon} />
            </Link>
            <IconButton onClick={toggleTheme}>
              {theme === 'light' ? (
                <LightModeIcon className={classes.themeIcon} />
              ) : (
                <DarkModeIcon className={classes.themeIcon} />
              )}
            </IconButton>
          </div>
        </div>
      </nav>
      <main className={classes.main}>
        <Outlet />
      </main>
      <footer className={classes.footer}>
        <div className={classes.footerContent}>Okeanrst© {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};
