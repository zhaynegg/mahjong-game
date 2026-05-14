import React from "react";

export default function LeaderboardPage({
  leaderboard,
  cities,
  cityFilter,
  onCityFilterChange,
  onApplyFilter,
}) {
  return (
    <section className="social-page">
      <section className="panel social-hero">
        <div>
          <p className="eyebrow">Social layer</p>
          <h2>Daily rankings</h2>
          <p className="home-copy">Track today's fastest clears and compare city standings.</p>
        </div>
        <div className="filter-row social-filter">
          <input placeholder="Filter by city" value={cityFilter} onChange={(event) => onCityFilterChange(event.target.value)} />
          <button onClick={onApplyFilter}>Apply</button>
        </div>
      </section>

      <section className="social-grid">
        <article className="panel leaderboard-panel">
          <div className="section-title">
            <p className="eyebrow">Daily leaderboard</p>
            <h3>Players today</h3>
          </div>
          <ul className="list leaderboard-list">
            {leaderboard.length === 0 && <li>No records today.</li>}
            {leaderboard.map((entry, idx) => (
              <li key={`${entry.username}-${idx}`}>
                <span>#{idx + 1}</span>
                <strong>{entry.username}</strong>
                <em>{entry.city}</em>
                <b>{entry.score} pts</b>
                <small>{entry.time_seconds}s</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel leaderboard-panel">
          <div className="section-title">
            <p className="eyebrow">Social filter</p>
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
        </article>
      </section>
    </section>
  );
}
