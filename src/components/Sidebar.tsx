
type Page = "Dashboard" | "Tasks" | "Analytics" | "History" | "Settings";

type SidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
};

function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const menuItems: { name: Page; icon: string }[] = [
    { name: "Dashboard", icon: "▦" },
    { name: "Tasks", icon: "✓" },
    { name: "Analytics", icon: "▥" },
    { name: "History", icon: "◷" },
    { name: "Settings", icon: "⚙" },
  ];

  return (
    <aside className="sidebar">
      <p className="sidebar-heading">WORKSPACE</p>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={activePage === item.name ? "active" : ""}
            onClick={() => onNavigate(item.name)}
          >
            {item.icon} {item.name}
          </li>
        ))}
      </ul>

      <div className="sidebar-bottom">
        <p>FOCUSFLOW</p>
        <span>Build better habits, one session at a time.</span>
      </div>
    </aside>
  );
}

export default Sidebar;

