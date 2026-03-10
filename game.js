const canvas = document.getElementById("arena");
const context = canvas.getContext("2d");

const outputPresetSelect = document.getElementById("outputPreset");
const courseStyleSelect = document.getElementById("courseStyle");
const racerCountInput = document.getElementById("racerCount");
const racerCountValue = document.getElementById("racerCountValue");
const simSpeedInput = document.getElementById("simSpeed");
const simSpeedValue = document.getElementById("simSpeedValue");
const autoCycleInput = document.getElementById("autoCycle");
const obstacleCountInput = document.getElementById("obstacleCount");
const obstacleCountValue = document.getElementById("obstacleCountValue");
const seedInput = document.getElementById("seedInput");
const randomSeedButton = document.getElementById("randomSeedButton");
const generateCourseButton = document.getElementById("generateCourseButton");
const shuffleStyleButton = document.getElementById("shuffleStyleButton");
const editorModeInput = document.getElementById("editorMode");
const bumperOrientationSelect = document.getElementById("bumperOrientation");
const bumperLengthInput = document.getElementById("bumperLength");
const bumperLengthValue = document.getElementById("bumperLengthValue");
const undoBumperButton = document.getElementById("undoBumperButton");
const clearBumpersButton = document.getElementById("clearBumpersButton");
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

const OUTPUT_PRESETS = [
  {
    id: "shorts",
    label: "YouTube Shorts / Reels 1080 x 1920",
    width: 1080,
    height: 1920,
    stageLabel: "9:16"
  },
  {
    id: "landscape",
    label: "YouTube Landscape 1920 x 1080",
    width: 1920,
    height: 1080,
    stageLabel: "16:9"
  },
  {
    id: "square",
    label: "Instagram Square 1080 x 1080",
    width: 1080,
    height: 1080,
    stageLabel: "1:1"
  }
];

const COURSE_STYLES = [
  { id: "variety", label: "Variety Mix" },
  { id: "switchback", label: "Switchback" },
  { id: "mirror", label: "Mirror Bounce" },
  { id: "pinball", label: "Pinball Cluster" },
  { id: "gates", label: "Gate Runner" },
  { id: "wave", label: "Wave Drift" }
];

const RESOLVED_STYLE_IDS = COURSE_STYLES.filter((style) => style.id !== "variety").map(
  (style) => style.id
);

const RACER_PALETTE = [
  { color: "#ff6b6b", frequency: 220, wave: "sine" },
  { color: "#ffd166", frequency: 247, wave: "triangle" },
  { color: "#06d6a0", frequency: 262, wave: "square" },
  { color: "#4cc9f0", frequency: 294, wave: "sawtooth" },
  { color: "#f72585", frequency: 330, wave: "triangle" },
  { color: "#fb8500", frequency: 392, wave: "square" }
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
  customWalls: [],
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

function randomBetween(randomFn, min, max) {
  return randomFn() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function getScale() {
  return Math.min(canvas.width / 1080, canvas.height / 1080);
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
      mimeType: "video/webm;codecs=vp8,opus",
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
  const level = clamp(impactSpeed / 420, 0.06, 0.2);

  primary.type = racer.wave;
  overtone.type = "sine";
  primary.frequency.setValueAtTime(racer.frequency, now);
  overtone.frequency.setValueAtTime(racer.frequency * 1.498, now);

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

function randomSeed() {
  return Math.floor(Math.random() * 999999);
}

function getPlayfield(width, height) {
  const portrait = height > width;
  const topInset = portrait ? height * 0.12 : height * 0.11;
  const bottomInset = portrait ? height * 0.1 : height * 0.1;
  const sideInset = width * 0.055;
  return {
    left: sideInset,
    right: width - sideInset,
    top: topInset,
    bottom: height - bottomInset,
    width: width - sideInset * 2,
    height: height - topInset - bottomInset
  };
}

function buildCourse(styleId, seedValue) {
  const seed = Number(seedValue) || 1;
  const randomFn = mulberry32(seed);
  const chosenStyle =
    styleId === "variety"
      ? RESOLVED_STYLE_IDS[Math.floor(randomFn() * RESOLVED_STYLE_IDS.length)]
      : styleId;
  const play = getPlayfield(canvas.width, canvas.height);
  const scale = getScale();
  const thickness = clamp(18 * scale, 14, 26);
  const obstacleCount = Number(obstacleCountInput.value);
  const finishHeight = randomBetween(randomFn, play.height * 0.18, play.height * 0.27);
  const finishY = randomBetween(randomFn, play.top + 80 * scale, play.bottom - finishHeight - 80 * scale);
  const gateWidth = 28 * scale;
  const walls = [];

  function addWall(x, y, width, height) {
    walls.push({
      x: clamp(x, play.left - 24 * scale, play.right - width - 12 * scale),
      y: clamp(y, play.top, play.bottom - height),
      width,
      height
    });
  }

  function addHorizontal(x, y, width) {
    addWall(x, y, clamp(width, 80 * scale, play.width * 0.42), thickness);
  }

  function addVertical(x, y, height) {
    addWall(x, y, thickness, clamp(height, 80 * scale, play.height * 0.46));
  }

  walls.push({ x: play.left, y: play.top - thickness, width: play.width + gateWidth, height: thickness });
  walls.push({ x: play.left, y: play.bottom, width: play.width + gateWidth, height: thickness });
  walls.push({ x: play.left - thickness, y: play.top, width: thickness, height: play.height });
  walls.push({ x: play.right, y: play.top, width: gateWidth, height: finishY - play.top });
  walls.push({
    x: play.right,
    y: finishY + finishHeight,
    width: gateWidth,
    height: play.bottom - (finishY + finishHeight)
  });

  if (chosenStyle === "switchback") {
    for (let index = 0; index < obstacleCount; index += 1) {
      const progress = index / Math.max(obstacleCount - 1, 1);
      const width = randomBetween(randomFn, play.width * 0.16, play.width * 0.3);
      const x = play.left + play.width * (0.08 + progress * 0.68);
      const y =
        index % 2 === 0
          ? randomBetween(randomFn, play.top + 100 * scale, play.top + play.height * 0.34)
          : randomBetween(randomFn, play.top + play.height * 0.64, play.bottom - 90 * scale);
      addHorizontal(x, y, width);
    }
  }

  if (chosenStyle === "mirror") {
    for (let index = 0; index < obstacleCount; index += 1) {
      const x = play.left + play.width * (0.08 + (index / Math.max(obstacleCount, 1)) * 0.72);
      const width = randomBetween(randomFn, play.width * 0.14, play.width * 0.24);
      const y = randomBetween(randomFn, play.top + 120 * scale, play.top + play.height * 0.28);
      addHorizontal(x, y, width);
      addHorizontal(x + randomBetween(randomFn, -40 * scale, 40 * scale), play.bottom - (y - play.top) - thickness, width);
    }
  }

  if (chosenStyle === "pinball") {
    for (let index = 0; index < obstacleCount; index += 1) {
      const orientation = randomFn() > 0.42 ? "horizontal" : "vertical";
      const x = randomBetween(randomFn, play.left + 120 * scale, play.right - 240 * scale);
      const y = randomBetween(randomFn, play.top + 90 * scale, play.bottom - 180 * scale);
      if (orientation === "horizontal") {
        addHorizontal(x, y, randomBetween(randomFn, play.width * 0.1, play.width * 0.22));
      } else {
        addVertical(x, y, randomBetween(randomFn, play.height * 0.12, play.height * 0.26));
      }
    }
  }

  if (chosenStyle === "gates") {
    for (let index = 0; index < obstacleCount; index += 1) {
      const progress = index / Math.max(obstacleCount - 1, 1);
      const x = play.left + play.width * (0.12 + progress * 0.68);
      const openingCenter = play.top + play.height * (0.28 + randomFn() * 0.44);
      const openingSize = randomBetween(randomFn, play.height * 0.18, play.height * 0.28);
      addVertical(x, play.top + 40 * scale, openingCenter - play.top - openingSize * 0.5);
      addVertical(
        x,
        openingCenter + openingSize * 0.5,
        play.bottom - openingCenter - openingSize * 0.5 - 36 * scale
      );
    }
  }

  if (chosenStyle === "wave") {
    const phase = randomBetween(randomFn, 0, Math.PI * 2);
    for (let index = 0; index < obstacleCount; index += 1) {
      const progress = index / Math.max(obstacleCount - 1, 1);
      const x = play.left + play.width * (0.08 + progress * 0.72);
      const center = play.top + play.height * 0.5;
      const amplitude = play.height * 0.24;
      const y = center + Math.sin(progress * Math.PI * 2.4 + phase) * amplitude;
      addHorizontal(x, y, randomBetween(randomFn, play.width * 0.12, play.width * 0.22));
    }
  }

  return {
    title: "SHIKAKU RACE",
    requestedStyle: styleId,
    resolvedStyle: chosenStyle,
    seed,
    playfield: play,
    finish: {
      x: play.right - 12 * scale,
      y: finishY,
      width: gateWidth + 12 * scale,
      height: finishHeight
    },
    baseWalls: walls,
    walls: walls.slice(),
    manual: false
  };
}

function refreshCourseWalls() {
  if (!state.course) {
    return;
  }
  state.course.walls = [...state.course.baseWalls, ...state.customWalls];
}

function updateCourseMeta() {
  if (!state.course) {
    return;
  }
  const presetLabel = `${state.preset.stageLabel} / ${canvas.width} x ${canvas.height}`;
  courseMeta.textContent = `${state.course.resolvedStyle} / seed ${state.course.seed} / ${presetLabel}`;
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
      playfield: state.course.playfield,
      finish: state.course.finish,
      walls: state.course.walls
    },
    null,
    2
  );
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

function updateStatus(text) {
  raceStatus.textContent = text;
}

function createRacers(count) {
  const play = state.course.playfield;
  const scale = getScale();
  const slotHeight = (play.height - 160 * scale) / count;

  return Array.from({ length: count }, (_, index) => {
    const palette = RACER_PALETTE[index];
    const size = clamp(24 * scale, 18, 28);
    const centerY = play.top + 90 * scale + slotHeight * index + slotHeight * 0.5;
    const speed = randomBetween(Math.random, 280 * scale, 340 * scale);
    const angle = randomBetween(Math.random, -0.24, 0.24);
    return {
      id: index + 1,
      label: `SQ-${String(index + 1).padStart(2, "0")}`,
      color: palette.color,
      wave: palette.wave,
      frequency: palette.frequency,
      x: play.left + 58 * scale + (index % 2) * 24 * scale,
      y: clamp(centerY - size * 0.5, play.top + 30 * scale, play.bottom - size - 30 * scale),
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
  state.customWalls = [];
  state.course = buildCourse(courseStyleSelect.value, seedValue);
  seedInput.value = String(state.course.seed);
  refreshCourseWalls();
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
    if (racer.vx > 0) {
      racer.x = wall.x - racer.size;
    } else {
      racer.x = wall.x + wall.width;
    }
    const impactSpeed = Math.abs(racer.vx);
    racer.vx *= -restitution;
    playCollisionTone(racer, impactSpeed);
  } else {
    if (racer.vy > 0) {
      racer.y = wall.y - racer.size;
    } else {
      racer.y = wall.y + wall.height;
    }
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

      const impulse = (-1.05 * speedAlongNormal) / 2;
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

    racer.x = clamp(racer.x, play.left - racer.size, play.right + 10);
    racer.y = clamp(racer.y, play.top, play.bottom - racer.size);

    racer.trail.push({ x: racer.x + racer.size * 0.5, y: racer.y + racer.size * 0.5 });
    if (racer.trail.length > 18) {
      racer.trail.shift();
    }

    if (intersectsRect(racer, state.course.finish)) {
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
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#111827");
  gradient.addColorStop(0.55, "#0d1824");
  gradient.addColorStop(1, "#08111a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(canvas.width * 0.2, canvas.height * 0.08, 10, canvas.width * 0.2, canvas.height * 0.08, canvas.width * 0.45);
  glow.addColorStop(0, "rgba(255,140,66,0.24)");
  glow.addColorStop(1, "rgba(255,140,66,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTrack() {
  const play = state.course.playfield;
  const scale = getScale();
  drawBackground();

  context.fillStyle = "rgba(255,255,255,0.04)";
  context.fillRect(play.left, play.top, play.width, play.height);

  context.strokeStyle = "rgba(255,255,255,0.05)";
  context.lineWidth = 2;
  for (let x = play.left; x < play.right; x += 90 * scale) {
    context.beginPath();
    context.moveTo(x, play.top);
    context.lineTo(x, play.bottom);
    context.stroke();
  }
  for (let y = play.top; y < play.bottom; y += 90 * scale) {
    context.beginPath();
    context.moveTo(play.left, y);
    context.lineTo(play.right, y);
    context.stroke();
  }

  context.fillStyle = "rgba(82, 199, 255, 0.18)";
  context.fillRect(state.course.finish.x, state.course.finish.y, state.course.finish.width, state.course.finish.height);
  context.fillStyle = "rgba(82, 199, 255, 0.64)";
  for (let y = state.course.finish.y; y < state.course.finish.y + state.course.finish.height; y += 42 * scale) {
    context.fillRect(state.course.finish.x, y, state.course.finish.width, 20 * scale);
  }

  context.fillStyle = "#22384b";
  state.course.walls.forEach((wall) => {
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
  });
}

function drawRacers() {
  for (const racer of state.racers) {
    if (racer.trail.length > 1) {
      context.strokeStyle = `${racer.color}4d`;
      context.lineWidth = 4;
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

    if (!racer.finished) {
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.font = `${12 * getScale()}px "Space Grotesk"`;
      context.fillText(racer.id, racer.x + 6, racer.y - 8);
    }
  }
}

function drawOverlay() {
  const scale = getScale();
  const bannerHeight = canvas.height > canvas.width ? 150 * scale : 118 * scale;
  const footerHeight = canvas.height > canvas.width ? 124 * scale : 106 * scale;

  context.fillStyle = "rgba(5, 10, 17, 0.7)";
  context.fillRect(36 * scale, 32 * scale, canvas.width - 72 * scale, bannerHeight);
  context.fillRect(36 * scale, canvas.height - footerHeight - 32 * scale, canvas.width - 72 * scale, footerHeight);

  context.fillStyle = "#f8f3eb";
  context.font = `${44 * scale}px "Space Grotesk"`;
  context.fillText(state.course.title, 68 * scale, 88 * scale);
  context.font = `${20 * scale}px "IBM Plex Sans JP"`;
  context.fillStyle = "#d2bfa2";
  context.fillText(`Style ${state.course.resolvedStyle.toUpperCase()}  /  Seed ${state.course.seed}`, 68 * scale, 124 * scale);

  context.fillStyle = "#f8f3eb";
  context.font = `${38 * scale}px "Space Grotesk"`;
  context.fillText(formatTime(state.elapsed), canvas.width - 240 * scale, 88 * scale);
  context.font = `${18 * scale}px "IBM Plex Sans JP"`;
  context.fillStyle = "#d2bfa2";
  context.fillText(state.preset.label, canvas.width - 420 * scale, 124 * scale);

  const rankingX = canvas.width - 305 * scale;
  const rankingY = 180 * scale;
  const rankingWidth = 240 * scale;
  const rankingHeight = 178 * scale;
  context.fillStyle = "rgba(5,10,17,0.62)";
  context.fillRect(rankingX, rankingY, rankingWidth, rankingHeight);
  context.fillStyle = "#f8f3eb";
  context.font = `${20 * scale}px "Space Grotesk"`;
  context.fillText("LIVE ORDER", rankingX + 24 * scale, rankingY + 34 * scale);

  const liveOrder = [...state.finishedOrder];
  state.racers
    .filter((racer) => !racer.finished)
    .sort((a, b) => (b.x - a.x) - (b.vx - a.vx) * 0.2)
    .forEach((racer) => liveOrder.push(racer));

  liveOrder.slice(0, 4).forEach((racer, index) => {
    context.fillStyle = racer.color;
    context.fillRect(rankingX + 22 * scale, rankingY + 52 * scale + index * 28 * scale, 16 * scale, 16 * scale);
    context.fillStyle = "#f8f3eb";
    context.font = `${18 * scale}px "IBM Plex Sans JP"`;
    context.fillText(`${index + 1}. ${racer.label}`, rankingX + 50 * scale, rankingY + 66 * scale + index * 28 * scale);
  });

  context.fillStyle = "#f8f3eb";
  context.font = `${18 * scale}px "IBM Plex Sans JP"`;
  context.fillText(
    `Race ${state.raceIndex}  /  Racers ${state.racers.length}  /  Speed ${Number(simSpeedInput.value).toFixed(1)}x`,
    70 * scale,
    canvas.height - 86 * scale
  );
  context.fillStyle = "#d2bfa2";
  context.fillText(
    `${recordStatus.textContent}  /  ${recordFormat.textContent}  /  ${state.running ? raceStatus.textContent : "READY"}`,
    70 * scale,
    canvas.height - 52 * scale
  );

  if (recorderState.mediaRecorder?.state === "recording") {
    context.fillStyle = "#ff5d73";
    context.beginPath();
    context.arc(canvas.width - 84 * scale, canvas.height - 74 * scale, 10 * scale, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f8f3eb";
    context.font = `${18 * scale}px "Space Grotesk"`;
    context.fillText("REC", canvas.width - 60 * scale, canvas.height - 68 * scale);
  }

  if (editorModeInput.checked) {
    context.strokeStyle = "rgba(255, 212, 94, 0.8)";
    context.lineWidth = 3;
    context.setLineDash([12 * scale, 10 * scale]);
    const play = state.course.playfield;
    context.strokeRect(play.left, play.top, play.width, play.height);
    context.setLineDash([]);
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

  const nextSeed = randomSeed();
  seedInput.value = String(nextSeed);
  state.course = buildCourse(courseStyleSelect.value, nextSeed);
  state.customWalls = [];
  refreshCourseWalls();
  updateCourseMeta();
  syncCourseJson();
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

  const mediaRecorder = profile.mimeType
    ? new MediaRecorder(recorderState.stream, {
        mimeType: profile.mimeType,
        videoBitsPerSecond: 10_000_000
      })
    : new MediaRecorder(recorderState.stream);

  recorderState.mediaRecorder = mediaRecorder;
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recorderState.chunks.push(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    const blobType = profile.mimeType || "video/webm";
    const blob = new Blob(recorderState.chunks, { type: blobType });
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
    : state.preset.id;
  outputPresetSelect.value = presetId;
  setCanvasPreset(presetId);
  state.customWalls = [];

  state.course = {
    title: "SHIKAKU RACE",
    requestedStyle: payload.requestedStyle ?? payload.resolvedStyle ?? "manual",
    resolvedStyle: payload.resolvedStyle ?? payload.requestedStyle ?? "manual",
    seed: Number(payload.seed) || randomSeed(),
    playfield: payload.playfield ?? getPlayfield(canvas.width, canvas.height),
    finish: payload.finish,
    baseWalls: payload.walls ?? [],
    walls: payload.walls ?? [],
    manual: true
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

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function addCustomBumper(event) {
  if (!editorModeInput.checked || !state.course) {
    return;
  }

  const point = getCanvasPoint(event);
  const play = state.course.playfield;
  if (
    point.x < play.left ||
    point.x > play.right ||
    point.y < play.top ||
    point.y > play.bottom
  ) {
    return;
  }

  const scale = getScale();
  const length = Number(bumperLengthInput.value) * scale;
  const thickness = clamp(18 * scale, 14, 26);
  const orientation = bumperOrientationSelect.value;

  const wall =
    orientation === "horizontal"
      ? {
          x: clamp(point.x - length * 0.5, play.left + 30 * scale, play.right - length - 30 * scale),
          y: clamp(point.y - thickness * 0.5, play.top + 20 * scale, play.bottom - thickness - 20 * scale),
          width: length,
          height: thickness
        }
      : {
          x: clamp(point.x - thickness * 0.5, play.left + 30 * scale, play.right - thickness - 30 * scale),
          y: clamp(point.y - length * 0.5, play.top + 20 * scale, play.bottom - length - 20 * scale),
          width: thickness,
          height: length
        };

  state.customWalls.push(wall);
  refreshCourseWalls();
  syncCourseJson();
  resetRace(false);
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

obstacleCountInput.addEventListener("input", () => {
  obstacleCountValue.textContent = obstacleCountInput.value;
});

bumperLengthInput.addEventListener("input", () => {
  bumperLengthValue.textContent = bumperLengthInput.value;
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
  const randomStyle = COURSE_STYLES[Math.floor(Math.random() * COURSE_STYLES.length)];
  courseStyleSelect.value = randomStyle.id;
  seedInput.value = String(randomSeed());
  generateCourse(seedInput.value);
});

undoBumperButton.addEventListener("click", () => {
  state.customWalls.pop();
  refreshCourseWalls();
  syncCourseJson();
  resetRace(false);
});

clearBumpersButton.addEventListener("click", () => {
  state.customWalls = [];
  refreshCourseWalls();
  syncCourseJson();
  resetRace(false);
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
    const payload = JSON.parse(courseJson.value);
    applyLoadedCourse(payload);
  } catch (error) {
    updateStatus("JSONエラー");
  }
});

canvas.addEventListener("click", (event) => {
  addCustomBumper(event);
});

requestAnimationFrame(loop);
