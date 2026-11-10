
import { useCallback, useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Timer from "./components/Timer";
import History from "./components/History";
import Tasks from "./components/Tasks";
import Settings from "./components/Settings";

import Analytics, {
  type SessionRecord,
} from "./components/Analytics";

import "./App.css";

export type Page =
  | "Dashboard"
  | "Analytics"
  | "History"
  | "Settings";

type Theme = "dark" | "light";

const SESSION_STORAGE_KEY = "focusflow_sessions";

function loadSessions(): SessionRecord[] {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is SessionRecord =>
            typeof item.id === "number" &&
            typeof item.completedAt === "string" &&
            typeof item.durationMinutes === "number" &&
            Number.isFinite(item.durationMinutes) &&
            !Number.isNaN(Date.parse(item.completedAt))
        );
      }
    }
  } catch (error) {
    console.error("Unable to load session history:", error);
  }

  return [];
}

function loadTheme(): Theme {
  try {
    return localStorage.getItem("focusflow_theme") === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function App() {
  const [sessions, setSessions] = useState<SessionRecord[]>(
    loadSessions
  );

  const [activePage, setActivePage] = useState<Page>("Dashboard");

  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(sessions)
      );
    } catch (error) {
      console.error("Unable to save session history:", error);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem("focusflow_theme", theme);
    } catch (error) {
      console.error("Unable to save theme:", error);
    }
  }, [theme]);

  const handleSessionComplete = useCallback(
    (durationMinutes: number) => {
      const newSession: SessionRecord = {
        id: Date.now(),
        completedAt: new Date().toISOString(),
        durationMinutes,
      };

      setSessions((previous) => [...previous, newSession]);

      console.log("Focus session saved:", newSession);
    },
    []
  );

  function handleClearHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to clear all session history?"
    );

    if (confirmed) {
      setSessions([]);
    }
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return (
          <div className="dashboard-content">
            <Timer
              onSessionComplete={handleSessionComplete}
            />

            <Tasks />
          </div>
        );

      case "Analytics":
        return <Analytics sessions={sessions} />;

      case "History":
        return (
          <History
            sessions={sessions}
            onClear={handleClearHistory}
          />
        );

      case "Settings":
        return (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div
      className={`app ${
        theme === "light" ? "theme-light" : ""
      }`}
    >
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onThemeToggle={() =>
          setTheme((previous) =>
            previous === "dark" ? "light" : "dark"
          )
        }
      />

      <div className="dashboard-layout">
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
