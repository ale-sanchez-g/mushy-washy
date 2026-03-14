window.onload = function () {
  // ─── Level configuration ──────────────────────────────────────────────────
  // 10 levels: each level requires more zombie kills, spawns them faster, and
  // they move at higher speed. Container restart time also shortens.
  const LEVELS = [
    { zombiesRequired: 5,  spawnInterval: 2400, speed: 60  },   // Level 1
    { zombiesRequired: 6,  spawnInterval: 2100, speed: 75  },   // Level 2
    { zombiesRequired: 7,  spawnInterval: 1900, speed: 90  },   // Level 3
    { zombiesRequired: 8,  spawnInterval: 1700, speed: 108 },   // Level 4
    { zombiesRequired: 9,  spawnInterval: 1500, speed: 126 },   // Level 5
    { zombiesRequired: 10, spawnInterval: 1300, speed: 144 },   // Level 6
    { zombiesRequired: 11, spawnInterval: 1100, speed: 165 },   // Level 7
    { zombiesRequired: 12, spawnInterval: 900,  speed: 190 },   // Level 8
    { zombiesRequired: 13, spawnInterval: 700,  speed: 218 },   // Level 9
    { zombiesRequired: 15, spawnInterval: 500,  speed: 250 },   // Level 10
  ];

  // How long (ms) a crashed container takes to restart at each level
  const RESTART_TIMES_MS = [3000, 2700, 2400, 2100, 1800, 1500, 1200, 1000, 800, 600];

  const NUM_CONTAINERS = 8;
  const ZOMBIE_Y_RATIO = 0.62; // vertical position of zombie lane (fraction of height)

  // ─── Game state ───────────────────────────────────────────────────────────
  let scene;
  let currentLevel = 0;
  let score = 0;
  let zombiesKilledInLevel = 0;
  let lives = 3;
  let gameActive = false;
  let containerStates = Array(NUM_CONTAINERS).fill('up');
  let nextCrashIndex = 0;

  // UI references
  let levelText, scoreText, livesText, progressBar;
  let containerBoxes = [];
  let containerLabels = [];
  let zombieGroup;
  let spawnTimer;
  let overlayItems = [];

  // ─── Phaser config ────────────────────────────────────────────────────────
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0d0d1a',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: { preload, create, update },
  };

  const game = new Phaser.Game(config);

  // iOS Safari: resume AudioContext on first user gesture
  const unlockAudio = () => {
    if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
      game.sound.context.resume().catch(() => {});
    }
  };
  document.addEventListener('touchstart', unlockAudio, { capture: true, once: true });
  document.addEventListener('click',      unlockAudio, { capture: true, once: true });

  // ─── Scene lifecycle ──────────────────────────────────────────────────────

  function preload() { /* all assets are drawn procedurally */ }

  function create() {
    scene = this;
    const W = this.scale.width;
    const H = this.scale.height;

    drawBackground(W, H);
    buildContainerPanel(W, H);
    buildHUD(W, H);
    buildProgressBar(W, H);

    zombieGroup = this.physics.add.group();

    showStartScreen(W, H);

    // Global pointer handler (individual zombies also handle their own tap)
    this.input.on('pointerdown', handlePointerDown, this);
  }

  function update() {
    if (!gameActive) return;
    const W = scene.scale.width;
    // Remove zombies that have crossed the left boundary (escaped)
    zombieGroup.getChildren().forEach(z => {
      if (z.active && z.x < -60) {
        z.setActive(false).setVisible(false).destroy();
        onZombieEscaped(W);
      }
    });
  }

  // ─── Background ───────────────────────────────────────────────────────────

  function drawBackground(W, H) {
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x0d0d1a, 0x0d0d1a, 0x120b28, 0x120b28, 1);
    bg.fillRect(0, 0, W, H);

    // Ground line beneath zombie lane
    const zombieY = H * ZOMBIE_Y_RATIO;
    const ground = scene.add.graphics();
    ground.lineStyle(2, 0x335533, 0.5);
    ground.beginPath();
    ground.moveTo(0, zombieY + 45);
    ground.lineTo(W, zombieY + 45);
    ground.strokePath();

    scene.add.text(W / 2, zombieY + 55, '— CHAOS ZONE —', {
      fontSize: '12px', fill: '#223322', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
  }

  // ─── Container panel ──────────────────────────────────────────────────────

  function buildContainerPanel(W, H) {
    const PANEL_TOP = 50;
    const PANEL_H   = Math.min(H * 0.22, 100);
    const BOX_W     = (W - 40) / NUM_CONTAINERS;
    const BOX_H     = PANEL_H - 28;

    const panel = scene.add.graphics();
    panel.fillStyle(0x111133, 0.95);
    panel.fillRoundedRect(10, PANEL_TOP, W - 20, PANEL_H, 6);
    panel.lineStyle(1, 0x334488, 1);
    panel.strokeRoundedRect(10, PANEL_TOP, W - 20, PANEL_H, 6);

    scene.add.text(16, PANEL_TOP + 4, '🐳 DOCKER CONTAINERS', {
      fontSize: '11px', fill: '#7799dd', fontFamily: 'monospace',
    });

    containerBoxes  = [];
    containerLabels = [];

    for (let i = 0; i < NUM_CONTAINERS; i++) {
      const bx = 20 + i * BOX_W;
      const by = PANEL_TOP + 22;
      const cx = bx + (BOX_W - 6) / 2;
      const cy = by + BOX_H / 2;

      const box = scene.add.graphics();
      box.fillStyle(0x00aa55, 1);
      box.fillRoundedRect(bx, by, BOX_W - 6, BOX_H, 5);
      containerBoxes.push({ gfx: box, bx, by, bw: BOX_W - 6, bh: BOX_H });

      const lbl = scene.add.text(cx, cy, `C${i + 1}\n✅`, {
        fontSize: '10px', fill: '#ffffff', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5, 0.5);
      containerLabels.push(lbl);
    }
  }

  function updateContainerUI() {
    const COLOR  = { up: 0x00aa55, crashed: 0xcc2222, restarting: 0xaaaa00 };
    const ICON   = { up: '✅', crashed: '💥', restarting: '🔄' };
    const STATUS = { up: '', crashed: 'CRASH', restarting: 'INIT' };

    containerStates.forEach((state, i) => {
      const { gfx, bx, by, bw, bh } = containerBoxes[i];
      gfx.clear();
      gfx.fillStyle(COLOR[state], 1);
      gfx.fillRoundedRect(bx, by, bw, bh, 5);
      containerLabels[i].setText(`C${i + 1}\n${ICON[state]}\n${STATUS[state]}`);
    });
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function buildHUD(W, H) {
    const style = { fontSize: '14px', fill: '#dddddd', fontFamily: 'monospace' };
    levelText = scene.add.text(12, 12, 'LEVEL: 1 / 10', style);
    scoreText = scene.add.text(W / 2, 12, 'SCORE: 0', style).setOrigin(0.5, 0);
    livesText = scene.add.text(W - 12, 12, '❤️❤️❤️', { ...style, fontSize: '13px' }).setOrigin(1, 0);
  }

  // ─── Progress bar ─────────────────────────────────────────────────────────

  function buildProgressBar(W, H) {
    const BY = H - 28;
    const BX = 60;
    const BW = W - 120;
    const BH = 12;

    scene.add.text(BX, BY - 18, 'ZOMBIES TO KILL:', {
      fontSize: '10px', fill: '#7799dd', fontFamily: 'monospace',
    });

    const bg = scene.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(BX, BY, BW, BH, 6);
    bg.lineStyle(1, 0x445588, 1);
    bg.strokeRoundedRect(BX, BY, BW, BH, 6);

    progressBar = scene.add.graphics();
    refreshProgressBar(W, H);
  }

  function refreshProgressBar(W, H) {
    const BY = H - 28;
    const BX = 60;
    const BW = W - 120;
    const BH = 12;
    const required = LEVELS[currentLevel] ? LEVELS[currentLevel].zombiesRequired : 1;
    const ratio = Math.min(zombiesKilledInLevel / required, 1);

    progressBar.clear();
    if (ratio > 0) {
      progressBar.fillStyle(0x44ff88, 1);
      progressBar.fillRoundedRect(BX + 1, BY + 1, (BW - 2) * ratio, BH - 2, 5);
    }
  }

  // ─── Overlay helpers ──────────────────────────────────────────────────────

  function clearOverlay() {
    overlayItems.forEach(item => { if (item && item.destroy) item.destroy(); });
    overlayItems = [];
  }

  function overlayBg(W, H, alpha) {
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, alpha);
    bg.fillRect(0, 0, W, H);
    overlayItems.push(bg);
  }

  function overlayText(x, y, text, size, color) {
    const t = scene.add.text(x, y, text, {
      fontSize: size, fill: color, fontFamily: 'monospace', align: 'center',
      wordWrap: { width: scene.scale.width * 0.85 },
    }).setOrigin(0.5, 0.5);
    overlayItems.push(t);
    return t;
  }

  function overlayButton(x, y, label) {
    const BW = Math.min(scene.scale.width * 0.6, 300);
    const BH = 44;
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a3a6a, 1);
    bg.fillRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 10);
    bg.lineStyle(2, 0x5577bb, 1);
    bg.strokeRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 10);
    overlayItems.push(bg);

    const t = scene.add.text(x, y, label, {
      fontSize: '15px', fill: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);
    overlayItems.push(t);
    t.setInteractive({ useHandCursor: true });
    return t;
  }

  // ─── Screens ──────────────────────────────────────────────────────────────

  function showStartScreen(W, H) {
    clearOverlay();
    gameActive = false;
    overlayBg(W, H, 0.78);
    overlayText(W / 2, H * 0.20, '🧟  CHAOS  ZOMBIE  🧟', '32px', '#ff4444');
    overlayText(W / 2, H * 0.35, 'Shoot zombies to trigger container crashes!\nSurvive all 10 levels to win.', '13px', '#ccccff');
    overlayText(W / 2, H * 0.50, '⚠️  Each shot crashes a Docker container.\nAs levels rise, zombies move FASTER!', '12px', '#ffcc66');
    overlayText(W / 2, H * 0.63, '💡 Tap directly on a zombie to shoot it', '12px', '#88ddff');
    const btn = overlayButton(W / 2, H * 0.80, '▶   START GAME');
    btn.on('pointerdown', () => startLevel(0));
  }

  function showLevelTransition(W, H) {
    clearOverlay();
    if (spawnTimer) spawnTimer.remove();
    zombieGroup.clear(true, true);

    // currentLevel has already been incremented by onZombieShot
    const completedLevelDisplay = currentLevel;       // 1-indexed display of the level just finished
    const nextLevelIndex        = currentLevel;       // 0-indexed index of the upcoming level

    if (nextLevelIndex >= LEVELS.length) {
      showWinScreen(W, H);
      return;
    }

    const prevSpeed = LEVELS[nextLevelIndex - 1].speed;
    const nextSpeed = LEVELS[nextLevelIndex].speed;
    const pctFaster = Math.round((nextSpeed / prevSpeed - 1) * 100);

    overlayBg(W, H, 0.80);
    overlayText(W / 2, H * 0.25, `✅  LEVEL ${completedLevelDisplay} COMPLETE!`, '28px', '#44ff88');
    overlayText(W / 2, H * 0.42, `Score: ${score}`, '18px', '#ffffff');
    overlayText(W / 2, H * 0.55,
      `Level ${nextLevelIndex + 1}: Zombies are ${pctFaster}% faster!\nContainers restart quicker too.`,
      '13px', '#ffcc44');
    const btn = overlayButton(W / 2, H * 0.76, `▶   LEVEL ${nextLevelIndex + 1}`);
    btn.on('pointerdown', () => startLevel(nextLevelIndex));
  }

  function showWinScreen(W, H) {
    clearOverlay();
    if (spawnTimer) spawnTimer.remove();
    gameActive = false;
    overlayBg(W, H, 0.82);
    overlayText(W / 2, H * 0.23, '🏆  YOU WIN!  🏆', '32px', '#ffdd00');
    overlayText(W / 2, H * 0.38, 'All 10 levels survived!', '16px', '#ffffff');
    overlayText(W / 2, H * 0.50, `Final Score: ${score}`, '20px', '#44ff88');
    overlayText(W / 2, H * 0.62,
      'The platform survived all chaos!\nSRE: Reliability under expected chaos.', '12px', '#88aaff');
    const btn = overlayButton(W / 2, H * 0.80, '🔁   PLAY AGAIN');
    btn.on('pointerdown', () => resetAndStart(0));
  }

  function showGameOver(W, H) {
    clearOverlay();
    if (spawnTimer) spawnTimer.remove();
    zombieGroup.clear(true, true);
    gameActive = false;
    overlayBg(W, H, 0.82);
    overlayText(W / 2, H * 0.25, '💀  GAME OVER  💀', '32px', '#ff3333');
    overlayText(W / 2, H * 0.42, `Score: ${score}`, '18px', '#ffffff');
    overlayText(W / 2, H * 0.54,
      'The platform was overwhelmed by chaos.\nReliability requires constant vigilance!', '13px', '#ff8888');
    const btn = overlayButton(W / 2, H * 0.76, '🔁   TRY AGAIN');
    btn.on('pointerdown', () => resetAndStart(0));
  }

  function resetAndStart(levelIndex) {
    score = 0;
    lives = 3;
    containerStates = Array(NUM_CONTAINERS).fill('up');
    startLevel(levelIndex);
  }

  // ─── Level management ─────────────────────────────────────────────────────

  function startLevel(levelIndex) {
    clearOverlay();
    currentLevel        = levelIndex;
    zombiesKilledInLevel = 0;
    nextCrashIndex      = 0;
    gameActive          = true;

    zombieGroup.clear(true, true);
    containerStates = Array(NUM_CONTAINERS).fill('up');
    updateContainerUI();

    const W = scene.scale.width;
    const H = scene.scale.height;

    levelText.setText(`LEVEL: ${levelIndex + 1} / 10`);
    scoreText.setText(`SCORE: ${score}`);
    livesText.setText('❤️'.repeat(lives));
    refreshProgressBar(W, H);

    if (spawnTimer) spawnTimer.remove();
    const lvl = LEVELS[levelIndex];
    spawnTimer = scene.time.addEvent({
      delay: lvl.spawnInterval,
      callback: spawnZombie,
      callbackScope: scene,
      loop: true,
    });

    // Spawn the first zombie immediately so players don't wait
    spawnZombie();
  }

  // ─── Zombie spawning ──────────────────────────────────────────────────────

  function spawnZombie() {
    if (!gameActive) return;

    const W = scene.scale.width;
    const H = scene.scale.height;
    const zombieY = H * ZOMBIE_Y_RATIO;
    const lvl = LEVELS[currentLevel];

    // Slight vertical variance so zombies don't all walk the same line
    const yVariance = Phaser.Math.Between(-18, 18);

    // Draw the zombie sprite procedurally
    const gfx = scene.add.graphics();
    drawZombie(gfx);

    // Wrap in a container so we can attach physics + interactivity
    const container = scene.add.container(W + 30, zombieY + yVariance, [gfx]);
    zombieGroup.add(container);

    scene.physics.world.enable(container);
    container.body.setVelocityX(-lvl.speed);
    container.body.setAllowGravity(false);

    const HIT_W = 38;
    const HIT_H = 70;
    container.body.setSize(HIT_W, HIT_H);
    container.body.setOffset(-HIT_W / 2, -HIT_H);

    // Make the container tappable / clickable
    container.setSize(HIT_W, HIT_H);
    container.setInteractive();
    container.on('pointerdown', () => {
      if (gameActive && container.active) {
        onZombieShot(container, W, H);
      }
    });
  }

  function drawZombie(gfx) {
    // Body
    gfx.fillStyle(0x55aa44, 1);
    gfx.fillRect(-14, -58, 28, 40);

    // Head
    gfx.fillStyle(0x88cc77, 1);
    gfx.fillCircle(0, -70, 14);

    // Eyes (red)
    gfx.fillStyle(0xff2222, 1);
    gfx.fillRect(-7, -74, 4, 4);
    gfx.fillRect(3, -74, 4, 4);

    // Mouth
    gfx.fillStyle(0x223322, 1);
    gfx.fillRect(-6, -65, 12, 3);

    // Arms outstretched toward the player (left)
    gfx.fillStyle(0x55aa44, 1);
    gfx.fillRect(-30, -52, 16, 7);
    gfx.fillRect(14, -52, 16, 7);

    // Legs
    gfx.fillStyle(0x334433, 1);
    gfx.fillRect(-12, -18, 10, 18);
    gfx.fillRect(2, -18, 10, 18);
  }

  // ─── Shot / escape handlers ───────────────────────────────────────────────

  function onZombieShot(zombie, W, H) {
    const zx = zombie.x;
    const zy = zombie.y;
    zombie.setActive(false).setVisible(false).destroy();

    score += (currentLevel + 1) * 10;
    scoreText.setText(`SCORE: ${score}`);

    showBang(zx, zy);
    triggerContainerCrash();

    zombiesKilledInLevel++;
    refreshProgressBar(W, H);

    // Check whether this level's quota has been met
    if (zombiesKilledInLevel >= LEVELS[currentLevel].zombiesRequired) {
      currentLevel++;
      scene.time.delayedCall(600, () => {
        if (currentLevel >= LEVELS.length) {
          showWinScreen(W, H);
        } else {
          showLevelTransition(W, H);
        }
      });
    }
  }

  function onZombieEscaped(W) {
    lives = Math.max(0, lives - 1);
    const H = scene.scale.height;
    livesText.setText(lives > 0 ? '❤️'.repeat(lives) : '💔');

    // Red flash to signal the escape
    const flash = scene.add.graphics();
    flash.fillStyle(0xff0000, 0.35);
    flash.fillRect(0, 0, W, H);
    scene.tweens.add({
      targets: flash, alpha: 0, duration: 500,
      onComplete: () => flash.destroy(),
    });

    if (lives <= 0) {
      gameActive = false;
      scene.time.delayedCall(600, () => showGameOver(W, H));
    }
  }

  // ─── Visual effects ───────────────────────────────────────────────────────

  function showBang(x, y) {
    const bang = scene.add.text(x, y - 10, '💥 BANG!', {
      fontSize: '16px', fill: '#ffcc00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0.5);
    scene.tweens.add({
      targets: bang, y: y - 55, alpha: 0, duration: 600, ease: 'Power2',
      onComplete: () => bang.destroy(),
    });
  }

  // ─── Container crash logic ────────────────────────────────────────────────

  function triggerContainerCrash() {
    // Collect indices of currently running containers
    const running = [];
    containerStates.forEach((s, i) => { if (s === 'up') running.push(i); });
    if (running.length === 0) return;

    const idx = running[nextCrashIndex % running.length];
    nextCrashIndex++;

    containerStates[idx] = 'crashed';
    updateContainerUI();

    const restartMs = RESTART_TIMES_MS[currentLevel] !== undefined
      ? RESTART_TIMES_MS[currentLevel]
      : 1500;

    // Show 'restarting' (yellow) after 40 % of restart time
    scene.time.delayedCall(restartMs * 0.4, () => {
      if (containerStates[idx] === 'crashed') {
        containerStates[idx] = 'restarting';
        updateContainerUI();
      }
    });

    // Back to 'up' (green) once fully restarted
    scene.time.delayedCall(restartMs, () => {
      containerStates[idx] = 'up';
      updateContainerUI();
    });
  }

  // ─── Global pointer handler ───────────────────────────────────────────────

  function handlePointerDown() {
    // Individual zombie containers handle their own 'pointerdown' events.
    // This global handler is a no-op placeholder kept for extensibility.
  }
};
