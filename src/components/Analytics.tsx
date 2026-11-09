
export type SessionRecord = {
  id: number;
  completedAt: string;
  durationMinutes: number;
};

type AnalyticsProps = {
  sessions: SessionRecord[];
};

function Analytics({ sessions }: AnalyticsProps) {
  const today = new Date().toLocaleDateString();

  const todaySessions = sessions.filter(
    (session) =>
      new Date(session.completedAt).toLocaleDateString() === today
  );

  const totalFocusTime = sessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  );

  const todayFocusTime = todaySessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  );

  const statistics = [
    {
      title: "Total Sessions",
      value: sessions.length,
      description: "All completed focus sessions",
      icon: "✓",
    },
    {
      title: "Total Focus Time",
      value: `${totalFocusTime} min`,
      description: "Time spent focusing",
      icon: "◷",
    },
    {
      title: "Today's Sessions",
      value: todaySessions.length,
      description: "Sessions completed today",
      icon: "📅",
    },
    {
      title: "Today's Focus Time",
      value: `${todayFocusTime} min`,
      description: "Today's productive time",
      icon: "⚡",
    },
  ];

  return (
    <section className="analytics-section">
      <div className="analytics-heading">
        <div>
          <p className="section-label">YOUR PERFORMANCE</p>
          <h2>Focus Analytics</h2>
        </div>
        <span className="analytics-period">All time / Today</span>
      </div>

      <div className="analytics-grid">
        {statistics.map((item) => (
          <div className="analytics-card" key={item.title}>
            <div className="analytics-icon">{item.icon}</div>
            <p>{item.title}</p>
            <h3>{item.value}</h3>
            <span>{item.description}</span>
          </div>
        ))}
      </div>

      <div className="recent-sessions">
        <h3>Recent Focus Sessions</h3>

        {sessions.length === 0 ? (
          <p className="empty-message">
            No completed sessions yet. Complete a focus session to see your analytics!
          </p>
        ) : (
          [...sessions]
            .reverse()
            .slice(0, 5)
            .map((session) => (
              <div className="session-row" key={session.id}>
                <div>
                  <strong>Focus Session</strong>
                  <p>
                    {new Date(session.completedAt).toLocaleString()}
                  </p>
                </div>

                <span>{session.durationMinutes} min</span>
              </div>
            ))
        )}
      </div>
    </section>
  );
}

export default Analytics;
