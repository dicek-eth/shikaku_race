const canvas = document.getElementById("arena");
const context = canvas.getContext("2d");

const trackSelect = document.getElementById("trackSelect");
const racerCountInput = document.getElementById("racerCount");
const racerCountValue = document.getElementById("racerCountValue");
const simSpeedInput = document.getElementById("simSpeed");
const simSpeedValue = document.getElementById("simSpeedValue");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const raceStatus = document.getElementById("raceStatus");
const raceTimer = document.getElementById("raceTimer");
const raceCount = document.getElementById("raceCount");
const podiumList = document.getElementById("podium");

const TRACKS = [
  {
    id: "mirror-sprint",
    name: "Mirror Sprint",
    description: "上下反射が中心のストレート寄りコース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 310, y: 150, width: 210, height: 20 },
      { x: 540, y: 545, width: 230, height: 20 },
      { x: 785, y: 225, width: 190, height: 20 }
    ],
    finish: { x: 1128, y: 26, width: 48, height: 668 }
  },
  {
    id: "double-bounce",
    name: "Double Bounce",
    description: "二段の横壁で角度が変わるコース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 245, y: 500, width: 245, height: 20 },
      { x: 505, y: 120, width: 245, height: 20 },
      { x: 770, y: 505, width: 210, height: 20 }
    ],
    finish: { x: 1128, y: 26, width: 48, height: 668 }
  },
  {
    id: "zig-zag-lite",
    name: "Zig Zag Lite",
    description: "軽い跳ね返りを何度か挟むコース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 225, y: 200, width: 170, height: 20 },
      { x: 430, y: 480, width: 185, height: 20 },
      { x: 650, y: 240, width: 185, height: 20 },
      { x: 880, y: 530, width: 130, height: 20 }
    ],
    finish: { x: 1128, y: 26, width: 48, height: 668 }
  }
];

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
  ready: false
};

const state = {
  racers: [],
  track: TRACKS[0],
  running: false,
  paused: false,
  elapsed: 0,
  finishedOrder: [],
  raceIndex: 0,
  lastFrame: 0
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function fillTrackSelect() {
  for (const track of TRACKS) {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = `${track.name} / ${track.description}`;
    trackSelect.append(option);
  }
}

function getCurrentTrack() {
  return TRACKS.find((track) => track.id === trackSelect.value) ?? TRACKS[0];
}

function intersectsRect(entity, rect) {
  return (
    entity.x < rect.x + rect.width &&
    entity.x + entity.size > rect.x &&
    entity.y < rect.y + rect.height &&
    entity.y + entity.size > rect.y
  );
}

function ensureAudioReady() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextClass();
  }

  audioState.context.resume();
  audioState.ready = true;
}

function playCollisionTone(racer, impactSpeed) {
  if (!audioState.ready || !audioState.context) {
    return;
  }

  const now = audioState.context.currentTime;
  if (now < racer.nextSoundAt) {
    return;
  }

  racer.nextSoundAt = now + 0.11;

  const osc = audioState.context.createOscillator();
  const overtone = audioState.context.createOscillator();
  const gain = audioState.context.createGain();

  const intensity = clamp(impactSpeed / 260, 0.08, 0.22);
  osc.type = racer.wave;
  overtone.type = "sine";
  osc.frequency.setValueAtTime(racer.frequency, now);
  overtone.frequency.setValueAtTime(racer.frequency * 1.5, now);

  gain.gain.setValueAtTime(intensity, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  osc.connect(gain);
  overtone.connect(gain);
  gain.connect(audioState.context.destination);

  osc.start(now);
  overtone.start(now);
  osc.stop(now + 0.14);
  overtone.stop(now + 0.14);
}

function createRacers(count) {
  return Array.from({ length: count }, (_, index) => {
    const style = RACER_PALETTE[index];
    const verticalGap = 92;
    const startY = 110 + index * verticalGap;
    const launchAngle = randomBetween(-0.18, 0.18);
    const speed = randomBetween(210, 250);
    return {
      id: index + 1,
      label: `SQ-${String(index + 1).padStart(2, "0")}`,
      color: style.color,
      wave: style.wave,
      frequency: style.frequency,
      x: 70,
      y: clamp(startY, 60, 630),
      size: 22,
      vx: Math.cos(launchAngle) * speed,
      vy: Math.sin(launchAngle) * speed,
      finished: false,
      finishTime: 0,
      trail: [],
      nextSoundAt: 0
    };
  });
}

function updateStatus(text) {
  raceStatus.textContent = text;
}

function renderPodium() {
  podiumList.innerHTML = "";
  if (state.finishedOrder.length === 0) {
    const item = document.createElement("li");
    item.textContent = "まだゴールした四角はいません。";
    podiumList.append(item);
    return;
  }

  state.finishedOrder.forEach((racer, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}位 ${racer.label} ${formatTime(racer.finishTime)}`;
    item.style.color = racer.color;
    podiumList.append(item);
  });
}

function resetRace(autostart = false) {
  state.track = getCurrentTrack();
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = autostart;
  state.paused = false;
  state.elapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  raceTimer.textContent = "0.0s";
  pauseButton.textContent = "一時停止";
  updateStatus(autostart ? "進行中" : "待機中");
  renderPodium();
  draw();
}

function startRace() {
  ensureAudioReady();
  state.track = getCurrentTrack();
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = true;
  state.paused = false;
  state.elapsed = 0;
  state.finishedOrder = [];
  state.lastFrame = 0;
  state.raceIndex += 1;
  raceCount.textContent = String(state.raceIndex);
  pauseButton.textContent = "一時停止";
  updateStatus("進行中");
  renderPodium();
}

function bounceOnAxis(racer, wall, axis) {
  if (!intersectsRect(racer, wall)) {
    return false;
  }

  const restitution = 0.98;
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

  return true;
}

function updateRace(deltaSeconds) {
  const dt = deltaSeconds * Number(simSpeedInput.value);
  state.elapsed += dt;
  raceTimer.textContent = formatTime(state.elapsed);

  for (const racer of state.racers) {
    if (racer.finished) {
      continue;
    }

    racer.x += racer.vx * dt;
    for (const wall of state.track.walls) {
      bounceOnAxis(racer, wall, "x");
    }

    racer.y += racer.vy * dt;
    for (const wall of state.track.walls) {
      bounceOnAxis(racer, wall, "y");
    }

    racer.x = clamp(racer.x, 24, 1176 - racer.size);
    racer.y = clamp(racer.y, 26, 694 - racer.size);

    racer.trail.push({ x: racer.x + racer.size / 2, y: racer.y + racer.size / 2 });
    if (racer.trail.length > 20) {
      racer.trail.shift();
    }

    if (intersectsRect(racer, state.track.finish)) {
      racer.finished = true;
      racer.finishTime = state.elapsed;
      state.finishedOrder.push(racer);
      renderPodium();
    }
  }

  if (state.finishedOrder.length === state.racers.length && state.racers.length > 0) {
    state.running = false;
    updateStatus("全員ゴール");
  }
}

function drawTrack() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#101923";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y < canvas.height; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  const finish = state.track.finish;
  context.fillStyle = "rgba(125, 211, 252, 0.22)";
  context.fillRect(finish.x, finish.y, finish.width, finish.height);
  context.fillStyle = "rgba(125, 211, 252, 0.52)";
  for (let y = finish.y; y < finish.y + finish.height; y += 28) {
    context.fillRect(finish.x, y, finish.width, 14);
  }

  context.fillStyle = "#243648";
  for (const wall of state.track.walls) {
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
  }
}

function drawRacers() {
  for (const racer of state.racers) {
    if (racer.trail.length > 1) {
      context.strokeStyle = `${racer.color}44`;
      context.lineWidth = 3;
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
    context.translate(racer.x + racer.size / 2, racer.y + racer.size / 2);
    context.rotate(Math.atan2(racer.vy, racer.vx));
    context.fillStyle = racer.color;
    context.fillRect(-racer.size / 2, -racer.size / 2, racer.size, racer.size);
    context.restore();

    if (!racer.finished) {
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.font = "11px 'Space Grotesk'";
      context.fillText(racer.id, racer.x + 5, racer.y - 5);
    }
  }
}

function drawHud() {
  context.fillStyle = "rgba(0,0,0,0.32)";
  context.fillRect(32, 30, 310, 92);

  context.fillStyle = "#f4efe7";
  context.font = "700 24px 'Space Grotesk'";
  context.fillText(state.track.name, 48, 64);
  context.font = "15px 'IBM Plex Sans JP'";
  context.fillStyle = "#cbbfa8";
  context.fillText(`Racers ${state.racers.length} / Speed ${Number(simSpeedInput.value).toFixed(1)}x`, 48, 92);
  context.fillText("Straight + Bounce Physics", 48, 114);
}

function draw() {
  drawTrack();
  drawRacers();
  drawHud();
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
  }

  draw();
  requestAnimationFrame(loop);
}

fillTrackSelect();
trackSelect.value = TRACKS[0].id;
resetRace(false);

racerCountInput.addEventListener("input", () => {
  racerCountValue.textContent = racerCountInput.value;
  resetRace(false);
});

simSpeedInput.addEventListener("input", () => {
  simSpeedValue.textContent = `${Number(simSpeedInput.value).toFixed(1)}x`;
});

trackSelect.addEventListener("change", () => {
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

requestAnimationFrame(loop);
