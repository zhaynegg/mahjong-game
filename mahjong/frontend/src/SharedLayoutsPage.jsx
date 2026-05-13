import React from "react";

function formatRating(score, count) {
  if (!count) return "No ratings";
  return `${score.toFixed(1)} ★ (${count})`;
}

export default function SharedLayoutsPage({ user, layouts, loading, onPlay, onRate }) {
  return (
    <div className="shared-layouts-page">
      <section className="panel shared-hero">
        <div>
          <p className="eyebrow">Community board hall</p>
          <h2>Shared layouts</h2>
          <p>Explore Pro users' shared boards. Rate the best ones and jump into any layout instantly.</p>
        </div>
      </section>

      <section className="panel shared-grid">
        {loading ? (
          <p>Loading shared layouts...</p>
        ) : layouts.length === 0 ? (
          <p>No shared layouts yet. Check back soon.</p>
        ) : (
          <div className="layout-cards">
            {layouts.map((layout) => (
              <article key={layout.id} className="layout-card">
                <div className="layout-card-header">
                  <div>
                    <strong>{layout.name}</strong>
                    <p>{layout.username} · {layout.difficulty || "Classic"}</p>
                  </div>
                  <span className="rating-pill">{formatRating(layout.avg_rating ?? 0, layout.rating_count ?? 0)}</span>
                </div>
                <div className="layout-card-meta">
                  <span>{layout.shared ? "Shared" : "Hidden"}</span>
                  <span>{layout.tiles_count ? `${layout.tiles_count} tiles` : "Custom layout"}</span>
                </div>
                <div className="button-grid two" style={{ marginTop: "14px" }}>
                  <button className="accent" onClick={() => onPlay(layout)}>Play</button>
                  <button className="quiet" onClick={() => onRate(layout.id, 5)}>Rate ★</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
