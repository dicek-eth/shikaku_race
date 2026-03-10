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
    id: "switchback",
    name: "Switchback Run",
    description: "上下に蛇行する王道コース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 1176, y: 0, width: 24, height: 720 },
      { x: 220, y: 26, width: 36, height: 430 },
      { x: 220, y: 560, width: 36, height: 134 },
      { x: 420, y: 196, width: 36, height: 498 },
      { x: 420, y: 26, width: 36, height: 78 },
      { x: 630, y: 26, width: 36, height: 410 },
      { x: 630, y: 548, width: 36, height: 146 },
      { x: 850, y: 250, width: 36, height: 444 },
      { x: 850, y: 26, width: 36, height: 112 }
    ],
    boosts: [
      { x: 110, y: 150, width: 80, height: 130, vx: 65, vy: -12 },
      { x: 510, y: 490, width: 90, height: 110, vx: 56, vy: -18 },
      { x: 930, y: 120, width: 92, height: 100, vx: 72, vy: 10 }
    ],
    checkpoints: [
      { x: 200, y: 520 },
      { x: 400, y: 150 },
      { x: 610, y: 520 },
      { x: 830, y: 180 },
      { x: 1060, y: 540 }
    ],
    finish: { x: 1090, y: 470, width: 70, height: 160 }
  },
  {
    id: "circuit",
    name: "Circuit Breaker",
    description: "中盤で激しく詰まるコース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 1176, y: 0, width: 24, height: 720 },
      { x: 180, y: 180, width: 34, height: 514 },
      { x: 180, y: 26, width: 34, height: 76 },
      { x: 368, y: 26, width: 34, height: 430 },
      { x: 368, y: 572, width: 34, height: 122 },
      { x: 570, y: 186, width: 34, height: 508 },
      { x: 570, y: 26, width: 34, height: 72 },
      { x: 780, y: 26, width: 34, height: 450 },
      { x: 780, y: 586, width: 34, height: 108 },
      { x: 980, y: 260, width: 34, height: 434 },
      { x: 980, y: 26, width: 34, height: 136 }
    ],
    boosts: [
      { x: 80, y: 520, width: 72, height: 100, vx: 60, vy: 8 },
      { x: 468, y: 90, width: 82, height: 94, vx: 64, vy: 22 },
      { x: 870, y: 520, width: 82, height: 88, vx: 66, vy: -18 }
    ],
    checkpoints: [
      { x: 160, y: 140 },
      { x: 348, y: 520 },
      { x: 550, y: 150 },
      { x: 760, y: 540 },
      { x: 960, y: 190 }
    ],
    finish: { x: 1060, y: 90, width: 88, height: 150 }
  },
  {
    id: "crosswind",
    name: "Crosswind Alley",
    description: "横揺れが激しい不安定コース",
    walls: [
      { x: 0, y: 0, width: 1200, height: 26 },
      { x: 0, y: 694, width: 1200, height: 26 },
      { x: 0, y: 0, width: 24, height: 720 },
      { x: 1176, y: 0, width: 24, height: 720 },
      { x: 240, y: 26, width: 36, height: 210 },
      { x: 240, y: 338, width: 36, height: 356 },
      { x: 470, y: 170, width: 36, height: 524 },
      { x: 470, y: 26, width: 36, height: 52 },
      { x: 690, y: 26, width: 36, height: 210 },
      { x: 690, y: 336, width: 36, height: 358 },
      { x: 910, y: 130, width: 36, height: 564 },
      { x: 910, y: 26, width: 36, height: 28 }
    ],
    boosts: [
      { x: 120, y: 110, width: 80, height: 84, vx: 54, vy: 28 },
      { x: 570, y: 280, width: 88, height: 110, vx: 72, vy: 0 },
      { x: 1010, y: 470, width: 92, height: 104, vx: 60, vy: -26 }
    ],
    checkpoints: [
      { x: 220, y: 280 },
      { x: 450, y: 120 },
      { x: 670, y: 520 },
      { x: 890, y: 90 },
      { x: 1080, y: 420 }
    ],
    finish: { x: 1092, y: 360, width: 56, height: 150 }
  }
];

const state = {
  racers: [],
  track: TRACKS[0],
  running: false,
  paused: false,
  startedAt: 0,
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

function createRacers(count) {
  const colors = [
    "#ff6b6b",
    "#ffd166",
    "#06d6a0",
    "#4cc9f0",
    "#f72585",
    "#fb8500",
    "#90be6d",
    "#b8f2e6",
    "#e9c46a",
    "#c77dff",
    "#ffadad",
    "#5dd39e"
  ];

  return Array.from({ length: count }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const size = 18;
    return {
      id: index + 1,
      label: `SQ-${String(index + 1).padStart(2, "0")}`,
      color: colors[index % colors.length],
      x: 60 + column * 30,
      y: 110 + row * 26,
      size,
      vx: randomBetween(90, 130),
      vy: randomBetween(-28, 28),
      checkpointIndex: 0,
      finished: false,
      finishTime: 0,
      trail: []
    };
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
  pauseButton.textContent = "一時停止";
  updateStatus(autostart ? "進行中" : "待機中");
  renderPodium();
  draw();
}

function startRace() {
  state.track = getCurrentTrack();
  state.racers = createRacers(Number(racerCountInput.value));
  state.running = true;
  state.paused = false;
  state.startedAt = performance.now();
  state.lastFrame = 0;
  state.elapsed = 0;
  state.finishedOrder = [];
  state.raceIndex += 1;
  raceCount.textContent = String(state.raceIndex);
  pauseButton.textContent = "一時停止";
  updateStatus("進行中");
  renderPodium();
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

  state.finishedOrder.slice(0, 5).forEach((racer, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}位 ${racer.label}  ${formatTime(racer.finishTime)}`;
    item.style.color = racer.color;
    podiumList.append(item);
  });
}

function intersectsRect(entity, rect) {
  return (
    entity.x < rect.x + rect.width &&
    entity.x + entity.size > rect.x &&
    entity.y < rect.y + rect.height &&
    entity.y + entity.size > rect.y
  );
}

function resolveWallCollision(racer, wall, axis) {
  if (!intersectsRect(racer, wall)) {
    return;
  }

  if (axis === "x") {
    if (racer.vx > 0) {
      racer.x = wall.x - racer.size;
    } else {
      racer.x = wall.x + wall.width;
    }
    racer.vx *= -0.86;
  } else {
    if (racer.vy > 0) {
      racer.y = wall.y - racer.size;
    } else {
      racer.y = wall.y + wall.height;
    }
    racer.vy *= -0.86;
  }
}

function applyCheckpointSteering(racer, deltaSeconds) {
  const checkpoints = state.track.checkpoints;
  const checkpoint =
    checkpoints[racer.checkpointIndex] ??
    {
      x: state.track.finish.x + state.track.finish.width / 2,
      y: state.track.finish.y + state.track.finish.height / 2
    };

  const centerX = racer.x + racer.size / 2;
  const centerY = racer.y + racer.size / 2;
  const dx = checkpoint.x - centerX;
  const dy = checkpoint.y - centerY;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const pull = racer.checkpointIndex >= checkpoints.length ? 48 : 34;

  racer.vx += (dx / distance) * pull * deltaSeconds;
  racer.vy += (dy / distance) * pull * deltaSeconds;

  if (distance < 56 && racer.checkpointIndex < checkpoints.length) {
    racer.checkpointIndex += 1;
  }
}

function applyBoosts(racer) {
  for (const boost of state.track.boosts) {
    if (intersectsRect(racer, boost)) {
      racer.vx += boost.vx * 0.06;
      racer.vy += boost.vy * 0.06;
    }
  }
}

function handleRacerCollisions() {
  const racers = state.racers;

  for (let i = 0; i < racers.length; i += 1) {
    const a = racers[i];
    if (a.finished) {
      continue;
    }

    for (let j = i + 1; j < racers.length; j += 1) {
      const b = racers[j];
      if (b.finished) {
        continue;
      }

      if (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
      ) {
        const dx = (a.x + a.size / 2) - (b.x + b.size / 2);
        const dy = (a.y + a.size / 2) - (b.y + b.size / 2);
        const overlapX = (a.size + b.size) / 2 - Math.abs(dx);
        const overlapY = (a.size + b.size) / 2 - Math.abs(dy);

        if (overlapX < overlapY) {
          const direction = dx < 0 ? -1 : 1;
          a.x += overlapX * 0.5 * direction;
          b.x -= overlapX * 0.5 * direction;
          const nextVxA = b.vx * 0.92;
          const nextVxB = a.vx * 0.92;
          a.vx = nextVxA;
          b.vx = nextVxB;
        } else {
          const direction = dy < 0 ? -1 : 1;
          a.y += overlapY * 0.5 * direction;
          b.y -= overlapY * 0.5 * direction;
          const nextVyA = b.vy * 0.92;
          const nextVyB = a.vy * 0.92;
          a.vy = nextVyA;
          b.vy = nextVyB;
        }
      }
    }
  }
}

function updateRace(deltaSeconds) {
  const speedFactor = Number(simSpeedInput.value);
  const dt = deltaSeconds * speedFactor;
  state.elapsed += dt;
  raceTimer.textContent = formatTime(state.elapsed);

  for (const racer of state.racers) {
    if (racer.finished) {
      continue;
    }

    applyCheckpointSteering(racer, dt);

    racer.vx *= 0.996;
    racer.vy *= 0.996;

    racer.vx = clamp(racer.vx, -160, 240);
    racer.vy = clamp(racer.vy, -180, 180);

    racer.x += racer.vx * dt;
    for (const wall of state.track.walls) {
      resolveWallCollision(racer, wall, "x");
    }

    racer.y += racer.vy * dt;
    for (const wall of state.track.walls) {
      resolveWallCollision(racer, wall, "y");
    }

    racer.x = clamp(racer.x, 28, 1150 - racer.size);
    racer.y = clamp(racer.y, 28, 680 - racer.size);

    applyBoosts(racer);

    racer.trail.push({ x: racer.x + racer.size / 2, y: racer.y + racer.size / 2 });
    if (racer.trail.length > 14) {
      racer.trail.shift();
    }

    if (
      racer.checkpointIndex >= state.track.checkpoints.length &&
      intersectsRect(racer, state.track.finish)
    ) {
      racer.finished = true;
      racer.finishTime = state.elapsed;
      state.finishedOrder.push(racer);
      renderPodium();
      if (state.finishedOrder.length === 1) {
        updateStatus("リーダー確定");
      }
    }
  }

  handleRacerCollisions();

  if (state.finishedOrder.length === state.racers.length) {
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

  for (const boost of state.track.boosts) {
    const gradient = context.createLinearGradient(boost.x, boost.y, boost.x + boost.width, boost.y);
    gradient.addColorStop(0, "rgba(73,220,177,0.22)");
    gradient.addColorStop(1, "rgba(73,220,177,0.52)");
    context.fillStyle = gradient;
    context.fillRect(boost.x, boost.y, boost.width, boost.height);
  }

  const finish = state.track.finish;
  context.fillStyle = "rgba(125, 211, 252, 0.28)";
  context.fillRect(finish.x, finish.y, finish.width, finish.height);

  context.fillStyle = "#243648";
  for (const wall of state.track.walls) {
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
  }

  context.strokeStyle = "rgba(255, 212, 59, 0.5)";
  context.setLineDash([10, 10]);
  context.lineWidth = 2;
  context.beginPath();
  for (let i = 0; i < state.track.checkpoints.length; i += 1) {
    const point = state.track.checkpoints[i];
    if (i === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }
  context.lineTo(finish.x + finish.width / 2, finish.y + finish.height / 2);
  context.stroke();
  context.setLineDash([]);
}

function drawRacers() {
  for (const racer of state.racers) {
    if (racer.trail.length > 1) {
      context.strokeStyle = `${racer.color}55`;
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
    context.rotate(Math.atan2(racer.vy, racer.vx) * 0.2);
    context.fillStyle = racer.color;
    context.fillRect(-racer.size / 2, -racer.size / 2, racer.size, racer.size);
    context.restore();

    if (!racer.finished) {
      context.fillStyle = "rgba(255,255,255,0.88)";
      context.font = "11px 'Space Grotesk'";
      context.fillText(racer.id, racer.x + 4, racer.y - 4);
    }
  }
}

function drawHud() {
  context.fillStyle = "rgba(0,0,0,0.32)";
  context.fillRect(32, 30, 260, 88);

  context.fillStyle = "#f4efe7";
  context.font = "700 24px 'Space Grotesk'";
  context.fillText(state.track.name, 48, 64);
  context.font = "15px 'IBM Plex Sans JP'";
  context.fillStyle = "#cbbfa8";
  context.fillText(`Racers ${state.racers.length} / Speed ${Number(simSpeedInput.value).toFixed(1)}x`, 48, 95);
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
