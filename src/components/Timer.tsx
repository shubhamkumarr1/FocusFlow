import { useEffect, useRef, useState } from "react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

type Durations = {
  focus: number;
  shortBreak: number;
  longBreak: number;
};

type TimerProps = {
  onSessionComplete: (durationMinutes: number) => void;
};

type ProgressData = {
  completedFocusSessions: number;
  cycleProgress: number;
};

type SavedTimerData = {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  endsAt: number | null;
  showNextSession: boolean;
  nextMode: TimerMode;
};
const DEFAULT_DURATIONS: Durations = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};
const STORAGE_KEY = "focusflow_timer_settings";
const SOUND_KEY = "focusflow_sound_settings";
const NOTIFICATION_KEY = "focusflow_notification_settings";
const PROGRESS_KEY = "focusflow_pomodoro_progress";
const TIMER_STATE_KEY = "focusflow_timer_state";

function isValidMode(value: unknown): value is TimerMode {
  return (
    value === "focus" ||
    value === "shortBreak" ||
    value === "longBreak"
  );
}

function isValidDurations(value: unknown): value is Durations {
  if (typeof value !== "object" || value === null) return false;

  const settings = value as Record<string, unknown>;

  return (
    Number.isInteger(settings.focus) &&
    Number.isInteger(settings.shortBreak) &&
    Number.isInteger(settings.longBreak) &&
    Number(settings.focus) >= 1 &&
    Number(settings.focus) <= 180 &&
    Number(settings.shortBreak) >= 1 &&
    Number(settings.shortBreak) <= 60 &&
    Number(settings.longBreak) >= 1 &&
    Number(settings.longBreak) <= 60
  );
}
function getSavedDurations(): Durations {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (isValidDurations(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Unable to load timer settings:", error);
  }

  return DEFAULT_DURATIONS;
}
function getSavedProgress(): ProgressData {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (typeof parsed === "object" && parsed !== null) {
        const data = parsed as Record<string, unknown>;

        if (
          Number.isInteger(data.completedFocusSessions) &&
          Number.isInteger(data.cycleProgress) &&
          Number(data.completedFocusSessions) >= 0 &&
          Number(data.cycleProgress) >= 0 &&
          Number(data.cycleProgress) <= 4
        ) {
          return {
            completedFocusSessions: Number(data.completedFocusSessions),
            cycleProgress: Number(data.cycleProgress),
          };
        }
      }
    }
} catch (error) {
    console.error("Unable to load Pomodoro progress:", error);
  }

  return {
    completedFocusSessions: 0,
    cycleProgress: 0,
  };
}

// Load saved timer state
function getSavedTimerState(durations: Durations): SavedTimerData {
  const defaultState: SavedTimerData = {
    mode: "focus",
    timeLeft: durations.focus * 60,
    isRunning: false,
    endsAt: null,
    showNextSession: false,
    nextMode: "shortBreak",
  };

  try {
    const saved = localStorage.getItem(TIMER_STATE_KEY);

    if (!saved) return defaultState;

    const parsed: unknown = JSON.parse(saved);

    if (typeof parsed !== "object" || parsed === null) {
      return defaultState;
    }

    const data = parsed as Record<string, unknown>;

    if (
      !isValidMode(data.mode) ||
      !Number.isInteger(data.timeLeft) ||
      Number(data.timeLeft) < 0 ||
      typeof data.isRunning !== "boolean" ||
      typeof data.showNextSession !== "boolean" ||
      !isValidMode(data.nextMode)
    ) {
      return defaultState;
    }

    const isRunning = data.isRunning && !data.showNextSession;

    const savedEndsAt =
      typeof data.endsAt === "number" &&
      Number.isFinite(data.endsAt)
        ? data.endsAt
        : null;

    const endsAt = isRunning
      ? savedEndsAt ?? Date.now() + Number(data.timeLeft) * 1000
      : null;

    const timeLeft =
      isRunning && endsAt !== null
        ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
        : Number(data.timeLeft);
return {
      mode: data.mode,
      timeLeft,
      isRunning,
      endsAt,
      showNextSession: data.showNextSession,
      nextMode: data.nextMode,
    };
  } catch (error) {
    console.error("Unable to load timer state:", error);
    return defaultState;
  }
}

// Play completion sound
function playCompletionSound() {
  try {
    if (localStorage.getItem(SOUND_KEY) === "false") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
 oscillator.type = "sine";
    oscillator.frequency.value = 800;

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.8
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.8);

    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch (error) {
    console.error("Unable to play notification sound:", error);
  }
}

// Browser notification
function showBrowserNotification(mode: TimerMode) {
  if (!("Notification" in window)) return;

  if (localStorage.getItem(NOTIFICATION_KEY) === "false") return;

  if (Notification.permission !== "granted") return;
   const title =
    mode === "focus"
      ? "Focus session completed! 🎉"
      : mode === "shortBreak"
      ? "Short break completed! ⏰"
      : "Long break completed! 💪";

  const message =
    mode === "focus"
      ? "Great work! Time for a break."
      : "Break is over. Ready to focus again?";

  new Notification(title, {
    body: message,
    icon: "/favicon.ico",
  });
}

function Timer({ onSessionComplete }: TimerProps) {
  const [durations, setDurations] = useState<Durations>(
    getSavedDurations
  );

  // Restore timer state after refresh
  const [initialTimerState] = useState(() =>
    getSavedTimerState(getSavedDurations())
  );

  const [mode, setMode] = useState<TimerMode>(
    initialTimerState.mode
  );
  const [timeLeft, setTimeLeft] = useState(
    initialTimerState.timeLeft
  );

  const [isRunning, setIsRunning] = useState(
    initialTimerState.isRunning
  );

  const [endsAt, setEndsAt] = useState<number | null>(
    initialTimerState.endsAt
  );

  const [showNextSession, setShowNextSession] = useState(
    initialTimerState.showNextSession
  );

  const [nextMode, setNextMode] = useState<TimerMode>(
    initialTimerState.nextMode
  );

  const [completedFocusSessions, setCompletedFocusSessions] =
    useState(() => getSavedProgress().completedFocusSessions);

  const [cycleProgress, setCycleProgress] = useState(
    () => getSavedProgress().cycleProgress
  );

  const completionHandled = useRef(false);

  // Save original browser tab title
  const originalDocumentTitle = useRef(document.title);

  const previousDurations = useRef(durations);

// Save Pomodoro progress
  useEffect(() => {
    const progress: ProgressData = {
      completedFocusSessions,
      cycleProgress,
    };

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Unable to save Pomodoro progress:", error);
    }
  }, [completedFocusSessions, cycleProgress]);

  // Save timer state
  useEffect(() => {
    const timerState: SavedTimerData = {
      mode,
      timeLeft,
      isRunning,
      endsAt,
      showNextSession,
      nextMode,
    };
     try {
      localStorage.setItem(
        TIMER_STATE_KEY,
        JSON.stringify(timerState)
      );
    } catch (error) {
      console.error("Unable to save timer state:", error);
    }
  }, [mode, timeLeft, isRunning, endsAt, showNextSession, nextMode]);

  // Request notification permission
  useEffect(() => {
    if (!("Notification" in window)) return;

    const enabled =
      localStorage.getItem(NOTIFICATION_KEY) !== "false";

    if (enabled && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => {
        console.error("Notification permission error:", error);
      });
    }
  }, []);

  // Listen for updated timer settings
  useEffect(() => {
    function updateDurations() {
      setDurations(getSavedDurations());
    }
     window.addEventListener(
      "focusflow-settings-updated",
      updateDurations
    );

    window.addEventListener("storage", updateDurations);

    return () => {
      window.removeEventListener(
        "focusflow-settings-updated",
        updateDurations
      );

      window.removeEventListener("storage", updateDurations);
    };
  }, []);

  // Update paused timer when settings change
  useEffect(() => {
    const oldDurations = previousDurations.current;

    const hasChanged =
      oldDurations.focus !== durations.focus ||
      oldDurations.shortBreak !== durations.shortBreak ||
      oldDurations.longBreak !== durations.longBreak;

    previousDurations.current = durations;

    if (hasChanged && !isRunning && !showNextSession) {
      setTimeLeft(durations[mode] * 60);
      setEndsAt(null);
      completionHandled.current = false;
    }
  }, [durations, isRunning, showNextSession, mode]);
  // Countdown using end timestamp
  useEffect(() => {
    if (!isRunning || endsAt === null) return;

    const endTime = endsAt;

    function updateRemainingTime() {
      const remaining = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
      );

      setTimeLeft(remaining);
    }

    updateRemainingTime();

    const interval = setInterval(updateRemainingTime, 250);

    return () => clearInterval(interval);
  }, [isRunning, endsAt]);

  // Handle timer completion
  useEffect(() => {
    if (
      timeLeft !== 0 ||
      !isRunning ||
      completionHandled.current
    ) {
      return;
    }
    completionHandled.current = true;

    setIsRunning(false);
    setEndsAt(null);

    playCompletionSound();
    showBrowserNotification(mode);

    let upcomingMode: TimerMode = "focus";

    if (mode === "focus") {
      const nextCount = completedFocusSessions + 1;
      const nextProgress = Math.min(cycleProgress + 1, 4);

      setCompletedFocusSessions(nextCount);
      setCycleProgress(nextProgress);

      upcomingMode =
        nextProgress === 4 ? "longBreak" : "shortBreak";

      onSessionComplete(durations.focus);
    } else if (mode === "longBreak") {
      setCycleProgress(0);
      upcomingMode = "focus";
    } else {
      upcomingMode = "focus";
    }
setNextMode(upcomingMode);
    setShowNextSession(true);
  }, [
    timeLeft,
    isRunning,
    mode,
    durations.focus,
    completedFocusSessions,
    cycleProgress,
    onSessionComplete,
  ]);

  // Start or pause timer
  function handleStartPause() {
    if (isRunning) {
      const remaining =
        endsAt !== null
          ? Math.max(
              0,
              Math.ceil((endsAt - Date.now()) / 1000)
            )
          : timeLeft;

      setTimeLeft(remaining);
      setIsRunning(false);
      setEndsAt(null);
    } else {
      setEndsAt(Date.now() + timeLeft * 1000);
      setIsRunning(true);
    }
  }
  // Handle next session choice
  function handleNextChoice(autoStart: boolean) {
    const selectedMode = nextMode;
    const newTime = durations[selectedMode] * 60;

    setMode(selectedMode);
    setTimeLeft(newTime);

    setShowNextSession(false);
    completionHandled.current = false;

    if (autoStart) {
      setEndsAt(Date.now() + newTime * 1000);
      setIsRunning(true);
    } else {
      setEndsAt(null);
      setIsRunning(false);
    }
  }

  // Change timer mode manually
  function changeMode(newMode: TimerMode) {
    setIsRunning(false);
    setEndsAt(null);
    setShowNextSession(false);
    completionHandled.current = false;

    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
  }

  // Reset timer
  function handleReset() {
    setIsRunning(false);
    setEndsAt(null);
    setShowNextSession(false);
    completionHandled.current = false;
  setTimeLeft(durations[mode] * 60);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Lesson 34: Circular timer progress
  const totalDuration = durations[mode] * 60;
  const timerProgress =
    totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;

  const circleRadius = 90;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset =
    circleCircumference * (1 - timerProgress / 100);

  const modeName =
    nextMode === "focus"
      ? "Focus Session"
      : nextMode === "shortBreak"
      ? "Short Break"
      : "Long Break";

  // Lesson 33: Update browser tab title
  useEffect(() => {
    const modeLabel =
      mode === "focus"
        ? "Focus"
        : mode === "shortBreak"
        ? "Short Break"
        : "Long Break";
         if (showNextSession) {
      document.title = "Session Completed! - FocusFlow";
    } else if (isRunning) {
      document.title = `${formattedTime} - ${modeLabel} | FocusFlow`;
    } else {
      document.title = `${formattedTime} (Paused) - FocusFlow`;
    }
  }, [formattedTime, mode, isRunning, showNextSession]);

  // Restore original title when Timer unmounts
  useEffect(() => {
    return () => {
      document.title = originalDocumentTitle.current;
    };
  }, []);

  return (
    <section className="timer-section">
      <div className="timer-card">
        <p className="section-label">POMODORO TIMER</p>

        <h2>
          {mode === "focus"
            ? "Time to Focus"
            : mode === "shortBreak"
            ? "Take a Short Break"
            : "Take a Long Break"}
        </h2>

        <div className="mode-buttons">
          <button
            className={mode === "focus" ? "mode-btn selected" : "mode-btn"}
            onClick={() => changeMode("focus")}
          >
            Focus
          </button>
           <button
            className={
              mode === "shortBreak"
                ? "mode-btn selected"
                : "mode-btn"
            }
            onClick={() => changeMode("shortBreak")}
          >
            Short Break
          </button>

          <button
            className={
              mode === "longBreak"
                ? "mode-btn selected"
                : "mode-btn"
            }
            onClick={() => changeMode("longBreak")}
          >
            Long Break
          </button>
        </div>

        {/* Pomodoro Cycle Progress */}
        <div className="cycle-progress">
          <div className="cycle-progress-heading">
            <span>Pomodoro Progress</span>
            <strong>{cycleProgress}/4</strong>
          </div> <div className="cycle-progress-bars">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={
                  step <= cycleProgress
                    ? "cycle-bar completed"
                    : "cycle-bar"
                }
              />
            ))}
          </div>

          <p>
            {cycleProgress === 4
              ? "All focus sessions completed! Take a long break."
              : `${4 - cycleProgress} focus session(s) until long break`}
          </p>
        </div>
        <div className="timer-circle-wrapper">
          <svg
            className="timer-circle"
            viewBox="0 0 200 200"
            role="progressbar"
            aria-label="Timer progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timerProgress)}
          >
            <circle
              className="timer-circle-track"
              cx="100"
              cy="100"
              r={circleRadius}
            />
            <circle
              className={`timer-circle-progress ${mode}`}
              cx="100"
              cy="100"
              r={circleRadius}
              strokeDasharray={circleCircumference}
              strokeDashoffset={circleOffset}
            />
          </svg>
           <div className="timer-circle-content">
            <div className="timer-display">{formattedTime}</div>
            <p className="timer-circle-label">
              {mode === "focus"
                ? "FOCUS TIME"
                : mode === "shortBreak"
                ? "SHORT BREAK"
                : "LONG BREAK"}
            </p>
          </div>
        </div>

        <p className="timer-message">
          {isRunning
            ? "Stay focused. You are doing great!"
            : "Ready to make progress?"}
        </p>

        <div className="timer-actions">
          <button
            className="start-btn"
            onClick={handleStartPause}
            disabled={showNextSession}
          >
            {isRunning ? "Pause" : "Start"}
          </button>

          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>  </div>

        {/* Next Session Choice */}
        {showNextSession && (
          <div className="next-session-box">
            <h3>🎉 Session Completed!</h3>

            <p>
              Your next session is: <strong>{modeName}</strong>
            </p>

            <p>What would you like to do next?</p>

            <div className="timer-actions">
              <button
                className="start-btn"
                onClick={() => handleNextChoice(true)}
              >
                Auto Start
              </button>

              <button
                className="reset-btn"
                onClick={() => handleNextChoice(false)}
              >
                Manual Start
              </button>
            </div>
          </div>
        )}

        <p className="timer-message">
          Completed Focus Sessions: {completedFocusSessions}
        </p>
      </div>
    </section>
  );
}

export default Timer;



