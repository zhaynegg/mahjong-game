import { useEffect, useState } from "react";

export default function GameScreen({
  board,
  user,
  time,
  hasTimer,
  formatTime,
  maxX,
  maxY,
  tileSkin,
  isFree,
  isLocked,
  selected,
  onTileClick,
  tileStepX,
  tileStepY,
  tileDepth,
  score,
  moves,
  remainingPairs,
  availablePairs,
  progress,
  layoutName,
  coach,
  onShuffle,
  onUndo,
  onHint,
  hasUndo,
  hasHints,
  hasScore,
}) {
  const boardWidth = (maxX + 2) * tileStepX;
  const boardHeight = Math.max(500, (maxY + 2) * tileStepY);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1200 : window.innerWidth));
  const boardScale =
    viewportWidth <= 760
      ? Math.max(0.36, Math.min(0.78, (viewportWidth - 44) / boardWidth))
      : 1;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <section className="board-panel">
        <div className="board-toolbar">
          <div>
            <p className="eyebrow">Playing as {user.username} · {user.city}</p>
            <h2>{layoutName}</h2>
          </div>
          {hasTimer && <div className="timer">{formatTime(time)}</div>}
        </div>
        <div className="board-wrap">
          <div
            className="board-stage"
            style={{
              "--board-scale": boardScale,
              "--board-height": `${boardHeight}px`,
              width: `${boardWidth * boardScale}px`,
              height: `${boardHeight * boardScale}px`,
            }}
          >
            <div className="board" style={{ width: `${boardWidth}px`, height: `${boardHeight}px` }}>
              {board
                .filter((tile) => !tile.removed || (tile.removed && Date.now() - (tile.removedAt || 0) < 300))
                .sort((a, b) => a.z - b.z)
                .map((tile) => {
                  const locked = isLocked(tile);
                  return (
                    <button
                      key={tile.id}
                      className={`tile skin-${tileSkin} layer-${tile.z} ${isFree(tile) ? "free" : ""} ${locked ? "locked" : ""} ${selected.includes(tile.id) && !locked ? "selected" : ""} ${tile.hint && !locked ? "hint" : ""} ${tile.removed ? "removed" : ""}`}
                      data-level={tile.z + 1}
                      disabled={locked}
                      aria-disabled={locked}
                      aria-label={locked ? "Locked tile" : `Tile ${tile.type}`}
                      style={{
                        left: `${tile.x * tileStepX - tile.z * tileDepth}px`,
                        top: `${tile.y * tileStepY - tile.z * tileDepth}px`,
                        zIndex: tile.z * 100 + tile.y,
                      }}
                      onClick={() => onTileClick(tile.id)}
                    >
                      <span className="tile-symbol">{tile.type}</span>
                      {tile.z > 0 && <span className="tile-level">{tile.z + 1}</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      <aside className="info-rail">
        <section className="panel action-panel">
          <div className="section-title">
            <p className="eyebrow">Tools</p>
            <h3>Board actions</h3>
          </div>
          <div className="button-grid three">
            <button className="quiet" onClick={onShuffle}>Shuffle</button>
            {hasUndo && <button className="quiet" onClick={onUndo}>Undo</button>}
            {hasHints && <button className="quiet" onClick={onHint}>Hint</button>}
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <p className="eyebrow">Live stats</p>
            <h3>Current run</h3>
          </div>
          <div className="stat-grid">
            {hasScore && <div><span>Score</span><strong>{score}</strong></div>}
            <div><span>Moves</span><strong>{moves}</strong></div>
            <div><span>Pairs left</span><strong>{remainingPairs}</strong></div>
            <div><span>Available</span><strong>{availablePairs}</strong></div>
            <div><span>Clear</span><strong>{progress}%</strong></div>
          </div>
          <p className="coach">{coach}</p>
        </section>
      </aside>
    </>
  );
}
