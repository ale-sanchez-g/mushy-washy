// Barista Error Budget Game
window.onload = function() {
  // Game state
  let gameState = {
    selectedSLO: null,
    currentLevel: 0,
    totalOrders: 0,
    successfulOrders: 0,
    failedOrders: 0,
    currentSLO: 1.0,
    errorBudgetRemaining: 0,
    score: 0,
    activeOrders: [],
    isPaused: false,
    gamePhase: 'sloSelection', // sloSelection, playing, gameOver
    spawnTimerId: null
  };

  // Phaser game configuration
  const config = {
    type: Phaser.AUTO,
    width: BaristaConfig.gameSettings.canvasWidth,
    height: BaristaConfig.gameSettings.canvasHeight,
    parent: 'game-container',
    backgroundColor: '#2d3436',
    scene: {
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);
  let graphics;
  let texts = {};

  function create() {
    graphics = this.add.graphics();
    
    // Show SLO selection screen
    showSLOSelection.call(this);
  }

  function showSLOSelection() {
    const scene = this;
    graphics.clear();

    // Title
    const title = scene.add.text(400, 50, 'Barista Error Budget Game', {
      fontSize: '32px',
      fontWeight: 'bold',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = scene.add.text(400, 100, 'Choose Your SLO Target', {
      fontSize: '24px',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    // Description
    const description = scene.add.text(400, 140, 
      'Higher SLO = Less room for errors = Harder to experiment!', {
      fontSize: '16px',
      fill: '#ecf0f1',
      align: 'center',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);

    // Create SLO option buttons
    BaristaConfig.sloOptions.forEach((slo, index) => {
      const y = 200 + index * 90;
      
      // Button background
      const button = scene.add.rectangle(400, y, 600, 70, 0x3498db, 0.8);
      button.setInteractive({ useHandCursor: true });
      button.setStrokeStyle(3, 0xffffff);

      // Button text
      const buttonText = scene.add.text(400, y - 15, slo.name, {
        fontSize: '28px',
        fontWeight: 'bold',
        fill: '#fff'
      }).setOrigin(0.5);

      const buttonDesc = scene.add.text(400, y + 15, slo.description, {
        fontSize: '14px',
        fill: '#ecf0f1'
      }).setOrigin(0.5);

      // Hover effects
      button.on('pointerover', () => {
        button.setFillStyle(0x2980b9);
        button.setScale(1.05);
      });

      button.on('pointerout', () => {
        button.setFillStyle(0x3498db);
        button.setScale(1.0);
      });

      // Click handler
      button.on('pointerdown', () => {
        gameState.selectedSLO = slo;
        gameState.errorBudgetRemaining = slo.errorBudget;
        startGame.call(scene);
      });
    });
  }

  function startGame() {
    const scene = this;
    
    // Clear selection screen
    scene.children.removeAll();
    graphics.clear();

    gameState.gamePhase = 'playing';
    gameState.currentLevel = 0;
    gameState.totalOrders = 0;
    gameState.successfulOrders = 0;
    gameState.failedOrders = 0;
    gameState.score = 0;
    gameState.activeOrders = [];

    // Create UI elements
    createGameUI.call(scene);
    
    // Start first level
    startLevel.call(scene);
  }

  function createGameUI() {
    const scene = this;

    // Header background
    graphics.fillStyle(0x34495e, 0.9);
    graphics.fillRect(0, 0, 800, 100);

    // SLO Info
    texts.sloInfo = scene.add.text(20, 15, 
      `SLO Target: ${gameState.selectedSLO.name}`, {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#3498db'
    });

    // Error Budget
    texts.errorBudget = scene.add.text(20, 45, 
      `Error Budget: ${gameState.errorBudgetRemaining}`, {
      fontSize: '18px',
      fill: getErrorBudgetColor()
    });

    // Current SLO Performance
    texts.currentSLO = scene.add.text(20, 70, 
      `Current SLO: ${(gameState.currentSLO * 100).toFixed(2)}%`, {
      fontSize: '18px',
      fill: '#2ecc71'
    });

    // Score
    texts.score = scene.add.text(780, 15, 
      `Score: ${gameState.score}`, {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#f1c40f'
    }).setOrigin(1, 0);

    // Level Info
    texts.level = scene.add.text(780, 45, 
      `Level: ${gameState.currentLevel + 1}`, {
      fontSize: '18px',
      fill: '#fff'
    }).setOrigin(1, 0);

    // Orders count
    texts.orders = scene.add.text(780, 70, 
      `Orders: ${gameState.successfulOrders}/${gameState.totalOrders}`, {
      fontSize: '18px',
      fill: '#95a5a6'
    }).setOrigin(1, 0);

    // Instructions
    texts.instructions = scene.add.text(400, 115, 
      'Click on orders to complete them! Faster = Better!', {
      fontSize: '16px',
      fill: '#ecf0f1',
      align: 'center'
    }).setOrigin(0.5);
  }

  function startLevel() {
    const scene = this;
    
    // Cancel any pending spawn timer from previous level
    if (gameState.spawnTimerId) {
      gameState.spawnTimerId.remove();
      gameState.spawnTimerId = null;
    }
    
    const level = BaristaConfig.levels[gameState.currentLevel];

    if (!level) {
      // Game won! All levels completed
      endGame.call(scene, true);
      return;
    }

    // Show level start message
    const levelText = scene.add.text(400, 300, 
      `Level ${level.number}: ${level.name}\n${level.description}`, {
      fontSize: '28px',
      fontWeight: 'bold',
      fill: '#fff',
      align: 'center',
      backgroundColor: '#34495e',
      padding: { x: 30, y: 20 }
    }).setOrigin(0.5);

    scene.time.delayedCall(2000, () => {
      levelText.destroy();
      
      // Start spawning orders
      spawnOrders.call(scene, level);
      
      // End level after duration
      scene.time.delayedCall(level.duration, () => {
        // Move to next level
        gameState.currentLevel++;
        startLevel.call(scene);
      });
    });
  }

  function spawnOrders(level) {
    const scene = this;
    
    const spawnOrder = () => {
      if (gameState.gamePhase !== 'playing') return;

      const orderTypes = BaristaConfig.coffeeOrders[level.complexity];
      const orderType = Phaser.Math.RND.pick(orderTypes);
      
      createOrder.call(scene, orderType);
      
      // Schedule next order
      gameState.spawnTimerId = scene.time.delayedCall(level.spawnDelay, spawnOrder);
    };

    spawnOrder();
  }

  function createOrder(orderType) {
    const scene = this;
    
    gameState.totalOrders++;
    
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(150, 550);

    // Order background
    const orderBg = scene.add.rectangle(x, y, 140, 100, 0xffffff, 0.9);
    orderBg.setStrokeStyle(3, 0x27ae60);
    orderBg.setInteractive({ useHandCursor: true });

    // Order icon
    const orderIcon = scene.add.text(x, y - 20, orderType.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);

    // Order name
    const orderName = scene.add.text(x, y + 15, orderType.name, {
      fontSize: '12px',
      fontWeight: 'bold',
      fill: '#000',
      align: 'center',
      wordWrap: { width: 130 }
    }).setOrigin(0.5);

    // Timer bar background
    const timerBg = scene.add.rectangle(x, y + 40, 120, 10, 0xecf0f1);
    const timerBar = scene.add.rectangle(x, y + 40, 120, 10, 0x2ecc71);

    const order = {
      bg: orderBg,
      icon: orderIcon,
      name: orderName,
      timerBg: timerBg,
      timerBar: timerBar,
      type: orderType,
      startTime: Date.now(),
      lifetime: BaristaConfig.gameSettings.orderLifetime
    };

    gameState.activeOrders.push(order);

    // Click handler
    orderBg.on('pointerdown', () => {
      completeOrder.call(scene, order);
    });

    // Update timer
    const updateTimer = () => {
      if (!order.bg.active) return;

      const elapsed = Date.now() - order.startTime;
      const remaining = Math.max(0, order.lifetime - elapsed);
      const progress = remaining / order.lifetime;

      timerBar.setScale(progress, 1);
      
      // Change color based on time remaining
      if (progress > 0.5) {
        timerBar.setFillStyle(0x2ecc71);
        orderBg.setStrokeStyle(3, 0x27ae60);
      } else if (progress > 0.25) {
        timerBar.setFillStyle(0xf39c12);
        orderBg.setStrokeStyle(3, 0xf39c12);
      } else {
        timerBar.setFillStyle(0xe74c3c);
        orderBg.setStrokeStyle(3, 0xe74c3c);
      }

      if (remaining > 0) {
        scene.time.delayedCall(50, updateTimer);
      } else {
        // Order expired
        failOrder.call(scene, order);
      }
    };

    updateTimer();
  }

  function completeOrder(order) {
    const scene = this;
    
    // Remove from active orders
    const index = gameState.activeOrders.indexOf(order);
    if (index > -1) {
      gameState.activeOrders.splice(index, 1);
    }

    gameState.successfulOrders++;
    
    // Calculate score based on speed
    const elapsed = Date.now() - order.startTime;
    const speedBonus = Math.max(0, Math.floor((order.lifetime - elapsed) / 100));
    const points = 100 + speedBonus;
    gameState.score += points;

    // Visual feedback
    const successText = scene.add.text(order.bg.x, order.bg.y, `+${points}`, {
      fontSize: '24px',
      fontWeight: 'bold',
      fill: '#2ecc71'
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: successText,
      y: order.bg.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => successText.destroy()
    });

    // Destroy order
    order.bg.destroy();
    order.icon.destroy();
    order.name.destroy();
    order.timerBg.destroy();
    order.timerBar.destroy();

    updateGameUI.call(scene);
  }

  function failOrder(order) {
    const scene = this;
    
    // Remove from active orders
    const index = gameState.activeOrders.indexOf(order);
    if (index > -1) {
      gameState.activeOrders.splice(index, 1);
    }

    gameState.failedOrders++;
    
    // Deduct from error budget
    if (gameState.selectedSLO.errorBudget > 0) {
      gameState.errorBudgetRemaining--;
    }

    // Visual feedback
    const failText = scene.add.text(order.bg.x, order.bg.y, '✗ FAILED', {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#e74c3c'
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: failText,
      y: order.bg.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => failText.destroy()
    });

    // Destroy order with red flash
    scene.tweens.add({
      targets: [order.bg, order.icon, order.name, order.timerBg, order.timerBar],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        order.bg.destroy();
        order.icon.destroy();
        order.name.destroy();
        order.timerBg.destroy();
        order.timerBar.destroy();
      }
    });

    updateGameUI.call(scene);

    // Check if error budget exhausted
    if (gameState.errorBudgetRemaining <= 0) {
      endGame.call(scene, false);
    }
  }

  function updateGameUI() {
    if (!texts.errorBudget) return;

    // Update error budget
    texts.errorBudget.setText(`Error Budget: ${gameState.errorBudgetRemaining}`);
    texts.errorBudget.setColor(getErrorBudgetColor());

    // Update current SLO
    const currentSLO = gameState.totalOrders > 0 
      ? gameState.successfulOrders / gameState.totalOrders 
      : 1.0;
    gameState.currentSLO = currentSLO;
    texts.currentSLO.setText(`Current SLO: ${(currentSLO * 100).toFixed(2)}%`);
    
    // Color based on meeting SLO
    if (currentSLO >= gameState.selectedSLO.value) {
      texts.currentSLO.setColor('#2ecc71');
    } else {
      texts.currentSLO.setColor('#e74c3c');
    }

    // Update score
    texts.score.setText(`Score: ${gameState.score}`);

    // Update level
    texts.level.setText(`Level: ${gameState.currentLevel + 1}`);

    // Update orders
    texts.orders.setText(`Orders: ${gameState.successfulOrders}/${gameState.totalOrders}`);
  }

  function getErrorBudgetColor() {
    if (gameState.selectedSLO.errorBudget === 0) {
      return '#e74c3c'; // Red for no error budget
    }
    
    const percentage = gameState.errorBudgetRemaining / gameState.selectedSLO.errorBudget;
    if (percentage > 0.5) return '#2ecc71'; // Green
    if (percentage > 0.25) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  }

  function endGame(won) {
    const scene = this;
    gameState.gamePhase = 'gameOver';

    // Clear active orders
    gameState.activeOrders.forEach(order => {
      order.bg.destroy();
      order.icon.destroy();
      order.name.destroy();
      order.timerBg.destroy();
      order.timerBar.destroy();
    });
    gameState.activeOrders = [];

    // Game over overlay
    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    overlay.setInteractive(); // Block clicks from passing through

    // Title
    const title = scene.add.text(400, 150, 
      won ? '🎉 Congratulations!' : '💔 Game Over', {
      fontSize: '48px',
      fontWeight: 'bold',
      fill: won ? '#2ecc71' : '#e74c3c'
    }).setOrigin(0.5);

    // Message
    const message = won 
      ? 'You completed all levels!'
      : gameState.errorBudgetRemaining <= 0
        ? 'Error budget exhausted!'
        : 'Better luck next time!';

    const messageText = scene.add.text(400, 220, message, {
      fontSize: '24px',
      fill: '#fff'
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Final Score: ${gameState.score}`,
      `SLO Target: ${gameState.selectedSLO.name}`,
      `Final SLO: ${(gameState.currentSLO * 100).toFixed(2)}%`,
      `Orders Completed: ${gameState.successfulOrders}/${gameState.totalOrders}`,
      `Success Rate: ${gameState.totalOrders > 0 ? ((gameState.successfulOrders / gameState.totalOrders) * 100).toFixed(1) : 0}%`
    ];

    stats.forEach((stat, index) => {
      scene.add.text(400, 280 + index * 30, stat, {
        fontSize: '18px',
        fill: '#ecf0f1'
      }).setOrigin(0.5);
    });

    // Lesson learned
    const lesson = scene.add.text(400, 420, 
      'Higher SLO targets leave less room for errors,\nmaking it harder to experiment and innovate!', {
      fontSize: '16px',
      fill: '#f39c12',
      align: 'center',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Player name input
    const nameLabel = scene.add.text(400, 470, 'Enter your name:', {
      fontSize: '16px',
      fill: '#fff'
    }).setOrigin(0.5);

    // Create HTML input element for player name
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.id = 'playerNameInput';
    inputElement.placeholder = 'Player Name';
    inputElement.maxLength = 20;
    inputElement.style.position = 'absolute';
    inputElement.style.width = '200px';
    inputElement.style.height = '30px';
    inputElement.style.fontSize = '16px';
    inputElement.style.textAlign = 'center';
    inputElement.style.border = '2px solid #3498db';
    inputElement.style.borderRadius = '5px';
    inputElement.style.backgroundColor = '#fff';
    inputElement.style.color = '#000';
    
    // Position the input element relative to the canvas
    const canvas = scene.sys.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    inputElement.style.left = (canvasRect.left + 300) + 'px';
    inputElement.style.top = (canvasRect.top + 490) + 'px';
    
    document.body.appendChild(inputElement);
    inputElement.focus();

    // Store reference to clean up later
    const cleanupInput = () => {
      if (inputElement && inputElement.parentNode) {
        document.body.removeChild(inputElement);
      }
    };

    // Buttons
    const playAgainBtn = scene.add.rectangle(300, 550, 180, 50, 0x3498db);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(2, 0xffffff);

    const playAgainText = scene.add.text(300, 550, 'Play Again', {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#fff'
    }).setOrigin(0.5);

    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x2980b9));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(0x3498db));
    playAgainBtn.on('pointerdown', () => {
      // Save score before restarting
      const playerName = inputElement.value.trim() || 'Anonymous';
      saveScore(playerName, gameState.score, gameState.selectedSLO.name);
      
      // Clean up input element
      cleanupInput();
      
      scene.scene.restart();
      gameState = {
        selectedSLO: null,
        currentLevel: 0,
        totalOrders: 0,
        successfulOrders: 0,
        failedOrders: 0,
        currentSLO: 1.0,
        errorBudgetRemaining: 0,
        score: 0,
        activeOrders: [],
        isPaused: false,
        gamePhase: 'sloSelection',
        spawnTimerId: null
      };
      texts = {};
    });

    const backBtn = scene.add.rectangle(500, 550, 180, 50, 0x95a5a6);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.setStrokeStyle(2, 0xffffff);

    const backText = scene.add.text(500, 550, 'Back to Menu', {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#fff'
    }).setOrigin(0.5);

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x7f8c8d));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x95a5a6));
    backBtn.on('pointerdown', () => {
      // Save score before leaving
      const playerName = inputElement.value.trim() || 'Anonymous';
      saveScore(playerName, gameState.score, gameState.selectedSLO.name);
      
      // Clean up input element
      cleanupInput();
      
      window.location.href = 'index.html';
    });
  }

  // Cookie helper functions
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function saveScore(playerName, score, slo) {
    const scores = getScores();
    scores.push({
      playerName: playerName,
      score: score,
      slo: slo,
      date: new Date().toISOString()
    });
    // Keep only top 10 scores
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 10) {
      scores.length = 10;
    }
    setCookie('baristaScores', JSON.stringify(scores), 365);
  }

  function getScores() {
    const scoresStr = getCookie('baristaScores');
    if (!scoresStr) return [];
    
    try {
      return JSON.parse(scoresStr);
    } catch (e) {
      // If cookie data is corrupted, return empty array
      console.warn('Failed to parse scores from cookie:', e);
      return [];
    }
  }

  function update() {
    // Main update loop
    // Most game logic is handled by timers and events
  }
};
