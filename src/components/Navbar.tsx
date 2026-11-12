
import type { Page } from "../App";

type NavbarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
};

const icons: Record<Page, React.ReactNode> = {
  Dashboard: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),

  Analytics: (
    <svg viewBox="0 0 24 24">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 3 6-7" />
      <path d="M17 6h4v4" />
    </svg>
  ),

  History: (
    <svg viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),

  

Settings: (
  <svg viewBox="0 0 24 24">
    {/* Center circle */}
    <circle cx="12" cy="12" r="3" />

    {/* Gear outer shape */}
    <circle cx="12" cy="12" r="7.5" />

    {/* Gear teeth */}
    <path d="
      M12 2.5 V4.5
      M12 19.5 V21.5
      M2.5 12 H4.5
      M19.5 12 H21.5
      M5.28 5.28 L6.7 6.7
      M17.3 17.3 L18.72 18.72
      M18.72 5.28 L17.3 6.7
      M6.7 17.3 L5.28 18.72
    " />
  </svg>
),

};

function Navbar({
  activePage,
  onNavigate,
  theme,
  onThemeToggle,
}: NavbarProps) {
  const menuItems: Page[] = [
    "Dashboard",
    "Analytics",
    "History",
    "Settings",
  ];

  return (
    <header className="navbar">
      <div className="brand">
  <img
    src="/focusflow-symbol.png"
    alt="FocusFlow Logo"
    className="brand-logo"
  />
  <h2>FocusFlow</h2>
</div>

      <div className="navbar-right">
        <nav className="nav-links" aria-label="Main navigation">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={
                activePage === item
                  ? "icon-nav-link active"
                  : "icon-nav-link"
              }
              onClick={() => onNavigate(item)}
              title={item}
              aria-label={item}
              aria-current={
                activePage === item ? "page" : undefined
              }
            >
              {icons[item]}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="theme-toggle"
          onClick={onThemeToggle}
          title="Change theme"
          aria-label="Change theme"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.42 1.42" />
              <path d="m17.65 17.65 1.42 1.42" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m4.93 19.07 1.42-1.42" />
              <path d="m17.65 6.35 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
