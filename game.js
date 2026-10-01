(() => {
  "use strict";

  const canvas = document.querySelector("#space");
  const ctx = canvas.getContext("2d");
  const radar = document.querySelector("#radar");
  const radarCtx = radar.getContext("2d");
  const $ = (selector) => document.querySelector(selector);
  const intro = $("#intro-modal");
  const ending = $("#ending-modal");
    const restartButton = $("#restart-button");
  const interaction = $("#interaction");
  const captureFill = $("#capture-fill");
  const crosshair = $("#crosshair");

  const GALAXIES = [
    { id: "lyra", name: "LYRA REACH", colors: ["#76aeea", "#ec9874", "#b69be8", "#dfc878", "#6ecbb8", "#dc8fae", "#e0b774", "#8fd4a8", "#c9a0e8"], stars: ["#ffd899", "#b9d7ff", "#ffc28c", "#f3e6bc", "#a8e0ff"], nebula: ["rgba(26,33,61,.27)", "rgba(15,25,44,.19)"] },
    { id: "orion", name: "ORION VEIL", colors: ["#77c8d2", "#d98278", "#a3b4e8", "#d6bb73", "#73c09b", "#ce8fb4", "#e5a66f", "#9ad4c8", "#e0a0c0"], stars: ["#aeeeff", "#ffd5a0", "#c4c5ff", "#ffe3b5", "#ffccaa"], nebula: ["rgba(20,53,66,.3)", "rgba(22,35,64,.2)"] },
    { id: "cygnus", name: "CYGNUS EXPANSE", colors: ["#86a4df", "#db866b", "#9bc787", "#d4a4df", "#60c4bd", "#e1c078", "#d989a0", "#a8c4e8", "#e8b890"], stars: ["#d5c2ff", "#ffbd91", "#b8d9ff", "#ffe9ca", "#c8e0ff"], nebula: ["rgba(47,29,68,.3)", "rgba(21,39,66,.2)"] },
    { id: "andromeda", name: "ANDROMEDA REACH", colors: ["#6a9fd8", "#e8956a", "#a88fd0", "#d4c06a", "#5cb8a0", "#d080a8", "#e0a060", "#90c8d0", "#c0a0e0"], stars: ["#ffe0a0", "#a0d0ff", "#ffc0a0", "#e8e0c0", "#c0e0ff"], nebula: ["rgba(30,25,55,.32)", "rgba(18,28,50,.22)"] },
    { id: "perseus", name: "PERSEUS ARM", colors: ["#70b8c8", "#d07060", "#90a8e0", "#c8b060", "#60b890", "#c070a0", "#e09050", "#80c0b0", "#d0a080"], stars: ["#ffd0a0", "#b0e0ff", "#ffb080", "#f0e0c0", "#a0c8ff"], nebula: ["rgba(25,40,55,.3)", "rgba(15,30,48,.2)"] }
  ];
  const PLANET_TYPES = ["OCEAN WORLD", "VOLCANIC WORLD", "GARDEN WORLD", "DESERT WORLD", "TUNDRA WORLD", "CAPITAL WORLD", "ICE WORLD", "GAS GIANT", "TOXIC WORLD", "CRYSTAL WORLD", "BARREN WORLD", "LAVA WORLD"];
  const PLANET_NAMES = [
    "Vesper", "Cinder", "Morrow", "Aegis", "Pelagos", "Kestrel", "Nexus", "Solace", "Ember", "Thorne",
    "Lumen", "Haven", "Rime", "Crown", "Sable", "Astra", "Quill", "Helix", "Nova", "Prism",
    "Cascade", "Forge", "Drift", "Echo", "Pulse", "Shard", "Veil", "Orbit", "Gleam", "Rift",
    "Aether", "Coral", "Dusk", "Frost", "Gale", "Ivory", "Jade", "Kepler", "Lark", "Mirage",
    "Nimbus", "Onyx", "Pike", "Quasar", "Raven", "Sierra", "Titan", "Umbra", "Vega", "Wisp"
  ];
  let worlds = [];
  let suns = [];
  let celestialBodies = [];
  let moons = [];
  let nebulaClouds = [];
  let debrisFields = [];

  const state = {
    width: innerWidth, height: innerHeight, dpr: Math.min(devicePixelRatio || 1, 2),
    running: false, finished: false, lastTime: 0, elapsed: 0, cameraX: 0, cameraY: 0,
    player: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, hull: 100, maxHull: 100, boost: 100, invulnerable: 0 },
    keys: new Set(), pointer: { x: innerWidth / 2, y: innerHeight / 2, active: false, firing: false },
    bullets: [], enemyBullets: [], enemies: [], particles: [], asteroids: [], stars: [], dust: [],
    captures: [], captured: [],
    kills: 0, credits: 0, fireCooldown: 0, enemySpawn: 2.5, toastTimeout: 0,
    activeWorld: -1, liberating: -1, pickups: [], sound: false, audio: null, audioReady: false,
    galaxyId: "lyra", campaignId: "frontier", goalTime: 0, upgradeLevels: { weapon: 0, engine: 0, armor: 0 }
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const random = (min, max) => Math.random() * (max - min) + min;
  function seeded(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function generateGalaxy(galaxyId) {
    const galaxy = GALAXIES.find((entry) => entry.id === galaxyId) || GALAXIES[0];
    const galaxyIndex = Math.max(0, GALAXIES.indexOf(galaxy));
    const rng = seeded(galaxyIndex * 7919 + 7414);
    // Core systems near origin + mid-range + deep-space frontier systems
    const centers = [
      { x: 820, y: 460, name: "Asterion" },
      { x: 3300, y: -2100, name: "Helios" },
      { x: -3500, y: 3100, name: "Meridian" },
      { x: 6100, y: 3900, name: "Farpoint" },
      { x: -7200, y: -4800, name: "Obsidian" },
      { x: 9800, y: -6200, name: "Horizon" },
      { x: -11000, y: 8500, name: "Riftgate" },
      { x: 14500, y: 9200, name: "Aurora" },
      { x: -16000, y: -11000, name: "Voidspire" },
      { x: 21000, y: -14000, name: "Elysium" }
    ];
    suns = centers.map((system, index) => {
      const isCore = index < 4;
      return {
        x: system.x, y: system.y,
        radius: isCore ? (index === 0 ? 94 : 66 + rng() * 35) : 48 + rng() * 42,
        color: galaxy.stars[index % galaxy.stars.length],
        name: system.name, phase: rng() * Math.PI * 2
      };
    });
    worlds = [];
    moons = [];
    centers.forEach((system, systemIndex) => {
      const isDeep = systemIndex >= 6;
      const planetCount = isDeep ? 3 + Math.floor(rng() * 2) : (systemIndex === centers.length - 1 ? 3 : 4 + Math.floor(rng() * 2));
      for (let i = 0; i < planetCount; i++) {
        const angle = rng() * Math.PI * 2;
        const orbit = (isDeep ? 220 : 290) + i * (isDeep ? 140 : 175) + rng() * (isDeep ? 90 : 110);
        const planetIndex = worlds.length;
        const name = PLANET_NAMES[planetIndex % PLANET_NAMES.length] + (planetIndex >= PLANET_NAMES.length ? ` ${Math.floor(planetIndex / PLANET_NAMES.length) + 1}` : "");
        const size = (isDeep ? 20 : 27) + rng() * (isDeep ? 16 : 20);
        worlds.push({
          name, x: system.x + Math.cos(angle) * orbit,
          y: system.y + Math.sin(angle) * orbit,
          color: galaxy.colors[planetIndex % galaxy.colors.length],
          size, type: PLANET_TYPES[planetIndex % PLANET_TYPES.length],
          phase: rng() * Math.PI * 2, system: system.name,
          hasRings: rng() > 0.55, moonCount: Math.floor(rng() * 3)
        });
        // Moons orbiting this planet
        const moonCount = worlds[worlds.length - 1].moonCount;
        for (let m = 0; m < moonCount; m++) {
          const mAngle = rng() * Math.PI * 2;
          const mOrbit = size + 18 + m * 22 + rng() * 12;
          moons.push({
            parent: planetIndex,
            x: worlds[planetIndex].x + Math.cos(mAngle) * mOrbit,
            y: worlds[planetIndex].y + Math.sin(mAngle) * mOrbit,
            size: 5 + rng() * 7,
            color: galaxy.colors[(planetIndex + m + 3) % galaxy.colors.length],
            phase: rng() * Math.PI * 2,
            orbit: mOrbit, orbitSpeed: (0.15 + rng() * 0.25) * (rng() > 0.5 ? 1 : -1),
            angle: mAngle
          });
        }
      }
    });
    // A few rogue planets in deep space (not liberatable for campaign balance, but visual/collision)
    for (let r = 0; r < 8; r++) {
      const angle = rng() * Math.PI * 2;
      const dist = 4000 + rng() * 18000;
      const planetIndex = worlds.length;
      worlds.push({
        name: PLANET_NAMES[(planetIndex + 7) % PLANET_NAMES.length] + " Drift",
        x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
        color: galaxy.colors[planetIndex % galaxy.colors.length],
        size: 18 + rng() * 22, type: PLANET_TYPES[planetIndex % PLANET_TYPES.length],
        phase: rng() * Math.PI * 2, system: "Deep Space", hasRings: rng() > 0.7, moonCount: 0, rogue: true
      });
    }
    state.galaxyId = galaxy.id;
    // Only core + mid systems are liberatable objectives (first ~22 worlds roughly); deep/rogue still exist for scenery
    const liberatableCount = Math.min(worlds.length, 22);
    state.captures = new Array(worlds.length).fill(0);
    state.captured = new Array(worlds.length).fill(false);
    // Asteroid belts around systems
    state.asteroids = [];
    centers.forEach((system, si) => {
      const count = si < 4 ? 22 : si < 7 ? 16 : 12;
      const spread = si < 4 ? 2400 : 1800;
      for (let a = 0; a < count; a++) {
        state.asteroids.push({
          x: system.x + (rng() - .5) * spread, y: system.y + (rng() - .5) * spread,
          size: 7 + rng() * 28, rotation: rng() * Math.PI * 2,
          spin: (rng() - .5) * .7, seed: rng() * 10
        });
      }
    });
    // Dense interstellar asteroid fields — fill the void between systems
    for (let belt = 0; belt < 14; belt++) {
      const bx = (rng() - .5) * 36000, by = (rng() - .5) * 36000;
      const beltAngle = rng() * Math.PI * 2;
      const beltLen = 18 + Math.floor(rng() * 16);
      for (let a = 0; a < beltLen; a++) {
        const along = (a - beltLen / 2) * (70 + rng() * 50);
        const side = (rng() - .5) * 320;
        state.asteroids.push({
          x: bx + Math.cos(beltAngle) * along - Math.sin(beltAngle) * side,
          y: by + Math.sin(beltAngle) * along + Math.cos(beltAngle) * side,
          size: 5 + rng() * 22, rotation: rng() * Math.PI * 2,
          spin: (rng() - .5) * .55, seed: rng() * 10
        });
      }
    }
    // Uniform scatter of rocks so every region has something nearby
    for (let a = 0; a < 220; a++) {
      state.asteroids.push({
        x: (rng() - .5) * 40000, y: (rng() - .5) * 40000,
        size: 4 + rng() * 16, rotation: rng() * Math.PI * 2,
        spin: (rng() - .5) * .45, seed: rng() * 10
      });
    }
    // Nebula clouds — more of them, larger, more visible
    nebulaClouds = [];
    for (let n = 0; n < 36; n++) {
      nebulaClouds.push({
        x: (rng() - .5) * 38000, y: (rng() - .5) * 38000,
        radius: 550 + rng() * 1400,
        color: galaxy.nebula[n % 2],
        alpha: 0.14 + rng() * 0.18,
        phase: rng() * Math.PI * 2
      });
    }
    // Debris / wreckage clusters denser across the map
    debrisFields = [];
    for (let d = 0; d < 28; d++) {
      const dx = (rng() - .5) * 36000, dy = (rng() - .5) * 36000;
      const pieces = [];
      for (let p = 0; p < 5 + Math.floor(rng() * 10); p++) {
        pieces.push({
          ox: (rng() - .5) * 140, oy: (rng() - .5) * 140,
          size: 3 + rng() * 10, rot: rng() * Math.PI * 2, spin: (rng() - .5) * .35
        });
      }
      debrisFields.push({ x: dx, y: dy, pieces });
    }
    // Local space-dust motes (tile with camera for continuous fill far from systems)
    state.dust = Array.from({ length: 160 }, () => ({
      x: rng() * 2400 - 1200,
      y: rng() * 2400 - 1200,
      size: 0.6 + rng() * 1.8,
      alpha: 0.12 + rng() * 0.35,
      depth: 0.15 + rng() * 0.4
    }));
    celestialBodies = [...worlds, ...suns, ...state.asteroids, ...moons];
  }
  const worldScreenPosition = (world) => ({
    x: world.x - state.cameraX + state.width / 2,
    y: world.y - state.cameraY + state.height / 2
  });

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    radar.width = 368;
    radar.height = 264;
    radarCtx.setTransform(2, 0, 0, 2, 0, 0);
  }

  function makeStars() {
    state.stars = Array.from({ length: 420 }, () => ({
      x: random(-4800, 4800), y: random(-4200, 4200),
      size: random(.3, 1.85), alpha: random(.12, .85),
      twinkle: random(0, Math.PI * 2), depth: random(.05, .55),
      tint: Math.random() < .12 ? "#9bc8ff" : Math.random() < .08 ? "#ffd5a8" : "#d5e3f4"
    }));
  }

  function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1, dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSquared, 0, 1) : 0;
    return distance(x1 + dx * t, y1 + dy * t, cx, cy) <= radius;
  }

  function hitCelestialBody(entity, radius) {
    for (const body of celestialBodies) {
      const bodyRadius = body.size || body.radius;
      const dx = entity.x - body.x, dy = entity.y - body.y;
      const d = Math.hypot(dx, dy), minimum = radius + bodyRadius;
      if (d >= minimum) continue;
      const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0;
      entity.x = body.x + nx * minimum;
      entity.y = body.y + ny * minimum;
      const velocity = Math.hypot(entity.vx || 0, entity.vy || 0);
      if ("vx" in entity) {
        const towardBody = entity.vx * nx + entity.vy * ny;
        if (towardBody < 0) {
          entity.vx -= towardBody * nx * 1.5;
          entity.vy -= towardBody * ny * 1.5;
        }
      }
      if (entity === state.player && velocity > 145) damagePlayer(body.radius ? 12 : 5);
    }
  }

  function projectileHitsCelestial(bullet, nextX, nextY) {
    return celestialBodies.some((body) =>
      segmentHitsCircle(bullet.x, bullet.y, nextX, nextY, body.x, body.y, (body.size || body.radius) + 3)
    );
  }

  function updateWorldList() {
    const liberatable = worlds.map((w, i) => ({ w, i })).filter(({ w }) => !w.rogue);
    $("#world-list").innerHTML = liberatable.map(({ w: world, i: index }) => {
      const captured = state.captured[index];
      const nearby = state.activeWorld === index;
      return `<span class="world-chip ${captured ? "captured" : nearby ? "hostile" : ""}"><i></i>${world.name}</span>`;
    }).join("");
    const count = liberatable.filter(({ i }) => state.captured[i]).length;
    const total = liberatable.length;
    $("#control-count").textContent = count;
    $("#world-total").textContent = total;
    $("#control-fill").style.width = `${total ? count / total * 100 : 0}%`;
  }

  function updateHud() {
    const hull = Math.round(state.player.hull / state.player.maxHull * 100);
    const boost = Math.round(state.player.boost);
    $("#hull-value").textContent = `${hull}%`;
    $("#hull-fill").style.width = `${hull}%`;
    $("#hull-fill").style.background = hull < 35
      ? "linear-gradient(90deg, #fa6473, #ff9b89)"
      : "linear-gradient(90deg, #58d9a4, #9bf0c3)";
    $("#boost-value").textContent = `${boost}%`;
    $("#boost-fill").style.width = `${boost}%`;
    $("#credits").textContent = String(state.credits).padStart(3, "0");
    $("#kills").textContent = String(state.kills).padStart(2, "0");
    $("#coordinates").textContent = `X ${Math.round(state.player.x)} · Y ${Math.round(state.player.y)}`;
    $("#sector-name").textContent = GALAXIES.find((galaxy) => galaxy.id === state.galaxyId)?.name || "UNKNOWN SECTOR";
  }

  function setObjective(text, icon = "⌖") {
    $("#objective-text").textContent = text;
    $("#objective-icon").textContent = icon;
  }

  function showToast(text) {
    const toast = $("#toast");
    toast.textContent = text;
    toast.classList.add("visible");
    clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2300);
  }

  function playTone(frequency = 440, duration = .07, type = "sine", volume = .035) {
    if (!state.sound || !state.audioReady) return;
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, state.audio.currentTime);
    gain.gain.setValueAtTime(volume * (parseFloat(settings.volume) / 100), state.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, state.audio.currentTime + duration);
    oscillator.connect(gain).connect(state.audio.destination);
    oscillator.start();
    oscillator.stop(state.audio.currentTime + duration);
  }

  function setSoundEnabled(enabled) {
    if (!enabled) {
      state.sound = false;
      $("#sound-icon").textContent = "◖))";
      $("#sound-button").setAttribute("aria-label", "Enable sound effects");
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!state.audio && AudioContext) {
      state.audio = new AudioContext();
      state.audioReady = true;
    }
    if (!state.audioReady) {
      state.sound = false;
      $("#sound-icon").textContent = "◖))";
      $("#sound-button").setAttribute("aria-label", "Enable sound effects");
      return;
    }

    state.sound = true;
    $("#sound-icon").textContent = "◖)";
    $("#sound-button").setAttribute("aria-label", "Mute sound effects");
    if (state.audio.state === "suspended") {
      state.audio.resume().then(() => {
        if (state.sound) playTone(550, .09, "triangle", .025);
      }).catch(() => {
        state.sound = false;
        $("#sound-icon").textContent = "◖))";
        $("#sound-button").setAttribute("aria-label", "Enable sound effects");
        showToast("AUDIO COULD NOT START");
      });
    } else {
      playTone(550, .09, "triangle", .025);
    }
  }

  function toggleSound() {
    setSoundEnabled(!state.sound);
  }

  function startMission() {
    if (state.running) return;
    intro.hidden = true;
    ending.hidden = true;
    $("#shop-modal").hidden = true;
    state.running = true;
    state.finished = false;
    state.lastTime = performance.now();
    if (state.campaignId === "survival") setObjective("Survive for 3:00. 180 seconds remain.");
    else if (state.campaignId === "bounty") setObjective("Defeat 15 hostiles. 15 remain.");
    else if (state.campaignId === "expedition") setObjective("Liberate 8 worlds. 8 remain.");
    else if (state.keys.size === 0) setObjective("Fly to a marked world and begin its liberation.");
    showToast("RANGER ONLINE — GOOD HUNT, PILOT");
    if (settings.sfx && !state.audioReady) setSoundEnabled(true);
    document.body.classList.add("playing");
    requestAnimationFrame(frame);
  }

  function restartMission() {
    state.player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, hull: 100, maxHull: 100, boost: 100, invulnerable: 0 };
    state.cameraX = 0;
    state.cameraY = 0;
    state.bullets = [];
    state.enemyBullets = [];
    state.enemies = [];
    state.particles = [];
    state.pickups = [];
    state.liberating = -1;
    state.captures = new Array(worlds.length).fill(0);
    state.captured = new Array(worlds.length).fill(false);
    state.kills = 0;
    state.credits = 0;
    state.elapsed = 0;
    state.enemySpawn = 2.5;
    state.goalTime = 0;
    state.upgradeLevels = { weapon: 0, engine: 0, armor: 0 };
    state.activeWorld = -1;
    state.finished = false;
    state.running = false;
    state.keys.clear();
    state.pointer.firing = false;
    updateWorldList();
    updateHud();
    updateWorldStatus();
    startMission();
  }

  function updateWorldStatus() {
    const liberatable = worlds.map((w, i) => i).filter((i) => !worlds[i].rogue);
    const allLiberated = liberatable.length > 0 && liberatable.every((i) => state.captured[i]);
    if (state.campaignId === "frontier" && allLiberated) {
      finishMission();
      return;
    }
    const remaining = liberatable.filter((i) => !state.captured[i]).length;
    setObjective(state.campaignId === "expedition"
      ? `Liberate 8 worlds. ${Math.max(0, 8 - liberatable.filter((i) => state.captured[i]).length)} remain.`
      : remaining === liberatable.length
      ? "Fly to any marked world to begin its liberation."
      : `${remaining} ${remaining === 1 ? "world" : "worlds"} remain under Dominion control.`, "⌖");
  }

  function finishMission() {
    state.finished = true;
    state.running = false;
    state.pointer.firing = false;
    document.body.classList.remove("playing");
    $("#ending-kills").textContent = String(state.kills).padStart(2, "0");
    $("#ending-credits").textContent = String(state.credits).padStart(3, "0");
    $("#ending-worlds").textContent = String(worlds.filter((w, i) => !w.rogue && state.captured[i]).length).padStart(2, "0");
    $("#ending-title").innerHTML = ["frontier", "expedition"].includes(state.campaignId)
      ? "THE STARS<br>ARE <span>OURS.</span>"
      : "MISSION<br><span>COMPLETE.</span>";
    ending.querySelector(".modal-copy").textContent = state.campaignId === "survival"
      ? "You held the line for three minutes. The frontier is still yours to defend."
      : state.campaignId === "bounty"
        ? "The hostile fleet has been scattered. Your bounty is secured."
        : state.campaignId === "expedition"
          ? "Eight worlds are under your protection. Your expedition has secured a foothold in this galaxy."
          : "The Dominion has fallen. Every world in the frontier flies your colors.";
    ending.hidden = false;
    ending.querySelector(".launch-button").focus();
  }

  function spawnEnemy() {
    const angle = random(0, Math.PI * 2);
    const radius = random(400, 660);
    const roll = Math.random();
    const type = roll < .46 ? "scout" : roll < .82 ? "striker" : "sentinel";
    const elite = type === "sentinel";
    const c = state.liberating >= 0 ? worlds[state.liberating] : state.player;
    state.enemies.push({
      x: c.x + Math.cos(angle) * radius,
      y: c.y + Math.sin(angle) * radius,
      vx: 0, vy: 0, angle: 0, hp: type === "scout" ? 1 : elite ? 5 : 2,
      cooldown: type === "striker" ? random(.55, .9) : random(.9, 1.8),
      radius: elite ? 17 : type === "striker" ? 13 : 10, phase: random(0, Math.PI * 2), elite, type,
      flash: 0
    });
  }

  function addBurst(x, y, color, amount = 12, speedScale = 1) {
    amount = Math.max(1, Math.round(amount * QUAL[settings.quality]));
    for (let i = 0; i < amount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(25, 150) * speedScale;
      const life = random(.25, .8);
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: random(1, 3.6), color });
    }
  }

  function firePlayerWeapon() {
    const player = state.player;
    state.bullets.push({
      x: player.x + Math.cos(player.angle) * 23,
      y: player.y + Math.sin(player.angle) * 23,
      vx: Math.cos(player.angle) * 710 + player.vx * .28,
      vy: Math.sin(player.angle) * 710 + player.vy * .28,
      life: 1.1, damage: 1 + state.upgradeLevels.weapon
    });
    addBurst(player.x + Math.cos(player.angle) * 23, player.y + Math.sin(player.angle) * 23, "#93f7ff", 3, .35);
    playTone(random(370, 460), .055, "triangle", .018);
    crosshair.classList.add("firing");
    setTimeout(() => crosshair.classList.remove("firing"), 65);
  }

  function damagePlayer(amount) {
    amount *= DIFF[settings.difficulty] * (1 - state.upgradeLevels.armor * .12);
    if (state.player.invulnerable > 0) return;
    state.player.hull = Math.max(0, state.player.hull - amount);
    state.player.invulnerable = .55;
    addBurst(state.player.x, state.player.y, "#ff8490", 8, .5);
    playTone(130, .2, "sawtooth", .035);
    if (state.player.hull <= 0) {
      state.player.hull = state.player.maxHull / 2;
      state.player.x = 0;
      state.player.y = 0;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.invulnerable = 2;
      state.credits = Math.max(0, state.credits - 20);
      showToast("HULL BREACH — EMERGENCY REPAIR -20 CR");
    }
    updateHud();
  }

  function nearestWorld() {
    let best = -1;
    let bestDistance = Infinity;
    worlds.forEach((world, index) => {
      if (world.rogue) return; // rogue planets are scenery only
      const currentDistance = distance(state.player.x, state.player.y, world.x, world.y);
      if (currentDistance < bestDistance) { bestDistance = currentDistance; best = index; }
    });
    return { index: best, distance: bestDistance };
  }

  function liberate(dt) {
    const { index, distance: d } = nearestWorld();
    if (index < 0 || worlds[index]?.rogue) { state.liberating = -1; return; }
    const holding = state.keys.has("e") && d <= 108 && !state.captured[index];
    state.liberating = holding ? index : -1;
    worlds.forEach((w, i) => {
      if (w.rogue || state.captured[i]) return;
      if (holding && i === index) {
        const defenders = state.enemies.filter((e) => distance(e.x, e.y, worlds[i].x, worlds[i].y) < 320).length;
        state.captures[i] = Math.min(100, state.captures[i] + dt * (defenders >= 3 ? 3 : 11));
      } else state.captures[i] = Math.max(0, state.captures[i] - dt * 3);
    });
    if (!holding) return;
    captureFill.style.width = `${state.captures[index]}%`;
    if (state.captures[index] >= 100) {
      state.captured[index] = true; state.liberating = -1;
      state.credits += 100;       state.player.hull = Math.min(state.player.maxHull, state.player.hull + 20);
      addBurst(worlds[index].x, worlds[index].y, "#f4dc98", 38, 1.3);
      playTone(660, .3, "sine", .04);
      updateWorldList(); updateHud(); updateWorldStatus();
      showToast(`${worlds[index].name.toUpperCase()} LIBERATED — +100 CREDITS`);
    }
  }

  function updateInteraction() {
    const nearest = nearestWorld();
    const world = worlds[nearest.index];
    if (!world || world.rogue || nearest.distance > 210 || state.captured[nearest.index]) {
      interaction.hidden = true;
      if (state.activeWorld !== -1) { state.activeWorld = -1; updateWorldList(); }
      return;
    }
    if (state.activeWorld !== nearest.index) { state.activeWorld = nearest.index; updateWorldList(); }
    interaction.hidden = false;
    $("#interaction-kicker").textContent = world.type;
    $("#interaction-distance").textContent = `${Math.round(nearest.distance)} KM`;
    $("#interaction-name").textContent = world.name;
    $("#interaction-body").textContent = nearest.distance > 108
      ? "Close the distance to begin planetary liberation."
      : "Establish a foothold and drive the Dominion out.";
    $("#interaction-action").textContent = nearest.distance > 108 ? "MOVE CLOSER" : "HOLD E TO LIBERATE";
    captureFill.style.width = `${state.captures[nearest.index]}%`;
  }

  function update(dt) {
    const player = state.player;
    state.elapsed += dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.boost = clamp(player.boost + dt * 15, 0, 100);

    let moveX = 0;
    let moveY = 0;
    if (state.keys.has("w") || state.keys.has("arrowup")) moveY -= 1;
    if (state.keys.has("s") || state.keys.has("arrowdown")) moveY += 1;
    if (state.keys.has("a") || state.keys.has("arrowleft")) moveX -= 1;
    if (state.keys.has("d") || state.keys.has("arrowright")) moveX += 1;
    if (moveX || moveY) {
      const magnitude = Math.hypot(moveX, moveY);
      moveX /= magnitude;
      moveY /= magnitude;
      const boosting = state.keys.has("shift") && player.boost > 1;
      const engineBoost = 1 + state.upgradeLevels.engine * .16;
      const acceleration = (boosting ? 610 : 350) * engineBoost;
      player.vx += moveX * acceleration * dt;
      player.vy += moveY * acceleration * dt;
      if (boosting) player.boost = Math.max(0, player.boost - dt * 48);
      if (Math.random() < dt * (boosting ? 30 : 17)) {
        const tail = player.angle + Math.PI + random(-.48, .48);
        addBurst(player.x + Math.cos(tail) * 12, player.y + Math.sin(tail) * 12, boosting ? "#8eeaff" : "#67c9ed", 1, .26);
      }
    }
    const engineBoost = 1 + state.upgradeLevels.engine * .16;
    const maxSpeed = (state.keys.has("shift") && player.boost > 1 ? 360 : 250) * engineBoost;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > maxSpeed) { player.vx = player.vx / speed * maxSpeed; player.vy = player.vy / speed * maxSpeed; }
    const drag = Math.pow(.955, dt * 60);
    player.vx *= drag;
    player.vy *= drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (state.pointer.active) {
      const sx = state.width / 2 + (player.x - state.cameraX), sy = state.height / 2 + (player.y - state.cameraY);
      player.angle = Math.atan2(state.pointer.y - sy, state.pointer.x - sx);
    } else if (speed > 12) player.angle = Math.atan2(player.vy, player.vx);

    hitCelestialBody(player, 11);
    state.cameraX += (player.x - state.cameraX) * Math.min(1, dt * 5);
    state.cameraY += (player.y - state.cameraY) * Math.min(1, dt * 5);
    state.fireCooldown -= dt;
    if (state.pointer.firing && state.fireCooldown <= 0) {
      firePlayerWeapon();
      state.fireCooldown = .17;
    }

    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const bullet = state.bullets[i];
      const startX = bullet.x, startY = bullet.y;
      const nextX = bullet.x + bullet.vx * dt, nextY = bullet.y + bullet.vy * dt;
      if (projectileHitsCelestial(bullet, nextX, nextY)) {
        addBurst(nextX, nextY, "#ffdb9c", 5, .3);
        state.bullets.splice(i, 1);
        continue;
      }
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      let hit = false;
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const enemy = state.enemies[j];
        if (segmentHitsCircle(startX, startY, bullet.x, bullet.y, enemy.x, enemy.y, enemy.radius + 5)) {
          enemy.hp -= bullet.damage;
          enemy.flash = .1;
          hit = true;
          addBurst(bullet.x, bullet.y, "#ffaaa0", 4, .35);
          if (enemy.hp <= 0) {
            addBurst(enemy.x, enemy.y, "#ff806f", 20, 1.1);
            state.enemies.splice(j, 1);
            state.kills++;
            if (Math.random() < .3) state.pickups.push({ x: enemy.x, y: enemy.y, life: 14 });
            state.credits += enemy.elite ? 22 : 12;
            updateHud();
            playTone(190, .12, "triangle", .03);
          }
          break;
        }
      }
      if (hit || bullet.life <= 0 || distance(bullet.x, bullet.y, player.x, player.y) > 1050) state.bullets.splice(i, 1);
    }

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = state.enemyBullets[i];
      const nextX = bullet.x + bullet.vx * dt, nextY = bullet.y + bullet.vy * dt;
      if (projectileHitsCelestial(bullet, nextX, nextY)) {
        state.enemyBullets.splice(i, 1);
        continue;
      }
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (distance(bullet.x, bullet.y, player.x, player.y) < 18) {
          damagePlayer(bullet.damage || 9);
        state.enemyBullets.splice(i, 1);
      } else if (bullet.life <= 0 || distance(bullet.x, bullet.y, player.x, player.y) > 850) state.enemyBullets.splice(i, 1);
    }

    for (const enemy of state.enemies) {
      let toPlayerX = player.x - enemy.x;
      let toPlayerY = player.y - enemy.y;
      const d = Math.hypot(toPlayerX, toPlayerY) || 1;
      // Obstacle avoidance: sample nearby bodies along approach and steer around
      let avoidX = 0, avoidY = 0;
      const lookAhead = Math.min(340, d * 0.7);
      // Prefer larger bodies (suns/planets) and nearby asteroids for performance
      const candidates = celestialBodies.filter((body) => {
        const br = (body.size || body.radius || 10);
        if (br < 12 && Math.random() > 0.35) return false; // skip many tiny rocks
        const bDist = distance(enemy.x, enemy.y, body.x, body.y);
        return bDist < lookAhead + br + 40;
      });
      for (const body of candidates) {
        const br = (body.size || body.radius || 10) + enemy.radius + 16;
        const bx = body.x - enemy.x, by = body.y - enemy.y;
        const bDist = Math.hypot(bx, by) || 1;
        if (bDist < 14) continue;
        const proj = (bx * toPlayerX + by * toPlayerY) / (d * d);
        if (proj < 0.01 || proj > 1.08) continue;
        const closestX = enemy.x + toPlayerX * proj;
        const closestY = enemy.y + toPlayerY * proj;
        const sideDist = distance(closestX, closestY, body.x, body.y);
        if (sideDist < br) {
          const nx = (enemy.x - body.x) / bDist;
          const ny = (enemy.y - body.y) / bDist;
          const strength = (1 - sideDist / br) * (1 - proj * 0.35) * 1.4;
          avoidX += nx * strength;
          avoidY += ny * strength;
        }
      }
      const avoidLen = Math.hypot(avoidX, avoidY);
      if (avoidLen > 0.08) {
        // Blend avoidance into desired heading (stronger when closer to obstacle)
        const blend = Math.min(0.85, avoidLen * 0.9);
        toPlayerX = toPlayerX / d * (1 - blend) + (avoidX / avoidLen) * blend;
        toPlayerY = toPlayerY / d * (1 - blend) + (avoidY / avoidLen) * blend;
        const newLen = Math.hypot(toPlayerX, toPlayerY) || 1;
        toPlayerX /= newLen;
        toPlayerY /= newLen;
      } else {
        toPlayerX /= d;
        toPlayerY /= d;
      }
      const angle = Math.atan2(toPlayerY, toPlayerX);
      enemy.angle = angle;
      const desiredSpeed = d > 245 ? enemy.type === "scout" ? 125 : enemy.type === "striker" ? 92 : 70 : -25;
      enemy.vx += (toPlayerX * desiredSpeed - enemy.vx) * Math.min(1, dt * 1.55);
      enemy.vy += (toPlayerY * desiredSpeed - enemy.vy) * Math.min(1, dt * 1.55);
      enemy.x += enemy.vx * dt + Math.sin(state.elapsed * 2 + enemy.phase) * 14 * dt;
      enemy.y += enemy.vy * dt + Math.cos(state.elapsed * 2 + enemy.phase) * 14 * dt;
      hitCelestialBody(enemy, enemy.radius);
      enemy.cooldown -= dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      if (d < 540 && enemy.cooldown <= 0) {
        const lead = .26;
        const aimX = player.x + player.vx * lead - enemy.x;
        const aimY = player.y + player.vy * lead - enemy.y;
        const shotAngle = Math.atan2(aimY, aimX);
        const shotSpeed = enemy.type === "sentinel" ? 250 : enemy.type === "striker" ? 235 : 195;
        state.enemyBullets.push({ x: enemy.x + Math.cos(shotAngle) * 13, y: enemy.y + Math.sin(shotAngle) * 13, vx: Math.cos(shotAngle) * shotSpeed, vy: Math.sin(shotAngle) * shotSpeed, life: 3, damage: enemy.type === "sentinel" ? 12 : 7 });
        enemy.cooldown = enemy.type === "striker" ? random(.55, .9) : enemy.elite ? random(.9, 1.4) : random(1.4, 2.2);
      }
      if (d < 27) {
        damagePlayer(7);
        enemy.x -= Math.cos(angle) * 45;
        enemy.y -= Math.sin(angle) * 45;
      }
    }

    state.enemySpawn -= dt;
    const difficulty = Math.min(1, state.elapsed / 150);
    const maxEnemies = Math.round((2 + Math.floor(difficulty * 4) + (state.liberating >= 0 ? 3 : 0)) * DIFF[settings.difficulty]);
    if (state.enemySpawn <= 0 && state.enemies.length < maxEnemies && Math.random() < .78) {
      spawnEnemy();
      state.enemySpawn = random(2.2, 4.1) - difficulty * .75;
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const particle = state.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.96, dt * 60);
      particle.vy *= Math.pow(.96, dt * 60);
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }

    liberate(dt);
    if (state.campaignId === "survival") {
      $("#objective-text").textContent = `Survive for 3:00. ${Math.max(0, 180 - Math.floor(state.elapsed))} seconds remain.`;
      if (state.elapsed >= 180) finishMission();
    }
    if (state.campaignId === "bounty") {
      $("#objective-text").textContent = `Defeat 15 hostiles. ${Math.max(0, 15 - state.kills)} remain.`;
      if (state.kills >= 15) finishMission();
    }
    if (state.campaignId === "expedition") {
      const liberated = worlds.filter((w, i) => !w.rogue && state.captured[i]).length;
      const remaining = Math.max(0, 8 - liberated);
      $("#objective-text").textContent = `Liberate 8 worlds. ${remaining} remain.`;
      if (!remaining) finishMission();
    }
    updateMoons(dt);
    updatePickups(dt);
    updateInteraction();
    updateHud();
    const warning = state.enemies.length > 0;
    $("#boss-warning").hidden = !warning;
    drawRadar();
  }

  function drawBackground() {
    ctx.fillStyle = "#080c16";
    ctx.fillRect(0, 0, state.width, state.height);
    const nebula = ctx.createRadialGradient(state.width * .53, state.height * .5, 0, state.width * .53, state.height * .5, Math.max(state.width, state.height) * .78);
    const galaxy = GALAXIES.find((entry) => entry.id === state.galaxyId) || GALAXIES[0];
    nebula.addColorStop(0, galaxy.nebula[0]);
    nebula.addColorStop(.48, galaxy.nebula[1]);
    nebula.addColorStop(1, "rgba(5, 8, 15, .1)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, state.width, state.height);

    for (let layer = 0; layer < 4; layer++) {
      ctx.save();
      for (const star of state.stars) {
        if (Math.floor(star.depth * 7) !== layer) continue;
        const parallax = star.depth;
        const tileW = 7200, tileH = 6400;
        const x = ((star.x - state.cameraX * parallax + tileW * 0.5) % tileW + tileW) % tileW - 80;
        const y = ((star.y - state.cameraY * parallax + tileH * 0.5) % tileH + tileH) % tileH - 80;
        const twinkle = .7 + Math.sin(state.elapsed * 1.3 + star.twinkle) * .3;
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = star.tint;
        ctx.beginPath();
        ctx.arc(x / tileW * (state.width + 160), y / tileH * (state.height + 160), star.size, 0, Math.PI * 2);
        ctx.fill();
        if (star.size > 1.35 && star.alpha > .58) {
          ctx.globalAlpha *= .22;
          ctx.fillRect(x / tileW * (state.width + 160) - 3, y / tileH * (state.height + 160), 7, .5);
        }
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    const gridSpacing = 160;
    const offsetX = ((-state.cameraX * .08) % gridSpacing + gridSpacing) % gridSpacing;
    const offsetY = ((-state.cameraY * .08) % gridSpacing + gridSpacing) % gridSpacing;
    ctx.fillStyle = "rgba(139, 169, 206, .085)";
    for (let x = offsetX; x < state.width; x += gridSpacing) {
      for (let y = offsetY; y < state.height; y += gridSpacing) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function drawAsteroids() {
    for (const asteroid of state.asteroids) {
      const x = asteroid.x - state.cameraX + state.width / 2;
      const y = asteroid.y - state.cameraY + state.height / 2;
      if (x < -40 || y < -40 || x > state.width + 40 || y > state.height + 40) continue;
      ctx.save();
      ctx.translate(x, y);
      asteroid.rotation += asteroid.spin * .002;
      ctx.rotate(asteroid.rotation);
      ctx.fillStyle = "#26303c";
      ctx.strokeStyle = "rgba(155, 173, 193, .24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const angle = i / 9 * Math.PI * 2;
        const radius = asteroid.size * (.78 + .22 * Math.sin(i * 4.1 + asteroid.seed));
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius * .7;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSuns() {
    for (const sun of suns) {
      const x = sun.x - state.cameraX + state.width / 2;
      const y = sun.y - state.cameraY + state.height / 2;
      if (x < -sun.radius * 4 || x > state.width + sun.radius * 4 || y < -sun.radius * 4 || y > state.height + sun.radius * 4) continue;
      const pulse = 1 + Math.sin(state.elapsed * .6 + sun.phase) * .025;
      const glow = ctx.createRadialGradient(x, y, sun.radius * .65, x, y, sun.radius * 3.3);
      glow.addColorStop(0, `${sun.color}55`);
      glow.addColorStop(.42, `${sun.color}20`);
      glow.addColorStop(1, `${sun.color}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, sun.radius * 3.3, 0, Math.PI * 2);
      ctx.fill();
      const star = ctx.createRadialGradient(x - sun.radius * .3, y - sun.radius * .35, sun.radius * .08, x, y, sun.radius * pulse);
      star.addColorStop(0, "#fff9dc");
      star.addColorStop(.42, sun.color);
      star.addColorStop(1, "#d76e49");
      ctx.fillStyle = star;
      ctx.shadowColor = sun.color;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(x, y, sun.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,245,216,.78)";
      ctx.font = "600 9px Barlow, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sun.name.toUpperCase() + " / STAR", x, y + sun.radius + 18);
    }
  }

  function drawWorld(world, index) {
    const pos = worldScreenPosition(world);
    if (pos.x < -world.size * 5 || pos.x > state.width + world.size * 5 || pos.y < -world.size * 5 || pos.y > state.height + world.size * 5) return;
    const size = world.size;
    const captured = state.captured[index];
    const atmosphere = ctx.createRadialGradient(pos.x, pos.y, size * .55, pos.x, pos.y, size * 2.15);
    atmosphere.addColorStop(0, `${world.color}22`);
    atmosphere.addColorStop(.5, `${world.color}10`);
    atmosphere.addColorStop(1, `${world.color}00`);
    ctx.fillStyle = atmosphere;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size * 2.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    const planet = ctx.createRadialGradient(-size * .34, -size * .39, size * .05, 0, 0, size * 1.2);
    planet.addColorStop(0, captured ? "#d3e9c1" : world.color);
    planet.addColorStop(.58, world.color);
    planet.addColorStop(1, captured ? "#2d534e" : "#17202e");
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, size - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = .18;
    ctx.strokeStyle = captured ? "#d8ffda" : "#f9eee3";
    ctx.lineWidth = 4;
    for (let i = -2; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, i * size * .43, size * 1.3, size * (.14 + (i % 2 === 0 ? .04 : 0)), .1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(238, 247, 232, .24)";
    ctx.beginPath();
    ctx.ellipse(-size * .27, -size * .25, size * .14, size * .09, -.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = captured ? "rgba(145,239,191,.7)" : "rgba(245,231,198,.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.24, size * .34, -.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const isActive = state.activeWorld === index;
    ctx.strokeStyle = captured ? "rgba(145,239,191,.55)" : isActive ? "rgba(247,221,154,.65)" : "rgba(247,221,154,.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size + 12 + Math.sin(state.elapsed * 2 + world.phase) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = captured ? "#9bf0c3" : "#dbc98e";
    ctx.font = "600 9px Barlow, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(world.name.toUpperCase(), pos.x, pos.y + size + 27);
    if (!captured && (isActive || distance(state.player.x, state.player.y, world.x, world.y) < 300)) {
      const progress = state.captures[index] / 100;
      ctx.fillStyle = "rgba(5, 9, 16, .75)";
      ctx.fillRect(pos.x - 25, pos.y + size + 32, 50, 3);
      ctx.fillStyle = "#e9d087";
      ctx.fillRect(pos.x - 25, pos.y + size + 32, 50 * progress, 3);
    }
  }

  function drawShip(x, y, angle, color = "#ff858c", playerShip = false, elite = false, flash = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (playerShip && state.player.invulnerable > 0 && Math.floor(state.elapsed * 24) % 2 === 0) {
      ctx.globalAlpha = .38;
    }
    ctx.shadowBlur = playerShip ? 14 : elite ? 12 : 7;
    ctx.shadowColor = playerShip ? "#75e6f0" : color;
    ctx.fillStyle = flash > 0 ? "#fff" : playerShip ? "#9af5f0" : color;
    ctx.strokeStyle = playerShip ? "rgba(219,255,255,.92)" : "rgba(255,206,202,.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playerShip ? 20 : 14, 0);
    ctx.lineTo(playerShip ? -12 : -10, playerShip ? -10 : -9);
    ctx.lineTo(playerShip ? -7 : -3, 0);
    ctx.lineTo(playerShip ? -12 : -10, playerShip ? 10 : 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 9;
    ctx.fillStyle = playerShip ? "#8deafa" : "#ff644f";
    ctx.beginPath();
    ctx.ellipse(playerShip ? -11 : -7, 0, random(4, 7), 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (elite) {
      ctx.strokeStyle = "#ffcf76";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCombat() {
    for (const bullet of state.bullets) {
      const x = bullet.x - state.cameraX + state.width / 2;
      const y = bullet.y - state.cameraY + state.height / 2;
      ctx.strokeStyle = "rgba(131, 241, 255, .95)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 9;
      ctx.shadowColor = "#8beaff";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - bullet.vx * .025, y - bullet.vy * .025);
      ctx.stroke();
    }
    for (const bullet of state.enemyBullets) {
      const x = bullet.x - state.cameraX + state.width / 2;
      const y = bullet.y - state.cameraY + state.height / 2;
      ctx.fillStyle = "#ff8481";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff666c";
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const enemy of state.enemies) {
      const x = enemy.x - state.cameraX + state.width / 2;
      const y = enemy.y - state.cameraY + state.height / 2;
      const color = enemy.type === "scout" ? "#ffdc88" : enemy.type === "striker" ? "#ff946b" : "#fa777f";
      drawShip(x, y, enemy.angle, color, false, enemy.elite, enemy.flash);
      const maxHealth = enemy.type === "sentinel" ? 5 : enemy.type === "scout" ? 1 : 2;
      if (enemy.hp < maxHealth) {
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(x - 10, y - 18, 20, 2);
        ctx.fillStyle = enemy.type === "scout" ? "#ffdb8a" : enemy.type === "striker" ? "#ff9c65" : "#ff777e";
        ctx.fillRect(x - 10, y - 18, 20 * enemy.hp / maxHealth, 2);
      }
    }
    const playerX = state.width / 2 + (state.player.x - state.cameraX);
    const playerY = state.height / 2 + (state.player.y - state.cameraY);
    drawShip(playerX, playerY, state.player.angle, "#8cebf1", true);

    for (const particle of state.particles) {
      const x = particle.x - state.cameraX + state.width / 2;
      const y = particle.y - state.cameraY + state.height / 2;
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawRadar() {
    const width = 184;
    const height = 132;
    radarCtx.clearRect(0, 0, width, height);
    radarCtx.fillStyle = "rgba(11, 19, 31, .82)";
    radarCtx.fillRect(0, 0, width, height);
    radarCtx.strokeStyle = "rgba(145, 170, 200, .12)";
    radarCtx.lineWidth = 1;
    for (let ring = 1; ring <= 3; ring++) {
      radarCtx.beginPath();
      radarCtx.arc(width / 2, height / 2, ring * 18, 0, Math.PI * 2);
      radarCtx.stroke();
    }
    radarCtx.beginPath();
    radarCtx.moveTo(width / 2, 5);
    radarCtx.lineTo(width / 2, height - 5);
    radarCtx.moveTo(5, height / 2);
    radarCtx.lineTo(width - 5, height / 2);
    radarCtx.stroke();
    const range = 1100;
    for (let i = 0; i < suns.length; i++) {
      const sun = suns[i];
      const x = width / 2 + (sun.x - state.player.x) / range * (width * .43);
      const y = height / 2 + (sun.y - state.player.y) / range * (height * .43);
      if (x < 3 || x > width - 3 || y < 3 || y > height - 3) continue;
      radarCtx.fillStyle = "#ffd48c";
      radarCtx.beginPath();
      radarCtx.arc(x, y, 3.5, 0, Math.PI * 2);
      radarCtx.fill();
    }
    for (let i = 0; i < worlds.length; i++) {
      const world = worlds[i];
      const x = width / 2 + (world.x - state.player.x) / range * (width * .43);
      const y = height / 2 + (world.y - state.player.y) / range * (height * .43);
      if (x < 3 || x > width - 3 || y < 3 || y > height - 3) continue;
      radarCtx.fillStyle = state.captured[i] ? "#91efbf" : "#e6ca82";
      radarCtx.beginPath();
      radarCtx.arc(x, y, 2.6, 0, Math.PI * 2);
      radarCtx.fill();
    }
    for (const enemy of state.enemies) {
      const x = width / 2 + (enemy.x - state.player.x) / range * (width * .43);
      const y = height / 2 + (enemy.y - state.player.y) / range * (height * .43);
      if (x < 2 || x > width - 2 || y < 2 || y > height - 2) continue;
      radarCtx.fillStyle = "#ff737b";
      radarCtx.beginPath();
      radarCtx.arc(x, y, 2.1, 0, Math.PI * 2);
      radarCtx.fill();
    }
    radarCtx.save();
    radarCtx.translate(width / 2, height / 2);
    radarCtx.rotate(state.player.angle);
    radarCtx.fillStyle = "#8af3f0";
    radarCtx.shadowBlur = 8;
    radarCtx.shadowColor = "#8af3f0";
    radarCtx.beginPath();
    radarCtx.moveTo(7, 0);
    radarCtx.lineTo(-4, -4);
    radarCtx.lineTo(-2, 0);
    radarCtx.lineTo(-4, 4);
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.restore();
  }

  function updateMoons(dt) {
    for (const moon of moons) {
      const parent = worlds[moon.parent];
      if (!parent) continue;
      moon.angle += moon.orbitSpeed * dt;
      moon.x = parent.x + Math.cos(moon.angle) * moon.orbit;
      moon.y = parent.y + Math.sin(moon.angle) * moon.orbit;
    }
  }

  function drawNebulaClouds() {
    for (const cloud of nebulaClouds) {
      const x = cloud.x - state.cameraX + state.width / 2;
      const y = cloud.y - state.cameraY + state.height / 2;
      if (x < -cloud.radius || y < -cloud.radius || x > state.width + cloud.radius || y > state.height + cloud.radius) continue;
      const pulse = 1 + Math.sin(state.elapsed * 0.18 + cloud.phase) * 0.07;
      const g = ctx.createRadialGradient(x, y, 0, x, y, cloud.radius * pulse);
      // Force higher visibility so deep-space nebulae read clearly
      const a0 = Math.min(0.38, cloud.alpha * 1.6);
      const a1 = a0 * 0.5;
      g.addColorStop(0, cloud.color.replace(/[\d.]+\)$/, `${a0})`));
      g.addColorStop(0.45, cloud.color.replace(/[\d.]+\)$/, `${a1})`));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, cloud.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDust() {
    if (!state.dust || !state.dust.length) return;
    const tile = 2400;
    for (const d of state.dust) {
      const parallax = d.depth;
      const wx = ((d.x - state.cameraX * parallax) % tile + tile) % tile;
      const wy = ((d.y - state.cameraY * parallax) % tile + tile) % tile;
      // Draw a 3x3 tile neighborhood so edges don't pop
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const sx = wx + ox * tile - tile * 0.5 + state.width / 2;
          const sy = wy + oy * tile - tile * 0.5 + state.height / 2;
          if (sx < -4 || sy < -4 || sx > state.width + 4 || sy > state.height + 4) continue;
          ctx.globalAlpha = d.alpha * (0.75 + 0.25 * Math.sin(state.elapsed * 1.1 + d.x * 0.01));
          ctx.fillStyle = "#c8d8e8";
          ctx.beginPath();
          ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMoons() {
    for (const moon of moons) {
      const x = moon.x - state.cameraX + state.width / 2;
      const y = moon.y - state.cameraY + state.height / 2;
      if (x < -20 || y < -20 || x > state.width + 20 || y > state.height + 20) continue;
      const g = ctx.createRadialGradient(x - moon.size * 0.3, y - moon.size * 0.3, 0, x, y, moon.size);
      g.addColorStop(0, moon.color);
      g.addColorStop(1, "#1a2030");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, moon.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(200,210,230,.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawDebris() {
    for (const field of debrisFields) {
      const fx = field.x - state.cameraX + state.width / 2;
      const fy = field.y - state.cameraY + state.height / 2;
      if (fx < -150 || fy < -150 || fx > state.width + 150 || fy > state.height + 150) continue;
      for (const p of field.pieces) {
        const x = fx + p.ox, y = fy + p.oy;
        p.rot += p.spin * 0.02;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.fillStyle = "#2a3340";
        ctx.strokeStyle = "rgba(140,160,180,.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.size, 0);
        ctx.lineTo(-p.size * 0.6, p.size * 0.5);
        ctx.lineTo(-p.size * 0.4, -p.size * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function render() {
    drawBackground();
    drawNebulaClouds();
    drawDust();
    drawAsteroids();
    drawDebris();
    drawSuns();
    worlds.forEach(drawWorld);
    drawMoons();
    drawPickups();
    drawCombat();
  }

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min((now - state.lastTime) / 1000 || 0, .04);
    state.lastTime = now;
    update(dt);
    render();
    fpsTick(dt);
    if (state.running) requestAnimationFrame(frame);
  }

  function setPointer(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    state.pointer.x = clientX - bounds.left;
    state.pointer.y = clientY - bounds.top;
    state.pointer.active = true;
    crosshair.style.left = `${state.pointer.x}px`;
    crosshair.style.top = `${state.pointer.y}px`;
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (handleOverlayKeys(event)) return;
    if (key === "escape" && state.running) {
      event.preventDefault();
      state.running = false;
      state.pointer.firing = false;
      openMenu(true);
      return;
    }
    if (!state.running) return;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "e"].includes(key)) event.preventDefault();
    state.keys.add(key);
    if (key === "b") openShop();
  });
  window.addEventListener("keyup", (event) => state.keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => { state.keys.clear(); state.pointer.firing = false; });
  window.addEventListener("pointermove", (event) => setPointer(event.clientX, event.clientY));
  window.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && state.running && !event.target.closest("button")) { setPointer(event.clientX, event.clientY); state.pointer.firing = true; }
  });
  window.addEventListener("pointerup", () => { state.pointer.firing = false; });
  window.addEventListener("pointercancel", () => { state.pointer.firing = false; });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  restartButton.addEventListener("click", restartMission);
  $("#sound-button").addEventListener("click", toggleSound);

  function updatePickups(dt) {
    const p = state.player;
    for (let i = state.pickups.length - 1; i >= 0; i--) {
      const k = state.pickups[i]; k.life -= dt;
      if (distance(k.x, k.y, p.x, p.y) < 28) {
        p.hull = Math.min(p.maxHull, p.hull + 25); addBurst(k.x, k.y, "#91efbf", 10, .6);
        showToast("HULL REPAIRED +25%"); state.pickups.splice(i, 1);
      } else if (k.life <= 0) state.pickups.splice(i, 1);
    }
  }
  function drawPickups() {
    for (const k of state.pickups) {
      const x = k.x - state.cameraX + state.width / 2, y = k.y - state.cameraY + state.height / 2;
      ctx.globalAlpha = k.life < 4 ? .4 + .6 * Math.abs(Math.sin(state.elapsed * 8)) : 1;
      ctx.strokeStyle = "#91efbf"; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = "#91efbf";
      const s = 7 + Math.sin(state.elapsed * 4) * 1.5;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  // ---------- settings ----------
  const DIFF = { EASY: .6, NORMAL: 1, HARD: 1.5 }, QUAL = { LOW: .4, MEDIUM: 1, HIGH: 1.6 };
  const DEF = { quality: "MEDIUM", difficulty: "NORMAL", fullscreen: false, fps: false, sfx: true, volume: 80 };
  const settings = { ...DEF };
  try {
    const saved = JSON.parse(localStorage.getItem("starfall-settings") || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      if (Object.prototype.hasOwnProperty.call(QUAL, saved.quality)) settings.quality = saved.quality;
      if (Object.prototype.hasOwnProperty.call(DIFF, saved.difficulty)) settings.difficulty = saved.difficulty;
      for (const key of ["fullscreen", "fps", "sfx"]) {
        if (typeof saved[key] === "boolean") settings[key] = saved[key];
      }
      const savedVolume = typeof saved.volume === "string" && saved.volume.endsWith("%")
        ? Number(saved.volume.slice(0, -1))
        : saved.volume;
      if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100) settings.volume = savedVolume;
    }
  } catch {}
  let fpsAcc = 0, fpsFrames = 0;
  function fpsTick(dt) {
    const el = $("#fps"); el.hidden = !settings.fps;
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc > .5) { el.textContent = `${Math.round(fpsFrames / fpsAcc)} FPS`; fpsAcc = 0; fpsFrames = 0; }
  }
  function applySettings(userInitiated = false) {
    try { localStorage.setItem("starfall-settings", JSON.stringify(settings)); } catch {}
    if (settings.fullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    if (!settings.fullscreen && document.fullscreenElement) document.exitFullscreen?.();
    if (!settings.sfx) setSoundEnabled(false);
    else if (userInitiated) setSoundEnabled(true);
    $("#fps").hidden = !settings.fps;
  }

  const UPGRADES = {
    weapon: { name: "PHASE CANNON", detail: "Increase weapon damage.", costs: [90, 160, 250] },
    engine: { name: "ION DRIVE", detail: "Improve acceleration and top speed.", costs: [80, 145, 225] },
    armor: { name: "REINFORCED HULL", detail: "Increase hull capacity and reduce damage.", costs: [100, 175, 260] }
  };
  function renderShop() {
    $("#shop-balance").textContent = `AVAILABLE CREDITS: ${state.credits}`;
    $("#shop-items").innerHTML = Object.entries(UPGRADES).map(([id, upgrade]) => {
      const level = state.upgradeLevels[id];
      const cost = upgrade.costs[level];
      return `<div class="shop-row"><div><b>${upgrade.name}</b><small>${upgrade.detail} LEVEL ${level}/3</small></div><button type="button" data-upgrade="${id}" ${cost === undefined || state.credits < cost ? "disabled" : ""}>${cost === undefined ? "MAX" : `${cost} CR`}</button></div>`;
    }).join("");
  }
  function openShop() {
    state.running = false;
    state.pointer.firing = false;
    document.body.classList.remove("playing");
    intro.hidden = true;
    ending.hidden = true;
    $("#shop-modal").hidden = false;
    cancelAnimationFrame(menuRaf);
    renderShop();
    const firstUpgrade = $("#shop-items button:not(:disabled)");
    (firstUpgrade || $("#shop-resume")).focus();
  }
  function buyUpgrade(id) {
    const upgrade = UPGRADES[id];
    if (!upgrade) return;
    const level = state.upgradeLevels[id], cost = upgrade.costs[level];
    if (cost === undefined || state.credits < cost) return;
    state.credits -= cost;
    state.upgradeLevels[id]++;
    if (id === "armor") {
      state.player.maxHull += 20;
      state.player.hull = Math.min(state.player.maxHull, state.player.hull + 20);
    }
    updateHud();
    renderShop();
    showToast(`${upgrade.name} UPGRADED`);
  }

  // ---------- main menu ----------
  const TABS = {
    briefing: { title: "CAMPAIGN/ BRIEFING", info: [["OBJECTIVE", "LIBERATE EVERY WORLD"], ["SYSTEMS", "4 STAR SYSTEMS"], ["DEFENDERS", "3 DOMINION FIGHTER CLASSES"], ["REPAIRS", "COLLECT GREEN CORES"]] },
    general: { title: "OPTIONS/ GENERAL", rows: [["DIFFICULTY", "difficulty", ["EASY", "NORMAL", "HARD"]]] },
    video: { title: "OPTIONS/ VIDEO", rows: [["GRAPHICS QUALITY", "quality", ["LOW", "MEDIUM", "HIGH"]], ["FULLSCREEN", "fullscreen"], ["FPS COUNTER", "fps"]] },
    audio: { title: "OPTIONS/ AUDIO", rows: [["SOUND EFFECTS", "sfx"], ["VOLUME", "volume", "range"]] },
    controls: { title: "OPTIONS/ CONTROLS", info: [["FLIGHT", "W A S D"], ["AIM", "MOUSE"], ["FIRE", "LEFT CLICK"], ["BOOST", "SHIFT"], ["LIBERATE", "HOLD E"], ["UPGRADES", "B"], ["PAUSE", "ESC"]] }
  };
  let mode = "main", tab = "briefing", paused = false, menuRaf = 0;
  function focusFirstMenuControl() {
    const selectedTab = $("#menu-items button.sel");
    if (selectedTab) { selectedTab.focus(); return; }
    const controls = intro.querySelectorAll("button:not([hidden]), select:not([hidden]), input:not([hidden])");
    controls[0]?.focus();
  }
  function handleOverlayKeys(event) {
    const shop = $("#shop-modal");
    const hasOverlay = !intro.hidden || !shop.hidden || !ending.hidden;
    if (event.key === "Escape" && hasOverlay) {
      event.preventDefault();
      if (!shop.hidden) {
        shop.hidden = true;
        startMission();
      } else if (!ending.hidden) {
        openMenu(false);
      } else if (!intro.hidden && mode !== "main") {
        mode = "main";
        renderMenu();
        requestAnimationFrame(focusFirstMenuControl);
      }
      return true;
    }
    const overlay = !intro.hidden ? intro : !$("#shop-modal").hidden ? $("#shop-modal") : !ending.hidden ? ending : null;
    if (overlay && ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key) &&
        !["SELECT", "INPUT"].includes(document.activeElement.tagName)) {
      const row = document.activeElement.closest(".row[role=button]");
      if (row && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        const definition = TABS[tab]?.rows.find((entry) => entry[1] === row.dataset.k);
        if (definition?.[2]) {
          const options = definition[2], current = options.indexOf(settings[row.dataset.k]);
          settings[row.dataset.k] = options[(current + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length];
          renderMenu();
          requestAnimationFrame(() => $(`.row[role=button][data-k="${row.dataset.k}"]`)?.focus());
          event.preventDefault();
          return true;
        }
      }
      const controls = [...overlay.querySelectorAll("button:not([hidden]), select:not([hidden]), input:not([hidden]), [tabindex='0']")]
        .filter((element) => element.getClientRects().length && !element.disabled);
      const index = controls.indexOf(document.activeElement);
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      controls[(index + (forward ? 1 : -1) + controls.length) % controls.length]?.focus();
      event.preventDefault();
      return true;
    }
    return !intro.hidden || !$("#shop-modal").hidden || !ending.hidden;
  }
  function renderMenu() {
    const items = mode === "main"
      ? [...(paused ? [["RESUME MISSION", "resume"], ["SHIP UPGRADES", "shop"]] : []), ["NEW CAMPAIGN", "new"], ["OPTIONS", "opts"]]
      : mode === "opts" ? [["GENERAL", "general"], ["VIDEO", "video"], ["AUDIO", "audio"], ["CONTROLS", "controls"], ["BACK TO MAIN MENU", "back"]] : [];
    $("#menu-title").textContent = mode === "main" ? "MAIN MENU" : mode === "opts" ? "OPTIONS" : "CAMPAIGN SELECT";
    $("#campaign-config").hidden = mode !== "campaign";
    $(".menu-opts").hidden = mode === "campaign";
    $("#menu-items").innerHTML = items.map(([l, id]) => `<button data-id="${id}" class="${mode === "opts" && id === tab ? "sel" : ""}">${l}</button>`).join("");
    const t = TABS[tab];
    $("#opts-title").textContent = t.title;
    $("#opts-rows").innerHTML = t.info
      ? t.info.map(([l, v]) => `<div class="row info"><span>${l}</span><b>${v}</b></div>`).join("")
      : t.rows.map(([label, key, options]) => {
          if (key === "quality") return `<label class="row"><span>${label}</span><select data-k="${key}">${options.map((option) => `<option${settings[key] === option ? " selected" : ""}>${option}</option>`).join("")}</select></label>`;
          if (key === "volume") return `<label class="row volume-row"><span>${label}</span><input data-k="${key}" type="range" min="0" max="100" step="1" value="${settings.volume}" aria-label="Sound volume"><output>${settings.volume}%</output></label>`;
          if (options) return `<div class="row" data-k="${key}" tabindex="0" role="button"><span>${label}</span><b>${settings[key]}</b><i class="tri"></i></div>`;
          return `<label class="row toggle-row"><span>${label}</span><input data-k="${key}" type="checkbox"${settings[key] ? " checked" : ""}></label>`;
        }).join("");
    $("#apply").hidden = !t.rows;
    requestAnimationFrame(focusFirstMenuControl);
  }
  function beginCampaign() {
    state.campaignId = $("#campaign-select").value;
    state.galaxyId = $("#galaxy-select").value;
    generateGalaxy(state.galaxyId);
    state.upgradeLevels = { weapon: 0, engine: 0, armor: 0 };
    state.player.maxHull = 100;
    state.player.hull = 100;
    restartMission();
  }
  function openMenu(isPaused) {
    paused = isPaused; mode = "main"; tab = "briefing";
    document.body.classList.remove("playing");
    renderMenu(); intro.hidden = false; ending.hidden = true;
    requestAnimationFrame(focusFirstMenuControl);
    cancelAnimationFrame(menuRaf); menuRaf = requestAnimationFrame(menuLoop);
  }
  $("#menu-items").addEventListener("click", (e) => {
    const id = e.target.closest("button")?.dataset.id; if (!id) return;
    if (id === "resume") startMission();
    else if (id === "shop") openShop();
    else if (id === "new") { mode = "campaign"; renderMenu(); requestAnimationFrame(focusFirstMenuControl); }
    else if (id === "opts") { mode = "opts"; tab = "video"; renderMenu(); }
    else if (id === "back") { mode = "main"; tab = "briefing"; renderMenu(); }
    else { tab = id; renderMenu(); }
  });
  $("#opts-rows").addEventListener("click", (e) => {
    const row = e.target.closest(".row[data-k]"); if (!row) return;
    const def = TABS[tab].rows.find((r) => r[1] === row.dataset.k), k = def[1];
    if (e.target.matches("input, select")) return;
    settings[k] = def[2] ? def[2][(def[2].indexOf(settings[k]) + 1) % def[2].length] : !settings[k];
    renderMenu();
    requestAnimationFrame(() => $(`.row[role=button][data-k="${k}"]`)?.focus());
  });
  $("#opts-rows").addEventListener("change", (event) => {
    const control = event.target.closest("[data-k]");
    if (!control) return;
    settings[control.dataset.k] = control.type === "checkbox" ? control.checked
      : control.dataset.k === "volume" ? Number(control.value) : control.value;
    if (control.dataset.k === "sfx" && !settings.sfx) setSoundEnabled(false);
  });
  $("#opts-rows").addEventListener("input", (event) => {
    if (event.target.dataset.k !== "volume") return;
    settings.volume = Number(event.target.value);
    event.target.nextElementSibling.value = `${settings.volume}%`;
  });
  $("#opts-rows").addEventListener("keydown", (event) => {
    const row = event.target.closest(".row[role=button]");
    if (row && ["Enter", " "].includes(event.key)) { event.preventDefault(); row.click(); }
  });
  $("#launch-campaign").addEventListener("click", beginCampaign);
  $("#shop-items").addEventListener("click", (event) => {
    const upgrade = event.target.closest("button[data-upgrade]")?.dataset.upgrade;
    if (upgrade) buyUpgrade(upgrade);
  });
  $("#shop-resume").addEventListener("click", () => startMission());
  $("#galaxy-select").innerHTML = GALAXIES.map((galaxy) => `<option value="${galaxy.id}">${galaxy.name}</option>`).join("");
  $("#apply").addEventListener("click", () => { applySettings(true); showToast("SETTINGS APPLIED"); });

  const mc = $("#menu-bg"), mx = mc.getContext("2d");
  const mStars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: random(.3, 1.6), a: random(.2, .9) }));
  const mRocks = Array.from({ length: 30 }, () => ({ x: Math.random(), y: random(.66, 1.05), s: random(10, 46), r: random(0, 6), sp: random(-.4, .4), seed: random(0, 9), v: random(.004, .012) }));
  function menuLoop(now) {
    if (intro.hidden) return;
    const t = now / 1000, w = innerWidth, h = innerHeight;
    if (mc.width !== w || mc.height !== h) { mc.width = w; mc.height = h; }
    const g = mx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b232b"); g.addColorStop(1, "#050a12");
    mx.fillStyle = g; mx.fillRect(0, 0, w, h);
    for (const s of mStars) { mx.globalAlpha = s.a * (.7 + .3 * Math.sin(t + s.x * 40)); mx.fillStyle = "#cfe6f4"; mx.fillRect(s.x * w, s.y * h, s.s, s.s); }
    mx.globalAlpha = 1;
    const px = w * .93, py = h * .2, pr = h * .5;
    const pg = mx.createRadialGradient(w * .7, h * .2, pr * .1, px, py, pr * 1.1);
    pg.addColorStop(0, "#c98a4a"); pg.addColorStop(.35, "#3a3028"); pg.addColorStop(1, "#071216");
    mx.fillStyle = pg; mx.beginPath(); mx.arc(px, py, pr, 0, 7); mx.fill();
    mx.strokeStyle = "rgba(230,150,80,.22)"; mx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { mx.beginPath(); mx.ellipse(px, py, pr * (1.15 + i * .06), pr * (.28 + i * .02), -.45, 0, 7); mx.stroke(); }
    mx.globalCompositeOperation = "lighter";
    const sg = mx.createRadialGradient(w * .67, h * .21, 0, w * .67, h * .21, h * .32 + Math.sin(t * 1.5) * 6);
    sg.addColorStop(0, "rgba(255,240,210,.95)"); sg.addColorStop(.15, "rgba(255,170,90,.5)"); sg.addColorStop(1, "rgba(255,120,40,0)");
    mx.fillStyle = sg; mx.fillRect(0, 0, w, h * .7);
    mx.globalCompositeOperation = "source-over";
    for (const r of mRocks) {
      const x = (((r.x + t * r.v) % 1.1) + 1.1) % 1.1 * w - 40, y = r.y * h + Math.sin(t * .3 + r.seed) * 5;
      mx.save(); mx.translate(x, y); mx.rotate(r.r + t * r.sp);
      mx.fillStyle = "#1a2126"; mx.strokeStyle = "rgba(90,200,210,.3)"; mx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rad = r.s * (.75 + .25 * Math.sin(i * 3.7 + r.seed)); mx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * .8); }
      mx.closePath(); mx.fill(); mx.stroke(); mx.restore();
    }
    const vg = mx.createLinearGradient(0, 0, w * .6, 0); vg.addColorStop(0, "rgba(3,8,14,.65)"); vg.addColorStop(1, "rgba(3,8,14,0)");
    mx.fillStyle = vg; mx.fillRect(0, 0, w, h);
    menuRaf = requestAnimationFrame(menuLoop);
  }

  resize();
  generateGalaxy(state.galaxyId);
  makeStars();
  updateWorldList();
  updateHud();
  render();
  applySettings();
  openMenu(false);
})();
