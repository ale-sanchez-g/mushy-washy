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
    spawnTimerId: null,
    levelStartTimerId: null,
    levelEndTimerId: null
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
  let sloSelectionElements = []; // Store references to SLO selection UI elements

  function resetGameState() {
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
      spawnTimerId: null,
      levelStartTimerId: null,
      levelEndTimerId: null
    };
    texts = {};
    sloSelectionElements = [];
  }

  function create() {
    graphics = this.add.graphics();
    
    // Show SLO selection screen
    showSLOSelection.call(this);
  }

  function showSLOSelection() {
    const scene = this;
    graphics.clear();
    sloSelectionElements = []; // Reset the array

    // Title
    const title = scene.add.text(400, 50, 'Barista Promise', {
      fontSize: '32px',
      fontWeight: 'bold',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);
    sloSelectionElements.push(title);

    // Subtitle
    const subtitle = scene.add.text(400, 100, 'What do you value more?', {
      fontSize: '24px',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);
    sloSelectionElements.push(subtitle);

    // Description
    const description = scene.add.text(400, 140, 
      'Higher % = Less room for errors = Harder to experiment! \n THIS IS AN SLO', {
      fontSize: '16px',
      fill: '#ecf0f1',
      align: 'center',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);
    sloSelectionElements.push(description);

    // Create SLO option buttons
    BaristaConfig.sloOptions.forEach((slo, index) => {
      const y = 200 + index * 90;
      
      // Button background
      const button = scene.add.rectangle(400, y, 600, 70, 0x3498db, 0.8);
      button.setInteractive({ useHandCursor: true });
      button.setStrokeStyle(3, 0xffffff);
      sloSelectionElements.push(button);

      // Button text
      const buttonText = scene.add.text(400, y - 15, slo.name, {
        fontSize: '28px',
        fontWeight: 'bold',
        fill: '#fff'
      }).setOrigin(0.5);
      sloSelectionElements.push(buttonText);

      const buttonDesc = scene.add.text(400, y + 15, slo.description, {
        fontSize: '14px',
        fill: '#ecf0f1'
      }).setOrigin(0.5);
      sloSelectionElements.push(buttonDesc);

      // Hover effects
      button.on('pointerover', () => {
        if (gameState.gamePhase !== 'sloSelection') return;
        button.setFillStyle(0x2980b9);
        button.setScale(1.05);
      });

      button.on('pointerout', () => {
        if (gameState.gamePhase !== 'sloSelection') return;
        button.setFillStyle(0x3498db);
        button.setScale(1.0);
      });

      // Click handler
      button.on('pointerdown', () => {
        // Only process click if we're still in SLO selection phase
        if (gameState.gamePhase !== 'sloSelection') return;
        
        gameState.selectedSLO = slo;
        gameState.errorBudgetRemaining = slo.errorBudget;
        startGame.call(scene);
      });
    });
  }

  function startGame() {
    const scene = this;
    
    // Change game phase immediately to prevent any more clicks
    gameState.gamePhase = 'playing';
    
    // Destroy all SLO selection elements and disable their interactivity
    sloSelectionElements.forEach(element => {
      if (element.disableInteractive) {
        element.disableInteractive();
      }
      element.destroy();
    });
    sloSelectionElements = [];
    
    // Clear any remaining graphics
    graphics.clear();

    // Reset game state
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
      `Our Promise (SLO): ${gameState.selectedSLO.name}`, {
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#3498db'
    });

    // Error Budget
    texts.errorBudget = scene.add.text(20, 45, 
      `Allowed mistakes (Error Budget): ${gameState.errorBudgetRemaining}`, {
      fontSize: '18px',
      fill: getErrorBudgetColor()
    });

    // Current SLO Performance
    texts.currentSLO = scene.add.text(20, 70, 
      `Keeping my promise: ${(gameState.currentSLO * 100).toFixed(2)}%`, {
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
      'If you take too long, it will affect your promise!', {
      fontSize: '16px',
      fill: '#ecf0f1',
      align: 'center'
    }).setOrigin(0.5);
  }

  function startLevel() {
    const scene = this;
    
    // Don't start level if game is over
    if (gameState.gamePhase === 'gameOver') return;
    
    // Cancel any pending timers from previous level
    if (gameState.spawnTimerId) {
      gameState.spawnTimerId.remove();
      gameState.spawnTimerId = null;
    }
    if (gameState.levelStartTimerId) {
      gameState.levelStartTimerId.remove();
      gameState.levelStartTimerId = null;
    }
    if (gameState.levelEndTimerId) {
      gameState.levelEndTimerId.remove();
      gameState.levelEndTimerId = null;
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

    gameState.levelStartTimerId = scene.time.delayedCall(2000, () => {
      // Check if game ended while waiting
      if (gameState.gamePhase === 'gameOver') {
        if (levelText && levelText.active) {
          levelText.destroy();
        }
        return;
      }
      
      levelText.destroy();
      
      // Start spawning orders
      spawnOrders.call(scene, level);
      
      // End level after duration
      gameState.levelEndTimerId = scene.time.delayedCall(level.duration, () => {
        // Check if game ended during level
        if (gameState.gamePhase === 'gameOver') return;
        
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
    texts.errorBudget.setText(`Allowed mistakes (Error Budget): ${gameState.errorBudgetRemaining}`);
    texts.errorBudget.setColor(getErrorBudgetColor());

    // Update current SLO
    const currentSLO = gameState.totalOrders > 0 
      ? gameState.successfulOrders / gameState.totalOrders 
      : 1.0;
    gameState.currentSLO = currentSLO;
    texts.currentSLO.setText(`Keeping my promise: ${(currentSLO * 100).toFixed(2)}%`);
    
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

    // Cancel all active timers to prevent level popups
    if (gameState.spawnTimerId) {
      gameState.spawnTimerId.remove();
      gameState.spawnTimerId = null;
    }
    if (gameState.levelStartTimerId) {
      gameState.levelStartTimerId.remove();
      gameState.levelStartTimerId = null;
    }
    if (gameState.levelEndTimerId) {
      gameState.levelEndTimerId.remove();
      gameState.levelEndTimerId = null;
    }

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
    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 1);
    overlay.setInteractive(); // Block clicks from passing through

    // Title
    const title = scene.add.text(400, 60, 
      won ? '🎉 Congratulations!' : '💔 Game Over', {
      fontSize: '42px',
      fontWeight: 'bold',
      fill: won ? '#2ecc71' : '#e74c3c'
    }).setOrigin(0.5);

    // Message
    const message = won 
      ? 'You completed all levels!'
      : gameState.errorBudgetRemaining <= 0
        ? 'You broke the promise!'
        : 'Better luck next time!';

    const messageText = scene.add.text(400, 115, message, {
      fontSize: '20px',
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
      scene.add.text(400, 155 + index * 30, stat, {
        fontSize: '16px',
        fill: '#ecf0f1'
      }).setOrigin(0.5);
    });

    // Lesson learned
    const lesson = scene.add.text(400, 315, 
      'Higher SLO targets leave less room for errors,\nmaking it harder to experiment and innovate!', {
      fontSize: '13px',
      fill: '#f39c12',
      align: 'center',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Player name input
    const nameLabel = scene.add.text(400, 375, 'Enter your name for the leaderboard:', {
      fontSize: '15px',
      fill: '#fff'
    }).setOrigin(0.5);
    
    const nameHint = scene.add.text(400, 442, '(Click any button below to save score)', {
      fontSize: '12px',
      fill: '#95a5a6',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Create HTML input element for player name
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.id = 'playerNameInput';
    inputElement.placeholder = 'Player Name';
    inputElement.maxLength = 20;
    inputElement.style.position = 'absolute';
    inputElement.style.width = '220px';
    inputElement.style.height = '32px';
    inputElement.style.fontSize = '16px';
    inputElement.style.textAlign = 'center';
    inputElement.style.border = '2px solid #3498db';
    inputElement.style.borderRadius = '5px';
    inputElement.style.backgroundColor = '#fff';
    inputElement.style.color = '#000';
    
    // Position the input element relative to the canvas
    const canvas = scene.sys.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    inputElement.style.left = (canvasRect.left + 290) + 'px';
    inputElement.style.top = (canvasRect.top + 395) + 'px';
    
    document.body.appendChild(inputElement);
    inputElement.focus();

    // Store reference to clean up later
    const cleanupInput = () => {
      if (inputElement && inputElement.parentNode) {
        document.body.removeChild(inputElement);
      }
    };

    // Buttons - repositioned to be more compact
    const buttonY = 470;
    const buttonSpacing = 145;
    
    const leaderboardBtn = scene.add.rectangle(400 - buttonSpacing, buttonY, 130, 45, 0x9b59b6);
    leaderboardBtn.setInteractive({ useHandCursor: true });
    leaderboardBtn.setStrokeStyle(2, 0xffffff);

    const leaderboardText = scene.add.text(400 - buttonSpacing, buttonY, 'Leaderboard', {
      fontSize: '16px',
      fontWeight: 'bold',
      fill: '#fff'
    }).setOrigin(0.5);

    leaderboardBtn.on('pointerover', () => leaderboardBtn.setFillStyle(0x8e44ad));
    leaderboardBtn.on('pointerout', () => leaderboardBtn.setFillStyle(0x9b59b6));
    leaderboardBtn.on('pointerdown', () => {
      // Save score with current name
      const playerName = inputElement.value.trim() || 'Anonymous';
      saveScore(playerName, gameState.score, gameState.selectedSLO.name);
      
      // Clean up input element
      cleanupInput();
      
      // Show leaderboard
      showLeaderboard.call(scene);
    });

    const playAgainBtn = scene.add.rectangle(400, buttonY, 130, 45, 0x3498db);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(2, 0xffffff);

    const playAgainText = scene.add.text(400, buttonY, 'Play Again', {
      fontSize: '16px',
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
      
      // Reset game state
      resetGameState();
      
      scene.scene.restart();
    });

    const backBtn = scene.add.rectangle(400 + buttonSpacing, buttonY, 130, 45, 0x95a5a6);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.setStrokeStyle(2, 0xffffff);

    const backText = scene.add.text(400 + buttonSpacing, buttonY, 'Main Menu', {
      fontSize: '16px',
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

  function showLeaderboard() {
    const scene = this;
    
    // Clear all existing UI elements
    scene.children.removeAll(true);

    // Fresh full-black backdrop
    const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x000000, 1);
    backdrop.setInteractive();
    backdrop.setDepth(0);
    backdrop.setAlpha(0);

    // Remove any remaining HUD text objects and header graphics
    Object.values(texts).forEach(text => {
      if (text && text.destroy) {
        text.destroy();
      }
    });
    texts = {};
    if (graphics) {
      graphics.clear();
    }

    const renderLeaderboard = () => {
    // Title
    const title = scene.add.text(400, 35, '🏆 Leaderboard', {
      fontSize: '36px',
      fontWeight: 'bold',
      fill: '#f1c40f'
    }).setOrigin(0.5);

    const subtitle = scene.add.text(400, 75, 'Top Barista Scores', {
      fontSize: '16px',
      fill: '#95a5a6',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Get scores
    const scores = getScores();

    if (scores.length === 0) {
      const emptyText = scene.add.text(400, 250, 'No scores yet!\nBe the first to set a record!', {
        fontSize: '22px',
        fill: '#ecf0f1',
        align: 'center'
      }).setOrigin(0.5);
    } else {
      // Create a background panel for the leaderboard table
      const tableBg = scene.add.rectangle(400, 270, 680, 300, 0x2c3e50, 0.8);
      tableBg.setStrokeStyle(2, 0x34495e);

      // Headers
      const headerY = 100;
      scene.add.text(120, headerY, 'Rank', {
        fontSize: '15px',
        fontWeight: 'bold',
        fill: '#3498db'
      }).setOrigin(0.5);
      scene.add.text(280, headerY, 'Player', {
        fontSize: '15px',
        fontWeight: 'bold',
        fill: '#3498db'
      }).setOrigin(0.5);
      scene.add.text(520, headerY, 'Score', {
        fontSize: '15px',
        fontWeight: 'bold',
        fill: '#3498db'
      }).setOrigin(0.5);
      scene.add.text(660, headerY, 'SLO', {
        fontSize: '15px',
        fontWeight: 'bold',
        fill: '#3498db'
      }).setOrigin(0.5);

      // Divider line under headers
      const headerLine = scene.add.rectangle(400, 112, 680, 2, 0x3498db, 0.5);

      // Display top 7 scores (to fit better on screen)
      const maxEntries = Math.min(7, scores.length);
      scores.slice(0, maxEntries).forEach((scoreEntry, index) => {
        const y = 135 + index * 34;
        
        // Alternating row background for better readability
        if (index % 2 === 0) {
          const rowBg = scene.add.rectangle(400, y, 660, 32, 0x34495e, 0.4);
        }
        
        // Rank with medal for top 3
        let rankText = `${index + 1}`;
        let rankColor = '#ecf0f1';
        if (index === 0) {
          rankText = '🥇';
          rankColor = '#f1c40f';
        } else if (index === 1) {
          rankText = '🥈';
          rankColor = '#95a5a6';
        } else if (index === 2) {
          rankText = '🥉';
          rankColor = '#cd7f32';
        }
        
        scene.add.text(120, y, rankText, {
          fontSize: '18px',
          fill: rankColor,
          fontWeight: 'bold'
        }).setOrigin(0.5);

        // Player name (truncate if too long)
        const playerName = scoreEntry.playerName.length > 18 
          ? scoreEntry.playerName.substring(0, 15) + '...'
          : scoreEntry.playerName;
        
        scene.add.text(280, y, playerName, {
          fontSize: '16px',
          fill: '#fff'
        }).setOrigin(0.5);

        // Score with nice formatting
        const scoreText = scoreEntry.score.toLocaleString();
        scene.add.text(520, y, scoreText, {
          fontSize: '16px',
          fill: '#2ecc71',
          fontWeight: 'bold'
        }).setOrigin(0.5);

        // SLO
        scene.add.text(660, y, scoreEntry.slo, {
          fontSize: '15px',
          fill: '#9b59b6'
        }).setOrigin(0.5);
      });
      
      // If there are more than 8 scores, show a note
      if (scores.length > 7) {
        scene.add.text(400, 455, `+ ${scores.length - 7} more`, {
          fontSize: '13px',
          fill: '#7f8c8d',
          fontStyle: 'italic'
        }).setOrigin(0.5);
      }
    }

    // Buttons
    const buttonY = 520;
    const playAgainBtn = scene.add.rectangle(300, buttonY, 160, 42, 0x3498db);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(2, 0xffffff);

    const playAgainText = scene.add.text(300, buttonY, 'Play Again', {
      fontSize: '17px',
      fontWeight: 'bold',
      fill: '#fff'
    }).setOrigin(0.5);

    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x2980b9));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(0x3498db));
    playAgainBtn.on('pointerdown', () => {
      // Reset game state
      resetGameState();
      
      scene.scene.restart();
    });

    const backBtn = scene.add.rectangle(500, buttonY, 160, 42, 0x95a5a6);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.setStrokeStyle(2, 0xffffff);

    const backText = scene.add.text(500, buttonY, 'Main Menu', {
      fontSize: '17px',
      fontWeight: 'bold',
      fill: '#fff'
    }).setOrigin(0.5);

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x7f8c8d));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x95a5a6));
    backBtn.on('pointerdown', () => {
      window.location.href = 'index.html';
    });
    };

    // Quick fade-to-black, then render leaderboard
    scene.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 120,
      onComplete: () => {
        scene.time.delayedCall(0, renderLeaderboard);
      }
    });
  }

  function update() {
    // Main update loop
    // Most game logic is handled by timers and events
  }
};
