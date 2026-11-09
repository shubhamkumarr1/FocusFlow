
function Navbar() {
  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-icon">F</span>
        <h2>FocusFlow</h2>
      </div>

      <nav className="nav-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#tasks">Tasks</a>
        <a href="#analytics">Analytics</a>
        <a href="#settings">Settings</a>
      </nav>

      <div className="profile">
        <span className="profile-avatar">S</span>
        <span>Student</span>
      </div>
    </header>
  );
}

export default Navbar;
