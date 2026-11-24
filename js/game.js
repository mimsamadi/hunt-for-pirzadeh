import { createSpriteSheet, CREATURE_CONFIG } from './sprites.js';
import { audio } from './audio.js';
import {
  getLeaderboard,
  submitScore,
  getBestScore,
  isTelegramMode,
  shareTelegramScore,
} from './leaderboard.js';

const HOLE_COUNT = 12;
const GAME_DURATION_SEC = 60;
const PIRZADEH_VISIBLE_MS = 780; // Very short window!

const sprites = createSpriteSheet();

// DOM references
const boardEl = document.getElementById('board');
const playfieldEl = document.querySelector('.playfield-wrapper');
const fxLayerEl = document.getElementById('fx-layer');

const hudScoreEl = document.getElementById('hud-score');
const hudTimeEl = document.getElementById('hud-time');
const hudSpeedEl = document.getElementById('hud-speed');
const timerBoxEl = document.querySelector('.timer-box');
const timerBarEl = document.getElementById('timer-bar');
const pirzadehDotEl = document.getElementById('pirzadeh-dot');
const pirzadehStatusEl = document.getElementById('pirzadeh-status-text');

const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const screenLeaderboard = document.getElementById('screen-leaderboard');

const legendEl = document.getElementById('creature-legend');
const startBestScoreEl = document.getElementById('start-best-score');
const finalScoreEl = document.getElementById('final-score');
const gameoverBadgeEl = document.getElementById('gameover-badge');
const gameoverSummaryEl = document.getElementById('gameover-summary');
const scoreFormEl = document.getElementById('score-form');
const playerNameInput = document.getElementById('player-name');
const saveConfirmEl = document.getElementById('save-confirmation');
const leaderboardListEl = document.getElementById('leaderboard-list');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnShareTg = document.getElementById('btn-share-tg');
const btnSound = document.getElementById('btn-sound');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const btnViewLb = document.getElementById('btn-view-lb');
const btnCloseLb = document.getElementById('btn-close-lb');
const lbBadgeEl = document.getElementById('lb-badge');
const lbNoteEl = document.getElementById('lb-note');

// Game state
const holes = [];
let state = createInitialState();
let lastScreenBeforeLb = screenStart;

function createInitialState() {
  return {
    running: false,
    score: 0,
    timeLeft: GAME_DURATION_SEC,
    startTimeMs: 0,
    lastHoleIndex: -1,
    spawnTimerId: null,
    countdownIntervalId: null,
    pirzadehScheduledAtSec: 0,
    pirzadehSpawned: false,
    pirzadehCaught: false,
    stats: {
      yellow: 0,
      green: 0,
      red: 0,
      pirzadeh: 0,
    },
  };
}

// ===== INITIALIZATION =====
function buildLegend() {
  const order = ['yellow', 'green', 'red', 'pirzadeh'];
  legendEl.innerHTML = '';
  for (const type of order) {
    const cfg = CREATURE_CONFIG[type];
    const item = document.createElement('div');
    item.className = `legend-item${type === 'pirzadeh' ? ' pirzadeh-card' : ''}`;
    item.innerHTML = `
      <img src="${sprites[type].normal}" alt="${cfg.name}" />
      <span class="legend-name">${cfg.name}</span>
      <span class="legend-pts ${type}">${cfg.label}</span>
      <span class="legend-note">${cfg.note}</span>
    `;
    legendEl.appendChild(item);
  }
}

function buildBoard() {
  boardEl.innerHTML = '';
  holes.length = 0;

  for (let i = 0; i < HOLE_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'hole-cell';
    cell.dataset.index = String(i);
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `Hole ${i + 1}`);

    const stage = document.createElement('div');
    stage.className = 'hole-stage';

    const back = document.createElement('div');
    back.className = 'hole-back';

    const mask = document.createElement('div');
    mask.className = 'hole-mask';

    const img = document.createElement('img');
    img.className = 'creature-sprite';
    img.alt = '';
    img.draggable = false;
    mask.appendChild(img);

    const front = document.createElement('div');
    front.className = 'hole-front';

    stage.appendChild(back);
    stage.appendChild(mask);
    stage.appendChild(front);
    cell.appendChild(stage);
    boardEl.appendChild(cell);

    const holeObj = {
      index: i,
      cell,
      img,
      active: false,
      hit: false,
      type: null,
      hideTimeoutId: null,
    };

    cell.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      handleHoleTap(holeObj, ev);
    });

    holes.push(holeObj);
  }
}

async function refreshBestScore() {
  const best = await getBestScore();
  startBestScoreEl.textContent = String(best);
}

// ===== GAME LIFECYCLE =====
function showOverlay(overlayEl) {
  [screenStart, screenGameOver, screenLeaderboard].forEach((el) => {
    el.classList.toggle('active', el === overlayEl);
  });
}

function hideAllOverlays() {
  [screenStart, screenGameOver, screenLeaderboard].forEach((el) => {
    el.classList.remove('active');
  });
}

function clearAllHoles() {
  for (const h of holes) {
    if (h.hideTimeoutId) {
      clearTimeout(h.hideTimeoutId);
      h.hideTimeoutId = null;
    }
    h.active = false;
    h.hit = false;
    h.type = null;
    h.cell.className = 'hole-cell';
  }
}

function startGame() {
  stopTimers();
  clearAllHoles();
  fxLayerEl.innerHTML = '';

  state = createInitialState();
  state.running = true;
  state.startTimeMs = performance.now();
  // Schedule Pirzadeh ONCE at a random moment between 14s and 48s elapsed
  state.pirzadehScheduledAtSec = 14 + Math.random() * 34;

  hideAllOverlays();
  updateHud();
  setPirzadehStatus('waiting', 'PIRZADEH: HIDING IN THE BURROWS...');
  audio.start();

  // 1-second timer tick (using exact elapsed time so it never drifts)
  state.countdownIntervalId = setInterval(() => {
    if (!state.running) return;
    const elapsedSec = (performance.now() - state.startTimeMs) / 1000;
    const remaining = Math.max(0, Math.ceil(GAME_DURATION_SEC - elapsedSec));

    if (remaining !== state.timeLeft) {
      state.timeLeft = remaining;
      if (remaining > 0 && remaining <= 5) {
        audio.tickUrgent();
      }
    }

    updateHud(elapsedSec);

    if (elapsedSec >= GAME_DURATION_SEC) {
      endGame();
    }
  }, 100);

  scheduleNextSpawn(280);
}

function stopTimers() {
  if (state.spawnTimerId) {
    clearTimeout(state.spawnTimerId);
    state.spawnTimerId = null;
  }
  if (state.countdownIntervalId) {
    clearInterval(state.countdownIntervalId);
    state.countdownIntervalId = null;
  }
}

async function endGame() {
  state.running = false;
  stopTimers();
  clearAllHoles();
  audio.gameOver();

  hudTimeEl.textContent = '0';
  timerBarEl.style.width = '0%';
  timerBoxEl.classList.remove('urgent');

  finalScoreEl.textContent = String(state.score);
  gameoverBadgeEl.textContent = state.pirzadehCaught
    ? 'PIRZADEH CAUGHT!'
    : "TIME'S UP!";

  gameoverSummaryEl.innerHTML = `
    <div class="summary-pill">YELLOW (+10)<strong>${state.stats.yellow}</strong></div>
    <div class="summary-pill">GREEN (+20)<strong>${state.stats.green}</strong></div>
    <div class="summary-pill">RED (-15)<strong>${state.stats.red}</strong></div>
    <div class="summary-pill">PIRZADEH (+50)<strong>${state.pirzadehCaught ? 'CAUGHT!' : 'MISSED'}</strong></div>
  `;

  if (isTelegramMode()) {
    scoreFormEl.classList.add('hidden');
    btnShareTg.classList.remove('hidden');
    saveConfirmEl.textContent = 'SYNCING TO TELEGRAM...';
    saveConfirmEl.classList.remove('hidden');
    showOverlay(screenGameOver);

    const res = await submitScore({
      score: state.score,
      caughtPirzadeh: state.pirzadehCaught,
    });
    if (res.ok) {
      saveConfirmEl.textContent = res.updated
        ? 'NEW HIGH SCORE SAVED!'
        : 'SCORE SYNCED TO TELEGRAM!';
    } else {
      saveConfirmEl.textContent = 'COULD NOT SYNC SCORE';
    }
  } else {
    scoreFormEl.classList.remove('hidden');
    btnShareTg.classList.add('hidden');
    saveConfirmEl.classList.add('hidden');
    showOverlay(screenGameOver);
  }

  await refreshBestScore();
}

// ===== DIFFICULTY CURVE & SPAWNING =====
function getProgress() {
  const elapsed = (performance.now() - state.startTimeMs) / 1000;
  return Math.max(0, Math.min(1, elapsed / GAME_DURATION_SEC));
}

function getDifficulty(progress) {
  // Smooth escalation: creatures spawn faster and stay up shorter near the end
  const spawnDelayMin = Math.round(760 - progress * 480); // 760ms -> 280ms
  const spawnDelayMax = Math.round(1080 - progress * 640); // 1080ms -> 440ms
  const maxConcurrent = progress < 0.3 ? 1 : progress < 0.7 ? 2 : 3;

  // Stay duration multiplier shrinks from 1.0 down to 0.48
  const stayFactor = 1 - progress * 0.52;

  let speedLabel = 'LVL 1';
  if (progress >= 0.88) speedLabel = 'MAX!';
  else if (progress >= 0.7) speedLabel = 'LVL 4';
  else if (progress >= 0.45) speedLabel = 'LVL 3';
  else if (progress >= 0.22) speedLabel = 'LVL 2';

  return {
    spawnDelayMin,
    spawnDelayMax,
    maxConcurrent,
    stayFactor,
    speedLabel,
  };
}

function scheduleNextSpawn(overrideMs = null) {
  if (!state.running) return;
  const progress = getProgress();
  const diff = getDifficulty(progress);
  const delay =
    overrideMs !== null
      ? overrideMs
      : diff.spawnDelayMin + Math.random() * (diff.spawnDelayMax - diff.spawnDelayMin);

  state.spawnTimerId = setTimeout(() => {
    if (!state.running) return;
    attemptSpawn();
    scheduleNextSpawn();
  }, delay);
}

function pickRandomFreeHole() {
  const free = holes.filter((h) => !h.active && h.index !== state.lastHoleIndex);
  if (free.length > 0) {
    return free[Math.floor(Math.random() * free.length)];
  }
  const anyFree = holes.filter((h) => !h.active);
  return anyFree.length ? anyFree[Math.floor(Math.random() * anyFree.length)] : null;
}

function pickRegularCreatureType(progress) {
  // Slight increase in red & green pressure as game speeds up
  const roll = Math.random();
  const redChance = 0.22 + progress * 0.08; // 22% -> 30%
  const greenChance = 0.24 + progress * 0.06; // 24% -> 30%
  if (roll < redChance) return 'red';
  if (roll < redChance + greenChance) return 'green';
  return 'yellow';
}

function attemptSpawn() {
  const elapsedSec = (performance.now() - state.startTimeMs) / 1000;
  const progress = Math.max(0, Math.min(1, elapsedSec / GAME_DURATION_SEC));
  const diff = getDifficulty(progress);

  // Guaranteed single Pirzadeh appearance when scheduled time arrives
  if (!state.pirzadehSpawned && elapsedSec >= state.pirzadehScheduledAtSec) {
    const hole = pickRandomFreeHole();
    if (hole) {
      state.pirzadehSpawned = true;
      spawnCreatureInHole(hole, 'pirzadeh', PIRZADEH_VISIBLE_MS);
      return;
    }
  }

  const activeCount = holes.filter((h) => h.active).length;
  if (activeCount >= diff.maxConcurrent) return;

  const hole = pickRandomFreeHole();
  if (!hole) return;

  const type = pickRegularCreatureType(progress);
  const baseStayMs =
    type === 'yellow' ? 1280 : type === 'green' ? 1050 : 1200;
  const stayMs = Math.max(430, Math.round(baseStayMs * diff.stayFactor));

  spawnCreatureInHole(hole, type, stayMs);
}

function spawnCreatureInHole(hole, type, visibleMs) {
  state.lastHoleIndex = hole.index;
  hole.active = true;
  hole.hit = false;
  hole.type = type;
  hole.img.src = sprites[type].normal;

  hole.cell.className = `hole-cell up ${type}`;

  if (type === 'pirzadeh') {
    audio.pirzadehAppear();
    setPirzadehStatus('active', 'PIRZADEH SPOTTED!! TAP NOW!');
  } else {
    audio.pop();
  }

  hole.hideTimeoutId = setTimeout(() => {
    hideHole(hole, false);
  }, visibleMs);
}

function hideHole(hole, wasHit) {
  if (hole.hideTimeoutId) {
    clearTimeout(hole.hideTimeoutId);
    hole.hideTimeoutId = null;
  }

  const missedPirzadeh = hole.type === 'pirzadeh' && !wasHit;
  hole.active = false;
  hole.hit = false;
  hole.type = null;
  hole.cell.className = 'hole-cell';

  if (missedPirzadeh && state.running) {
    setPirzadehStatus('escaped', 'PIRZADEH ESCAPED! (0 PTS)');
  }
}

// ===== INTERACTION & FEEDBACK =====
function handleHoleTap(hole, ev) {
  if (!state.running || !hole.active || hole.hit) return;

  hole.hit = true;
  const type = hole.type;
  const cfg = CREATURE_CONFIG[type];

  // Clear auto-hide timer so bonk animation plays briefly
  if (hole.hideTimeoutId) {
    clearTimeout(hole.hideTimeoutId);
    hole.hideTimeoutId = null;
  }

  hole.img.src = sprites[type].hit;
  hole.cell.classList.add('bonked');

  // Update score (floor at 0)
  state.score = Math.max(0, state.score + cfg.points);
  state.stats[type] += 1;

  // Sound & screen juice
  if (type === 'yellow') {
    audio.hitYellow();
  } else if (type === 'green') {
    audio.hitGreen();
  } else if (type === 'red') {
    audio.hitRed();
    triggerPlayfieldEffect('shake');
  } else if (type === 'pirzadeh') {
    state.pirzadehCaught = true;
    audio.hitPirzadeh();
    triggerPlayfieldEffect('gold-flash');
    setPirzadehStatus('caught', 'PIRZADEH CAUGHT! (+50 PTS)');
  }

  spawnFloatingFeedback(hole.cell, cfg.label, type, cfg.particleColors);
  updateHud();

  // Duck back down shortly after bonk
  hole.hideTimeoutId = setTimeout(() => {
    hideHole(hole, true);
  }, 150);
}

function triggerPlayfieldEffect(className) {
  playfieldEl.classList.remove(className);
  // Force reflow to restart animation
  void playfieldEl.offsetWidth;
  playfieldEl.classList.add(className);
}

function spawnFloatingFeedback(cellEl, text, type, colors) {
  const boardRect = playfieldEl.getBoundingClientRect();
  const cellRect = cellEl.getBoundingClientRect();
  const cx = cellRect.left - boardRect.left + cellRect.width / 2;
  const cy = cellRect.top - boardRect.top + cellRect.height * 0.42;

  const popup = document.createElement('div');
  popup.className = `float-score ${type}`;
  popup.textContent = text;
  popup.style.left = `${cx}px`;
  popup.style.top = `${cy}px`;
  fxLayerEl.appendChild(popup);
  setTimeout(() => popup.remove(), 750);

  // Pixel particle burst
  const count = type === 'pirzadeh' ? 14 : 7;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'pixel-particle';
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = (type === 'pirzadeh' ? 42 : 26) + Math.random() * 18;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
    p.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist)}px`);
    fxLayerEl.appendChild(p);
    setTimeout(() => p.remove(), 480);
  }
}

function setPirzadehStatus(mode, text) {
  pirzadehDotEl.className = `status-dot ${mode}`;
  pirzadehStatusEl.textContent = text;
}

function updateHud(elapsedSec = null) {
  hudScoreEl.textContent = String(state.score);
  hudTimeEl.textContent = String(state.timeLeft);

  const elapsed =
    elapsedSec !== null
      ? elapsedSec
      : state.running
        ? (performance.now() - state.startTimeMs) / 1000
        : 0;
  const progress = Math.max(0, Math.min(1, elapsed / GAME_DURATION_SEC));
  const diff = getDifficulty(progress);
  hudSpeedEl.textContent = diff.speedLabel;

  const pct = Math.max(0, (1 - progress) * 100);
  timerBarEl.style.width = `${pct}%`;

  const urgent = state.running && state.timeLeft <= 10;
  timerBoxEl.classList.toggle('urgent', urgent);
  timerBarEl.classList.toggle('urgent', urgent);
}

// ===== LEADERBOARD UI =====
async function renderLeaderboard() {
  const tgMode = isTelegramMode();
  lbBadgeEl.textContent = tgMode ? 'TELEGRAM LIVE SCORES' : 'LOCAL PROTOTYPE';
  lbNoteEl.textContent = tgMode
    ? 'Live serverless leaderboard for this Telegram chat.'
    : 'Local browser scores (launch from Telegram for group leaderboard).';

  leaderboardListEl.innerHTML = '<li class="lb-row"><span class="lb-name">LOADING...</span></li>';
  const list = await getLeaderboard(10);
  leaderboardListEl.innerHTML = '';

  if (list.length === 0) {
    leaderboardListEl.innerHTML =
      '<li class="lb-row"><span class="lb-name">NO SCORES YET. BE FIRST!</span></li>';
    return;
  }

  list.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = `lb-row${idx === 0 ? ' top-1' : ''}`;
    const rank = entry.position || idx + 1;
    const crown = entry.caughtPirzadeh ? ' *' : '';
    li.innerHTML = `
      <span class="lb-rank">#${rank}</span>
      <span class="lb-name">${escapeHtml(entry.name)}${crown}</span>
      <span class="lb-score">${entry.score}</span>
    `;
    leaderboardListEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function openLeaderboard(returnScreen) {
  lastScreenBeforeLb = returnScreen;
  await renderLeaderboard();
  showOverlay(screenLeaderboard);
}

// ===== EVENT LISTENERS =====
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);
btnShareTg.addEventListener('click', shareTelegramScore);

btnSound.addEventListener('click', () => {
  const on = audio.toggle();
  btnSound.textContent = on ? 'SFX:ON' : 'SFX:OFF';
});

btnLeaderboard.addEventListener('click', () => {
  if (state.running) return; // Don't interrupt active run
  const current = screenGameOver.classList.contains('active')
    ? screenGameOver
    : screenStart;
  openLeaderboard(current);
});

btnViewLb.addEventListener('click', () => openLeaderboard(screenGameOver));

btnCloseLb.addEventListener('click', () => {
  showOverlay(lastScreenBeforeLb || screenStart);
});

scoreFormEl.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) return;

  await submitScore({
    name,
    score: state.score,
    caughtPirzadeh: state.pirzadehCaught,
  });

  scoreFormEl.classList.add('hidden');
  saveConfirmEl.classList.remove('hidden');
  await refreshBestScore();
});

// Boot
buildLegend();
buildBoard();
refreshBestScore();
