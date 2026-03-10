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
    horizontal: [2, 4],
    vertical: [3, 7],
    widthBase: 2,
    widthMax: 4,
    alternate: true
  },
  ladder: {
    horizontal: [1, 3],
    vertical: [5, 9],
    widthBase: 2,
    widthMax: 3,
    alternate: true
  },
  canyon: {
    horizontal: [3, 5],
    vertical: [2, 5],
    widthBase: 3,
    widthMax: 5,
    alternate: false
  },
  zigzag: {
    horizontal: [1, 2],
    vertical: [2, 6],
    widthBase: 1,
    widthMax: 3,
    alternate: true
  }
};

const COLORS = {
  page: "#f6efe3",
  stage: "#c4bda9",
  blocked: "#ece8de",
  blockedStroke: "#9e9889",
  path: "#5967ff",
  start: "#2fc38e",
  finishLight: "#ffffff",
  finishDark: "#121212",
  ink: "#24211c",
  softInk: "#706a5e",
  accent: "#ff7a45",
  overlay: "rgba(255, 250, 243, 0.94)"
};

const RACER_PALETTE = [
  { color: "#ff7a45", frequency: 220, wave: "sine" },
  { color: "#2fc38e", frequency: 247, wave: "triangle" },
  { color: "#5d78ff", frequency: 262, wave: "square" },
  { color: "#ffd166", frequency: 294, wave: "sawtooth" },
  { color: "#d46bff", frequency: 330, wave: "triangle" },
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
  const topInset = portrait ? 136 : 90;
  const bottomInset = portrait ? 106 : 82;
  const sideInset = 38;
  const size = Math.min(canvas.width - sideInset * 2, canvas.height - topInset - bottomInset);
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
  const rows = grid.length;
  const cols = grid[0].length;
  const minX = clamp(x, 0, cols - 1);
  const minY = clamp(y, 0, rows - 1);
  const maxX = clamp(x + width - 1, 0, cols - 1);
  const maxY = clamp(y + height - 1, 0, rows - 1);

  for (let row = minY; row <= maxY; row += 1) {
    for (let col = minX; col <= maxX; col += 1) {
      grid[row][col] = true;
    }
  }
}

function chooseResolvedStyle(styleId, randomFn) {
  if (styleId !== "variety") {
    return styleId;
  }
  return STYLE_IDS[randomInt(randomFn, 0, STYLE_IDS.length - 1)];
}

function nextWidth(currentWidth, profile, varianceRate, randomFn) {
  const chance = varianceRate / 100;
  if (randomFn() > chance) {
    return currentWidth;
  }

  const delta = randomFn() > 0.5 ? 1 : -1;
  const next = clamp(currentWidth + delta, 1, profile.widthMax);
  if (next === currentWidth) {
    return clamp(currentWidth + 1, 1, profile.widthMax);
  }
  return next;
}

function carveHorizontal(grid, fromX, toX, centerY, width) {
  const left = Math.min(fromX, toX);
  const right = Math.max(fromX, toX);
  const top = clamp(centerY - Math.floor(width / 2), INNER_MARGIN, GRID_SIZE - INNER_MARGIN - width);
  carveRect(grid, left, top, right - left + 1, width);
}

function carveVertical(grid, centerX, fromY, toY, width) {
  const top = Math.min(fromY, toY);
  const bottom = Math.max(fromY, toY);
  const left = clamp(centerX - Math.floor(width / 2), INNER_MARGIN, GRID_SIZE - INNER_MARGIN - width);
  carveRect(grid, left, top, width, bottom - top + 1);
}

function buildCourse(styleId, seedValue) {
  const play = getPlayfield();
  const seed = Number(seedValue) || 1;
  const randomFn = mulberry32(seed);
  const resolvedStyle = chooseResolvedStyle(styleId, randomFn);
  const profile = STYLE_PROFILES[resolvedStyle];
  const targetLength = Number(pathLengthInput.value);
  const varianceRate = Number(widthVarianceInput.value);
  const grid = createMatrix(GRID_SIZE, GRID_SIZE, false);
  const startTop = randomInt(randomFn, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
  const goalTopBase = randomInt(randomFn, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
  const startCenterY = startTop + 1;
  const goalTop = clamp(goalTopBase, INNER_MARGIN, GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN);
  const goalCenterY = goalTop + 1;
  const startLeft = INNER_MARGIN;
  const goalLeft = GRID_SIZE - START_GOAL_SIZE - INNER_MARGIN;
  const goalCenterX = goalLeft;
  const gridCellSize = Math.floor(play.width / GRID_SIZE);
  const offsetX = Math.floor(play.left + (play.width - gridCellSize * GRID_SIZE) * 0.5);
  const offsetY = Math.floor(play.top + (play.height - gridCellSize * GRID_SIZE) * 0.5);

  carveRect(grid, startLeft, startTop, START_GOAL_SIZE, START_GOAL_SIZE);
  carveRect(grid, goalLeft, goalTop, START_GOAL_SIZE, START_GOAL_SIZE);

  let currentX = startLeft + START_GOAL_SIZE - 1;
  let currentY = startCenterY;
  let currentWidth = profile.widthBase;
  let currentLength = 0;
  let direction = randomFn() > 0.5 ? 1 : -1;

  while (currentX < goalCenterX - 1) {
    const remainingToGoal = (goalCenterX - currentX) + Math.abs(goalCenterY - currentY);
    const extraBudget = targetLength - currentLength - remainingToGoal;

    if (extraBudget > 2) {
      if (profile.alternate) {
        direction *= -1;
      } else if (randomFn() > 0.58) {
        direction *= -1;
      }

      let room = direction > 0 ? GRID_SIZE - INNER_MARGIN - 1 - currentY : currentY - INNER_MARGIN;
      if (room <= 0) {
        direction *= -1;
        room = direction > 0 ? GRID_SIZE - INNER_MARGIN - 1 - currentY : currentY - INNER_MARGIN;
      }

      if (room > 0) {
        const verticalStep = Math.min(
          randomInt(randomFn, profile.vertical[0], profile.vertical[1]),
          room,
          Math.max(2, extraBudget - 1)
        );
        currentWidth = nextWidth(currentWidth, profile, varianceRate, randomFn);
        const nextY = currentY + verticalStep * direction;
        carveVertical(grid, currentX, currentY, nextY, currentWidth);
        currentLength += Math.abs(nextY - currentY);
        currentY = nextY;
      }
    }

    const remainingX = goalCenterX - currentX;
    if (remainingX <= 0) {
      break;
    }
    const horizontalStep = Math.min(randomInt(randomFn, profile.horizontal[0], profile.horizontal[1]), remainingX);
    currentWidth = nextWidth(currentWidth, profile, varianceRate, randomFn);
    carveHorizontal(grid, currentX, currentX + horizontalStep, currentY, currentWidth);
    currentX += horizontalStep;
    currentLength += horizontalStep;
  }

  if (currentY !== goalCenterY) {
    currentWidth = nextWidth(currentWidth, profile, varianceRate, randomFn);
    carveVertical(grid, currentX, currentY, goalCenterY, currentWidth);
    currentLength += Math.abs(goalCenterY - currentY);
    currentY = goalCenterY;
  }

  if (currentX < goalCenterX) {
    currentWidth = nextWidth(currentWidth, profile, varianceRate, randomFn);
    carveHorizontal(grid, currentX, goalCenterX, currentY, currentWidth);
    currentLength += goalCenterX - currentX;
  }

  const walls = [];
  const pathRects = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const rect = {
        x: offsetX + col * gridCellSize,
        y: offsetY + row * gridCellSize,
        width: gridCellSize,
        height: gridCellSize
      };
      if (grid[row][col]) {
        pathRects.push(rect);
      } else {
        walls.push(rect);
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
    actualLength: currentLength,
    widthVariance: varianceRate,
    cellSize: gridCellSize,
    playfield: {
      left: offsetX,
      top: offsetY,
      right: offsetX + gridCellSize * GRID_SIZE,
      bottom: offsetY + gridCellSize * GRID_SIZE,
      width: gridCellSize * GRID_SIZE,
      height: gridCellSize * GRID_SIZE
    },
    startRect: {
      x: offsetX + startLeft * gridCellSize,
      y: offsetY + startTop * gridCellSize,
      width: START_GOAL_SIZE * gridCellSize,
      height: START_GOAL_SIZE * gridCellSize
    },
    finishRect: {
      x: offsetX + goalLeft * gridCellSize,
      y: offsetY + goalTop * gridCellSize,
      width: START_GOAL_SIZE * gridCellSize,
      height: START_GOAL_SIZE * gridCellSize
    },
    pathRects,
    walls
  };
}

function updateCourseMeta() {
  if (!state.course) {
    return;
  }
  courseMeta.textContent = `${state.course.resolvedStyle} / seed ${state.course.seed} / len ${state.course.actualLength}`;
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
      widthVariance: state.course.widthVariance,
      cellSize: state.course.cellSize,
      playfield: state.course.playfield,
      startRect: state.course.startRect,
      finishRect: state.course.finishRect,
      pathRects: state.course.pathRects,
      walls: state.course.walls
    },
    null,
    2
  );
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
    const speed = clamp(state.course.cellSize * 4.6, 90, 170);
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
      const dx = bx - ax;
      const dy = by - ay;
      const distance = Math.hypot(dx, dy);
      const minDistance = (racerA.size + racerB.size) * 0.5;

      if (distance === 0 || distance >= minDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      racerA.x -= nx * overlap * 0.5;
      racerA.y -= ny * overlap * 0.5;
      racerB.x += nx * overlap * 0.5;
      racerB.y += ny * overlap * 0.5;

      const relativeVelocityX = racerA.vx - racerB.vx;
      const relativeVelocityY = racerA.vy - racerB.vy;
      const speedAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
      if (speedAlongNormal > 0) {
        continue;
      }

      const impulse = (-1.04 * speedAlongNormal) / 2;
      racerA.vx += impulse * nx;
      racerA.vy += impulse * ny;
      racerB.vx -= impulse * nx;
      racerB.vy -= impulse * ny;
    }
  }
}

function updateRace(deltaSeconds) {
  const dt = deltaSeconds * Number(simSpeedInput.value);
  const play = state.course.playfield;
  const maxTime = 28;
  state.elapsed += dt;
  raceTimer.textContent = formatTime(state.elapsed);

  for (const racer of state.racers) {
    if (racer.finished) {
      continue;
    }

    racer.x += racer.vx * dt;
    for (const wall of state.course.walls) {
      bounceOnAxis(racer, wall, "x");
    }

    racer.y += racer.vy * dt;
    for (const wall of state.course.walls) {
      bounceOnAxis(racer, wall, "y");
    }

    racer.x = clamp(racer.x, play.left, play.right - racer.size);
    racer.y = clamp(racer.y, play.top, play.bottom - racer.size);

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

function drawCells(rects, fill, stroke) {
  rects.forEach((rect) => {
    context.fillStyle = fill;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = 1;
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  });
}

function drawBackground() {
  context.fillStyle = COLORS.page;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = COLORS.stage;
  context.fillRect(
    state.course.playfield.left - 12,
    state.course.playfield.top - 12,
    state.course.playfield.width + 24,
    state.course.playfield.height + 24
  );
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
  drawCells(state.course.walls, COLORS.blocked, COLORS.blockedStroke);
  drawCells(state.course.pathRects, COLORS.path, null);
  drawStartAndGoal();
}

function drawRacers() {
  for (const racer of state.racers) {
    if (racer.trail.length > 1) {
      context.strokeStyle = `${racer.color}55`;
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
  const topHeight = canvas.height > canvas.width ? 104 : 84;
  const footerHeight = canvas.height > canvas.width ? 88 : 72;
  const rankingWidth = 178;

  context.fillStyle = COLORS.overlay;
  context.fillRect(24, 20, canvas.width - 48, topHeight);
  context.fillRect(24, canvas.height - footerHeight - 20, canvas.width - 48, footerHeight);
  context.fillRect(canvas.width - rankingWidth - 24, 136, rankingWidth, 152);

  context.fillStyle = COLORS.ink;
  context.font = 'bold 26px "Space Grotesk"';
  context.fillText(state.course.title, 38, 56);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.softInk;
  context.fillText(
    `${state.course.resolvedStyle} / seed ${state.course.seed} / len ${state.course.actualLength}`,
    38,
    80
  );
  context.fillText(
    `variance ${state.course.widthVariance}% / ${state.preset.label}`,
    38,
    100
  );

  context.fillStyle = COLORS.ink;
  context.font = 'bold 22px "Space Grotesk"';
  context.fillText(formatTime(state.elapsed), canvas.width - 122, 58);
  context.font = '14px "IBM Plex Sans JP"';
  context.fillStyle = COLORS.softInk;
  context.fillText(`Race ${state.raceIndex}`, canvas.width - 122, 82);
  context.fillText(`${state.racers.length} racers`, canvas.width - 122, 102);

  context.fillStyle = COLORS.ink;
  context.font = 'bold 16px "Space Grotesk"';
  context.fillText("LIVE", canvas.width - rankingWidth, 158);

  const liveOrder = [...state.finishedOrder];
  state.racers
    .filter((racer) => !racer.finished)
    .sort((a, b) => b.x - a.x)
    .forEach((racer) => liveOrder.push(racer));

  liveOrder.slice(0, 4).forEach((racer, index) => {
    const y = 186 + index * 28;
    context.fillStyle = racer.color;
    context.fillRect(canvas.width - rankingWidth, y - 12, 12, 12);
    context.fillStyle = COLORS.ink;
    context.font = '14px "IBM Plex Sans JP"';
    context.fillText(`${index + 1}. ${racer.label}`, canvas.width - rankingWidth + 18, y);
  });

  context.fillStyle = COLORS.ink;
  context.font = '14px "IBM Plex Sans JP"';
  context.fillText(`${recordStatus.textContent} / ${recordFormat.textContent}`, 38, canvas.height - 52);
  context.fillText(
    `${state.running ? raceStatus.textContent : "READY"} / speed ${Number(simSpeedInput.value).toFixed(1)}x`,
    38,
    canvas.height - 32
  );

  if (recorderState.mediaRecorder?.state === "recording") {
    context.fillStyle = COLORS.accent;
    context.beginPath();
    context.arc(canvas.width - 70, canvas.height - 46, 7, 0, Math.PI * 2);
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
    seed: Number(payload.seed) || randomSeed(),
    gridSize: payload.gridSize ?? GRID_SIZE,
    targetLength: Number(payload.targetLength ?? pathLengthInput.value),
    actualLength: Number(payload.actualLength ?? pathLengthInput.value),
    widthVariance: Number(payload.widthVariance ?? widthVarianceInput.value),
    cellSize: payload.cellSize,
    playfield: payload.playfield,
    startRect: payload.startRect,
    finishRect: payload.finishRect,
    pathRects: payload.pathRects ?? [],
    walls: payload.walls ?? []
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
