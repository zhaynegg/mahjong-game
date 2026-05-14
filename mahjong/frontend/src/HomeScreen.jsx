import React from "react";

export default function HomeScreen({
  user,
  difficulty,
  onDifficultyChange,
  tileSkin,
  onTileSkinChange,
  availableSkins,
  customLayouts,
  selectedLayoutId,
  onSelectedLayoutChange,
  selectedMode,
  onSelectedModeChange,
  onStart,
  onOpenBuilder,
  onOpenShared,
}) {
  const selectedCustomLayout = customLayouts.find((layout) => String(layout.id) === selectedLayoutId);
  const canStart = selectedMode !== "custom" || Boolean(selectedCustomLayout);
  const modes = [
    { id: "classic", label: "Classic layouts", note: "Random board by difficulty" },
    { id: "daily", label: "Daily task", note: "Today's seeded challenge" },
    { id: "custom", label: "Custom layout", note: customLayouts.length ? "Use your saved boards" : "No saved boards yet", disabled: customLayouts.length === 0 },
    { id: "fog", label: "Fog of war", note: "Locked tiles reveal after dependencies" },
    { id: "no-excuse", label: "No excuse", note: "Mistakes add tiles and reshuffle" },
  ];

  return (
    <div className="home-screen">
      <section className="home-hero panel">
        <div>
          <p className="eyebrow">Mahjong Focus</p>
          <h2>Prepare the board</h2>
          <p className="home-copy">
            Choose the run, shape, and tile skin before the first match starts.
          </p>
        </div>
        <div className="home-player">
          <span>{user.city}</span>
          <strong>{user.username}</strong>
          <small>{user.rank || "Rookie"} · {user.xp ?? 0} XP</small>
        </div>
      </section>

      <section className="home-grid">
        <article className="panel home-card">
          <div className="section-title">
            <p className="eyebrow">Difficulty</p>
            <h3>Pick the pressure</h3>
          </div>
          <div className="choice-grid three">
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                className={`choice-button ${difficulty === level ? "active" : ""}`}
                onClick={() => onDifficultyChange(level)}
              >
                <strong>{level}</strong>
                <span>{level === "easy" ? "Wide and calm" : level === "medium" ? "Layered classic" : "Tall and tight"}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel home-card">
          <div className="section-title">
            <p className="eyebrow">Tile skin</p>
            <h3>Choose the ornament</h3>
          </div>
          <div className="skin-grid">
            {availableSkins.map((skin) => (
              <button
                key={skin.id}
                className={`skin-choice ${tileSkin === skin.id ? "active" : ""}`}
                onClick={() => onTileSkinChange(skin.id)}
              >
                <span className={`skin-swatch skin-${skin.id}`}>🀄</span>
                <span>{skin.label}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel home-card home-card-wide">
          <div className="section-title">
            <p className="eyebrow">Layout</p>
            <h3>Choose the board source</h3>
          </div>
          <div className="choice-grid mode-choice-grid">
            {modes.map((mode) => (
              <button
                key={mode.id}
                className={`choice-button ${selectedMode === mode.id ? "active" : ""}`}
                onClick={() => onSelectedModeChange(mode.id)}
                disabled={mode.disabled}
              >
                <strong>{mode.label}</strong>
                <span>{mode.note}</span>
              </button>
            ))}
          </div>

          {selectedMode === "custom" && (
            <div className="home-select-row">
              <label>Saved layout</label>
              <select value={selectedLayoutId} onChange={(event) => onSelectedLayoutChange(event.target.value)}>
                <option value="">Choose a custom layout...</option>
                {customLayouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            </div>
          )}


          <div className="home-actions">
            {user.is_pro && <button className="quiet" onClick={onOpenBuilder}>Layout studio</button>}
            <button className="accent start-button" onClick={onStart} disabled={!canStart}>Start game</button>
          </div>
        </article>
      </section>
    </div>
  );
}
