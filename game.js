const canvas = document.getElementById("arena");
const context = canvas.getContext("2d");

const outputPresetSelect = document.getElementById("outputPreset");
const racerCountInput = document.getElementById("racerCount");
const racerCountValue = document.getElementById("racerCountValue");
const simSpeedInput = document.getElementById("simSpeed");
const simSpeedValue = document.getElementById("simSpeedValue");
const autoCycleInput = document.getElementById("autoCycle");
const hudToggleInput = document.getElementById("hudToggle");
const pathLengthInput = document.getElementById("pathLength");
const pathLengthValue = document.getElementById("pathLengthValue");
const widthVarianceInput = document.getElementById("widthVariance");
const widthVarianceValue = document.getElementById("widthVarianceValue");
const branchRateInput = document.getElementById("branchRate");
const branchRateValue = document.getElementById("branchRateValue");
const breakWallCountInput = document.getElementById("breakWallCount");
const breakWallCountValue = document.getElementById("breakWallCountValue");
const movingWallDirectionInput = document.getElementById("movingWallDirection");
const movingWallSpeedInput = document.getElementById("movingWallSpeed");
const movingWallSpeedValue = document.getElementById("movingWallSpeedValue");
const seedInput = document.getElementById("seedInput");
const randomSeedButton = document.getElementById("randomSeedButton");
const generateCourseButton = document.getElementById("generateCourseButton");
const shuffleStyleButton = document.getElementById("shuffleStyleButton");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const recordButton = document.getElementById("recordButton");
const stopRecordButton = document.getElementById("stopRecordButton");
const soundTypeInput = document.getElementById("soundType");
const musicModeInput = document.getElementById("musicMode");
const recordingModeInput = document.getElementById("recordingMode");
const exportJsonButton = document.getElementById("exportJsonButton");
const loadJsonButton = document.getElementById("loadJsonButton");
const courseJson = document.getElementById("courseJson");
const raceStatus = document.getElementById("raceStatus");
const raceTimer = document.getElementById("raceTimer");
const recordStatus = document.getElementById("recordStatus");
const recordFormat = document.getElementById("recordFormat");
const courseMeta = document.getElementById("courseMeta");
const podiumList = document.getElementById("podium");
const raceLogList = document.getElementById("raceLog");

const GRID_COLS = 15;
const GRID_ROWS = 20;
const START_ZONE_SIZE = 1;
const FINISH_SIZE = 1;
const INNER_MARGIN = 1;
const START_ZONE_GAP = 1;

const OUTPUT_PRESETS = [
  {
    id: "shorts",
    label: "YouTube Shorts 720 x 1280",
    width: 720,
    height: 1280,
    stageLabel: "9:16"
  },
  {
    id: "square",
    label: "Instagram Square 720 x 720",
    width: 720,
    height: 720,
    stageLabel: "1:1"
  }
];

const COLORS = {
  page: "#f6efe2",
  stage: "#c8bea8",
  boardShadow: "rgba(70, 57, 38, 0.16)",
  wall: "#b86230",
  wallAlt: "#cb7440",
  mortar: "#f6ddc6",
  path: "#f7f0df",
  start: "#25c48a",
  finishLight: "#ffffff",
  finishDark: "#121212",
  ink: "#27231d",
  muted: "#746c60",
  accent: "#ff7a45",
  chip: "rgba(255, 250, 242, 0.96)"
};

const RACER_PALETTE = [
  { name: "ORANGE", color: "#ff7a45", frequency: 220, wave: "sine" },
  { name: "MINT", color: "#25c48a", frequency: 247, wave: "triangle" },
  { name: "BLUE", color: "#5b7cff", frequency: 262, wave: "square" },
  { name: "YELLOW", color: "#ffd166", frequency: 294, wave: "sawtooth" },
  { name: "VIOLET", color: "#d86cff", frequency: 330, wave: "triangle" },
  { name: "PINK", color: "#fb5f86", frequency: 392, wave: "square" }
];

const RACER_SYNTH_PROFILES = [
  { rootInterval: 0, scalePattern: [0, 2, 4, 7, 9, 12] },
  { rootInterval: 2, scalePattern: [0, 3, 5, 7, 10, 12] },
  { rootInterval: 4, scalePattern: [0, 2, 5, 7, 9, 12] },
  { rootInterval: 5, scalePattern: [0, 3, 7, 10, 12] },
  { rootInterval: 7, scalePattern: [0, 2, 4, 7, 11, 12] },
  { rootInterval: 9, scalePattern: [0, 3, 5, 8, 10, 12] }
];

const SOUND_PRESETS = {
  classic: {
    primaryWave: "sine",
    overtoneWave: "triangle",
    overtoneRatio: 1.5,
    attack: 0.004,
    decay: 0.12,
    level: 1
  },
  glass: {
    primaryWave: "triangle",
    overtoneWave: "sine",
    overtoneRatio: 2.02,
    attack: 0.002,
    decay: 0.18,
    level: 0.8
  },
  arcade: {
    primaryWave: "square",
    overtoneWave: "square",
    overtoneRatio: 2,
    attack: 0.002,
    decay: 0.1,
    level: 0.9
  },
  rubber: {
    primaryWave: "sawtooth",
    overtoneWave: "triangle",
    overtoneRatio: 1.25,
    attack: 0.003,
    decay: 0.14,
    level: 0.85
  },
  synth: {
    primaryWave: "sawtooth",
    overtoneWave: "square",
    overtoneRatio: 2,
    attack: 0.004,
    decay: 0.2,
    level: 0.74,
    useRacerScale: true
  },
  marimba: {
    primaryWave: "triangle",
    overtoneWave: "sine",
    overtoneRatio: 3,
    attack: 0.002,
    decay: 0.22,
    level: 0.72
  },
  dream: {
    primaryWave: "sine",
    overtoneWave: "sine",
    overtoneRatio: 0.5,
    attack: 0.01,
    decay: 0.28,
    level: 0.62
  },
  musicBox: {
    primaryWave: "triangle",
    overtoneWave: "triangle",
    overtoneRatio: 2.5,
    attack: 0.002,
    decay: 0.2,
    level: 0.66
  },
  harp: {
    primaryWave: "sine",
    overtoneWave: "triangle",
    overtoneRatio: 1.75,
    attack: 0.003,
    decay: 0.24,
    level: 0.68
  }
};

const MUSIC_MODES = {
  off: null,
  pentatonic: [0, 2, 4, 7, 9, 7, 4, 2],
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  chord: [0, 4, 7, 12, 7, 4]
};

const RACE_LOG_STORAGE_KEY = "shikaku-race-history";
const MAX_RACE_LOGS = 20;

const audioState = {
  context: null,
  masterGain: null,
  mediaDestination: null,
  silentGain: null,
  silenceSource: null,
  ready: false
};

const recorderState = {
  mediaRecorder: null,
  chunks: [],
  stream: null,
  profile: null,
  mode: "continuous",
  armed: false,
  pendingStopAt: 0,
  clipSequence: 0,
  filename: ""
};

const state = {
  preset: OUTPUT_PRESETS[0],
  course: null,
  racers: [],
  running: false,
  paused: false,
  elapsed: 0,
  simElapsed: 0,
  finishedOrder: [],
  raceHistory: [],
  raceIndex: 0,
  lastFrame: 0,
  nextAutoRaceAt: 0,
  winningRacer: null,
  winnerBannerUntil: 0,
  resultBanner: null
};

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let value = Math.imul(t ^ (t >>> 15), 1 | t);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(randomFn, min, max) {
  return Math.floor(randomFn() * (max - min + 1)) + min;
}

function randomSeed() {
  return Math.floor(Math.random() * 999999);
}

function seededAttempt(seed, attempt) {
  return seed + attempt * 9973;
}

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function syncCanvasDisplaySize() {
  const maxHeight = Math.max(320, window.innerHeight * 0.78);
  const maxWidth = canvas.height > canvas.width ? 460 : 760;
  const fittedWidth = Math.min(maxWidth, canvas.width, maxHeight * (canvas.width / canvas.height));
  canvas.style.width = `${Math.max(220, fittedWidth)}px`;
  canvas.style.height = `${Math.max(220, fittedWidth * (canvas.height / canvas.width))}px`;
}

function isPerRaceRecording() {
  return recorderState.mode === "per-race";
}

function getSoundPreset() {
  return SOUND_PRESETS[soundTypeInput?.value] ?? SOUND_PRESETS.classic;
}

function getMusicPattern() {
  return MUSIC_MODES[musicModeInput?.value] ?? null;
}

function intervalToFrequency(rootFrequency, semitoneOffset) {
  return rootFrequency * 2 ** (semitoneOffset / 12);
}

function buildRecordingFilename(extension) {
  const safeStyle = state.course?.styleId ?? "course";
  const targetRaceIndex = state.running ? state.raceIndex : state.raceIndex + 1;
  const raceLabel = `race-${Math.max(targetRaceIndex, 1)}`;
  const clipLabel = `clip-${String(recorderState.clipSequence).padStart(3, "0")}`;
  return `shikaku-race-${safeStyle}-${raceLabel}-${clipLabel}.${extension}`;
}

function drawRoundedRect(x, y, width, height, radius, fillStyle) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function getRecordingProfile() {
  if (!window.MediaRecorder) {
    return null;
  }

  const candidates = [
    {
      mimeType: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
      extension: "mp4",
      label: "MP4 / H.264"
    },
    {
      mimeType: "video/mp4",
      extension: "mp4",
      label: "MP4"
    },
    {
      mimeType: "video/webm;codecs=vp9,opus",
      extension: "webm",
      label: "WebM fallback"
    },
    {
      mimeType: "video/webm",
      extension: "webm",
      label: "WebM fallback"
    }
  ];

  const supported = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType));
  return supported ?? { mimeType: "", extension: "webm", label: "Browser default" };
}

function ensureAudioReady() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return false;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextClass();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 0.12;
    audioState.mediaDestination = audioState.context.createMediaStreamDestination();
    audioState.silentGain = audioState.context.createGain();
    audioState.silentGain.gain.value = 0;
    audioState.silenceSource = audioState.context.createConstantSource();
    audioState.silenceSource.offset.value = 0;
    audioState.masterGain.connect(audioState.context.destination);
    audioState.masterGain.connect(audioState.mediaDestination);
    audioState.silenceSource.connect(audioState.silentGain);
    audioState.silentGain.connect(audioState.mediaDestination);
    audioState.silenceSource.start();
  }

  audioState.context.resume();
  audioState.ready = true;
  return true;
}

function playCollisionTone(racer, impactSpeed) {
  if (!audioState.ready || !audioState.context || !audioState.masterGain) {
    return;
  }

  const now = audioState.context.currentTime;
  if (now < racer.nextSoundAt) {
    return;
  }

  racer.nextSoundAt = now + 0.08;

  const preset = getSoundPreset();
  const melody = getMusicPattern();
  let baseFrequency = racer.frequency;
  const noteIndex = racer.noteStep;
  if (preset.useRacerScale) {
    const racerScale = racer.scalePattern?.length ? racer.scalePattern : [0];
    const racerStep = racerScale[noteIndex % racerScale.length];
    const melodyStep = melody?.length ? melody[noteIndex % melody.length] : 0;
    baseFrequency = intervalToFrequency(racer.rootFrequency ?? racer.frequency, racerStep + melodyStep);
    racer.noteStep = noteIndex + 1;
  } else if (melody?.length) {
    const step = melody[noteIndex % melody.length];
    baseFrequency = intervalToFrequency(racer.frequency, step);
    racer.noteStep = noteIndex + 1;
  }

  const primary = audioState.context.createOscillator();
  const overtone = audioState.context.createOscillator();
  const gain = audioState.context.createGain();
  const level = clamp((impactSpeed / 320) * preset.level, 0.05, 0.2);

  primary.type = preset.primaryWave ?? racer.wave;
  overtone.type = preset.overtoneWave ?? "sine";
  primary.frequency.setValueAtTime(baseFrequency, now);
  overtone.frequency.setValueAtTime(baseFrequency * preset.overtoneRatio, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(level, now + preset.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.decay);

  primary.connect(gain);
  overtone.connect(gain);
  gain.connect(audioState.masterGain);

  primary.start(now);
  overtone.start(now);
  primary.stop(now + preset.decay);
  overtone.stop(now + preset.decay);
}

function fillSelectOptions() {
  OUTPUT_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    outputPresetSelect.append(option);
  });
}

function setCanvasPreset(presetId) {
  const preset = OUTPUT_PRESETS.find((item) => item.id === presetId) ?? OUTPUT_PRESETS[0];
  state.preset = preset;
  canvas.width = preset.width;
  canvas.height = preset.height;
  syncCanvasDisplaySize();
}

function getPlayfield() {
  const portrait = canvas.height > canvas.width;
  const topInset = portrait ? 128 : 86;
  const bottomInset = portrait ? 100 : 78;
  const horizontalInset = 34;
  const availableWidth = canvas.width - horizontalInset * 2;
  const availableHeight = canvas.height - topInset - bottomInset;
  const cellSize = Math.floor(Math.min(availableWidth / GRID_COLS, availableHeight / GRID_ROWS));
  const width = cellSize * GRID_COLS;
  const height = cellSize * GRID_ROWS;
  const left = Math.floor((canvas.width - width) * 0.5);
  const top = Math.floor(topInset + (availableHeight - height) * 0.5);

  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height
  };
}

function createMatrix(rows, cols, value = false) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}

function carveRect(grid, x, y, width, height) {
  const minX = clamp(x, 0, GRID_COLS - 1);
  const minY = clamp(y, 0, GRID_ROWS - 1);
  const maxX = clamp(x + width - 1, 0, GRID_COLS - 1);
  const maxY = clamp(y + height - 1, 0, GRID_ROWS - 1);

  for (let row = minY; row <= maxY; row += 1) {
    for (let col = minX; col <= maxX; col += 1) {
      grid[row][col] = true;
    }
  }
}

function carveCentered(grid, point, width) {
  const radius = Math.floor(width / 2);
  carveRect(grid, point.x - radius, point.y - radius, width, width);
}

function carveConnection(grid, previous, next, width) {
  const radius = Math.floor(width / 2);
  const minX = Math.min(previous.x, next.x) - radius;
  const minY = Math.min(previous.y, next.y) - radius;
  const rectWidth = Math.abs(previous.x - next.x) + width;
  const rectHeight = Math.abs(previous.y - next.y) + width;
  carveRect(grid, minX, minY, rectWidth, rectHeight);
}

function generateGoalTop(randomFn, startCenterY) {
  let goalTop = randomInt(randomFn, INNER_MARGIN, GRID_ROWS - FINISH_SIZE - INNER_MARGIN);
  let tries = 0;
  while (Math.abs(goalTop + 1 - startCenterY) < 4 && tries < 12) {
    goalTop = randomInt(randomFn, INNER_MARGIN, GRID_ROWS - FINISH_SIZE - INNER_MARGIN);
    tries += 1;
  }
  return goalTop;
}

function generateTopBandGoalTop(randomFn) {
  const topMin = INNER_MARGIN;
  const topMax = Math.min(INNER_MARGIN + 4, GRID_ROWS - FINISH_SIZE - INNER_MARGIN);
  return randomInt(randomFn, topMin, topMax);
}

function generateGoalLeft(randomFn) {
  return randomInt(randomFn, INNER_MARGIN, GRID_COLS - FINISH_SIZE - INNER_MARGIN);
}

function chooseGoalEntrance(randomFn) {
  return ["up", "down", "left", "right"][randomInt(randomFn, 0, 3)];
}

function buildStartZones(count, randomFn) {
  const totalHeight = count * START_ZONE_SIZE + (count - 1) * START_ZONE_GAP;
  const topMin = INNER_MARGIN;
  const topMax = Math.max(topMin, GRID_ROWS - INNER_MARGIN - totalHeight);
  const startTop = randomInt(randomFn, topMin, topMax);

  return Array.from({ length: count }, (_, index) => ({
    x: INNER_MARGIN,
    y: startTop + index * (START_ZONE_SIZE + START_ZONE_GAP),
    width: START_ZONE_SIZE,
    height: START_ZONE_SIZE
  }));
}

function getZoneCenterRow(zone) {
  return zone.y + Math.floor(zone.height / 2);
}

function getWidthMode(varianceRate) {
  if (varianceRate < 34) {
    return { min: 1, max: 1, label: "1マス" };
  }
  if (varianceRate < 67) {
    return { min: 1, max: 2, label: "1-2マス" };
  }
  return { min: 1, max: 3, label: "1-3マス" };
}

function buildVariableWidths(path, widthMode, randomFn) {
  let currentWidth = randomInt(randomFn, widthMode.min, widthMode.max);
  const widths = [];
  const baseChangeChance = 0.2 + (widthMode.max - widthMode.min) * 0.08;

  for (let index = 0; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const next = path[index + 1];
    const turning =
      previous &&
      next &&
      (Math.sign(current.x - previous.x) !== Math.sign(next.x - current.x) ||
        Math.sign(current.y - previous.y) !== Math.sign(next.y - current.y));
    if (index > 0 && (turning || randomFn() < baseChangeChance)) {
      currentWidth = randomInt(randomFn, widthMode.min, widthMode.max);
    }
    widths.push(currentWidth);
  }

  return widths;
}

function updateWidthVarianceLabel() {
  widthVarianceValue.textContent = getWidthMode(Number(widthVarianceInput.value)).label;
}

function updateBranchRateLabel() {
  branchRateValue.textContent = `${branchRateInput.value}%`;
}

function updateBreakWallLabel() {
  breakWallCountValue.textContent = breakWallCountInput.value;
}

function updateMovingWallSpeedLabel() {
  movingWallSpeedValue.textContent = `${(Number(movingWallSpeedInput.value) / 180).toFixed(1)}x`;
}

function getRectCells(rect) {
  const cells = [];
  for (let row = rect.y; row < rect.y + rect.height; row += 1) {
    for (let col = rect.x; col < rect.x + rect.width; col += 1) {
      cells.push({ x: col, y: row });
    }
  }
  return cells;
}

function measureShortestPath(grid, startZones, finishZone) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const distances = createMatrix(rows, cols, -1);
  const queue = [];
  let head = 0;

  startZones.forEach((zone) => {
    getRectCells(zone).forEach((cell) => {
      if (!grid[cell.y]?.[cell.x] || distances[cell.y][cell.x] !== -1) {
        return;
      }
      distances[cell.y][cell.x] = 0;
      queue.push(cell);
    });
  });

  const finishKeys = new Set(getRectCells(finishZone).map((cell) => `${cell.x},${cell.y}`));
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    if (finishKeys.has(`${current.x},${current.y}`)) {
      return distances[current.y][current.x];
    }

    for (const [dx, dy] of directions) {
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      if (
        nextX < 0 ||
        nextX >= cols ||
        nextY < 0 ||
        nextY >= rows ||
        !grid[nextY][nextX] ||
        distances[nextY][nextX] !== -1
      ) {
        continue;
      }
      distances[nextY][nextX] = distances[current.y][current.x] + 1;
      queue.push({ x: nextX, y: nextY });
    }
  }

  return Infinity;
}

function carvePolyline(grid, points, width) {
  points.forEach((point, index) => {
    carveCentered(grid, point, width);
    if (index > 0) {
      carveConnection(grid, points[index - 1], point, width);
    }
  });
}

function buildBottomStartZones(count, laneLeft, laneRight, pocketBottom) {
  const usableWidth = laneRight - laneLeft + 1;
  const grouped = count >= 4;
  if (!grouped) {
    const gap = usableWidth >= count * 2 ? 1 : 0;
    const totalWidth = count + (count - 1) * gap;
    const startLeft = laneLeft + Math.max(0, Math.floor((usableWidth - totalWidth) * 0.5));
    return Array.from({ length: count }, (_, index) => ({
      x: startLeft + index * (1 + gap),
      y: pocketBottom,
      width: 1,
      height: 1
    }));
  }

  const zones = [];
  const groupCount = Math.ceil(count / 2);
  const separator = 1;
  const totalWidth = count + Math.max(0, groupCount - 1) * separator;
  const startLeft = laneLeft + Math.max(0, Math.floor((usableWidth - totalWidth) * 0.5));
  let cursor = startLeft;

  for (let index = 0; index < count; index += 1) {
    zones.push({
      x: cursor,
      y: pocketBottom,
      width: 1,
      height: 1
    });
    cursor += 1;
    if (index % 2 === 1 && index < count - 1) {
      cursor += separator;
    }
  }

  return zones;
}

function getGoalApproachPoint(goalLeft, goalTop, entrance) {
  if (entrance === "up") {
    return { x: goalLeft, y: goalTop - 1 };
  }
  if (entrance === "left") {
    return { x: goalLeft - 1, y: goalTop };
  }
  if (entrance === "right") {
    return { x: goalLeft + 1, y: goalTop };
  }
  return { x: goalLeft, y: goalTop + 1 };
}

function enforceGoalPocket(grid, goalLeft, goalTop, entrance) {
  grid[goalTop][goalLeft] = true;
  const around = {
    up: { x: goalLeft, y: goalTop - 1 },
    down: { x: goalLeft, y: goalTop + 1 },
    left: { x: goalLeft - 1, y: goalTop },
    right: { x: goalLeft + 1, y: goalTop }
  };

  Object.entries(around).forEach(([side, cell]) => {
    if (cell.x < 0 || cell.x >= GRID_COLS || cell.y < 0 || cell.y >= GRID_ROWS) {
      return;
    }
    grid[cell.y][cell.x] = side === entrance;
  });
}

function buildFinishTriggerRect(goalLeft, goalTop, cellSize, offsetX, offsetY, entrance) {
  const baseX = offsetX + goalLeft * cellSize;
  const baseY = offsetY + goalTop * cellSize;
  if (entrance === "up") {
    return { x: baseX, y: baseY + cellSize * 0.5, width: cellSize, height: cellSize * 0.5 };
  }
  if (entrance === "left") {
    return { x: baseX + cellSize * 0.5, y: baseY, width: cellSize * 0.5, height: cellSize };
  }
  if (entrance === "right") {
    return { x: baseX, y: baseY, width: cellSize * 0.5, height: cellSize };
  }
  return { x: baseX, y: baseY, width: cellSize, height: cellSize * 0.5 };
}

function buildFinishTriggerRectFromRect(finishRect, entrance) {
  if (entrance === "up") {
    return {
      x: finishRect.x,
      y: finishRect.y + finishRect.height * 0.5,
      width: finishRect.width,
      height: finishRect.height * 0.5
    };
  }
  if (entrance === "left") {
    return {
      x: finishRect.x + finishRect.width * 0.5,
      y: finishRect.y,
      width: finishRect.width * 0.5,
      height: finishRect.height
    };
  }
  if (entrance === "right") {
    return {
      x: finishRect.x,
      y: finishRect.y,
      width: finishRect.width * 0.5,
      height: finishRect.height
    };
  }
  return {
    x: finishRect.x,
    y: finishRect.y,
    width: finishRect.width,
    height: finishRect.height * 0.5
  };
}

function isPointInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function isRacerInFinishZone(racer, course) {
  const triggerRect = course.finishTriggerRect ?? course.finishRect;
  const centerX = racer.x + racer.size * 0.5;
  const centerY = racer.y + racer.size * 0.5;
  return isPointInsideRect(centerX, centerY, triggerRect);
}

function buildSwitchbackPath(startX, laneSpecs, goalX, goalY) {
  const path = [{ x: startX, y: laneSpecs[laneSpecs.length - 1].center }];
  let current = { ...path[0] };
  let moveRight = true;

  for (let laneIndex = laneSpecs.length - 1; laneIndex >= 0; laneIndex -= 1) {
    const lane = laneSpecs[laneIndex];
    const laneY = lane.center;
    const targetX =
      laneIndex === 0
        ? goalX
        : moveRight
          ? lane.right
          : lane.left;

    while (current.x !== targetX) {
      current = { x: current.x + Math.sign(targetX - current.x), y: laneY };
      pushPoint(path, current);
    }

    if (laneIndex > 0) {
      const nextY = laneSpecs[laneIndex - 1].center;
      while (current.y !== nextY) {
        current = { x: current.x, y: current.y + Math.sign(nextY - current.y) };
        pushPoint(path, current);
      }
    }

    moveRight = !moveRight;
  }

  while (current.y !== goalY) {
    current = { x: current.x, y: current.y + Math.sign(goalY - current.y) };
    pushPoint(path, current);
  }

  return path;
}

function buildRandomMainPath(startPoint, goalPoint, targetLength, randomFn) {
  const path = [{ ...startPoint }];
  let current = { ...startPoint };
  let currentLength = 0;
  let horizontalDirection = randomFn() > 0.5 ? 1 : -1;
  let guard = 0;
  const minX = INNER_MARGIN + 1;
  const maxX = GRID_COLS - INNER_MARGIN - 2;
  const minY = INNER_MARGIN + 1;

  while ((current.y > goalPoint.y + 1 || currentLength < targetLength * 0.82) && guard < 120) {
    guard += 1;
    const remainingVertical = Math.max(0, current.y - goalPoint.y);
    const remainingDirect =
      remainingVertical + Math.abs(current.x - goalPoint.x) + Math.abs(current.y - goalPoint.y);
    const extraBudget = Math.max(0, targetLength - currentLength - remainingDirect);

    let horizontalTarget = clamp(
      current.x + horizontalDirection * randomInt(randomFn, 2, 6),
      minX,
      maxX
    );
    if (randomFn() < 0.4 || extraBudget > 10) {
      horizontalTarget = horizontalDirection > 0 ? maxX - randomInt(randomFn, 0, 1) : minX + randomInt(randomFn, 0, 1);
    }
    if (randomFn() < 0.24) {
      horizontalTarget = clamp(goalPoint.x + randomInt(randomFn, -4, 4), minX, maxX);
    }

    while (current.x !== horizontalTarget) {
      current = { x: current.x + Math.sign(horizontalTarget - current.x), y: current.y };
      pushPoint(path, current);
      currentLength += 1;
    }

    if (current.y <= goalPoint.y + 1 && currentLength >= targetLength * 0.65) {
      break;
    }

    let verticalStep = randomInt(randomFn, 1, 4);
    if (extraBudget > 8) {
      verticalStep = Math.min(verticalStep + randomInt(randomFn, 1, 3), 6);
    }
    verticalStep = Math.min(verticalStep, Math.max(1, current.y - minY));

    for (let step = 0; step < verticalStep && current.y > minY; step += 1) {
      current = { x: current.x, y: current.y - 1 };
      pushPoint(path, current);
      currentLength += 1;
    }

    if (randomFn() < 0.78) {
      horizontalDirection *= -1;
    } else {
      horizontalDirection = current.x > goalPoint.x ? -1 : 1;
    }
  }

  while (current.x !== goalPoint.x) {
    current = { x: current.x + Math.sign(goalPoint.x - current.x), y: current.y };
    pushPoint(path, current);
  }

  while (current.y !== goalPoint.y) {
    current = { x: current.x, y: current.y + Math.sign(goalPoint.y - current.y) };
    pushPoint(path, current);
  }

  return path;
}

function buildOrderedCells(path) {
  const cells = [];
  const seen = new Set();
  path.forEach((point) => {
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    cells.push({ x: point.x, y: point.y });
  });
  return cells;
}

function buildBranches(grid, path, branchRate, widthMode, randomFn) {
  const branches = [];
  const branchCount = clamp(Math.round((branchRate / 100) * 6) + (branchRate > 30 ? 1 : 0), 0, 7);
  if (branchCount === 0 || path.length < 10) {
    return branches;
  }

  for (let index = 0; index < branchCount; index += 1) {
    let tries = 0;
    while (tries < 16) {
      const startIndex = randomInt(randomFn, 2, Math.max(2, path.length - 10));
      const endIndex = randomInt(randomFn, startIndex + 4, Math.min(path.length - 2, startIndex + 12));
      const start = path[startIndex];
      const end = path[endIndex];
      const direction = randomFn() > 0.5 ? 1 : -1;
      const branchOffset = randomInt(randomFn, 2, 6);
      const branchRow = clamp(start.y + direction * branchOffset, INNER_MARGIN + 1, GRID_ROWS - INNER_MARGIN - 2);
      const bendCol = clamp(
        Math.round((start.x + end.x) * 0.5) + randomInt(randomFn, -3, 3),
        INNER_MARGIN + 1,
        GRID_COLS - INNER_MARGIN - 2
      );

      if (Math.abs(branchRow - end.y) < 2 && Math.abs(start.x - end.x) < 3) {
        tries += 1;
        continue;
      }

      const width = randomInt(randomFn, widthMode.min, widthMode.max);
      const points =
        randomFn() < 0.5
          ? [start, { x: start.x, y: branchRow }, { x: end.x, y: branchRow }, end]
          : [start, { x: bendCol, y: start.y }, { x: bendCol, y: branchRow }, { x: end.x, y: branchRow }, end];
      carvePolyline(grid, points, width);
      branches.push({
        startIndex,
        endIndex,
        width
      });
      break;
    }
  }

  return branches;
}

function getPathSegmentDirection(path, index) {
  const prev = path[Math.max(0, index - 1)];
  const next = path[Math.min(path.length - 1, index + 1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  return Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
}

function collectBarrierCells(grid, point, orientation) {
  const cells = [];

  if (orientation === "horizontal") {
    let row = point.y;
    while (row >= 0 && grid[row][point.x]) {
      row -= 1;
    }
    row += 1;
    while (row < GRID_ROWS && grid[row][point.x]) {
      cells.push({ x: point.x, y: row });
      row += 1;
    }
    return cells;
  }

  let col = point.x;
  while (col >= 0 && grid[point.y][col]) {
    col -= 1;
  }
  col += 1;
  while (col < GRID_COLS && grid[point.y][col]) {
    cells.push({ x: col, y: point.y });
    col += 1;
  }

  return cells;
}

function buildBreakWalls(grid, path, count, cellSize, offsetX, offsetY) {
  const candidates = path
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => index > Math.floor(path.length * 0.18) && index < Math.floor(path.length * 0.9));
  const walls = [];
  const used = new Set();
  const barrierCount = Math.min(count, candidates.length);

  for (let index = 0; index < barrierCount; index += 1) {
    const candidate = candidates[Math.floor(((index + 1) * candidates.length) / (barrierCount + 1))];
    const orientation = getPathSegmentDirection(path, candidate.index);
    const barrierCells = collectBarrierCells(grid, candidate.point, orientation === "horizontal" ? "horizontal" : "vertical");
    if (barrierCells.length === 0) {
      continue;
    }
    const key = barrierCells.map((cell) => `${cell.x},${cell.y}`).join("|");
    if (used.has(key)) {
      continue;
    }
    used.add(key);

    for (const cell of barrierCells) {
      walls.push({
        cellX: cell.x,
        cellY: cell.y,
        x: offsetX + cell.x * cellSize,
        y: offsetY + cell.y * cellSize,
        width: cellSize,
        height: cellSize,
        broken: false
      });
    }
  }
  return walls;
}

function buildMovingWalls(direction, speedRate, randomFn) {
  if (direction === "none") {
    return [];
  }

  return [
    {
      direction,
      speed: (0.045 + randomFn() * 0.008) * speedRate,
      delay: 0
    }
  ];
}

function buildSwitchbackCourseCandidate(
  seedValue,
  attempt,
  targetLength,
  widthVariance,
  branchRate,
  breakWallCount,
  movingWallDirection,
  movingWallSpeedRate,
  racerCount
) {
  const play = getPlayfield();
  const seed = Number(seedValue) || 1;
  const randomFn = mulberry32(seededAttempt(seed, attempt));
  const widthMode = getWidthMode(widthVariance);
  const maxLaneWidth = clamp(widthMode.max, 1, 3);
  const laneCount = 4;
  const laneGap = 2;
  const pocketDepth = 4;
  const laneBaseTop = Math.max(INNER_MARGIN, Math.floor((GRID_ROWS - (laneCount * maxLaneWidth + (laneCount - 1) * laneGap + pocketDepth)) * 0.5));
  const laneTops = Array.from({ length: laneCount }, (_, index) => laneBaseTop + index * (maxLaneWidth + laneGap));
  const laneSpecs = [];
  const laneLeftBound = INNER_MARGIN + 1;
  const laneRightBound = GRID_COLS - INNER_MARGIN - 2;
  const laneWidths = Array.from({ length: laneCount }, (_, index) =>
    clamp(randomInt(randomFn, 1, maxLaneWidth), index === laneCount - 1 ? 2 : 1, maxLaneWidth)
  );

  const bottomRight = laneRightBound - randomInt(randomFn, 0, 1);
  const secondLeft = laneLeftBound + randomInt(randomFn, 0, 2);
  const thirdRight = laneRightBound - randomInt(randomFn, 1, 3);
  const topGoalRight = thirdRight;
  laneSpecs.push({ top: laneTops[0], width: laneWidths[0], left: laneLeftBound, right: topGoalRight });
  laneSpecs.push({ top: laneTops[1], width: laneWidths[1], left: secondLeft, right: topGoalRight });
  laneSpecs.push({ top: laneTops[2], width: laneWidths[2], left: secondLeft, right: bottomRight });
  laneSpecs.push({ top: laneTops[3], width: laneWidths[3], left: laneLeftBound + 1, right: bottomRight });
  laneSpecs.forEach((lane) => {
    lane.center = lane.top + Math.floor(lane.width * 0.5);
  });

  const goalLeft = INNER_MARGIN;
  const goalTop = generateTopBandGoalTop(randomFn);
  const pocketBottom = GRID_ROWS - 1;
  const pocketTop = laneSpecs[laneCount - 1].top + laneSpecs[laneCount - 1].width;
  const startZones = buildBottomStartZones(racerCount, laneSpecs[laneCount - 1].left + 1, laneSpecs[laneCount - 1].right - 1, pocketBottom);
  const startX = startZones[0].x;
  const grid = createMatrix(GRID_ROWS, GRID_COLS, false);

  laneSpecs.forEach((lane) => {
    carveRect(grid, lane.left, lane.top, lane.right - lane.left + 1, lane.width);
  });

  startZones.forEach((zone) => {
    carveRect(grid, zone.x, pocketTop, 1, pocketBottom - pocketTop + 1);
  });

  carveRect(grid, goalLeft, goalTop, FINISH_SIZE, FINISH_SIZE);

  const path = buildSwitchbackPath(startX, laneSpecs, goalLeft + 1, goalTop + 1);
  const widths = path.map((point) => {
    const lane = laneSpecs.find((entry) => point.y >= entry.top && point.y < entry.top + entry.width);
    return lane?.width ?? maxLaneWidth;
  });
  path.forEach((point, index) => {
    const width = widths[index];
    carveCentered(grid, point, width);
    if (index > 0) {
      carveConnection(grid, path[index - 1], point, Math.max(widths[index - 1], width));
    }
  });
  const branches = buildBranches(grid, path, branchRate, widthMode, randomFn);

  const cellSize = Math.floor(Math.min(play.width / GRID_COLS, play.height / GRID_ROWS));
  const offsetX = Math.floor(play.left + (play.width - cellSize * GRID_COLS) * 0.5);
  const offsetY = Math.floor(play.top + (play.height - cellSize * GRID_ROWS) * 0.5);
  const pathRects = [];
  const wallRects = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const rect = {
        x: offsetX + col * cellSize,
        y: offsetY + row * cellSize,
        width: cellSize,
        height: cellSize
      };
      if (grid[row][col]) {
        pathRects.push(rect);
      } else {
        wallRects.push(rect);
      }
    }
  }

  const startZoneRects = startZones.map((zone) => ({
    x: offsetX + zone.x * cellSize,
    y: offsetY + zone.y * cellSize,
    width: cellSize,
    height: cellSize
  }));

  const mainPathCells = buildOrderedCells(path);
  const pathIndexMap = Object.fromEntries(mainPathCells.map((cell, index) => [`${cell.x},${cell.y}`, index]));
  const pathWidthMap = Object.fromEntries(path.map((point, index) => [`${point.x},${point.y}`, widths[index]]));
  const shortestPathLength = measureShortestPath(grid, startZones, {
    x: goalLeft,
    y: goalTop,
    width: FINISH_SIZE,
    height: FINISH_SIZE
  });
  const breakWalls = buildBreakWalls(grid, path, breakWallCount, cellSize, offsetX, offsetY);
  const movingWalls = buildMovingWalls(movingWallDirection, movingWallSpeedRate, randomFn);

  return {
    title: "SHIKAKU RACE",
    requestedStyle: "switchback",
    resolvedStyle: "switchback",
    seed,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    targetLength,
    actualLength: shortestPathLength,
    widthVariance,
    branchRate,
    breakWallCount,
    movingWallCount: movingWalls.length,
    branchCount: branches.length,
    widthMode,
    movingWallDirection,
    movingWallSpeedRate,
    racerSpeed: clamp(cellSize * 4.5, 90, 170),
    cellSize,
    passableGrid: grid,
    playfield: {
      left: offsetX,
      top: offsetY,
      right: offsetX + cellSize * GRID_COLS,
      bottom: offsetY + cellSize * GRID_ROWS,
      width: cellSize * GRID_COLS,
      height: cellSize * GRID_ROWS
    },
    startZones: startZoneRects,
    startRect: startZoneRects[0],
    finishRect: {
      x: offsetX + goalLeft * cellSize,
      y: offsetY + goalTop * cellSize,
      width: FINISH_SIZE * cellSize,
      height: FINISH_SIZE * cellSize
    },
    finishEntrance: "down",
    finishTriggerRect: buildFinishTriggerRect(goalLeft, goalTop, cellSize, offsetX, offsetY, "down"),
    pathRects,
    wallRects,
    breakWalls,
    movingWalls,
    mainPathCells,
    pathIndexMap,
    pathWidthMap
  };
}

function buildRandomCourseCandidate(
  seedValue,
  attempt,
  targetLength,
  widthVariance,
  branchRate,
  breakWallCount,
  movingWallDirection,
  movingWallSpeedRate,
  racerCount
) {
  const play = getPlayfield();
  const seed = Number(seedValue) || 1;
  const randomFn = mulberry32(seededAttempt(seed, attempt));
  const widthMode = getWidthMode(widthVariance);
  const grid = createMatrix(GRID_ROWS, GRID_COLS, false);
  const goalLeft = generateGoalLeft(randomFn);
  const goalTop = generateTopBandGoalTop(randomFn);
  const finishEntrance = chooseGoalEntrance(randomFn);
  const goalPoint = getGoalApproachPoint(goalLeft, goalTop, finishEntrance);
  const startZones = buildBottomStartZones(racerCount, INNER_MARGIN + 1, GRID_COLS - INNER_MARGIN - 2, GRID_ROWS - 1);
  const pocketTop = clamp(GRID_ROWS - 5 - randomInt(randomFn, 0, 2), INNER_MARGIN + 6, GRID_ROWS - 4);
  const hubX = clamp(
    Math.round(startZones.reduce((sum, zone) => sum + zone.x, 0) / startZones.length) + randomInt(randomFn, -2, 2),
    INNER_MARGIN + 1,
    GRID_COLS - INNER_MARGIN - 2
  );
  const startPoint = { x: hubX, y: pocketTop };

  startZones.forEach((zone) => {
    carveRect(grid, zone.x, pocketTop, 1, GRID_ROWS - pocketTop);
    carveConnection(grid, { x: zone.x, y: pocketTop }, startPoint, randomInt(randomFn, widthMode.min, Math.min(widthMode.max, 2)));
  });

  carveRect(grid, goalLeft, goalTop, FINISH_SIZE, FINISH_SIZE);

  const effectiveTarget = targetLength + attempt * 3 + randomInt(randomFn, 0, 8);
  const path = buildRandomMainPath(startPoint, goalPoint, effectiveTarget, randomFn);
  const widths = buildVariableWidths(path, widthMode, randomFn);

  path.forEach((point, index) => {
    const width = widths[index];
    carveCentered(grid, point, width);
    if (index > 0) {
      carveConnection(grid, path[index - 1], point, Math.max(widths[index - 1], width));
    }
  });

  carveConnection(grid, path[path.length - 1], goalPoint, 1);
  const branches = buildBranches(grid, path, branchRate, widthMode, randomFn);
  enforceGoalPocket(grid, goalLeft, goalTop, finishEntrance);

  const cellSize = Math.floor(Math.min(play.width / GRID_COLS, play.height / GRID_ROWS));
  const offsetX = Math.floor(play.left + (play.width - cellSize * GRID_COLS) * 0.5);
  const offsetY = Math.floor(play.top + (play.height - cellSize * GRID_ROWS) * 0.5);
  const pathRects = [];
  const wallRects = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const rect = {
        x: offsetX + col * cellSize,
        y: offsetY + row * cellSize,
        width: cellSize,
        height: cellSize
      };
      if (grid[row][col]) {
        pathRects.push(rect);
      } else {
        wallRects.push(rect);
      }
    }
  }

  const startZoneRects = startZones.map((zone) => ({
    x: offsetX + zone.x * cellSize,
    y: offsetY + zone.y * cellSize,
    width: zone.width * cellSize,
    height: zone.height * cellSize
  }));
  const mainPathCells = buildOrderedCells(path);
  const pathIndexMap = Object.fromEntries(mainPathCells.map((cell, index) => [`${cell.x},${cell.y}`, index]));
  const pathWidthMap = Object.fromEntries(path.map((point, index) => [`${point.x},${point.y}`, widths[index]]));
  const shortestPathLength = measureShortestPath(grid, startZones, {
    x: goalLeft,
    y: goalTop,
    width: FINISH_SIZE,
    height: FINISH_SIZE
  });
  const breakWalls = buildBreakWalls(grid, path, breakWallCount, cellSize, offsetX, offsetY);
  const movingWalls = buildMovingWalls(movingWallDirection, movingWallSpeedRate, randomFn);

  return {
    title: "SHIKAKU RACE",
    requestedStyle: "random",
    resolvedStyle: "random maze",
    seed,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    targetLength,
    actualLength: shortestPathLength,
    widthVariance,
    branchRate,
    breakWallCount,
    movingWallCount: movingWalls.length,
    branchCount: branches.length,
    widthMode,
    movingWallDirection,
    movingWallSpeedRate,
    racerSpeed: clamp(cellSize * 4.5, 90, 170),
    cellSize,
    passableGrid: grid,
    playfield: {
      left: offsetX,
      top: offsetY,
      right: offsetX + cellSize * GRID_COLS,
      bottom: offsetY + cellSize * GRID_ROWS,
      width: cellSize * GRID_COLS,
      height: cellSize * GRID_ROWS
    },
    startZones: startZoneRects,
    startRect: startZoneRects[0],
    finishRect: {
      x: offsetX + goalLeft * cellSize,
      y: offsetY + goalTop * cellSize,
      width: FINISH_SIZE * cellSize,
      height: FINISH_SIZE * cellSize
    },
    finishEntrance,
    finishTriggerRect: buildFinishTriggerRect(goalLeft, goalTop, cellSize, offsetX, offsetY, finishEntrance),
    pathRects,
    wallRects,
    breakWalls,
    movingWalls,
    mainPathCells,
    pathIndexMap,
    pathWidthMap
  };
}

function pushPoint(path, point) {
  const last = path[path.length - 1];
  if (!last || last.x !== point.x || last.y !== point.y) {
    path.push(point);
  }
}

function buildCenterline(profile, startPoint, goalPoint, targetLength, randomFn) {
  const path = [{ ...startPoint }];
  let current = { ...startPoint };
  let currentLength = 0;
  let preferDown = randomFn() > 0.5;
  const target = Math.max(targetLength, goalPoint.x - startPoint.x + Math.abs(goalPoint.y - startPoint.y));

  while (current.x < goalPoint.x) {
    const remainingHorizontal = goalPoint.x - current.x;
    const remainingVertical = Math.abs(goalPoint.y - current.y);
    const minimumNeeded = remainingHorizontal + remainingVertical;
    const extraBudget = Math.max(0, target - currentLength - minimumNeeded);

    let horizontalStep = 1;
    const maxHorizontal = Math.min(profile.horizontalMax, remainingHorizontal);
    if (extraBudget < remainingHorizontal * 0.45) {
      horizontalStep = maxHorizontal;
    } else if (extraBudget > remainingHorizontal * 1.8) {
      horizontalStep = 1;
    } else {
      horizontalStep = randomInt(randomFn, 1, maxHorizontal);
    }

    for (let step = 0; step < horizontalStep; step += 1) {
      current = { x: current.x + 1, y: current.y };
      pushPoint(path, current);
      currentLength += 1;
    }

    if (current.x >= goalPoint.x) {
      break;
    }

    const remainingHorizontalAfter = goalPoint.x - current.x;
    const remainingVerticalAfter = Math.abs(goalPoint.y - current.y);
    const minimumNeededAfter = remainingHorizontalAfter + remainingVerticalAfter;
    const extraBudgetAfter = Math.max(0, target - currentLength - minimumNeededAfter);
    const shouldSwing =
      extraBudgetAfter > 0 &&
      (randomFn() < profile.verticalBias || remainingVerticalAfter > 0 || extraBudgetAfter > remainingHorizontalAfter);

    if (!shouldSwing) {
      continue;
    }

    let direction = preferDown ? 1 : -1;
    if (!profile.alternating && randomFn() > 0.62) {
      direction *= -1;
    }

    let room = direction > 0 ? GRID_ROWS - INNER_MARGIN - 2 - current.y : current.y - (INNER_MARGIN + 1);
    if (room <= 0) {
      direction *= -1;
      room = direction > 0 ? GRID_ROWS - INNER_MARGIN - 2 - current.y : current.y - (INNER_MARGIN + 1);
    }
    if (room <= 0) {
      continue;
    }

    const suggestedSwing = clamp(
      Math.round(extraBudgetAfter / Math.max(remainingHorizontalAfter, 1)),
      profile.swingMin,
      profile.swingMax
    );
    const targetSwing = clamp(
      suggestedSwing + randomInt(randomFn, -1, 2),
      profile.swingMin,
      profile.swingMax
    );
    const swing = Math.min(room, targetSwing);

    for (let step = 0; step < swing; step += 1) {
      current = { x: current.x, y: current.y + direction };
      pushPoint(path, current);
      currentLength += 1;
    }

    if (profile.alternating) {
      preferDown = !preferDown;
    } else if (randomFn() > 0.55) {
      preferDown = !preferDown;
    }
  }

  while (current.y !== goalPoint.y) {
    const direction = goalPoint.y > current.y ? 1 : -1;
    current = { x: current.x, y: current.y + direction };
    pushPoint(path, current);
    currentLength += 1;
  }

  while (current.x < goalPoint.x) {
    current = { x: current.x + 1, y: current.y };
    pushPoint(path, current);
    currentLength += 1;
  }

  return { path, actualLength: currentLength };
}

function buildWidths(profile, path, varianceRate, randomFn) {
  const mode = getWidthMode(varianceRate);
  let currentWidth = clamp(profile.widthBase, mode.min, Math.min(mode.max, profile.widthMax));
  const widths = [];
  const changeChance = 0.14 + varianceRate / 140;

  for (let index = 0; index < path.length; index += 1) {
    if (index > 0 && randomFn() < changeChance) {
      currentWidth = randomInt(
        randomFn,
        mode.min,
        Math.min(mode.max, profile.widthMax)
      );
    }
    widths.push(currentWidth);
  }

  return widths;
}

function buildCourseCandidate(
  styleId,
  seedValue,
  attempt,
  targetLength,
  widthVariance,
  branchRate,
  breakWallCount,
  movingWallDirection,
  movingWallSpeedRate,
  racerCount
) {
  return buildRandomCourseCandidate(
    seedValue,
    attempt,
    targetLength,
    widthVariance,
    branchRate,
    breakWallCount,
    movingWallDirection,
    movingWallSpeedRate,
    racerCount
  );
}

function buildCourse(seedValue) {
  const targetLength = Number(pathLengthInput.value);
  const widthVariance = Number(widthVarianceInput.value);
  const branchRate = Number(branchRateInput.value);
  const breakWallCount = Number(breakWallCountInput.value);
  const movingWallDirection = movingWallDirectionInput.value;
  const movingWallSpeedRate = Number(movingWallSpeedInput.value) / 180;
  const racerCount = Number(racerCountInput.value);
  let bestCandidate = null;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const candidate = buildCourseCandidate(
      "random",
      seedValue,
      attempt,
      targetLength,
      widthVariance,
      branchRate,
      breakWallCount,
      movingWallDirection,
      movingWallSpeedRate,
      racerCount
    );
    if (Number.isFinite(candidate.actualLength) && (!bestCandidate || candidate.actualLength > bestCandidate.actualLength)) {
      bestCandidate = candidate;
    }
    if (Number.isFinite(candidate.actualLength) && candidate.actualLength >= targetLength) {
      return candidate;
    }
  }

  return (
    bestCandidate ??
    buildCourseCandidate(
      "random",
      seedValue,
      0,
      targetLength,
      widthVariance,
      branchRate,
      breakWallCount,
      movingWallDirection,
      movingWallSpeedRate,
      racerCount
    )
  );
}

function updateCourseMeta() {
  if (!state.course) {
    return;
  }
  courseMeta.textContent = `${state.course.resolvedStyle} / seed ${state.course.seed} / ${state.course.actualLength}`;
}

function syncCourseJson() {
  if (!state.course) {
    return;
  }

  courseJson.value = JSON.stringify(
    {
      preset: state.preset.id,
      requestedStyle: state.course.requestedStyle,
      resolvedStyle: state.course.resolvedStyle,
      seed: state.course.seed,
      gridCols: state.course.gridCols,
      gridRows: state.course.gridRows,
      targetLength: state.course.targetLength,
      actualLength: state.course.actualLength,
      widthVariance: state.course.widthVariance,
      branchRate: state.course.branchRate,
      breakWallCount: state.course.breakWallCount,
      movingWallCount: state.course.movingWallCount,
      branchCount: state.course.branchCount,
      widthMode: state.course.widthMode,
      movingWallDirection: state.course.movingWallDirection,
      movingWallSpeedRate: state.course.movingWallSpeedRate,
      racerSpeed: state.course.racerSpeed,
      cellSize: state.course.cellSize,
      passableGrid: state.course.passableGrid,
      playfield: state.course.playfield,
      startZones: state.course.startZones,
      startRect: state.course.startRect,
      finishRect: state.course.finishRect,
      finishEntrance: state.course.finishEntrance,
      finishTriggerRect: state.course.finishTriggerRect,
      pathRects: state.course.pathRects,
      wallRects: state.course.wallRects,
      breakWalls: state.course.breakWalls,
      movingWalls: state.course.movingWalls,
      mainPathCells: state.course.mainPathCells,
      pathWidthMap: state.course.pathWidthMap
    },
    null,
    2
  );
}

function rebuildPassableGrid(payload) {
  if (payload.passableGrid) {
    return payload.passableGrid;
  }

  const rows = payload.gridRows ?? payload.gridSize ?? GRID_ROWS;
  const cols = payload.gridCols ?? payload.gridSize ?? GRID_COLS;
  const grid = createMatrix(rows, cols, false);
  const left = payload.playfield?.left ?? 0;
  const top = payload.playfield?.top ?? 0;
  const cellSize = payload.cellSize ?? 1;

  for (const rect of payload.pathRects ?? []) {
    const col = Math.round((rect.x - left) / cellSize);
    const row = Math.round((rect.y - top) / cellSize);
    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      grid[row][col] = true;
    }
  }

  return grid;
}

function updateStatus(text) {
  raceStatus.textContent = text;
}

function renderPodium() {
  podiumList.innerHTML = "";
  if (state.finishedOrder.length === 0) {
    const item = document.createElement("li");
    item.textContent = "まだ結果はありません。";
    podiumList.append(item);
    return;
  }

  state.finishedOrder.slice(0, 6).forEach((racer, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}位 ${racer.label} ${formatTime(racer.finishTime)}`;
    item.style.color = racer.color;
    podiumList.append(item);
  });
}

function loadRaceHistory() {
  try {
    const raw = window.localStorage.getItem(RACE_LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.raceHistory = Array.isArray(parsed) ? parsed.slice(0, MAX_RACE_LOGS) : [];
  } catch (error) {
    state.raceHistory = [];
  }
}

function saveRaceHistory() {
  try {
    window.localStorage.setItem(RACE_LOG_STORAGE_KEY, JSON.stringify(state.raceHistory.slice(0, MAX_RACE_LOGS)));
  } catch (error) {
    // Ignore storage failures; logging should not block races.
  }
}

function renderRaceHistory() {
  raceLogList.innerHTML = "";
  if (state.raceHistory.length === 0) {
    const item = document.createElement("li");
    item.textContent = "まだログはありません。";
    raceLogList.append(item);
    return;
  }

  state.raceHistory.slice(0, 8).forEach((entry) => {
    const item = document.createElement("li");
    const leaders = entry.order.slice(0, 3).join(" / ");
    item.textContent = `#${entry.raceIndex} ${entry.result} ${leaders}`;
    raceLogList.append(item);
  });
}

function persistRaceResult(resultLabel) {
  const order = [
    ...state.finishedOrder.map((racer) => `${racer.label} ${formatTime(racer.finishTime)}`),
    ...state.racers
      .filter((racer) => !racer.finished)
      .map((racer) => `${racer.label} DNF`)
  ];

  state.raceHistory.unshift({
    raceIndex: state.raceIndex,
    seed: state.course?.seed,
    result: resultLabel,
    order
  });
  state.raceHistory = state.raceHistory.slice(0, MAX_RACE_LOGS);
  saveRaceHistory();
  renderRaceHistory();
}

function createRacers(count) {
  const speed = state.course.racerSpeed;
  return Array.from({ length: count }, (_, index) => {
    const palette = RACER_PALETTE[index];
    const synthProfile = RACER_SYNTH_PROFILES[index] ?? RACER_SYNTH_PROFILES[0];
    const zone = state.course.startZones[index] ?? state.course.startZones[0];
    const size = clamp(state.course.cellSize * 0.72, 16, 28);
    const angle = randomInt(Math.random, -65, 65) * (Math.PI / 180);
    const startX = zone.x + (zone.width - size) * 0.5;
    const startY = zone.y + (zone.height - size) * 0.5;
    return {
      id: index + 1,
      label: palette.name,
      color: palette.color,
      wave: palette.wave,
      frequency: palette.frequency,
      rootFrequency: intervalToFrequency(196, synthProfile.rootInterval),
      scalePattern: synthProfile.scalePattern,
      x: startX,
      y: startY,
      size,
      speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lastSafeX: startX,
      lastSafeY: startY,
      finished: false,
      eliminated: false,
      deathReason: "",
      finishTime: 0,
      noteStep: index,
      trail: [],
      nextSoundAt: 0,
      squishX: 1,
      squishY: 1
    };
  });
}

function resetRace(autostart = false) {
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = autostart;
  state.paused = false;
  state.elapsed = 0;
  state.simElapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  state.nextAutoRaceAt = 0;
  state.winningRacer = null;
  state.winnerBannerUntil = 0;
  state.resultBanner = null;
  raceTimer.textContent = "0.0s";
  pauseButton.textContent = "一時停止";
  updateStatus(autostart ? "進行中" : "待機中");
  renderPodium();
  draw();
}

function generateCourse(seedValue = seedInput.value) {
  state.course = buildCourse(seedValue);
  seedInput.value = String(state.course.seed);
  updateCourseMeta();
  syncCourseJson();
  resetRace(false);
}

function startRace() {
  if (recorderState.armed && recorderState.mode === "per-race" && !recorderState.mediaRecorder) {
    startRecording(true);
  }
  ensureAudioReady();
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = true;
  state.paused = false;
  state.elapsed = 0;
  state.simElapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  state.nextAutoRaceAt = 0;
  state.winningRacer = null;
  state.winnerBannerUntil = 0;
  state.resultBanner = null;
  state.raceIndex += 1;
  pauseButton.textContent = "一時停止";
  updateStatus("進行中");
  renderPodium();
}

function finishRace(reason = "全員ゴール", winner = null) {
  const finishedAt = performance.now();
  state.running = false;
  state.paused = false;
  state.winningRacer = winner;
  const bannerLabel = winner ? winner.label : reason === "全員脱落" ? "DRAW" : "";
  const bannerDuration = winner || reason === "全員脱落" ? 5000 : 0;
  state.winnerBannerUntil = bannerDuration ? finishedAt + bannerDuration : 0;
  state.resultBanner = bannerLabel
    ? {
        label: bannerLabel,
        subtitle: winner ? `WIN / ${formatTime(winner.finishTime)}` : "ALL RACERS ELIMINATED",
        accent: winner ? winner.color : "#7b6f61",
        crown: Boolean(winner),
        isDraw: !winner
      }
    : null;
  state.nextAutoRaceAt = autoCycleInput.checked ? finishedAt + (bannerDuration || 1800) : 0;
  if (recorderState.mediaRecorder?.state === "recording" && isPerRaceRecording()) {
    recorderState.pendingStopAt = bannerDuration ? state.winnerBannerUntil : finishedAt + 1200;
    recordStatus.textContent = "書き出し待ち";
  }
  persistRaceResult(bannerLabel || reason);
  updateStatus(reason);
}

function intersectsRect(entity, rect) {
  return (
    entity.x < rect.x + rect.width &&
    entity.x + entity.size > rect.x &&
    entity.y < rect.y + rect.height &&
    entity.y + entity.size > rect.y
  );
}

function isPointOnCourse(course, x, y) {
  const col = Math.floor((x - course.playfield.left) / course.cellSize);
  const row = Math.floor((y - course.playfield.top) / course.cellSize);
  if (row < 0 || row >= course.gridRows || col < 0 || col >= course.gridCols) {
    return false;
  }
  return Boolean(course.passableGrid[row]?.[col]);
}

function isRacerOnCourse(course, racer) {
  const inset = Math.max(2, racer.size * 0.18);
  const samples = [
    [racer.x + inset, racer.y + inset],
    [racer.x + racer.size - inset, racer.y + inset],
    [racer.x + inset, racer.y + racer.size - inset],
    [racer.x + racer.size - inset, racer.y + racer.size - inset],
    [racer.x + racer.size * 0.5, racer.y + racer.size * 0.5]
  ];

  return samples.every(([x, y]) => isPointOnCourse(course, x, y));
}

function recoverRacerToCourse(racer) {
  racer.x = racer.lastSafeX;
  racer.y = racer.lastSafeY;

  if (Math.abs(racer.vx) >= Math.abs(racer.vy)) {
    racer.vx *= -0.92;
    racer.vy *= 0.88;
  } else {
    racer.vy *= -0.92;
    racer.vx *= 0.88;
  }

  normalizeRacerSpeed(racer);
}

function normalizeRacerSpeed(racer) {
  const magnitude = Math.hypot(racer.vx, racer.vy);
  if (magnitude === 0) {
    racer.vx = racer.speed;
    racer.vy = 0;
    return;
  }

  racer.vx = (racer.vx / magnitude) * racer.speed;
  racer.vy = (racer.vy / magnitude) * racer.speed;
}

function reflectVelocity(vx, vy, nx, ny) {
  const dot = vx * nx + vy * ny;
  return {
    vx: vx - 2 * dot * nx,
    vy: vy - 2 * dot * ny
  };
}

function triggerSquish(racer, axis, intensity = 1) {
  const amount = clamp(0.12 + intensity * 0.08, 0.12, 0.34);
  if (axis === "x") {
    racer.squishX = Math.min(racer.squishX, 1 - amount);
    racer.squishY = Math.max(racer.squishY, 1 + amount * 0.9);
  } else {
    racer.squishY = Math.min(racer.squishY, 1 - amount);
    racer.squishX = Math.max(racer.squishX, 1 + amount * 0.9);
  }
}

function getMovingWallProgress(wall, elapsed) {
  return Math.max(0, (elapsed - wall.delay) * wall.speed);
}

function getMovingFillRects(course, wall, elapsed) {
  const progress = getMovingWallProgress(wall, elapsed);
  if (progress <= 0) {
    return { fillRects: [], leadingRects: [] };
  }

  const fillRects = [];
  const leadingRects = [];
  const fullCells = Math.floor(progress);
  const partial = Math.max(0, Math.min(1, progress - fullCells));

  for (let row = 0; row < course.gridRows; row += 1) {
    for (let col = 0; col < course.gridCols; col += 1) {
      if (!course.passableGrid[row]?.[col]) {
        continue;
      }

      const rectX = course.playfield.left + col * course.cellSize;
      const rectY = course.playfield.top + row * course.cellSize;

      if (wall.direction === "up") {
        const depth = course.gridRows - 1 - row;
        if (depth < fullCells) {
          fillRects.push({ x: rectX, y: rectY, width: course.cellSize, height: course.cellSize });
        } else if (depth === fullCells && partial > 0) {
          const height = course.cellSize * partial;
          fillRects.push({ x: rectX, y: rectY + course.cellSize - height, width: course.cellSize, height });
          leadingRects.push({ x: rectX, y: rectY + course.cellSize - height, width: course.cellSize, height });
        }
      } else if (wall.direction === "down") {
        const depth = row;
        if (depth < fullCells) {
          fillRects.push({ x: rectX, y: rectY, width: course.cellSize, height: course.cellSize });
        } else if (depth === fullCells && partial > 0) {
          const height = course.cellSize * partial;
          fillRects.push({ x: rectX, y: rectY, width: course.cellSize, height });
          leadingRects.push({ x: rectX, y: rectY, width: course.cellSize, height });
        }
      } else if (wall.direction === "right") {
        const depth = col;
        if (depth < fullCells) {
          fillRects.push({ x: rectX, y: rectY, width: course.cellSize, height: course.cellSize });
        } else if (depth === fullCells && partial > 0) {
          const width = course.cellSize * partial;
          fillRects.push({ x: rectX, y: rectY, width, height: course.cellSize });
          leadingRects.push({ x: rectX, y: rectY, width, height: course.cellSize });
        }
      } else if (wall.direction === "left") {
        const depth = course.gridCols - 1 - col;
        if (depth < fullCells) {
          fillRects.push({ x: rectX, y: rectY, width: course.cellSize, height: course.cellSize });
        } else if (depth === fullCells && partial > 0) {
          const width = course.cellSize * partial;
          fillRects.push({ x: rectX + course.cellSize - width, y: rectY, width, height: course.cellSize });
          leadingRects.push({ x: rectX + course.cellSize - width, y: rectY, width, height: course.cellSize });
        }
      }
    }
  }

  return { fillRects, leadingRects };
}

function getMovingWallSpan(course, direction) {
  return direction === "left" || direction === "right" ? course.gridCols : course.gridRows;
}

function getMovingWallsState(course, elapsed) {
  const wallStates = (course.movingWalls ?? []).map((wall) => ({
    wall,
    ...getMovingFillRects(course, wall, elapsed)
  }));
  return {
    walls: wallStates,
    fillRects: wallStates.flatMap((item) => item.fillRects),
    leadingRects: wallStates.flatMap((item) => item.leadingRects),
    isComplete: wallStates.some((item) => getMovingWallProgress(item.wall, elapsed) >= getMovingWallSpan(course, item.wall.direction))
  };
}

function getSolidWallRects(course, movingRects = []) {
  return [
    ...course.wallRects,
    ...(course.breakWalls ?? []).filter((wall) => !wall.broken),
    ...movingRects
  ];
}

function canOccupyPosition(course, racer, x, y, movingRects = []) {
  const testRacer = { x, y, size: racer.size };
  if (
    x < course.playfield.left ||
    y < course.playfield.top ||
    x + racer.size > course.playfield.right ||
    y + racer.size > course.playfield.bottom
  ) {
    return false;
  }

  if (!isRacerOnCourse(course, testRacer)) {
    return false;
  }

  return !getSolidWallRects(course, movingRects).some((wall) => intersectsRect(testRacer, wall));
}

function findNearestSafePlacement(course, racer, movingRects = []) {
  const candidates = [
    { x: racer.lastSafeX, y: racer.lastSafeY },
    { x: racer.x, y: racer.y }
  ];

  const pathCandidates = [...course.pathRects]
    .map((rect) => ({
      x: rect.x + (rect.width - racer.size) * 0.5,
      y: rect.y + (rect.height - racer.size) * 0.5,
      distance:
        (rect.x + rect.width * 0.5 - (racer.x + racer.size * 0.5)) ** 2 +
        (rect.y + rect.height * 0.5 - (racer.y + racer.size * 0.5)) ** 2
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 80);

  candidates.push(...pathCandidates);

  for (const candidate of candidates) {
    if (canOccupyPosition(course, racer, candidate.x, candidate.y, movingRects)) {
      return candidate;
    }
  }

  return null;
}

function resolveInvalidRacerState(course, racer, movingRects = [], reason = "stuck") {
  if (canOccupyPosition(course, racer, racer.x, racer.y, movingRects)) {
    racer.lastSafeX = racer.x;
    racer.lastSafeY = racer.y;
    return true;
  }

  const placement = findNearestSafePlacement(course, racer, movingRects);
  if (!placement) {
    eliminateRacer(racer, reason);
    return false;
  }

  const shiftX = placement.x - racer.x;
  const shiftY = placement.y - racer.y;
  racer.x = placement.x;
  racer.y = placement.y;
  if (Math.abs(shiftX) >= Math.abs(shiftY) && shiftX !== 0) {
    racer.vx = shiftX > 0 ? Math.abs(racer.vx) : -Math.abs(racer.vx);
  } else if (shiftY !== 0) {
    racer.vy = shiftY > 0 ? Math.abs(racer.vy) : -Math.abs(racer.vy);
  }
  normalizeRacerSpeed(racer);
  racer.lastSafeX = racer.x;
  racer.lastSafeY = racer.y;
  return true;
}

function collidesWithStaticBoundsOrWalls(course, racer, movingRects = []) {
  if (
    racer.x <= course.playfield.left ||
    racer.y <= course.playfield.top ||
    racer.x + racer.size >= course.playfield.right ||
    racer.y + racer.size >= course.playfield.bottom
  ) {
    return true;
  }

  return getSolidWallRects(course, movingRects).some((wall) => intersectsRect(racer, wall));
}

function collideMovingWall(course, racer, rect, movingRects) {
  if (!intersectsRect(racer, rect)) {
    return false;
  }

  if (course.movingWallDirection === "up") {
    racer.y = rect.y - racer.size;
    racer.vy = -Math.abs(racer.vy);
    triggerSquish(racer, "y", 1.4);
  } else if (course.movingWallDirection === "down") {
    racer.y = rect.y + rect.height;
    racer.vy = Math.abs(racer.vy);
    triggerSquish(racer, "y", 1.4);
  } else if (course.movingWallDirection === "right") {
    racer.x = rect.x + rect.width;
    racer.vx = Math.abs(racer.vx);
    triggerSquish(racer, "x", 1.4);
  } else if (course.movingWallDirection === "left") {
    racer.x = rect.x - racer.size;
    racer.vx = -Math.abs(racer.vx);
    triggerSquish(racer, "x", 1.4);
  }

  playCollisionTone(racer, racer.speed * 0.9);
  normalizeRacerSpeed(racer);

  if (collidesWithStaticBoundsOrWalls(course, racer)) {
    eliminateRacer(racer, "moving-wall");
  }

  return true;
}

function collideBreakWall(racer, wall, axis) {
  if (wall.broken || !intersectsRect(racer, wall)) {
    return false;
  }

  wall.broken = true;
  const restitution = 0.92;
  if (axis === "x") {
    racer.x = racer.vx > 0 ? wall.x - racer.size : wall.x + wall.width;
    racer.vx *= -restitution;
    triggerSquish(racer, "x", 1.2);
  } else {
    racer.y = racer.vy > 0 ? wall.y - racer.size : wall.y + wall.height;
    racer.vy *= -restitution;
    triggerSquish(racer, "y", 1.2);
  }
  playCollisionTone(racer, racer.speed * 1.1);
  normalizeRacerSpeed(racer);
  return true;
}

function eliminateRacer(racer, reason = "脱落") {
  if (racer.eliminated || racer.finished) {
    return;
  }
  racer.eliminated = true;
  racer.deathReason = reason;
  racer.vx = 0;
  racer.vy = 0;
}

function bounceOnAxis(racer, wall, axis) {
  if (!intersectsRect(racer, wall)) {
    return;
  }

  const restitution = 0.985;
  if (axis === "x") {
    racer.x = racer.vx > 0 ? wall.x - racer.size : wall.x + wall.width;
    const impactSpeed = Math.abs(racer.vx);
    racer.vx *= -restitution;
    playCollisionTone(racer, impactSpeed);
    triggerSquish(racer, "x", impactSpeed / Math.max(racer.speed, 1));
  } else {
    racer.y = racer.vy > 0 ? wall.y - racer.size : wall.y + wall.height;
    const impactSpeed = Math.abs(racer.vy);
    racer.vy *= -restitution;
    playCollisionTone(racer, impactSpeed);
    triggerSquish(racer, "y", impactSpeed / Math.max(racer.speed, 1));
  }

  normalizeRacerSpeed(racer);
}

function bounceOnBounds(racer, playfield) {
  let collided = false;

  if (racer.x < playfield.left) {
    racer.x = playfield.left;
    racer.vx = Math.abs(racer.vx);
    collided = true;
    triggerSquish(racer, "x");
  } else if (racer.x + racer.size > playfield.right) {
    racer.x = playfield.right - racer.size;
    racer.vx = -Math.abs(racer.vx);
    collided = true;
    triggerSquish(racer, "x");
  }

  if (racer.y < playfield.top) {
    racer.y = playfield.top;
    racer.vy = Math.abs(racer.vy);
    collided = true;
    triggerSquish(racer, "y");
  } else if (racer.y + racer.size > playfield.bottom) {
    racer.y = playfield.bottom - racer.size;
    racer.vy = -Math.abs(racer.vy);
    collided = true;
    triggerSquish(racer, "y");
  }

  if (collided) {
    playCollisionTone(racer, racer.speed);
    normalizeRacerSpeed(racer);
  }
}

function handleRacerCollisions() {
  for (let pass = 0; pass < 5; pass += 1) {
    for (let index = 0; index < state.racers.length; index += 1) {
      const racerA = state.racers[index];
      if (racerA.finished || racerA.eliminated) {
        continue;
      }

      for (let inner = index + 1; inner < state.racers.length; inner += 1) {
        const racerB = state.racers[inner];
        if (racerB.finished || racerB.eliminated) {
          continue;
        }

        const ax = racerA.x + racerA.size * 0.5;
        const ay = racerA.y + racerA.size * 0.5;
        const bx = racerB.x + racerB.size * 0.5;
        const by = racerB.y + racerB.size * 0.5;
        let dx = bx - ax;
        let dy = by - ay;
        let distance = Math.hypot(dx, dy);
        const minDistance = (racerA.size + racerB.size) * 0.5;

        if (distance >= minDistance) {
          continue;
        }

        if (distance === 0) {
          dx = racerB.vx - racerA.vx;
          dy = racerB.vy - racerA.vy;
          distance = Math.hypot(dx, dy);
          if (distance === 0) {
            dx = inner - index;
            dy = pass % 2 === 0 ? 1 : -1;
            distance = Math.hypot(dx, dy);
          }
        }

        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance + 1.2;
        racerA.x -= nx * overlap * 0.5;
        racerA.y -= ny * overlap * 0.5;
        racerB.x += nx * overlap * 0.5;
        racerB.y += ny * overlap * 0.5;

        const reflectedA = reflectVelocity(racerA.vx, racerA.vy, -nx, -ny);
        const reflectedB = reflectVelocity(racerB.vx, racerB.vy, nx, ny);

        racerA.vx = reflectedA.vx - nx * 8;
        racerA.vy = reflectedA.vy - ny * 8;
        racerB.vx = reflectedB.vx + nx * 8;
        racerB.vy = reflectedB.vy + ny * 8;

        normalizeRacerSpeed(racerA);
        normalizeRacerSpeed(racerB);
      }
    }
  }
}

function updateRace(deltaSeconds) {
  const dt = deltaSeconds * Number(simSpeedInput.value);
  const play = state.course.playfield;
  state.elapsed += deltaSeconds;
  state.simElapsed += dt;
  raceTimer.textContent = formatTime(state.elapsed);
  const movingWallsState = getMovingWallsState(state.course, state.simElapsed);
  let winner = null;

  if (movingWallsState.isComplete) {
    finishRace("MOVING WALL FULL");
    return;
  }

  for (const racer of state.racers) {
    if (racer.finished || racer.eliminated) {
      continue;
    }

    racer.lastSafeX = racer.x;
    racer.lastSafeY = racer.y;

    racer.x += racer.vx * dt;
    for (const wall of state.course.breakWalls ?? []) {
      collideBreakWall(racer, wall, "x");
    }
    for (const wall of state.course.wallRects) {
      bounceOnAxis(racer, wall, "x");
    }

    racer.y += racer.vy * dt;
    for (const wall of state.course.breakWalls ?? []) {
      collideBreakWall(racer, wall, "y");
    }
    for (const wall of state.course.wallRects) {
      bounceOnAxis(racer, wall, "y");
    }

    for (const rect of movingWallsState.fillRects) {
      collideMovingWall(state.course, racer, rect, movingWallsState.fillRects);
      if (racer.eliminated) {
        break;
      }
    }
    if (racer.eliminated) {
      continue;
    }

    bounceOnBounds(racer, play);
    if (!resolveInvalidRacerState(state.course, racer, [], "wall-stuck")) {
      continue;
    }

    racer.trail.push({ x: racer.x + racer.size * 0.5, y: racer.y + racer.size * 0.5 });
    if (racer.trail.length > 16) {
      racer.trail.shift();
    }

    if (isRacerInFinishZone(racer, state.course)) {
      racer.finished = true;
      racer.finishTime = state.elapsed;
      state.finishedOrder.push(racer);
      renderPodium();
      if (state.finishedOrder.length === 1) {
        winner = racer;
        break;
      }
    }
  }

  if (winner) {
    finishRace(`${winner.label} WIN`, winner);
    return;
  }

  const activeRacers = state.racers.filter((racer) => !racer.finished && !racer.eliminated);
  if (activeRacers.length === 0) {
    finishRace("全員脱落");
    return;
  }

  handleRacerCollisions();
  for (const racer of state.racers) {
    if (!racer.finished && !racer.eliminated) {
      resolveInvalidRacerState(state.course, racer, [], "wall-stuck");
    }
  }
  if (!state.racers.some((racer) => !racer.finished && !racer.eliminated)) {
    finishRace("全員脱落");
  }
}

function drawBackground() {
  context.fillStyle = COLORS.page;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.shadowColor = COLORS.boardShadow;
  context.shadowBlur = 24;
  context.shadowOffsetY = 10;
  drawRoundedRect(
    state.course.playfield.left - 14,
    state.course.playfield.top - 14,
    state.course.playfield.width + 28,
    state.course.playfield.height + 28,
    18,
    COLORS.stage
  );
  context.shadowColor = "transparent";
}

function drawCells(rects, fillStyle) {
  context.fillStyle = fillStyle;
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  });
}

function drawBrickWalls(rects) {
  rects.forEach((rect) => {
    const row = Math.round((rect.y - state.course.playfield.top) / state.course.cellSize);
    const col = Math.round((rect.x - state.course.playfield.left) / state.course.cellSize);
    const inset = Math.max(1, Math.floor(rect.width * 0.08));
    const splitX = rect.x + Math.floor(rect.width * (row % 2 === 0 ? 0.52 : 0.38));
    const midY = rect.y + Math.floor(rect.height * 0.5);

    context.fillStyle = (row + col) % 2 === 0 ? COLORS.wall : COLORS.wallAlt;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeStyle = COLORS.mortar;
    context.lineWidth = Math.max(1, rect.width * 0.05);
    context.strokeRect(rect.x + inset, rect.y + inset, rect.width - inset * 2, rect.height - inset * 2);

    context.beginPath();
    context.moveTo(rect.x + inset, midY);
    context.lineTo(rect.x + rect.width - inset, midY);
    context.stroke();

    context.beginPath();
    context.moveTo(splitX, rect.y + inset);
    context.lineTo(splitX, midY);
    context.moveTo(rect.x + rect.width - (splitX - rect.x), midY);
    context.lineTo(rect.x + rect.width - (splitX - rect.x), rect.y + rect.height - inset);
    context.stroke();
  });
}

function drawBreakWalls(rects) {
  rects.forEach((wall) => {
    if (wall.broken) {
      return;
    }
    context.fillStyle = "#8d4f2c";
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
    context.strokeStyle = "#fff2df";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(wall.x + wall.width * 0.2, wall.y + wall.height * 0.22);
    context.lineTo(wall.x + wall.width * 0.52, wall.y + wall.height * 0.46);
    context.lineTo(wall.x + wall.width * 0.34, wall.y + wall.height * 0.82);
    context.moveTo(wall.x + wall.width * 0.58, wall.y + wall.height * 0.14);
    context.lineTo(wall.x + wall.width * 0.78, wall.y + wall.height * 0.5);
    context.lineTo(wall.x + wall.width * 0.56, wall.y + wall.height * 0.88);
    context.stroke();
  });
}

function drawMovingWalls(rects, timestamp) {
  const movingWallsState = getMovingWallsState(state.course, state.simElapsed);
  movingWallsState.fillRects.forEach((rect) => {
    context.fillStyle = "rgba(64, 112, 198, 0.72)";
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  });
}

function drawStartAndGoal() {
  const finish = state.course.finishRect;

  state.course.startZones.forEach((zone, index) => {
    const palette = RACER_PALETTE[index];
    context.fillStyle = `${palette.color}cc`;
    context.fillRect(zone.x, zone.y, zone.width, zone.height);
    context.strokeStyle = "#fff8ef";
    context.lineWidth = 2;
    context.strokeRect(zone.x, zone.y, zone.width, zone.height);
  });

  context.fillStyle = COLORS.finishLight;
  context.fillRect(finish.x, finish.y, finish.width, finish.height);
  context.strokeStyle = COLORS.ink;
  context.lineWidth = Math.max(1, finish.width * 0.08);
  context.strokeRect(finish.x, finish.y, finish.width, finish.height);

  const checker = 2;
  const size = finish.width / checker;
  for (let row = 0; row < checker; row += 1) {
    for (let col = 0; col < checker; col += 1) {
      context.fillStyle = (row + col) % 2 === 0 ? COLORS.finishDark : COLORS.finishLight;
      context.fillRect(finish.x + col * size, finish.y + row * size, size, size);
    }
  }
}

function drawTrack(timestamp) {
  drawBackground();
  drawBrickWalls(state.course.wallRects);
  drawCells(state.course.pathRects, COLORS.path);
  drawBreakWalls(state.course.breakWalls ?? []);
  drawMovingWalls(state.course.movingWalls ?? [], timestamp);

  drawStartAndGoal();
}

function drawRacers() {
  for (const racer of state.racers) {
    racer.squishX += (1 - racer.squishX) * 0.28;
    racer.squishY += (1 - racer.squishY) * 0.28;

    if (racer.trail.length > 1) {
      for (let index = 0; index < racer.trail.length; index += 1) {
        const point = racer.trail[index];
        const ratio = index / racer.trail.length;
        const radius = Math.max(3, racer.size * (0.18 + ratio * 0.2));
        const alpha = 0.08 + ratio * 0.28;
        const r = Number.parseInt(racer.color.slice(1, 3), 16);
        const g = Number.parseInt(racer.color.slice(3, 5), 16);
        const b = Number.parseInt(racer.color.slice(5, 7), 16);
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.save();
    context.translate(racer.x + racer.size * 0.5, racer.y + racer.size * 0.5);
    context.scale(racer.squishX, racer.squishY);
    context.fillStyle = racer.eliminated ? "#6f655f" : racer.color;
    context.beginPath();
    context.arc(0, 0, racer.size * 0.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.28)";
    context.beginPath();
    context.arc(-racer.size * 0.14, -racer.size * 0.18, racer.size * 0.18, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff8ef";
    context.beginPath();
    context.arc(-racer.size * 0.13, -racer.size * 0.06, racer.size * 0.12, 0, Math.PI * 2);
    context.arc(racer.size * 0.13, -racer.size * 0.06, racer.size * 0.12, 0, Math.PI * 2);
    context.fill();

    const eyeLookX = clamp(racer.vx / racer.speed, -1, 1) * racer.size * 0.025;
    const eyeLookY = clamp(racer.vy / racer.speed, -1, 1) * racer.size * 0.025;
    context.fillStyle = "#171717";
    context.beginPath();
    context.arc(-racer.size * 0.13 + eyeLookX, -racer.size * 0.06 + eyeLookY, racer.size * 0.045, 0, Math.PI * 2);
    context.arc(racer.size * 0.13 + eyeLookX, -racer.size * 0.06 + eyeLookY, racer.size * 0.045, 0, Math.PI * 2);
    context.fill();
    context.restore();

    if (racer.eliminated) {
      context.strokeStyle = "#171717";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(racer.x - 1, racer.y - 1);
      context.lineTo(racer.x + racer.size + 1, racer.y + racer.size + 1);
      context.moveTo(racer.x + racer.size + 1, racer.y - 1);
      context.lineTo(racer.x - 1, racer.y + racer.size + 1);
      context.stroke();
    }
  }
}

function drawOverlay() {
  if (!hudToggleInput.checked) {
    return;
  }

  drawRoundedRect(22, 18, canvas.width - 44, 84, 18, COLORS.chip);
  drawRoundedRect(22, canvas.height - 82, canvas.width - 44, 60, 18, COLORS.chip);

  context.fillStyle = COLORS.ink;
  context.font = 'bold 26px "Space Grotesk"';
  context.fillText(state.course.title, 40, 50);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.muted;
  context.fillText(
    `${state.course.resolvedStyle} / seed ${state.course.seed} / route ${state.course.actualLength} / target ${state.course.targetLength}`,
    40,
    74
  );
  context.fillText(
    `${state.preset.label} / width ${state.course.widthMode.label} / branch ${state.course.branchCount} / first goal wins`,
    40,
    92
  );

  context.fillStyle = COLORS.ink;
  context.font = 'bold 22px "Space Grotesk"';
  context.fillText(formatTime(state.elapsed), canvas.width - 112, 52);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.muted;
  context.fillText(`${state.racers.filter((racer) => !racer.eliminated).length} racers`, canvas.width - 112, 76);
  context.fillText(`speed ${Number(simSpeedInput.value).toFixed(1)}x`, canvas.width - 112, 94);

  const liveOrder = [...state.finishedOrder];
  state.racers
    .filter((racer) => !racer.finished)
    .sort((a, b) => b.x - a.x)
    .forEach((racer) => liveOrder.push(racer));

  liveOrder.slice(0, 4).forEach((racer, index) => {
    const x = 40 + index * 120;
    context.fillStyle = racer.color;
    context.fillRect(x, canvas.height - 62, 12, 12);
    context.fillStyle = COLORS.ink;
    context.font = '13px "IBM Plex Sans JP"';
    context.fillText(`${index + 1}. ${racer.label}`, x + 18, canvas.height - 52);
  });

  context.fillStyle = COLORS.muted;
  context.font = '13px "IBM Plex Sans JP"';
  context.fillText(`${recordStatus.textContent} / ${recordFormat.textContent}`, canvas.width - 220, canvas.height - 52);

  if (recorderState.mediaRecorder?.state === "recording") {
    context.fillStyle = COLORS.accent;
    context.beginPath();
    context.arc(canvas.width - 24, canvas.height - 52, 6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawWinnerBanner(timestamp) {
  if (!state.resultBanner || timestamp > state.winnerBannerUntil) {
    return;
  }

  const width = Math.min(canvas.width - 96, 520);
  const height = 210;
  const x = (canvas.width - width) * 0.5;
  const y = canvas.height * 0.5 - height * 0.5;

  context.shadowColor = `${state.resultBanner.accent}88`;
  context.shadowBlur = 42;
  drawRoundedRect(x, y, width, height, 30, "rgba(255,250,243,0.98)");
  context.shadowColor = "transparent";

  const grad = context.createLinearGradient(x, y, x + width, y + height);
  grad.addColorStop(0, state.resultBanner.accent);
  grad.addColorStop(1, "#171717");
  context.fillStyle = grad;
  drawRoundedRect(x + 10, y + 10, width - 20, height - 20, 24, grad);

  context.fillStyle = "rgba(255,250,243,0.92)";
  drawRoundedRect(x + 22, y + 56, width - 44, height - 78, 20, "rgba(255,250,243,0.92)");

  const crownX = canvas.width * 0.5;
  const crownY = y + 26;
  if (state.resultBanner.crown) {
    context.fillStyle = "#ffd166";
    context.beginPath();
    context.moveTo(crownX - 42, crownY + 18);
    context.lineTo(crownX - 28, crownY - 12);
    context.lineTo(crownX - 8, crownY + 6);
    context.lineTo(crownX, crownY - 18);
    context.lineTo(crownX + 8, crownY + 6);
    context.lineTo(crownX + 28, crownY - 12);
    context.lineTo(crownX + 42, crownY + 18);
    context.lineTo(crownX + 42, crownY + 30);
    context.lineTo(crownX - 42, crownY + 30);
    context.closePath();
    context.fill();
  } else {
    context.fillStyle = "#fff4c7";
    context.font = '700 26px "Space Grotesk"';
    context.textAlign = "center";
    context.fillText("NO WINNER", canvas.width * 0.5, y + 34);
  }

  context.fillStyle = "#171717";
  context.font = '700 18px "Space Grotesk"';
  context.textAlign = "center";
  context.fillText(state.resultBanner.crown ? "KING OF THE RACE" : "RACE RESULT", canvas.width * 0.5, y + 92);
  context.fillStyle = state.resultBanner.accent;
  context.font = '700 52px "Space Grotesk"';
  context.fillText(state.resultBanner.label, canvas.width * 0.5, y + 142);
  context.fillStyle = "#171717";
  context.font = '700 22px "IBM Plex Sans JP"';
  context.fillText(state.resultBanner.subtitle, canvas.width * 0.5, y + 178);
  context.textAlign = "start";
}

function draw(timestamp = performance.now()) {
  if (!state.course) {
    return;
  }

  drawTrack(timestamp);
  drawRacers();
  drawOverlay();
  drawWinnerBanner(timestamp);
}

function maybeAutoAdvance(timestamp) {
  const waitingPerRaceClip =
    recorderState.mode === "per-race" && (recorderState.pendingStopAt || recorderState.mediaRecorder);
  if (!state.nextAutoRaceAt || timestamp < state.nextAutoRaceAt || waitingPerRaceClip) {
    return;
  }

  seedInput.value = String(randomSeed());
  generateCourse(seedInput.value);
  startRace();
}

function maybeStopRecordingAfterRace(timestamp) {
  if (!recorderState.pendingStopAt || timestamp < recorderState.pendingStopAt) {
    return false;
  }
  recorderState.pendingStopAt = 0;
  stopRecordingAfterRace();
  return true;
}

function loop(timestamp) {
  if (state.running && !state.paused) {
    if (state.lastFrame === 0) {
      state.lastFrame = timestamp;
    }
    const deltaSeconds = Math.min((timestamp - state.lastFrame) / 1000, 0.033);
    state.lastFrame = timestamp;
    updateRace(deltaSeconds);
  } else {
    state.lastFrame = timestamp;
    const stoppedRecording = maybeStopRecordingAfterRace(timestamp);
    if (!stoppedRecording) {
      maybeAutoAdvance(timestamp);
    }
  }

  draw(timestamp);
  requestAnimationFrame(loop);
}

function downloadBlob(blob, extension, filename = `shikaku-race-${Date.now()}.${extension}`) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stopRecording() {
  recorderState.armed = false;
  if (!recorderState.mediaRecorder || recorderState.mediaRecorder.state !== "recording") {
    recordStatus.textContent = "停止中";
    return;
  }
  recorderState.pendingStopAt = 0;
  recorderState.mediaRecorder.stop();
}

function stopRecordingAfterRace() {
  if (!recorderState.mediaRecorder || recorderState.mediaRecorder.state !== "recording") {
    return;
  }
  recorderState.pendingStopAt = 0;
  recorderState.mediaRecorder.stop();
}

function startRecording(skipRaceStart = false) {
  if (recorderState.mediaRecorder?.state === "recording") {
    return;
  }

  ensureAudioReady();
  const profile = getRecordingProfile();
  if (!profile) {
    recordStatus.textContent = "未対応";
    recordFormat.textContent = "MediaRecorder なし";
    return;
  }

  const stream = canvas.captureStream(60);
  const tracks = [...stream.getVideoTracks()];
  if (audioState.mediaDestination) {
    tracks.push(...audioState.mediaDestination.stream.getAudioTracks());
  }

  recorderState.stream = new MediaStream(tracks);
  recorderState.chunks = [];
  recorderState.profile = profile;
  recorderState.mode = recordingModeInput.value;
  recorderState.armed = recorderState.mode === "per-race";
  recorderState.pendingStopAt = 0;
  recorderState.clipSequence += 1;
  recorderState.filename = buildRecordingFilename(profile.extension);

  const options = profile.mimeType
    ? { mimeType: profile.mimeType, videoBitsPerSecond: 4_000_000 }
    : { videoBitsPerSecond: 4_000_000 };
  const mediaRecorder = new MediaRecorder(recorderState.stream, options);
  recorderState.mediaRecorder = mediaRecorder;

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recorderState.chunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recorderState.chunks, {
      type: profile.mimeType || "video/webm"
    });
    downloadBlob(blob, profile.extension, recorderState.filename);
    recorderState.stream?.getTracks().forEach((track) => track.stop());
    recorderState.stream = null;
    recorderState.mediaRecorder = null;
    recorderState.filename = "";
    recordStatus.textContent =
      recorderState.armed && recorderState.mode === "per-race" ? "次レース待機" : "停止中";
  };

  mediaRecorder.start();
  recordStatus.textContent = isPerRaceRecording() ? "1レース録画中" : "録画中";
  recordFormat.textContent = profile.label;

  if (!state.running && !skipRaceStart) {
    startRace();
  }
}

function applyLoadedCourse(payload) {
  const presetId = OUTPUT_PRESETS.some((preset) => preset.id === payload.preset)
    ? payload.preset
    : OUTPUT_PRESETS[0].id;
  outputPresetSelect.value = presetId;
  setCanvasPreset(presetId);

  pathLengthInput.value = String(payload.targetLength ?? pathLengthInput.value);
  pathLengthValue.textContent = pathLengthInput.value;
  widthVarianceInput.value = String(payload.widthVariance ?? widthVarianceInput.value);
  updateWidthVarianceLabel();
  branchRateInput.value = String(payload.branchRate ?? branchRateInput.value);
  updateBranchRateLabel();
  breakWallCountInput.value = String(payload.breakWallCount ?? breakWallCountInput.value);
  updateBreakWallLabel();
  movingWallDirectionInput.value = String(payload.movingWallDirection ?? movingWallDirectionInput.value);
  movingWallSpeedInput.value = String(
    Math.round((payload.movingWallSpeedRate ?? Number(movingWallSpeedInput.value) / 180) * 180)
  );
  updateMovingWallSpeedLabel();

  state.course = {
    title: "SHIKAKU RACE",
    requestedStyle: payload.requestedStyle ?? payload.resolvedStyle ?? "manual",
    resolvedStyle: payload.resolvedStyle ?? payload.requestedStyle ?? "manual",
    seed: Number(payload.seed ?? seedInput.value),
    gridCols: payload.gridCols ?? payload.gridSize ?? GRID_COLS,
    gridRows: payload.gridRows ?? payload.gridSize ?? GRID_ROWS,
    targetLength: Number(payload.targetLength ?? pathLengthInput.value),
    actualLength: Number(payload.actualLength ?? pathLengthInput.value),
    widthVariance: Number(payload.widthVariance ?? widthVarianceInput.value),
    branchRate: Number(payload.branchRate ?? branchRateInput.value),
    breakWallCount: Number(payload.breakWallCount ?? breakWallCountInput.value),
    movingWallCount: Number(payload.movingWallCount ?? (payload.movingWallDirection && payload.movingWallDirection !== "none" ? 1 : 0)),
    branchCount: Number(payload.branchCount ?? 0),
    widthMode: payload.widthMode ?? getWidthMode(Number(payload.widthVariance ?? widthVarianceInput.value)),
    movingWallDirection: payload.movingWallDirection ?? "right",
    movingWallSpeedRate: Number(payload.movingWallSpeedRate ?? Number(movingWallSpeedInput.value) / 180),
    racerSpeed: Number(payload.racerSpeed ?? clamp((payload.cellSize ?? 20) * 4.5, 90, 170)),
    cellSize: payload.cellSize,
    passableGrid: rebuildPassableGrid(payload),
    playfield: payload.playfield,
    startZones: payload.startZones ?? (payload.startRect ? [payload.startRect] : []),
    startRect: payload.startRect,
    finishRect: payload.finishRect,
    finishEntrance: payload.finishEntrance ?? "down",
    finishTriggerRect:
      payload.finishTriggerRect ??
      (payload.finishRect ? buildFinishTriggerRectFromRect(payload.finishRect, payload.finishEntrance ?? "down") : null),
    pathRects: payload.pathRects ?? [],
    wallRects: payload.wallRects ?? [],
    breakWalls: payload.breakWalls ?? [],
    movingWalls: payload.movingWalls ?? [],
    mainPathCells: payload.mainPathCells ?? [],
    pathIndexMap: Object.fromEntries((payload.mainPathCells ?? []).map((cell, index) => [`${cell.x},${cell.y}`, index])),
    pathWidthMap: payload.pathWidthMap ?? {}
  };

  seedInput.value = String(state.course.seed);
  updateCourseMeta();
  syncCourseJson();
  resetRace(false);
}

function exportCourseJson() {
  syncCourseJson();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(courseJson.value).catch(() => {});
  }
}

fillSelectOptions();
loadRaceHistory();
renderRaceHistory();
outputPresetSelect.value = OUTPUT_PRESETS[0].id;
recordFormat.textContent = getRecordingProfile()?.label ?? "未対応";
updateWidthVarianceLabel();
updateBranchRateLabel();
updateBreakWallLabel();
updateMovingWallSpeedLabel();
setCanvasPreset(outputPresetSelect.value);
generateCourse(seedInput.value);

racerCountInput.addEventListener("input", () => {
  racerCountValue.textContent = racerCountInput.value;
  generateCourse(seedInput.value);
});

simSpeedInput.addEventListener("input", () => {
  simSpeedValue.textContent = `${Number(simSpeedInput.value).toFixed(1)}x`;
});

pathLengthInput.addEventListener("input", () => {
  pathLengthValue.textContent = pathLengthInput.value;
});

widthVarianceInput.addEventListener("input", () => {
  updateWidthVarianceLabel();
});

branchRateInput.addEventListener("input", () => {
  updateBranchRateLabel();
});

breakWallCountInput.addEventListener("input", () => {
  updateBreakWallLabel();
});

movingWallDirectionInput.addEventListener("change", () => {
  generateCourse(seedInput.value);
});

movingWallSpeedInput.addEventListener("input", () => {
  updateMovingWallSpeedLabel();
});

outputPresetSelect.addEventListener("change", () => {
  setCanvasPreset(outputPresetSelect.value);
  generateCourse(seedInput.value);
});

generateCourseButton.addEventListener("click", () => {
  generateCourse(seedInput.value);
});

randomSeedButton.addEventListener("click", () => {
  seedInput.value = String(randomSeed());
  generateCourse(seedInput.value);
});

shuffleStyleButton.addEventListener("click", () => {
  seedInput.value = String(randomSeed());
  generateCourse(seedInput.value);
});

startButton.addEventListener("click", () => {
  startRace();
});

pauseButton.addEventListener("click", () => {
  if (!state.running) {
    return;
  }
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "再開" : "一時停止";
  updateStatus(state.paused ? "停止中" : "進行中");
});

resetButton.addEventListener("click", () => {
  resetRace(false);
});

recordButton.addEventListener("click", () => {
  startRecording();
});

stopRecordButton.addEventListener("click", () => {
  stopRecording();
});

exportJsonButton.addEventListener("click", () => {
  exportCourseJson();
});

loadJsonButton.addEventListener("click", () => {
  try {
    applyLoadedCourse(JSON.parse(courseJson.value));
  } catch (error) {
    updateStatus("JSONエラー");
  }
});

window.addEventListener("resize", syncCanvasDisplaySize);

requestAnimationFrame(loop);
