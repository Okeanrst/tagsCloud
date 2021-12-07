import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const styles = {
  navbar: { backgroundColor: '#e3f2fd' },
};

export const Layout = () => (
  <main role="main" className="container">
    <nav key="nav" className="navbar navbar-light mb-4" style={styles.navbar}>
      <Link to="/" className="navbar-brand">
        Home page
      </Link>
      <Link to="/tagsListEditor" className="">
        Tags list editor
      </Link>
    </nav>
    <Outlet />
    <footer>Okeanrst 2021</footer>
  </main>
);
