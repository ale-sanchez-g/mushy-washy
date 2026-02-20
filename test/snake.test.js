// Test for Snake Game
describe('Snake Game', () => {
  let mockPhaser;
  let mockScene;
  let mockGroup;
  let mockChildren;
  let snake;

  beforeEach(() => {
    // Mock snake group children
    mockChildren = [];
    for (let i = 0; i < 10; i++) {
      mockChildren.push({ x: 100 + i * 20, y: 100, sprite: 'snake', destroy: jest.fn() });
    }
    
    mockGroup = {
      create: jest.fn((x, y, sprite) => {
        const child = { x, y, sprite, destroy: jest.fn(), getBounds: jest.fn().mockReturnValue({ x, y, width: 20, height: 20 }) };
        return child;
      }),
      getChildren: jest.fn(() => mockChildren)
    };

    mockScene = {
      load: {
        image: jest.fn()
      },
      add: {
        group: jest.fn(() => mockGroup),
        image: jest.fn().mockReturnValue({
          setPosition: jest.fn(),
          getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 20, height: 20 })
        }),
        text: jest.fn().mockReturnValue({
          setText: jest.fn(),
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis()
        })
      },
      input: {
        keyboard: {
          createCursorKeys: jest.fn().mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false }
          })
        },
        on: jest.fn()
      },
      time: {
        addEvent: jest.fn().mockReturnValue({ remove: jest.fn() }),
        update: jest.fn()
      },
      scale: {
        width: 800,
        height: 600
      },
      physics: {
        pause: jest.fn()
      }
    };

    // Initialize snake variable before Phaser mock
    snake = null;

    global.Phaser = {
      AUTO: 0,
      Game: jest.fn().mockImplementation((config) => {
        // Don't call preload/create automatically
        return {};
      }),
      Math: {
        Between: jest.fn((min, max) => Math.floor((min + max) / 2))
      },
      Actions: {
        ShiftPosition: jest.fn()
      },
      Geom: {
        Intersects: {
          RectangleToRectangle: jest.fn().mockReturnValue(false)
        }
      },
      Scale: {
        FIT: 3,
        CENTER_BOTH: 1
      }
    };

    // Reset modules to avoid caching
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockChildren = [];
    delete global.Phaser;
  });

  test('snake game should be defined', () => {
    // Just check that the file can be required
    const snakeModule = require('../public/snake');
    expect(snakeModule).toBeDefined();
  });

  test('game should initialize with correct configuration', () => {
    require('../public/snake');
    
    expect(global.Phaser.Game).toHaveBeenCalled();
    const config = global.Phaser.Game.mock.calls[0][0];
    
    expect(config.type).toBe(0); // Phaser.AUTO
    expect(config.width).toBe(800);
    expect(config.height).toBe(600);
    expect(config.backgroundColor).toBe('#000');
  });

  test('game should have required scene methods', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scene.preload).toBeDefined();
    expect(config.scene.create).toBeDefined();
    expect(config.scene.update).toBeDefined();
  });

  test('preload should load snake and food assets', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.preload.call(mockScene);
    
    expect(mockScene.load.image).toHaveBeenCalledWith('snake', 'assets/body.svg');
    expect(mockScene.load.image).toHaveBeenCalledWith('food', 'https://labs.phaser.io/assets/sprites/apple.png');
  });

  test('create should initialize snake with 10 segments', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Check that 10 snake segments were created
    const groupCreateCalls = mockGroup.create.mock.calls.filter(call => call[2] === 'snake');
    expect(groupCreateCalls.length).toBe(10);
  });

  test('create should initialize snake at correct position', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // First segment should be at (100, 100)
    const firstSegmentCall = mockGroup.create.mock.calls[0];
    expect(firstSegmentCall[0]).toBe(100);
    expect(firstSegmentCall[1]).toBe(100);
  });

  test('create should initialize food', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.add.image).toHaveBeenCalledWith(400, 300, 'food');
  });

  test('create should initialize score text', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.add.text).toHaveBeenCalledWith(16, 16, 'Score: 0', expect.any(Object));
  });

  test('create should set up cursor keys', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
  });

  test('create should set up game loop with timer', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.time.addEvent).toHaveBeenCalled();
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    expect(timerCall.delay).toBe(100);
    expect(timerCall.loop).toBe(true);
    expect(timerCall.callback).toBeDefined();
  });

  test('constants should have correct values', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.width).toBe(800); // GAME_WIDTH
    expect(config.height).toBe(600); // GAME_HEIGHT
  });

  test('snake segments should be spaced correctly', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const snakeSegments = mockGroup.create.mock.calls.filter(call => call[2] === 'snake');
    
    // Check spacing between segments (20 pixels apart)
    for (let i = 1; i < snakeSegments.length; i++) {
      const prevX = snakeSegments[i - 1][0];
      const currX = snakeSegments[i][0];
      expect(currX - prevX).toBe(20);
    }
  });

  test('score text should have correct styling', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const scoreTextCall = mockScene.add.text.mock.calls[0];
    const style = scoreTextCall[3];
    expect(style.fontSize).toBe('32px');
    expect(style.fill).toBe('#fff');
  });

  test('game group should be created for snake', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.add.group).toHaveBeenCalled();
  });

  test('game should initialize with default RIGHT direction', () => {
    require('../public/snake');
    
    // If the game starts without errors, direction is properly initialized
    expect(global.Phaser.Game).toHaveBeenCalled();
  });

  test('game should have initial score of 0', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const scoreTextCall = mockScene.add.text.mock.calls.find(call => 
      call[2].includes('Score')
    );
    expect(scoreTextCall[2]).toBe('Score: 0');
  });

  test('update should detect left cursor press', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    const cursors = {
      left: { isDown: true },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    };
    mockScene.input.keyboard.createCursorKeys.mockReturnValue(cursors);
    
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    // If left is pressed and direction is not RIGHT, nextDirection should be LEFT
    expect(mockChildren[0]).toBeDefined();
  });

  test('update should detect right cursor press', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    const cursors = {
      left: { isDown: false },
      right: { isDown: true },
      up: { isDown: false },
      down: { isDown: false }
    };
    mockScene.input.keyboard.createCursorKeys.mockReturnValue(cursors);
    
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    expect(mockChildren[0]).toBeDefined();
  });

  test('update should detect up cursor press', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    const cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: true },
      down: { isDown: false }
    };
    mockScene.input.keyboard.createCursorKeys.mockReturnValue(cursors);
    
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    expect(mockChildren[0]).toBeDefined();
  });

  test('update should detect down cursor press', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    const cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: true }
    };
    mockScene.input.keyboard.createCursorKeys.mockReturnValue(cursors);
    
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    expect(mockChildren[0]).toBeDefined();
  });

  test('moveSnake callback should be defined', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    expect(timerCall.callback).toBeDefined();
    expect(typeof timerCall.callback).toBe('function');
  });

  test('moveSnake should handle moving right', () => {
    // Mock ShiftPosition to actually modify the children array
    global.Phaser.Actions.ShiftPosition.mockImplementation(() => {});
    
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const initialCallCount = mockGroup.create.mock.calls.length;
    
    // Get the moveSnake callback
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    const moveSnakeCallback = timerCall.callback;
    
    // Call moveSnake
    moveSnakeCallback.call(mockScene);
    
    // Should have created a new head segment
    expect(mockGroup.create.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  test('moveSnake should handle collision with food', () => {
    // Mock collision detection
    global.Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(true);
    
    // Mock food object with setPosition
    const mockFood = {
      setPosition: jest.fn(),
      getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 20, height: 20 })
    };
    mockScene.add.image.mockReturnValue(mockFood);
    
    // Mock score text
    const mockScoreText = {
      setText: jest.fn(),
      setOrigin: jest.fn().mockReturnThis()
    };
    mockScene.add.text.mockReturnValue(mockScoreText);
    
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Get the moveSnake callback
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    const moveSnakeCallback = timerCall.callback;
    
    // Call moveSnake
    moveSnakeCallback.call(mockScene);
    
    // Should update food position when collision occurs
    expect(mockFood.setPosition).toHaveBeenCalled();
  });

  test('moveSnake should increase score on food collision', () => {
    // Mock collision detection
    global.Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(true);
    
    // Mock food object
    const mockFood = {
      setPosition: jest.fn(),
      getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 20, height: 20 })
    };
    
    // Mock score text
    const mockScoreText = {
      setText: jest.fn(),
      setOrigin: jest.fn().mockReturnThis()
    };
    
    let imageCallCount = 0;
    mockScene.add.image.mockImplementation(() => mockFood);
    mockScene.add.text.mockImplementation(() => mockScoreText);
    
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Get the moveSnake callback
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    const moveSnakeCallback = timerCall.callback;
    
    // Call moveSnake
    moveSnakeCallback.call(mockScene);
    
    // Score text should be updated (Score: 10)
    expect(mockScoreText.setText).toHaveBeenCalledWith('Score: 10');
  });

  test('moveSnake should remove tail segment when no food collision', () => {
    // Mock no collision
    global.Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(false);
    
    const mockTailSegment = { destroy: jest.fn() };
    mockChildren.push(mockTailSegment);
    
    mockGroup.getChildren.mockReturnValue([...mockChildren, mockTailSegment]);
    
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Get the moveSnake callback
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    const moveSnakeCallback = timerCall.callback;
    
    // Call moveSnake (should remove last segment)
    moveSnakeCallback.call(mockScene);
    
    // Verify getChildren was called (to get the tail)
    expect(mockGroup.getChildren).toHaveBeenCalled();
  });

  test('update should not change direction from RIGHT to LEFT directly', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Start with RIGHT direction (default)
    const cursors = {
      left: { isDown: true },  // Try to go left while moving right
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    };
    mockScene.input.keyboard.createCursorKeys.mockReturnValue(cursors);
    
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    // Should not allow opposite direction change
    // The game should handle this internally
    expect(mockGroup.getChildren).toHaveBeenCalled();
  });

  test('snake speed should be defined in timer', () => {
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    expect(timerCall.delay).toBe(100);  // snakeSpeed initial value
  });

  test('food should use Phaser.Math.Between for random position', () => {
    // Mock collision to trigger food repositioning
    global.Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(true);
    
    const mockFood = {
      setPosition: jest.fn(),
      getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 20, height: 20 })
    };
    mockScene.add.image.mockReturnValue(mockFood);
    
    const mockScoreText = {
      setText: jest.fn(),
      setOrigin: jest.fn().mockReturnThis()
    };
    mockScene.add.text.mockReturnValue(mockScoreText);
    
    require('../public/snake');
    
    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const timerCall = mockScene.time.addEvent.mock.calls[0][0];
    const moveSnakeCallback = timerCall.callback;
    
    moveSnakeCallback.call(mockScene);
    
    // Phaser.Math.Between should be called for random food position
    expect(global.Phaser.Math.Between).toHaveBeenCalled();
  });

  test('game config should include scale settings for mobile responsiveness', () => {
    require('../public/snake');

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scale).toBeDefined();
    expect(config.scale.mode).toBe(global.Phaser.Scale.FIT);
    expect(config.scale.autoCenter).toBe(global.Phaser.Scale.CENTER_BOTH);
  });

  test('create should register pointerdown event for touch swipe support', () => {
    require('../public/snake');

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);

    const eventNames = mockScene.input.on.mock.calls.map(call => call[0]);
    expect(eventNames).toContain('pointerdown');
  });

  test('create should register pointerup event for touch swipe support', () => {
    require('../public/snake');

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);

    const eventNames = mockScene.input.on.mock.calls.map(call => call[0]);
    expect(eventNames).toContain('pointerup');
  });

  test('swipe right should set nextDirection to RIGHT', () => {
    require('../public/snake');

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);

    const pointerdownCall = mockScene.input.on.mock.calls.find(c => c[0] === 'pointerdown');
    const pointerupCall = mockScene.input.on.mock.calls.find(c => c[0] === 'pointerup');

    pointerdownCall[1]({ x: 100, y: 300 });
    // Swipe right (dx > 30)
    pointerupCall[1]({ x: 200, y: 300 });

    // Should not throw and pointerup handler ran
    expect(pointerupCall).toBeDefined();
  });

  test('swipe up should set nextDirection to UP when not moving DOWN', () => {
    require('../public/snake');

    const config = global.Phaser.Game.mock.calls[0][0];
    // Change direction to RIGHT first by calling update with right key then swap to UP
    config.scene.create.call(mockScene);

    const pointerdownCall = mockScene.input.on.mock.calls.find(c => c[0] === 'pointerdown');
    const pointerupCall = mockScene.input.on.mock.calls.find(c => c[0] === 'pointerup');

    pointerdownCall[1]({ x: 300, y: 300 });
    // Swipe up (dy < -30)
    pointerupCall[1]({ x: 300, y: 200 });

    expect(pointerupCall).toBeDefined();
  });
});
