import React from 'react';
import { Link } from 'react-router-dom';

type PropsT = { children: React.ReactNode };

const styles = {
  navbar: { backgroundColor: '#e3f2fd' },
};

const Layout = ({ children }: PropsT) => (
  <main role="main" className="container">
    <nav key="nav" className="navbar navbar-light mb-4" style={styles.navbar}>
      <Link to="/" className="navbar-brand">
        Home page
      </Link>
      <Link to="/tagsListEditor" className="">
        Tags list editor
      </Link>
    </nav>
    {children}
    <footer>Okeanrst 2021</footer>
  </main>
);

export default Layout;
