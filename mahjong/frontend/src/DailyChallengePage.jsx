import React from "react";

function formatDateLabel(dateKey) {
  if (!dateKey) return "Today";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(seconds) {
  if (seconds === undefined || seconds === null) return "-";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function EntryList({ entries, emptyText }) {
  return (
    <ul className="list leaderboard-list">
      {entries.length === 0 && <li>{emptyText}</li>}
      {entries.map((entry, idx) => (
        <li key={`${entry.username}-${entry.created_at}-${idx}`}>
          <span>#{idx + 1}</span>
          <strong>{entry.username}</strong>
          <em>{entry.city}</em>
          <b>{entry.score} pts</b>
          <small>{formatTime(entry.time_seconds)}</small>
        </li>
      ))}
    </ul>
  );
}

export default function DailyChallengePage({
  summary,
  loading,
  leaderboard,
  cities,
  cityFilter,
  onCityFilterChange,
  onApplyFilter,
  onStart,
}) {
  const today = summary || {};
  const userBest = today.user_best;
  const visibleLeaderboard = cityFilter ? leaderboard : today.today_leaderboard || [];

  return (
    <section className="daily-page">
      <section className="panel daily-hero">
        <div>
          <p className="eyebrow">Daily / Rankings</p>
          <h2>{formatDateLabel(today.date_key)}</h2>
          <p className="home-copy">One shared board for everyone today, with city standings and past daily boards in one place.</p>
        </div>
        <div className="daily-status">
          <div>
            <span>Today's seed</span>
            <strong>{today.seed || "-"}</strong>
          </div>
          <div>
            <span>Attempts</span>
            <strong>{today.attempts_today ?? 0}</strong>
          </div>
          <div className="filter-row daily-filter">
            <input placeholder="Filter by city" value={cityFilter} onChange={(event) => onCityFilterChange(event.target.value)} />
            <button onClick={onApplyFilter}>Apply</button>
          </div>
          <button className="accent" onClick={onStart}>Play today's board</button>
        </div>
      </section>

      <section className="daily-grid">
        <article className="panel daily-card">
          <div className="section-title">
            <p className="eyebrow">Your day</p>
            <h3>{userBest ? "Best daily run" : "No clear yet"}</h3>
          </div>
          {userBest ? (
            <div className="daily-best">
              <div><span>Score</span><strong>{userBest.score}</strong></div>
              <div><span>Time</span><strong>{formatTime(userBest.time_seconds)}</strong></div>
              <div><span>Daily rank</span><strong>{today.user_rank ? `#${today.user_rank}` : "-"}</strong></div>
              <div><span>Hints</span><strong>{userBest.hints_used}</strong></div>
            </div>
          ) : (
            <p className="empty-state">{loading ? "Loading your daily status..." : "Play today's board to place yourself on the daily ladder."}</p>
          )}
        </article>

        <article className="panel daily-card">
          <div className="section-title">
            <p className="eyebrow">Daily ranks</p>
            <h3>{cityFilter ? `${cityFilter} leaderboard` : "Today's leaderboard"}</h3>
          </div>
          <EntryList entries={visibleLeaderboard} emptyText={loading ? "Loading daily ranks..." : "No daily clears yet."} />
        </article>
      </section>

      <section className="panel daily-archive">
        <div className="section-title">
          <p className="eyebrow">Cities</p>
          <h3>City standings</h3>
        </div>
        <ul className="list city-list">
          {cities.length === 0 && <li>No city data.</li>}
          {cities.map((city, idx) => (
            <li key={`${city.city}-${idx}`}>
              <span>#{idx + 1}</span>
              <strong>{city.city}</strong>
              <b>{city.best_score} pts</b>
              <small>{city.best_time}s best time</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel daily-archive">
        <div className="section-title">
          <p className="eyebrow">Archive</p>
          <h3>Past daily boards</h3>
        </div>
        {(today.archive || []).length === 0 ? (
          <p className="empty-state">{loading ? "Loading archive..." : "Past daily leaderboards will appear after more daily wins."}</p>
        ) : (
          <div className="archive-grid">
            {today.archive.map((day) => (
              <article key={day.date_key} className="archive-card">
                <div>
                  <span>{formatDateLabel(day.date_key)}</span>
                  <strong>{day.entries[0]?.username || "No winner"}</strong>
                </div>
                <EntryList entries={day.entries || []} emptyText="No clears." />
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
