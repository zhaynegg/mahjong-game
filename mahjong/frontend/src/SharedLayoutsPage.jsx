import React from "react";

function formatRating(score, count) {
  if (!count) return "No ratings";
  return `${score.toFixed(1)} ★ (${count})`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatMode(mode) {
  if (mode === "fog") return "Fog of war";
  if (mode === "no-excuse") return "No excuse";
  return "Classic";
}

function pointKey(point) {
  return `${point.x}:${point.y}:${point.z}`;
}

function maskToPreviewCells(mask) {
  if (!Array.isArray(mask) || mask.length === 0) return [];
  const levels = Array.isArray(mask[0]) ? mask : [mask];
  const height = Math.max(...levels.map((level) => level.length), 1);
  const width = Math.max(...levels.flatMap((level) => level.map((row) => row.length)), 1);
  const cells = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let level = -1;
      levels.forEach((rows, z) => {
        if (rows[y]?.[x] === "#") level = z;
      });
      cells.push({ x, y, level });
    }
  }

  return { cells, width, height: Math.max(...cells.map((cell) => cell.y), 0) + 1 };
}

function LayoutPreview({ layout }) {
  const preview = maskToPreviewCells(layout.mask);
  const lockedKeys = new Set((layout.locked_tiles || []).map(pointKey));
  if (!preview.cells?.length) {
    return <div className="layout-preview empty">No preview</div>;
  }

  return (
    <div
      className="layout-preview"
      style={{
        gridTemplateColumns: `repeat(${preview.width}, minmax(0, 1fr))`,
      }}
      aria-label={`${layout.name} layout preview`}
    >
      {preview.cells.map((cell) => (
        <span
          key={`${cell.x}-${cell.y}`}
          title={lockedKeys.has(pointKey({ x: cell.x, y: cell.y, z: cell.level })) ? "Blocked in Fog of War" : undefined}
          className={`preview-cell ${cell.level >= 0 ? "filled" : ""} level-${cell.level + 1} ${lockedKeys.has(pointKey({ x: cell.x, y: cell.y, z: cell.level })) ? "blocked" : ""}`}
        />
      ))}
    </div>
  );
}

export default function SharedLayoutsPage({ user, layouts, loading, onPlay }) {
  return (
    <div className="shared-layouts-page">
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
                    <p>{layout.username} · {formatMode(layout.play_mode)}</p>
                  </div>
                  <div className="layout-pill-stack">
                    <span className={`mode-pill mode-${layout.play_mode || "classic"}`}>{formatMode(layout.play_mode)}</span>
                    <span className="rating-pill">{formatRating(layout.avg_rating ?? 0, layout.rating_count ?? 0)}</span>
                  </div>
                </div>
                <LayoutPreview layout={layout} />
                <div className="layout-stats-table">
                  <div>
                    <span>Created by</span>
                    <strong>{layout.username}</strong>
                  </div>
                  <div>
                    <span>Total plays</span>
                    <strong>{formatNumber(layout.total_plays)}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{layout.rating_count ? Number(layout.avg_rating ?? 0).toFixed(1) : "No ratings"}</strong>
                  </div>
                  <div>
                    <span>Mode</span>
                    <strong>{formatMode(layout.play_mode)}</strong>
                  </div>
                  {layout.play_mode === "fog" && (
                    <div>
                      <span>Blocked tiles</span>
                      <strong>{(layout.locked_tiles || []).length}</strong>
                    </div>
                  )}
                </div>
                <div className="layout-card-meta">
                  <span>{layout.shared ? "Shared" : "Hidden"}</span>
                  <span>{layout.tiles_count ? `${layout.tiles_count} tiles` : "Custom layout"}</span>
                </div>
                <div className="button-grid" style={{ marginTop: "14px" }}>
                  <button className="accent" onClick={() => onPlay(layout)}>Play</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
