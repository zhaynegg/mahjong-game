import React from "react";

function formatProgress(xp, next) {
  if (!next) return 100;
  return Math.min(100, Math.round((xp / next) * 100));
}

export default function ProfilePage({ user, history }) {
  const progress = formatProgress(user.xp ?? 0, user.next_rank_xp);
  const completedAchievements = (user.achievements || []).filter((item) => item.unlocked).length;

  return (
    <div className="profile-page">
      <section className="profile-hero panel">
        <div className="hero-info">
          <p className="eyebrow">Player profile</p>
          <h2>{user.username}</h2>
          <p className="hero-tag">{user.city} · {user.rank || "Rookie"}</p>
        </div>
        <div className="hero-stats">
          <div className="hero-card">
            <span>XP</span>
            <strong>{user.xp ?? 0}</strong>
          </div>
          <div className="hero-card">
            <span>Layouts</span>
            <strong>{user.layout_count ?? 0}</strong>
          </div>
          <div className="hero-card">
            <span>Wins</span>
            <strong>{user.total_wins ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="panel profile-summary">
        <div className="section-title">
          <p className="eyebrow">Progress</p>
          <h3>Rank growth</h3>
        </div>
        <div className="rank-card">
          <div>
            <span>Current rank</span>
            <strong>{user.rank || "Rookie"}</strong>
          </div>
          <div>
            <span>Next level</span>
            <strong>{user.next_rank_xp ? `${user.next_rank_xp} XP` : "Maxed"}</strong>
          </div>
        </div>
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-label">
          {user.next_rank_xp
            ? `Progress to next rank: ${progress}% (${user.xp ?? 0}/${user.next_rank_xp} XP)`
            : "You have reached the highest rank."}
        </p>
      </section>

      <section className="panel achievement-panel">
        <div className="section-title">
          <p className="eyebrow">Achievements</p>
          <h3>{completedAchievements} unlocked</h3>
        </div>
        <div className="achievement-grid">
          {(user.achievements || []).map((achievement) => (
            <div key={achievement.id} className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}>
              <strong>{achievement.label}</strong>
              <p>{achievement.description}</p>
              <span>{achievement.unlocked ? "Unlocked" : "Locked"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel history-panel">
        <div className="section-title">
          <p className="eyebrow">Recent games</p>
          <h3>Timeline</h3>
        </div>
        {history.length === 0 ? (
          <p className="empty-state">No played games yet. Play Classic or Daily to earn XP.</p>
        ) : (
          <ul className="list compact-list history-list">
            {history.slice(0, 8).map((item, idx) => (
              <li key={`${item.created_at}-${idx}`}>
                <div>
                  <strong>{item.mode}</strong> · {item.difficulty}
                </div>
                <div>{item.won ? `Win in ${item.time_seconds}s` : "Lost"}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
