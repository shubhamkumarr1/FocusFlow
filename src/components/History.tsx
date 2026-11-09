

import type { SessionRecord } from "./Analytics";

type HistoryProps = {
  sessions: SessionRecord[];
  onClear: () => void;
};

function History({ sessions, onClear }: HistoryProps) {
  const sortedSessions = [...sessions].reverse();

  return (
    <section className="history-section">
      <div className="history-heading">
        <div>
          <p className="section-label">YOUR ACTIVITY</p>
          <h2>Session History</h2>
          <p className="history-subtitle">
            Your recently completed focus sessions
          </p>
        </div>

        <div className="history-actions">
          <span>{sessions.length} Sessions</span>

          <button
            className="clear-history-btn"
            onClick={onClear}
            disabled={sessions.length === 0}
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="history-card">
        {sessions.length === 0 ? (
          <div className="history-empty">
            <h3>No Sessions Yet</h3>
            <p>Complete a focus session to see it here.</p>
          </div>
        ) : (
          <div className="history-list">
            {sortedSessions.map((session) => (
              <div className="history-row" key={session.id}>
                <div>
                  <strong>✓ Focus Session</strong>
                  <p>
                    {new Date(session.completedAt).toLocaleDateString()}
                    {" · "}
                    {new Date(session.completedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <strong>{session.durationMinutes} min</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default History;
