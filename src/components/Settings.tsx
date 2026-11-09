
import { useState } from "react";

type Durations = {
  focus: number;
  shortBreak: number;
  longBreak: number;
};

type Theme = "dark" | "light";

type SettingsProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const TIMER_KEY = "focusflow_timer_settings";
const SOUND_KEY = "focusflow_sound_settings";
const NOTIFICATION_KEY = "focusflow_notification_settings";

function getSavedDurations(): Durations {
  try {
    const saved = localStorage.getItem(TIMER_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        Number.isInteger(parsed.focus) &&
        Number.isInteger(parsed.shortBreak) &&
        Number.isInteger(parsed.longBreak) &&
        parsed.focus >= 1 &&
        parsed.focus <= 180 &&
        parsed.shortBreak >= 1 &&
        parsed.shortBreak <= 60 &&
        parsed.longBreak >= 1 &&
        parsed.longBreak <= 60
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Unable to load settings:", error);
  }

  return {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  };
}

function getSavedSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "false";
  } catch {
    return true;
  }
}

// Load browser notification preference
function getSavedNotification(): boolean {
  try {
    return localStorage.getItem(NOTIFICATION_KEY) !== "false";
  } catch {
    return true;
  }
}

function Settings({ theme, onThemeChange }: SettingsProps) {
  const [durations, setDurations] = useState<Durations>(
    getSavedDurations
  );

  const [soundEnabled, setSoundEnabled] = useState(getSavedSound);

  const [notificationEnabled, setNotificationEnabled] =
    useState(getSavedNotification);

  const [message, setMessage] = useState("");

  function handleDurationChange(
    field: keyof Durations,
    value: string
  ) {
    setDurations((previous) => ({
      ...previous,
      [field]: value === "" ? 0 : Number(value),
    }));

    setMessage("");
  }

  // Handle browser notification toggle
  async function handleNotificationChange(enabled: boolean) {
    setNotificationEnabled(enabled);
    setMessage("");

    if (
      enabled &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }
  }

  function saveSettings() {
    const valid =
      Number.isInteger(durations.focus) &&
      durations.focus >= 1 &&
      durations.focus <= 180 &&
      Number.isInteger(durations.shortBreak) &&
      durations.shortBreak >= 1 &&
      durations.shortBreak <= 60 &&
      Number.isInteger(durations.longBreak) &&
      durations.longBreak >= 1 &&
      durations.longBreak <= 60;

    if (!valid) {
      setMessage("Please enter valid durations.");
      return;
    }

    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(durations));

      localStorage.setItem(
        SOUND_KEY,
        String(soundEnabled)
      );

      localStorage.setItem(
        NOTIFICATION_KEY,
        String(notificationEnabled)
      );

      localStorage.setItem("focusflow_theme", theme);

      setMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Unable to save settings:", error);
      setMessage("Unable to save settings. Please try again.");
    }
  }

  return (
    <section className="app-settings">
      <div className="settings-page-heading">
        <p className="section-label">PREFERENCES</p>
        <h1>Settings</h1>
        <p>Customize your FocusFlow experience.</p>
      </div>

      {/* Timer Duration */}
      <div className="settings-card">
        <p className="section-label">TIMER PREFERENCES</p>
        <h2>Timer Duration</h2>

        <div className="settings-inputs">
          <div>
            <label>Focus Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={durations.focus || ""}
              onChange={(event) =>
                handleDurationChange("focus", event.target.value)
              }
            />
          </div>

          <div>
            <label>Short Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={durations.shortBreak || ""}
              onChange={(event) =>
                handleDurationChange("shortBreak", event.target.value)
              }
            />
          </div>

          <div>
            <label>Long Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={durations.longBreak || ""}
              onChange={(event) =>
                handleDurationChange("longBreak", event.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Sound Notifications */}
      <div className="settings-card">
        <p className="section-label">NOTIFICATIONS</p>
        <h2>Sound Notifications</h2>

        <div className="settings-option">
          <div>
            <strong>Timer Sound</strong>
            <p>Enable sound notification preferences.</p>
          </div>

          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) =>
                setSoundEnabled(event.target.checked)
              }
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Browser Notifications */}
      <div className="settings-card">
        <p className="section-label">BROWSER ALERTS</p>
        <h2>Browser Notifications</h2>

        <div className="settings-option">
          <div>
            <strong>Notification Alerts</strong>
            <p>
              Receive alerts when a timer finishes.
            </p>
          </div>

          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(event) =>
                handleNotificationChange(event.target.checked)
              }
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <p className="settings-description">
          {notificationEnabled
            ? "Browser notifications are enabled."
            : "Browser notifications are disabled."}
        </p>
      </div>

      {/* Theme Preferences */}
      <div className="settings-card">
        <p className="section-label">APPEARANCE</p>
        <h2>Theme Preferences</h2>

        <div className="theme-options">
          <button
            className={
              theme === "dark"
                ? "theme-btn selected"
                : "theme-btn"
            }
            onClick={() => onThemeChange("dark")}
          >
            🌙 Dark Theme
          </button>

          <button
            className={
              theme === "light"
                ? "theme-btn selected"
                : "theme-btn"
            }
            onClick={() => onThemeChange("light")}
          >
            ☀️ Light Theme
          </button>
        </div>
      </div>

      {/* Save Settings */}
      <div className="settings-save-area">
        <button
          className="start-btn save-settings-btn"
          onClick={saveSettings}
        >
          Save Settings
        </button>

        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

export default Settings;

