
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
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
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
        <span className="brand-icon">F</span>
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
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
