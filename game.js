const canvas = document.getElementById("arena");
const context = canvas.getContext("2d");

const outputPresetSelect = document.getElementById("outputPreset");
const courseStyleSelect = document.getElementById("courseStyle");
const racerCountInput = document.getElementById("racerCount");
const racerCountValue = document.getElementById("racerCountValue");
const simSpeedInput = document.getElementById("simSpeed");
const simSpeedValue = document.getElementById("simSpeedValue");
const autoCycleInput = document.getElementById("autoCycle");
const pathLengthInput = document.getElementById("pathLength");
const pathLengthValue = document.getElementById("pathLengthValue");
const widthVarianceInput = document.getElementById("widthVariance");
const widthVarianceValue = document.getElementById("widthVarianceValue");
const seedInput = document.getElementById("seedInput");
const randomSeedButton = document.getElementById("randomSeedButton");
const generateCourseButton = document.getElementById("generateCourseButton");
const shuffleStyleButton = document.getElementById("shuffleStyleButton");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const recordButton = document.getElementById("recordButton");
const stopRecordButton = document.getElementById("stopRecordButton");
const exportJsonButton = document.getElementById("exportJsonButton");
const loadJsonButton = document.getElementById("loadJsonButton");
const courseJson = document.getElementById("courseJson");
const raceStatus = document.getElementById("raceStatus");
const raceTimer = document.getElementById("raceTimer");
const recordStatus = document.getElementById("recordStatus");
const recordFormat = document.getElementById("recordFormat");
const courseMeta = document.getElementById("courseMeta");
const podiumList = document.getElementById("podium");

const GRID_SIZE = 28;
const START_GOAL_SIZE = 3;
const INNER_MARGIN = 1;

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

const COURSE_STYLES = [
  { id: "variety", label: "Variety Mix" },
  { id: "snake", label: "Snake Channel" },
  { id: "ladder", label: "Ladder Drop" },
  { id: "canyon", label: "Wide Canyon" },
  { id: "zigzag", label: "Tight Zigzag" }
];

const STYLE_IDS = COURSE_STYLES.filter((style) => style.id !== "variety").map((style) => style.id);

const STYLE_PROFILES = {
  snake: {
    horizontalMax: 3,
    swingMin: 3,
    swingMax: 7,
    widthMin: 2,
    widthBase: 2,
    widthMax: 4,
    verticalBias: 0.88,
    alternating: true
  },
  ladder: {
    horizontalMax: 2,
    swingMin: 5,
    swingMax: 9,
    widthMin: 1,
    widthBase: 2,
    widthMax: 3,
    verticalBias: 0.94,
    alternating: true
  },
  canyon: {
    horizontalMax: 4,
    swingMin: 2,
    swingMax: 5,
    widthMin: 2,
    widthBase: 3,
    widthMax: 5,
    verticalBias: 0.72,
    alternating: false
  },
  zigzag: {
    horizontalMax: 2,
    swingMin: 2,
    swingMax: 5,
    widthMin: 1,
    widthBase: 1,
    widthMax: 3,
    verticalBias: 0.9,
    alternating: true
  }
};

const COLORS = {
  page: "#f6efe2",
  stage: "#c8bea8",
  boardShadow: "rgba(70, 57, 38, 0.16)",
  wall: "#ece7dd",
  path: "#4f63ff",
  start: "#25c48a",
  finishLight: "#ffffff",
  finishDark: "#121212",
  ink: "#27231d",
  muted: "#746c60",
  accent: "#ff7a45",
  chip: "rgba(255, 250, 242, 0.96)"
};

const RACER_PALETTE = [
  { color: "#ff7a45", frequency: 220, wave: "sine" },
  { color: "#25c48a", frequency: 247, wave: "triangle" },
  { color: "#5b7cff", frequency: 262, wave: "square" },
  { color: "#ffd166", frequency: 294, wave: "sawtooth" },
  { color: "#d86cff", frequency: 330, wave: "triangle" },
  { color: "#fb5f86", frequency: 392, wave: "square" }
];

const audioState = {
  context: null,
  masterGain: null,
  mediaDestination: null,
  ready: false
};

const recorderState = {
  mediaRecorder: null,
  chunks: [],
  stream: null,
  profile: null
};

const state = {
  preset: OUTPUT_PRESETS[0],
  course: null,
  racers: [],
  running: false,
  paused: false,
  elapsed: 0,
  finishedOrder: [],
  raceIndex: 0,
  lastFrame: 0,
  nextAutoRaceAt: 0
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

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
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
    audioState.masterGain.connect(audioState.context.destination);
    audioState.masterGain.connect(audioState.mediaDestination);
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

  const primary = audioState.context.createOscillator();
  const overtone = audioState.context.createOscillator();
  const gain = audioState.context.createGain();
  const level = clamp(impactSpeed / 320, 0.05, 0.18);

  primary.type = racer.wave;
  overtone.type = "sine";
  primary.frequency.setValueAtTime(racer.frequency, now);
  overtone.frequency.setValueAtTime(racer.frequency * 1.5, now);

  gain.gain.setValueAtTime(level, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  primary.connect(gain);
  overtone.connect(gain);
  gain.connect(audioState.masterGain);

  primary.start(now);
  overtone.start(now);
  primary.stop(now + 0.12);
  overtone.stop(now + 0.12);
}

function fillSelectOptions() {
  OUTPUT_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    outputPresetSelect.append(option);
  });

  COURSE_STYLES.forEach((style) => {
    const option = document.createElement("option");
    option.value = style.id;
    option.textContent = style.label;
    courseStyleSelect.append(option);
  });
}

function setCanvasPreset(presetId) {
  const preset = OUTPUT_PRESETS.find((item) => item.id === presetId) ?? OUTPUT_PRESETS[0];
  state.preset = preset;
  canvas.width = preset.width;
  canvas.height = preset.height;
}

function getPlayfield() {
  const portrait = canvas.height > canvas.width;
  const topInset = portrait ? 128 : 86;
  const bottomInset = portrait ? 100 : 78;
  const horizontalInset = 34;
  const size = Math.min(canvas.width - horizontalInset * 2, canvas.height - topInset - bottomInset);

  return {
    left: Math.floor((canvas.width - size) * 0.5),
    top: topInset,
    right: Math.floor((canvas.width - size) * 0.5) + size,
    bottom: topInset + size,
    width: size,
    height: size
  };
}

function createMatrix(rows, cols, value = false) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}

function carveRect(grid, x, y, width, height) {
  const minX = clamp(x, 0, GRID_SIZE - 1);
  const minY = clamp(y, 0, GRID_SIZE - 1);
  const maxX = clamp(x + width - 1, 0, GRID_SIZE - 1);
  const maxY = clamp(y + height - 1, 0, GRID_SIZE - 1);

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

function chooseStyle(styleId, randomFn) {
  if (styleId !== "variety") {
    return styleId;
  }
  return STYLE_IDS[randomInt(randomFn, 0, STYLE_IDS.length - 1)];
}

function generateGoalTop(randomFn, startTop) {
  let goalTop = randomInt(randomFn, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
  let tries = 0;
  while (Math.abs(goalTop - startTop) < 5 && tries < 12) {
    goalTop = randomInt(randomFn, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
    tries += 1;
  }
  return goalTop;
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

    let room = direction > 0 ? GRID_SIZE - INNER_MARGIN - 2 - current.y : current.y - (INNER_MARGIN + 1);
    if (room <= 0) {
      direction *= -1;
      room = direction > 0 ? GRID_SIZE - INNER_MARGIN - 2 - current.y : current.y - (INNER_MARGIN + 1);
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
  let currentWidth = profile.widthBase;
  const widths = [];
  const changeChance = varianceRate / 100;

  for (let index = 0; index < path.length; index += 1) {
    if (index > 0 && randomFn() < changeChance * 0.55) {
      const delta = randomFn() > 0.5 ? 1 : -1;
      currentWidth = clamp(currentWidth + delta, profile.widthMin, profile.widthMax);
    }
    widths.push(currentWidth);
  }

  return widths;
}

function buildCourse(styleId, seedValue) {
  const play = getPlayfield();
  const seed = Number(seedValue) || 1;
  const randomFn = mulberry32(seed);
  const resolvedStyle = chooseStyle(styleId, randomFn);
  const profile = STYLE_PROFILES[resolvedStyle];
  const targetLength = Number(pathLengthInput.value);
  const widthVariance = Number(widthVarianceInput.value);
  const grid = createMatrix(GRID_SIZE, GRID_SIZE, false);

  const startLeft = INNER_MARGIN;
  const startTop = randomInt(randomFn, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
  const goalLeft = GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN;
  const goalTop = generateGoalTop(randomFn, startTop);
  const startPoint = { x: startLeft + START_GOAL_SIZE - 1, y: startTop + 1 };
  const goalPoint = { x: goalLeft, y: goalTop + 1 };

  carveRect(grid, startLeft, startTop, START_GOAL_SIZE, START_GOAL_SIZE);
  carveRect(grid, goalLeft, goalTop, START_GOAL_SIZE, START_GOAL_SIZE);

  const { path, actualLength } = buildCenterline(profile, startPoint, goalPoint, targetLength, randomFn);
  const widths = buildWidths(profile, path, widthVariance, randomFn);

  path.forEach((point, index) => {
    const width = widths[index];
    carveCentered(grid, point, width);
    if (index > 0) {
      carveConnection(grid, path[index - 1], point, Math.max(widths[index - 1], width));
    }
  });

  const cellSize = Math.floor(play.width / GRID_SIZE);
  const offsetX = Math.floor(play.left + (play.width - cellSize * GRID_SIZE) * 0.5);
  const offsetY = Math.floor(play.top + (play.height - cellSize * GRID_SIZE) * 0.5);
  const pathRects = [];
  const wallRects = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
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

  return {
    title: "SHIKAKU RACE",
    requestedStyle: styleId,
    resolvedStyle,
    seed,
    gridSize: GRID_SIZE,
    targetLength,
    actualLength,
    timeLimit: clamp(Math.ceil((actualLength / 4.5) * 3.2), 18, 60),
    widthVariance,
    cellSize,
    passableGrid: grid,
    playfield: {
      left: offsetX,
      top: offsetY,
      right: offsetX + cellSize * GRID_SIZE,
      bottom: offsetY + cellSize * GRID_SIZE,
      width: cellSize * GRID_SIZE,
      height: cellSize * GRID_SIZE
    },
    startRect: {
      x: offsetX + startLeft * cellSize,
      y: offsetY + startTop * cellSize,
      width: START_GOAL_SIZE * cellSize,
      height: START_GOAL_SIZE * cellSize
    },
    finishRect: {
      x: offsetX + goalLeft * cellSize,
      y: offsetY + goalTop * cellSize,
      width: START_GOAL_SIZE * cellSize,
      height: START_GOAL_SIZE * cellSize
    },
    pathRects,
    wallRects
  };
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
      gridSize: state.course.gridSize,
      targetLength: state.course.targetLength,
      actualLength: state.course.actualLength,
      timeLimit: state.course.timeLimit,
      widthVariance: state.course.widthVariance,
      cellSize: state.course.cellSize,
      passableGrid: state.course.passableGrid,
      playfield: state.course.playfield,
      startRect: state.course.startRect,
      finishRect: state.course.finishRect,
      pathRects: state.course.pathRects,
      wallRects: state.course.wallRects
    },
    null,
    2
  );
}

function rebuildPassableGrid(payload) {
  if (payload.passableGrid) {
    return payload.passableGrid;
  }

  const grid = createMatrix(payload.gridSize ?? GRID_SIZE, payload.gridSize ?? GRID_SIZE, false);
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

function createRacers(count) {
  const start = state.course.startRect;
  return Array.from({ length: count }, (_, index) => {
    const palette = RACER_PALETTE[index];
    const size = clamp(state.course.cellSize * 0.52, 10, 18);
    const laneHeight = start.height / count;
    const angle = (Math.random() - 0.5) * 0.24;
    const speed = clamp(state.course.cellSize * 4.5, 90, 170);
    return {
      id: index + 1,
      label: `SQ-${String(index + 1).padStart(2, "0")}`,
      color: palette.color,
      wave: palette.wave,
      frequency: palette.frequency,
      x: start.x + 6 + (index % 2) * 8,
      y: start.y + laneHeight * index + laneHeight * 0.5 - size * 0.5,
      size,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lastSafeX: start.x + 6 + (index % 2) * 8,
      lastSafeY: start.y + laneHeight * index + laneHeight * 0.5 - size * 0.5,
      finished: false,
      finishTime: 0,
      trail: [],
      nextSoundAt: 0
    };
  });
}

function resetRace(autostart = false) {
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = autostart;
  state.paused = false;
  state.elapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  state.nextAutoRaceAt = 0;
  raceTimer.textContent = "0.0s";
  pauseButton.textContent = "一時停止";
  updateStatus(autostart ? "進行中" : "待機中");
  renderPodium();
  draw();
}

function generateCourse(seedValue = seedInput.value) {
  state.course = buildCourse(courseStyleSelect.value, seedValue);
  seedInput.value = String(state.course.seed);
  updateCourseMeta();
  syncCourseJson();
  resetRace(false);
}

function startRace() {
  ensureAudioReady();
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = true;
  state.paused = false;
  state.elapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  state.nextAutoRaceAt = 0;
  state.raceIndex += 1;
  pauseButton.textContent = "一時停止";
  updateStatus("進行中");
  renderPodium();
}

function finishRace(reason = "全員ゴール") {
  state.running = false;
  state.paused = false;
  state.nextAutoRaceAt = autoCycleInput.checked ? performance.now() + 1800 : 0;
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
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
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
  } else {
    racer.y = racer.vy > 0 ? wall.y - racer.size : wall.y + wall.height;
    const impactSpeed = Math.abs(racer.vy);
    racer.vy *= -restitution;
    playCollisionTone(racer, impactSpeed);
  }
}

function handleRacerCollisions() {
  for (let pass = 0; pass < 3; pass += 1) {
    for (let index = 0; index < state.racers.length; index += 1) {
      const racerA = state.racers[index];
      if (racerA.finished) {
        continue;
      }

      for (let inner = index + 1; inner < state.racers.length; inner += 1) {
        const racerB = state.racers[inner];
        if (racerB.finished) {
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
        const overlap = minDistance - distance + 0.6;
        racerA.x -= nx * overlap * 0.5;
        racerA.y -= ny * overlap * 0.5;
        racerB.x += nx * overlap * 0.5;
        racerB.y += ny * overlap * 0.5;

        const relativeVelocityX = racerA.vx - racerB.vx;
        const relativeVelocityY = racerA.vy - racerB.vy;
        const speedAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
        const impulse = speedAlongNormal < 0 ? (-1.08 * speedAlongNormal) / 2 : 6;

        racerA.vx += impulse * nx;
        racerA.vy += impulse * ny;
        racerB.vx -= impulse * nx;
        racerB.vy -= impulse * ny;
      }
    }
  }
}

function updateRace(deltaSeconds) {
  const dt = deltaSeconds * Number(simSpeedInput.value);
  const play = state.course.playfield;
  const maxTime = state.course.timeLimit;
  state.elapsed += dt;
  raceTimer.textContent = formatTime(state.elapsed);

  for (const racer of state.racers) {
    if (racer.finished) {
      continue;
    }

    racer.lastSafeX = racer.x;
    racer.lastSafeY = racer.y;

    racer.x += racer.vx * dt;
    for (const wall of state.course.wallRects) {
      bounceOnAxis(racer, wall, "x");
    }

    racer.y += racer.vy * dt;
    for (const wall of state.course.wallRects) {
      bounceOnAxis(racer, wall, "y");
    }

    racer.x = clamp(racer.x, play.left, play.right - racer.size);
    racer.y = clamp(racer.y, play.top, play.bottom - racer.size);

    if (!isRacerOnCourse(state.course, racer)) {
      recoverRacerToCourse(racer);
    } else {
      racer.lastSafeX = racer.x;
      racer.lastSafeY = racer.y;
    }

    racer.trail.push({ x: racer.x + racer.size * 0.5, y: racer.y + racer.size * 0.5 });
    if (racer.trail.length > 16) {
      racer.trail.shift();
    }

    if (intersectsRect(racer, state.course.finishRect)) {
      racer.finished = true;
      racer.finishTime = state.elapsed;
      state.finishedOrder.push(racer);
      renderPodium();
    }
  }

  handleRacerCollisions();

  if (state.finishedOrder.length === state.racers.length && state.racers.length > 0) {
    finishRace("全員ゴール");
  } else if (state.elapsed >= maxTime) {
    finishRace("タイムアップ");
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

function drawStartAndGoal() {
  const start = state.course.startRect;
  const finish = state.course.finishRect;

  context.fillStyle = COLORS.start;
  context.fillRect(start.x, start.y, start.width, start.height);
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 2;
  context.strokeRect(start.x, start.y, start.width, start.height);

  context.fillStyle = COLORS.finishLight;
  context.fillRect(finish.x, finish.y, finish.width, finish.height);
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 2;
  context.strokeRect(finish.x, finish.y, finish.width, finish.height);

  const checker = 3;
  const size = finish.width / checker;
  for (let row = 0; row < checker; row += 1) {
    for (let col = 0; col < checker; col += 1) {
      context.fillStyle = (row + col) % 2 === 0 ? COLORS.finishDark : COLORS.finishLight;
      context.fillRect(finish.x + col * size, finish.y + row * size, size, size);
    }
  }
}

function drawTrack() {
  drawBackground();
  drawCells(state.course.wallRects, COLORS.wall);
  drawCells(state.course.pathRects, COLORS.path);

  drawStartAndGoal();
}

function drawRacers() {
  for (const racer of state.racers) {
    if (racer.trail.length > 1) {
      context.strokeStyle = `${racer.color}4a`;
      context.lineWidth = 2.5;
      context.beginPath();
      racer.trail.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    }

    context.save();
    context.translate(racer.x + racer.size * 0.5, racer.y + racer.size * 0.5);
    context.rotate(Math.atan2(racer.vy, racer.vx));
    context.fillStyle = racer.color;
    context.fillRect(-racer.size * 0.5, -racer.size * 0.5, racer.size, racer.size);
    context.restore();
  }
}

function drawOverlay() {
  drawRoundedRect(22, 18, canvas.width - 44, 84, 18, COLORS.chip);
  drawRoundedRect(22, canvas.height - 82, canvas.width - 44, 60, 18, COLORS.chip);

  context.fillStyle = COLORS.ink;
  context.font = 'bold 26px "Space Grotesk"';
  context.fillText(state.course.title, 40, 50);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.muted;
  context.fillText(
    `${state.course.resolvedStyle} / seed ${state.course.seed} / target ${state.course.targetLength} / built ${state.course.actualLength}`,
    40,
    74
  );
  context.fillText(`${state.preset.label} / limit ${state.course.timeLimit}s`, 40, 92);

  context.fillStyle = COLORS.ink;
  context.font = 'bold 22px "Space Grotesk"';
  context.fillText(formatTime(state.elapsed), canvas.width - 112, 52);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.muted;
  context.fillText(`${state.racers.length} racers`, canvas.width - 112, 76);
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

function draw() {
  if (!state.course) {
    return;
  }

  drawTrack();
  drawRacers();
  drawOverlay();
}

function maybeAutoAdvance(timestamp) {
  if (!state.nextAutoRaceAt || timestamp < state.nextAutoRaceAt) {
    return;
  }

  seedInput.value = String(randomSeed());
  generateCourse(seedInput.value);
  startRace();
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
    maybeAutoAdvance(timestamp);
  }

  draw();
  requestAnimationFrame(loop);
}

function downloadBlob(blob, extension) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `shikaku-race-${Date.now()}.${extension}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stopRecording() {
  if (!recorderState.mediaRecorder || recorderState.mediaRecorder.state !== "recording") {
    return;
  }
  recorderState.mediaRecorder.stop();
}

function startRecording() {
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
    downloadBlob(blob, profile.extension);
    recorderState.stream?.getTracks().forEach((track) => track.stop());
    recorderState.stream = null;
    recorderState.mediaRecorder = null;
    recordStatus.textContent = "停止中";
  };

  mediaRecorder.start();
  recordStatus.textContent = "録画中";
  recordFormat.textContent = profile.label;

  if (!state.running) {
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
  widthVarianceValue.textContent = `${widthVarianceInput.value}%`;

  state.course = {
    title: "SHIKAKU RACE",
    requestedStyle: payload.requestedStyle ?? payload.resolvedStyle ?? "manual",
    resolvedStyle: payload.resolvedStyle ?? payload.requestedStyle ?? "manual",
    seed: Number(payload.seed ?? seedInput.value),
    gridSize: payload.gridSize ?? GRID_SIZE,
    targetLength: Number(payload.targetLength ?? pathLengthInput.value),
    actualLength: Number(payload.actualLength ?? pathLengthInput.value),
    timeLimit: Number(payload.timeLimit ?? Math.ceil((Number(payload.actualLength ?? pathLengthInput.value) / 4.5) * 3.2)),
    widthVariance: Number(payload.widthVariance ?? widthVarianceInput.value),
    cellSize: payload.cellSize,
    passableGrid: rebuildPassableGrid(payload),
    playfield: payload.playfield,
    startRect: payload.startRect,
    finishRect: payload.finishRect,
    pathRects: payload.pathRects ?? [],
    wallRects: payload.wallRects ?? []
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
outputPresetSelect.value = OUTPUT_PRESETS[0].id;
courseStyleSelect.value = "variety";
recordFormat.textContent = getRecordingProfile()?.label ?? "未対応";
setCanvasPreset(outputPresetSelect.value);
generateCourse(seedInput.value);

racerCountInput.addEventListener("input", () => {
  racerCountValue.textContent = racerCountInput.value;
  resetRace(false);
});

simSpeedInput.addEventListener("input", () => {
  simSpeedValue.textContent = `${Number(simSpeedInput.value).toFixed(1)}x`;
});

pathLengthInput.addEventListener("input", () => {
  pathLengthValue.textContent = pathLengthInput.value;
});

widthVarianceInput.addEventListener("input", () => {
  widthVarianceValue.textContent = `${widthVarianceInput.value}%`;
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
  const style = COURSE_STYLES[randomInt(Math.random, 0, COURSE_STYLES.length - 1)];
  courseStyleSelect.value = style.id;
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

requestAnimationFrame(loop);
