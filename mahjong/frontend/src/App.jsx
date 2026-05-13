import { useEffect, useMemo, useState } from "react";
import GameScreen from "./GameScreen";
import HomeScreen from "./HomeScreen";
import ProfilePage from "./ProfilePage";
import SharedLayoutsPage from "./SharedLayoutsPage";

const API = "http://192.168.0.101:8000/api";
const API_TIMEOUT_MS = 15000;
const LAYOUT_API_TIMEOUT_MS = 30000;
const TILE_SET = ["🀇", "🀈", "🀉", "🀐", "🀑", "🀒", "🀙", "🀚", "🀛", "🀀", "🀁", "🀄"];
const TILE_STEP_X = 60;
const TILE_STEP_Y = 76;
const TILE_DEPTH = 7;
const GRID_WIDTH = 14;
const GRID_HEIGHT = 8;
const TILE_SKINS = [
  { id: "classic", label: "Classic", pro: false },
  { id: "jade", label: "Jade", pro: false },
  { id: "sunset", label: "Sunset", pro: true },
  { id: "moon", label: "Moon", pro: true },
  { id: "stone", label: "Stone", pro: true },
  { id: "cybertrack", label: "Cybertrack", pro: true },
  { id: "kazakh", label: "Kazakh Ornaments", pro: true },
  { id: "sakura", label: "Sakura", pro: true },
  { id: "minimalist", label: "Minimalist", pro: true },
  { id: "neon", label: "Neon", pro: true },
];

function maskToPoints(mask) {
  // Check if this is a multi-level custom format (4 levels × 8 rows)
  if (Array.isArray(mask[0]) && typeof mask[0][0] === "string") {
    return mask.flatMap((levelRows, z) =>
      levelRows.flatMap((row, y) =>
        [...row].flatMap((cell, x) => (cell === "#" ? [{ x, y, z }] : [])),
      ),
    );
  }
  // Original single-level structure format
  return mask.flatMap((row, y) =>
    [...row].flatMap((cell, x) => (cell === "#" ? [{ x, y, z: 0 }] : [])),
  );
}

const STRUCTURES = [
  { name: "Classic", difficulty: "easy", mask: ["....######....", "..##########..", ".############.", "##############", ".############.", "..##########..", "....######...."] },
  { name: "Classic II", difficulty: "easy", mask: ["..##########..", ".############.", "######..######", "#####....#####", "######..######", ".############.", "..##########.."] },
  { name: "Pyramini", difficulty: "medium", mask: ["......##......", ".....####.....", "....######....", "...########...", "..##########..", ".############.", "##############"] },
  { name: "Harmony", difficulty: "medium", mask: ["..####..####..", ".############.", "##############", "#####....#####", "##############", ".############.", "..####..####.."] },
  { name: "Fish", difficulty: "medium", mask: ["....#####.....", "..#########...", "#############.", "..###########.", "....#####..###", "..........####", "...........##."] },
  { name: "Bridge", difficulty: "easy", mask: ["##############", "####......####", "###........###", "###........###", "####......####", "##############"] },
  { name: "Twin Peaks", difficulty: "medium", mask: ["..####..####..", ".######.#####.", "##############", "##############", "..##########..", "...########..."] },
  { name: "Tri Peaks", difficulty: "medium", mask: [".###..###..###", "##############", "##############", ".############.", "..##########.."] },
  { name: "Hollow", difficulty: "hard", mask: ["##############", "##############", "###........###", "###........###", "###........###", "##############", "##############"] },
  { name: "H", difficulty: "easy", mask: ["###........###", "###........###", "###........###", "##############", "##############", "###........###", "###........###", "###........###"] },
  { name: "Teeth", difficulty: "medium", mask: ["##############", ".############.", "..##########..", ".##..##..##...", "##..##..##..##", ".##..##..##..."] },
  { name: "Gate", difficulty: "easy", mask: ["##############", "##############", "###........###", "###........###", "###........###", "###........###", "###........###"] },
  { name: "Butterfly", difficulty: "hard", mask: ["###........###", "#####....#####", "##############", "..##########..", "..##########..", "##############", "#####....#####", "###........###"] },
  { name: "Pyramid", difficulty: "hard", mask: ["......##......", ".....####.....", "....######....", "...########...", "..##########..", ".############.", "##############", "##############"] },
  { name: "Triangle", difficulty: "hard", mask: ["#.............", "###...........", "#####.........", "#######.......", "#########.....", "###########...", "#############.", "##############"] },
  { name: "Square", difficulty: "easy", mask: ["##############", "##############", "##############", "##############", "##############", "##############"] },
  { name: "Tower", difficulty: "easy", mask: ["....######....", "....######....", "....######....", "..##########..", "..##########..", "##############", "##############"] },
  { name: "X", difficulty: "hard", mask: ["###........###", ".###......###.", "..###....###..", "...###..###...", "....######....", "...###..###...", "..###....###..", ".###......###.", "###........###"] },
  { name: "UFO", difficulty: "medium", mask: ["....######....", "..##########..", ".############.", "##############", "##############", ".############.", "..##########..", "....######...."] },
  { name: "Cross", difficulty: "easy", mask: [".....####.....", ".....####.....", "##############", "##############", ".....####.....", ".....####....."] },
  { name: "Great Wall", difficulty: "easy", mask: ["##############", "##############", "..##########..", "..##########..", "##############", "##############"] },
  { name: "Snake", difficulty: "hard", mask: ["##########....", "##########....", "......########", "......########", "########......", "########......", "....##########", "....##########"] },
  { name: "Blade", difficulty: "hard", mask: ["##########....", ".##########...", "..##########..", "...##########.", "....##########", "...##########.", "..##########.."] },
  { name: "Double Play", difficulty: "medium", mask: ["######..######", "######..######", "######..######", "######..######", "######..######", "######..######"] },
  { name: "Bullseye", difficulty: "medium", mask: ["..##########..", ".############.", "####......####", "###..####..###", "###..####..###", "####......####", ".############.", "..##########.."] },
  { name: "Circles", difficulty: "medium", mask: ["..####..####..", ".######.#####.", "#######.######", ".######.#####.", "..####..####.."] },
];

function rng(seed) {
  let x = seed;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maskToLayer(mask, z) {
  const width = Math.max(...mask.map((row) => row.length));
  return mask.flatMap((row, y) => {
    const padded = row.padEnd(width, ".");
    return [...padded].flatMap((cell, x) => (cell === "#" ? [{ x, y, z }] : []));
  });
}

function erodeLayer(layer, z) {
  const cells = new Set(layer.map((p) => `${p.x}:${p.y}`));
  return layer
    .filter((p) => cells.has(`${p.x - 1}:${p.y}`) && cells.has(`${p.x + 1}:${p.y}`) && cells.has(`${p.x}:${p.y - 1}`) && cells.has(`${p.x}:${p.y + 1}`))
    .map((p) => ({ x: p.x, y: p.y, z }));
}

function maxLayersByDifficulty(difficulty) {
  if (difficulty === "easy") return 2;
  if (difficulty === "hard") return 4;
  return 3;
}

function generateBoard(difficulty, seed) {
  const random = rng(seed);
  const structures = STRUCTURES.filter((structure) => structure.difficulty === difficulty);
  const structureList = structures.length ? structures : STRUCTURES;
  const structure = structureList[Math.floor(random() * structureList.length)];
  let layer = maskToLayer(structure.mask, 0);
  const points = [...layer];
  const maxLayers = maxLayersByDifficulty(difficulty);
  for (let z = 1; z < maxLayers; z += 1) {
    layer = erodeLayer(layer, z);
    if (layer.length < 2) break;
    points.push(...layer);
  }
  const total = points.length % 2 === 0 ? points.length : points.length - 1;
  const playablePoints = points.slice(0, total);
  const symbols = [];
  for (let i = 0; i < total / 2; i += 1) {
    const symbol = TILE_SET[i % TILE_SET.length];
    symbols.push(symbol, symbol);
  }
  for (let i = symbols.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return {
    name: structure.name,
    tiles: playablePoints.map((p, i) => ({ id: `${p.x}-${p.y}-${p.z}-${i}`, ...p, type: symbols[i], removed: false, hint: false })),
  };
}

function generateCustomBoard(mask, name, seed) {
  const points = maskToPoints(mask);
  const total = points.length % 2 === 0 ? points.length : points.length - 1;
  const playablePoints = points.slice(0, total);
  const random = rng(seed);
  const symbols = [];
  for (let i = 0; i < total / 2; i += 1) {
    const symbol = TILE_SET[i % TILE_SET.length];
    symbols.push(symbol, symbol);
  }
  for (let i = symbols.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return {
    name,
    tiles: playablePoints.map((p, i) => ({ id: `${p.x}-${p.y}-${p.z}-${i}`, ...p, type: symbols[i], removed: false, hint: false })),
  };
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function dailySeed() {
  const now = new Date();
  return Number(`${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}`);
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("mf_token") || "");
  const [theme, setTheme] = useState(localStorage.getItem("mf_theme") || "dark");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ username: "", password: "", city: "Almaty" });
  const [authError, setAuthError] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [tileSkin, setTileSkin] = useState(localStorage.getItem("mf_tile_skin") || "classic");
  const [mode, setMode] = useState("classic");
  const [hasTimer, setHasTimer] = useState(true);
  const [hasScore, setHasScore] = useState(true);
  const [hasUndo, setHasUndo] = useState(true);
  const [hasHints, setHasHints] = useState(true);

  const [timeLimit, setTimeLimit] = useState(null);
  const [layoutName, setLayoutName] = useState("Classic");
  const [page, setPage] = useState("home");
  const [homeMode, setHomeMode] = useState("classic");
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [victory, setVictory] = useState(null);
  const [customLayouts, setCustomLayouts] = useState([]);
  const [customName, setCustomName] = useState("My layout");
  const [customMask, setCustomMask] = useState(Array.from({ length: 4 }, () => Array.from({ length: GRID_HEIGHT }, () => ".".repeat(GRID_WIDTH))));
  const [activeCustomLayout, setActiveCustomLayout] = useState(null);
  const [builderStatus, setBuilderStatus] = useState("");
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [undoStack, setUndoStack] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [time, setTime] = useState(0);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cities, setCities] = useState([]);
  const [sharedLayouts, setSharedLayouts] = useState([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [coach, setCoach] = useState("AI Coach is ready.");
  const [cityFilter, setCityFilter] = useState("");
  const availableSkins = TILE_SKINS.filter((skin) => !skin.pro || user?.is_pro);

  useEffect(() => {
    localStorage.setItem("mf_tile_skin", tileSkin);
  }, [tileSkin]);

  useEffect(() => {
    if (!user?.is_pro && TILE_SKINS.find((skin) => skin.id === tileSkin)?.pro) {
      setTileSkin("classic");
    }
    if (!TILE_SKINS.some((skin) => skin.id === tileSkin)) {
      setTileSkin("classic");
    }
  }, [user, tileSkin]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isHome = page === "home";
  const isProfile = page === "profile";
  const isShared = page === "shared";

  async function api(path, options = {}) {
    const { timeoutMs = API_TIMEOUT_MS, ...fetchOptions } = options;
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(`${API}${path}`, { ...fetchOptions, headers, signal: options.signal || controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    const json = await response.json();
    if (!response.ok) {
      const d = json.detail;
      const msg = Array.isArray(d) ? d.map(String).join(" ") : typeof d === "string" ? d : "Request failed";
      throw new Error(msg);
    }
    return json;
  }

  const hasTileAt = (x, y, z, ignoreId) => board.some((t) => !t.removed && t.id !== ignoreId && t.x === x && t.y === y && t.z === z);

  const isFree = (tile) => {
    if (tile.removed) return false;
    if (hasTileAt(tile.x, tile.y, tile.z + 1, tile.id)) return false;
    const left = hasTileAt(tile.x - 1, tile.y, tile.z, tile.id);
    const right = hasTileAt(tile.x + 1, tile.y, tile.z, tile.id);
    return !left || !right;
  };

  const freeTiles = useMemo(() => board.filter((t) => isFree(t)), [board]);
  const remainingPairs = useMemo(() => Math.floor(board.filter((t) => !t.removed).length / 2), [board]);
  const availablePairs = useMemo(() => {
    const counts = {};
    freeTiles.forEach((t) => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    return Object.values(counts).reduce((sum, n) => sum + Math.floor(n / 2), 0);
  }, [freeTiles]);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      if (timeLimit) {
        const remaining = timeLimit - elapsed;
        setTime(remaining);
        if (remaining <= 0) {
          // Game over for Blitz
          setVictory({ score: score, time: elapsed, moves, mode, difficulty, lost: true });
        }
      } else {
        setTime(elapsed);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, timeLimit, score, moves, mode, difficulty]);

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    localStorage.setItem("mf_theme", theme);
  }, [theme]);

  async function loadProfile({ includeRelated = true } = {}) {
    if (!token) return;
    try {
      const me = await api("/me");
      setUser(me);
      setDrawerOpen(false);
      if (includeRelated) {
        Promise.all([loadHistory(), loadLeaderboards()]).catch(() => {});
      }
    } catch {
      setToken("");
      setUser(null);
      setDrawerOpen(false);
      localStorage.removeItem("mf_token");
    }
  }

  async function refreshAfterGame() {
    await Promise.all([loadHistory(), loadLeaderboards(), loadProfile({ includeRelated: false })]);
  }

  useEffect(() => {
    loadProfile();
  }, [token]);

  useEffect(() => {
    if (user?.is_pro) {
      loadLayouts().catch(() => {});
    } else {
      setCustomLayouts([]);
    }
  }, [user]);

  useEffect(() => {
    if (page === "shared") {
      loadSharedLayouts().catch(() => {});
    }
  }, [page, user]);

  async function loadHistory() {
    const data = await api("/game/history");
    setHistory(data.items);
  }

  async function loadLeaderboards() {
    const query = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : "";
    const [daily, cityData] = await Promise.all([api(`/leaderboard/daily${query}`), api("/leaderboard/cities")]);
    setLeaderboard(daily.items);
    setCities(cityData.items);
  }

  async function loadSharedLayouts() {
    if (!user) {
      setSharedLayouts([]);
      return;
    }
    setSharedLoading(true);
    try {
      const data = await api("/shared-layouts", { timeoutMs: LAYOUT_API_TIMEOUT_MS });
      setSharedLayouts(data.items || []);
    } catch {
      setSharedLayouts([]);
    } finally {
      setSharedLoading(false);
    }
  }

  async function rateSharedLayout(layoutId, score) {
    try {
      await api(`/shared-layouts/${layoutId}/rate`, { method: "POST", body: JSON.stringify({ score }) });
      await loadSharedLayouts();
    } catch (err) {
      alert(err.message || "Unable to rate layout.");
    }
  }

  async function playSharedLayout(layout) {
    setSharedLayouts((items) =>
      items.map((item) =>
        item.id === layout.id ? { ...item, total_plays: (item.total_plays || 0) + 1 } : item,
      ),
    );
    api(`/shared-layouts/${layout.id}/play`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
    startGame("custom", layout);
  }

  async function submitVictoryRating(score) {
    if (!activeCustomLayout?.id) return;
    await rateSharedLayout(activeCustomLayout.id, score);
    setVictory((current) => (current ? { ...current, rated: true } : current));
  }

  function goHome() {
    setBoard([]);
    setSelected([]);
    setUndoStack([]);
    setMoves(0);
    setScore(0);
    setHintsUsed(0);
    setTime(0);
    setVictory(null);
    setActiveCustomLayout(null);
    setLayoutName("Classic");
    setMode("classic");
    setPage("home");
  }

  async function toggleLayoutShare(layoutId, share) {
    try {
      await api(`/pro/layouts/${layoutId}/share`, { method: "POST", body: JSON.stringify({ shared: share }) });
      await loadLayouts();
      if (page === "shared") {
        await loadSharedLayouts();
      }
    } catch (err) {
      alert(err.message || "Unable to update share status.");
    }
  }

  async function loadLayouts() {
    try {
      const data = await api("/pro/layouts", { timeoutMs: LAYOUT_API_TIMEOUT_MS });
      setCustomLayouts(data.items || []);
    } catch {
      setCustomLayouts([]);
    }
  }

  async function saveLayout() {
  setBuilderStatus("");

  const points = maskToPoints(customMask);
  const trimmedName = customName.trim();

  if (!trimmedName) {
    setBuilderStatus("Layout name is required.");
    return;
  }

  if (points.length < 2) {
    setBuilderStatus("Place at least two tiles.");
    return;
  }

  if (points.length % 2 !== 0) {
    setBuilderStatus("Tile count must be even.");
    return;
  }

  const payload = {
    name: trimmedName,
    mask: customMask,
  };

  try {
    await api("/pro/layouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setBuilderStatus("Layout saved!");
    loadLayouts().catch(() => {});
  } catch (err) {
    setBuilderStatus(
      err instanceof Error
        ? err.message
        : "Unable to save layout.",
    );
  }
}

  function returnToPlay() {
    if (board.length === 0) {
      setPage("home");
    } else {
      setPage("play");
    }
  }

  function playCurrentDesign() {
    const customPoints = maskToPoints(customMask);
    if (customPoints.length < 2) {
      setBuilderStatus("Place at least two tiles before playing this design.");
      return;
    }
    if (customPoints.length % 2 !== 0) {
      setBuilderStatus("Tile count must be even.");
      return;
    }
    startGame("custom", { name: customName.trim() || "My layout", mask: customMask });
  }

  function clearLevel() {
    setCustomMask((prev) => {
      const newMask = [...prev];
      const topLevel = Math.max(0, ...prev.map((levelRows, index) => (levelRows.some((row) => row.includes("#")) ? index : 0)));
      newMask[topLevel] = Array.from({ length: GRID_HEIGHT }, () => ".".repeat(GRID_WIDTH));
      return newMask;
    });
    setBuilderStatus("");
  }

  function toggleMaskBuilderCell(x, y) {
    setCustomMask((prev) => {
      const currentHeight = prev.reduce((height, levelRows) => height + (levelRows[y][x] === "#" ? 1 : 0), 0);
      const nextHeight = (currentHeight + 1) % (prev.length + 1);

      return prev.map((levelRows, z) => {
        const nextRows = [...levelRows];
        nextRows[y] =
          nextRows[y].slice(0, x) +
          (z < nextHeight ? "#" : ".") +
          nextRows[y].slice(x + 1);
        return nextRows;
      });
    });

    setBuilderStatus("");
  }

  function clearMask() {
    setCustomMask(Array.from({ length: 4 }, () => Array.from({ length: GRID_HEIGHT }, () => ".".repeat(GRID_WIDTH))));
    setBuilderStatus("");
  }

  function updateCoach() {
    const topLayerFree = freeTiles.filter((t) => t.z >= 2).length;
    const blockedRisk = Math.max(0, 5 - availablePairs);
    let tip = "Board is stable. Keep hints for endgame.";
    if (availablePairs === 0) tip = "No safe pair is open. Shuffle now.";
    else if (topLayerFree >= 4) tip = "Clear top layers first to unlock buried pairs.";
    else if (blockedRisk >= 4) tip = "Match side tiles before the board locks.";
    setCoach(`AI Coach: ${tip}`);
  }

  async function upgradePro() {
    try {
      const data = await api("/upgrade-pro", { method: "POST", body: JSON.stringify({}) });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      alert("Error starting upgrade: " + (err.message || "Unknown error"));
    }
  }

  useEffect(() => {
    if (user) updateCoach();
  }, [availablePairs, board.length, user]);

  function startGame(nextMode, customLayout = null) {
    let seed = Math.floor(Math.random() * 1_000_000);
    if (nextMode === "daily") {
      seed = dailySeed();
    }
    const nextBoard = customLayout
      ? generateCustomBoard(customLayout.mask, customLayout.name, seed)
      : generateBoard(difficulty, seed);
    setMode(customLayout ? "custom" : nextMode);
    setActiveCustomLayout(customLayout ?? null);
    setLayoutName(nextBoard.name);
    setBoard(nextBoard.tiles);
    setSelected([]);
    setUndoStack([]);
    setMoves(0);
    setScore(0);
    setVictory(null);
    setHintsUsed(0);
    setStartedAt(Date.now());
    setTime(0);
    setPage("play");
  }

  function startHomeGame() {
    if (homeMode === "custom") {
      const layout = customLayouts.find((item) => String(item.id) === selectedLayoutId);
      if (!layout) return;
      startGame("custom", layout);
      return;
    }
    startGame(homeMode);
  }

  async function submitAuth() {
    setAuthError("");
    const u = auth.username.trim();
    const p = auth.password;
    if (authMode === "register") {
      if (u.length < 3 || p.length < 6) {
        setAuthError("Имя: минимум 3 символа. Пароль: минимум 6 символов.");
        return;
      }
    } else if (u.length === 0 || p.length === 0) {
      setAuthError("Введите имя пользователя и пароль.");
      return;
    }
    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        authMode === "register" ? { ...auth, username: u, password: p } : { username: u, password: p };
      const data = await api(path, { method: "POST", body: JSON.stringify(payload) });
      setDrawerOpen(false);
      setToken(data.token);
      localStorage.setItem("mf_token", data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Ошибка запроса");
    }
  }

  async function onTileClick(tileId) {
    const tile = board.find((t) => t.id === tileId);
    if (!tile || !isFree(tile)) return;
    const picks = selected.includes(tileId) ? selected.filter((id) => id !== tileId) : [...selected, tileId].slice(-2);
    setSelected(picks);
    if (picks.length !== 2) return;
    const [aId, bId] = picks;
    const a = board.find((t) => t.id === aId);
    const b = board.find((t) => t.id === bId);
    if (a && b && a.id !== b.id && a.type === b.type) {
      const nextBoard = board.map((t) => (t.id === a.id || t.id === b.id ? { ...t, removed: true, hint: false, removedAt: Date.now() } : t));
      setBoard(nextBoard);
      // Play tile disappear sound
      const sound = new Audio('/sounds/tile-disappear.mp3');
      sound.volume = 0.3;
      sound.play().catch(() => {}); // Ignore errors if sound fails
      setUndoStack((v) => [...v, [a.id, b.id]]);
      setMoves((v) => v + 1);
      const scoreIncrease = 120;
      setScore((v) => v + scoreIncrease);
      setSelected([]);
      if (nextBoard.every((t) => t.removed)) {
        const finalTime = Math.floor((Date.now() - startedAt) / 1000);
        const finalScore = score + 120 + Math.max(0, 500 - finalTime * 2);
        setScore(finalScore);
        setVictory({
          score: finalScore,
          time: finalTime,
          moves: moves + 1,
          mode,
          difficulty,
        });
        api("/game/result", {
          method: "POST",
          body: JSON.stringify({ mode, difficulty, score: finalScore, time_seconds: finalTime, won: true, hints_used: hintsUsed }),
        })
          .then(refreshAfterGame)
          .catch(() => {});
      }
    } else {
      setScore((v) => Math.max(0, v - 10));
    }
  }

  function onShuffle() {
    const active = board.filter((t) => !t.removed);
    const types = active.map((t) => t.type);
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const shuffledTypes = new Map(active.map((tile, index) => [tile.id, types[index]]));
    setBoard((prev) =>
      prev.map((t) => (t.removed ? t : { ...t, type: shuffledTypes.get(t.id) || t.type, hint: false })),
    );
    setMoves((v) => v + 1);
    setScore((v) => Math.max(0, v - 35));
  }

  function onUndo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setBoard((prev) => prev.map((t) => (last.includes(t.id) ? { ...t, removed: false } : t)));
    setUndoStack((v) => v.slice(0, -1));
    setMoves((v) => v + 1);
    setScore((v) => Math.max(0, v - 25));
  }

  function onHint() {
    const grouped = {};
    freeTiles.forEach((t) => {
      if (!grouped[t.type]) grouped[t.type] = [];
      grouped[t.type].push(t);
    });
    const pair = Object.values(grouped).find((arr) => arr.length >= 2);
    if (!pair) return;
    setBoard((prev) => prev.map((t) => ({ ...t, hint: t.id === pair[0].id || t.id === pair[1].id })));
    setHintsUsed((v) => v + 1);
    setScore((v) => Math.max(0, v - 15));
  }

  if (!user) {
    return (
      <main className="auth">
        <section className="card auth-card">
          <h1>Mahjong Focus</h1>
          <div className="tabs">
            <button className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Login</button>
            <button className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Register</button>
          </div>
          <input placeholder="Username (мин. 3 символа)" value={auth.username} onChange={(e) => setAuth({ ...auth, username: e.target.value })} />
          <input type="password" placeholder="Password (мин. 6 символов)" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
          {authMode === "register" && (
            <select value={auth.city} onChange={(e) => setAuth({ ...auth, city: e.target.value })}>
              <option>Almaty</option>
              <option>Astana</option>
              <option>Shymkent</option>
              <option>Bishkek</option>
            </select>
          )}
          {authError ? <p className="auth-error">{authError}</p> : null}
          <button onClick={submitAuth}>{authMode === "register" ? "Create account" : "Sign in"}</button>
        </section>
      </main>
    );
  }

  const activeTiles = board.filter((t) => !t.removed);
  const maxX = Math.max(...activeTiles.map((t) => t.x), 0);
  const maxY = Math.max(...activeTiles.map((t) => t.y), 0);
  const removedTiles = board.length - activeTiles.length;
  const progress = board.length ? Math.round((removedTiles / board.length) * 100) : 0;
  const isBuilder = page === "builder";
  const customPoints = maskToPoints(customMask);
  const builderProgress = customPoints.length ? Math.round((customPoints.length / (GRID_WIDTH * GRID_HEIGHT * customMask.length)) * 100) : 0;
  const pageTitle = isBuilder
    ? "Pro board designer"
    : isHome
      ? "Home"
      : isProfile
        ? "Profile"
        : isShared
          ? "Shared layouts"
      : mode === "daily"
        ? "Daily board"
        : "Mahjong board";

  return (

    <div className={`page ${drawerOpen ? "menu-open" : ""}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Mahjong Focus</p>
          <h1>{pageTitle}</h1>
        </div>
        <div className="topbar-actions">
          {page !== "home"  && (
            <button className="topbar-button" onClick={goHome}>Home</button>
          )}
          {(page !== "profile" && page !== "play") && (
            <button className="topbar-button" onClick={() => setPage("profile")}>Profile</button>
          )}
          {(page !== "shared" && page !== "play") && (
            <button className="topbar-button" onClick={() => setPage("shared")}>Shared layouts</button>
          )}
          {page !== "play"  && (
            <button className="menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          )}
        </div>
      </header>

      <main className={isHome || isProfile || isShared ? "content-shell" : "game-shell"}>
        {isHome ? (
          <HomeScreen
            user={user}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            tileSkin={tileSkin}
            onTileSkinChange={setTileSkin}
            availableSkins={availableSkins}
            customLayouts={customLayouts}
            selectedLayoutId={selectedLayoutId}
            onSelectedLayoutChange={setSelectedLayoutId}
            selectedMode={homeMode}
            onSelectedModeChange={setHomeMode}
            onStart={startHomeGame}
            onOpenBuilder={() => setPage("builder")}
            onOpenShared={() => setPage("shared")}
          />
        ) : isProfile ? (
          <section className="board-panel">
            <div className="board-toolbar">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>Player profile</h2>
              </div>
            </div>
            <div className="board-wrap">
              <ProfilePage user={user} history={history} customLayouts={customLayouts} />
            </div>
          </section>
        ) : isShared ? (
          <section className="board-panel">
            <div className="board-toolbar">
              <div>
                <p className="eyebrow">Community board hall</p>
                <h2>Shared layouts</h2>
              </div>
            </div>
            <div className="board-wrap">
              <SharedLayoutsPage
                user={user}
                layouts={sharedLayouts}
                loading={sharedLoading}
                onPlay={playSharedLayout}
              />
            </div>
          </section>
        ) : isBuilder ? (
          <>
            <section className="board-panel">
          <div className="board-toolbar">
            <div>
              <p className="eyebrow">Design mode</p>
              <h2>{customName}</h2>
            </div>
          </div>

          <div className="board-wrap">
              <div className="builder-grid" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 30px)` }}>
                {Array.from({ length: GRID_HEIGHT }).map((_, rowIdx) =>
                  Array.from({ length: GRID_WIDTH }).map((_, colIdx) => {
                    const level = customMask.reduce((topLevel, levelRows, levelIdx) => (levelRows[rowIdx][colIdx] === "#" ? levelIdx : topLevel), -1);

                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        className={`builder-cell ${level !== -1 ? "filled" : ""}`}
                        onClick={() => toggleMaskBuilderCell(colIdx, rowIdx)}
                        aria-label={`Change tile level at row ${rowIdx + 1}, col ${colIdx + 1}`}
                      >
                        {level !== -1 ? `L${level + 1}` : ""}
                      </button>
                    );
                  }),
                )}
              </div>
          </div>
        </section>

          <aside className="info-rail">
                <section className="panel">
                <div className="section-title">
                  <p className="eyebrow">Layout studio</p>
                  <h3>Design your own board</h3>
                </div>
                <label>Layout name</label>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} />
                <div
                    className="button-grid three"
                    style={{ marginBottom: "14px" }}
                  >
                  <button className="quiet" onClick={clearLevel}>Clear top level</button>
                  <button className="quiet" onClick={clearMask}>Reset all</button>
                  <button className="accent" onClick={saveLayout}>Save layout</button>
                </div>
                <div className="stat-grid">
                  <div><span>Tiles placed</span><strong>{customPoints.length}</strong></div>
                  <div><span>Board density</span><strong>{builderProgress}%</strong></div>
                  <div><span>Grid size</span><strong>{GRID_WIDTH}×{GRID_HEIGHT}</strong></div>
                  <div><span>Layout</span><strong>{customName}</strong></div>
                </div>
                {builderStatus ? <p className={builderStatus.toLowerCase().includes("saved") ? "" : "auth-error"}>{builderStatus}</p> : null}
                <div className="button-grid two" style={{ marginTop: "12px" }}>
                  <button onClick={returnToPlay}>Back to play</button>
                  <button className="accent" onClick={playCurrentDesign}>Play this design</button>
                </div>
              </section>

              <section
                className="panel"
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                <div className="section-title">
                  <p className="eyebrow">Saved boards</p>
                  <h3>My Pro layouts</h3>
                </div>
                {customLayouts.length === 0 ? (
                  <p>No saved layouts yet.</p>
                ) : (
                  <ul className="list">
                    {customLayouts.map((layout) => (
                      <li key={layout.id}>
                        <div>{layout.name}</div>
                        <div className="button-grid two" style={{ marginTop: "8px" }}>
                          <button className="quiet" onClick={() => { setPage("play"); setDrawerOpen(false); startGame("custom", layout); }}>Play</button>
                          <button className="quiet" onClick={() => toggleLayoutShare(layout.id, !layout.is_shared)}>
                            {layout.is_shared ? "Unshare" : "Share"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
        </aside>
          </>
        ) : (
            <GameScreen
              board={board}
              user={user}
              time={time}
              hasTimer={hasTimer}
              formatTime={formatTime}
              maxX={maxX}
              maxY={maxY}
              tileSkin={tileSkin}
              isFree={isFree}
              selected={selected}
              onTileClick={onTileClick}
              tileStepX={TILE_STEP_X}
              tileStepY={TILE_STEP_Y}
              tileDepth={TILE_DEPTH}
              score={score}
              moves={moves}
              remainingPairs={remainingPairs}
              availablePairs={availablePairs}
              progress={progress}
              mode={mode}
              layoutName={layoutName}
              coach={coach}
              onShuffle={onShuffle}
              onUndo={onUndo}
              onHint={onHint}
              hasUndo={hasUndo}
              hasHints={hasHints}
              hasScore={hasScore}
            />
        )}
      </main>

      <div className={`drawer-backdrop ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)}></div>
      <aside className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Menu</p>
            <h2>{user.username}</h2>
          </div>
          <button className="close-button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">×</button>
        </div>

        <section className="drawer-section">
          <h3>Daily leaderboard</h3>
          <ul className="list">
            {leaderboard.length === 0 && <li>No records today.</li>}
            {leaderboard.map((entry, idx) => (
              <li key={`${entry.username}-${idx}`}>#{idx + 1} {entry.username} ({entry.city}) · {entry.score} pts / {entry.time_seconds}s</li>
            ))}
          </ul>
        </section>


        <section className="drawer-section">
          <h3>Social filter</h3>
          <div className="filter-row">
            <input placeholder="City" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            <button onClick={loadLeaderboards}>Apply</button>
          </div>
          <ul className="list compact-list">
            {cities.length === 0 && <li>No city data.</li>}
            {cities.map((city, idx) => (
              <li key={`${city.city}-${idx}`}>#{idx + 1} {city.city} · best {city.best_score} pts in {city.best_time}s</li>
            ))}
          </ul>
        </section>


        <div className="drawer-actions">
          <button className="quiet" onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}>Theme</button>
          {user.is_pro ? (
            <button className="accent" onClick={() => { setPage("builder"); setDrawerOpen(false); }}>
              Pro layout studio
            </button>
          ) : (
            <button className="accent" onClick={upgradePro}>Upgrade to Pro</button>
          )}
          <button
            className="danger"
            onClick={() => {
              setUser(null);
              setToken("");
              setDrawerOpen(false);
              localStorage.removeItem("mf_token");
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      {victory && (
  <div className="victory-backdrop">
    <div className="victory-modal">
      <div className="confetti-container">
        {Array.from({ length: 14 }).map((_, idx) => (
          <span
            key={idx}
            className="confetti-piece"
            style={{
              left: `${5 + idx * 6}%`,
              background: ["#7c5cff", "#37d2ff", "#facc15", "#ff8a5b"][idx % 4],
              animationDelay: `${idx * 80}ms`,
              transform: `rotate(${idx * 22}deg)`,
            }}
          />
        ))}
      </div>
      <p className="eyebrow">Board cleared</p>
      <h2>Victory!</h2>

      <div className="stat-grid">
        <div>
          <span>Score</span>
          <strong>{victory.score}</strong>
        </div>

        <div>
          <span>Time</span>
          <strong>{formatTime(victory.time)}</strong>
        </div>

        <div>
          <span>Moves</span>
          <strong>{victory.moves}</strong>
        </div>
      </div>

      <div
        className="button-grid two"
        style={{ marginTop: "18px" }}
      >
        <button
          className="quiet"
          onClick={() => setVictory(null)}
        >
          Close
        </button>

        <button
          className="accent"
          onClick={() => {
            setVictory(null);

            if (mode === "custom") {
              startGame("custom", activeCustomLayout ?? {
                name: customName,
                mask: customMask,
              });
            } else {
              startGame(mode);
            }
          }}
        >
          Play again
        </button>
      </div>
      {mode === "custom" && activeCustomLayout?.id && activeCustomLayout?.shared && (
        <div className="victory-rating">
          <p className="eyebrow">Rate this layout</p>
          {victory.rated ? (
            <p className="muted">Thanks for rating.</p>
          ) : (
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} className="quiet" onClick={() => submitVictoryRating(value)}>
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}
