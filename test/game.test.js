// Test for the Mushroom Game
describe('Mushroom Game', () => {
  let mockPhaser;
  let mockScene;
  let mockPhysics;
  let mockTime;
  let mockInput;
  let mockScale;
  let mockAdd;

  beforeEach(() => {
    // Mock Phaser and its components
    mockAdd = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }),
      image: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 10, height: 10 }),
        destroy: jest.fn()
      })
    };

    mockPhysics = {
      add: {
        image: jest.fn().mockReturnValue({
          setScale: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          body: {
            setGravityY: jest.fn()
          },
          x: 100,
          y: 100,
          getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 10, height: 10 }),
          destroy: jest.fn()
        }),
        collider: jest.fn()
      },
      pause: jest.fn()
    };

    mockTime = {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn()
      }),
      update: jest.fn()
    };

    mockInput = {
      keyboard: {
        createCursorKeys: jest.fn().mockReturnValue({
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false }
        })
      }
    };

    mockScale = {
      width: 800,
      height: 600
    };

    mockScene = {
      load: {
        image: jest.fn()
      },
      add: mockAdd,
      physics: mockPhysics,
      time: mockTime,
      input: mockInput,
      scale: mockScale
    };

    // Mock Phaser.Math
    global.Phaser = {
      AUTO: 'AUTO',
      Game: jest.fn().mockImplementation((config) => {
        // Don't automatically call scene methods to avoid initialization errors
        return {};
      }),
      Math: {
        Between: jest.fn((min, max) => Math.floor(Math.random() * (max - min + 1)) + min)
      },
      Actions: {
        ShiftPosition: jest.fn()
      },
      Geom: {
        Intersects: {
          RectangleToRectangle: jest.fn().mockReturnValue(false)
        }
      }
    };

    // Mock window
    global.window = {
      innerWidth: 800,
      innerHeight: 600,
      onload: null
    };

    // Reset modules
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.Phaser;
    delete global.window;
  });

  test('game module should be defined', () => {
    const game = require('../public/game');
    expect(game).toBeDefined();
  });

  test('game should set up window.onload handler', () => {
    require('../public/game');
    expect(typeof global.window.onload).toBe('function');
  });

  test('window.onload should create Phaser Game instance', () => {
    require('../public/game');
    
    // Manually call onload
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    expect(global.Phaser.Game).toHaveBeenCalled();
  });

  test('game configuration should use window dimensions', () => {
    // Set specific dimensions
    global.window.innerWidth = 1200;
    global.window.innerHeight = 800;
    
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.width).toBe(1200);
    expect(config.height).toBe(800);
  });

  test('game should have arcade physics configured', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.physics).toBeDefined();
    expect(config.physics.default).toBe('arcade');
  });

  test('game should use Phaser.AUTO type', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.type).toBe('AUTO');
  });

  test('game physics should have gravity configured', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.physics.arcade).toBeDefined();
    expect(config.physics.arcade.gravity).toEqual({ y: 10 });
  });

  test('game should have scene configuration', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scene).toBeDefined();
    expect(config.scene.preload).toBeDefined();
    expect(config.scene.create).toBeDefined();
    expect(config.scene.update).toBeDefined();
  });

  test('game should have collectMushroom function', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scene.collectMushroom).toBeDefined();
    expect(typeof config.scene.collectMushroom).toBe('function');
  });

  test('game should be created only once per window load', () => {
    require('../public/game');
   
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    expect(global.Phaser.Game).toHaveBeenCalledTimes(1);
  });

  test('preload should load blue_mushroom asset', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.preload.call(mockScene);
    
    expect(mockScene.load.image).toHaveBeenCalledWith('blue_mushroom', 'assets/blueMushroom.jpeg');
  });

  test('preload should load basket asset', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.preload.call(mockScene);
    
    expect(mockScene.load.image).toHaveBeenCalledWith('basket', 'assets/basket.webp');
  });

  test('create should initialize score text', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockAdd.text).toHaveBeenCalledWith(
      mockScale.width,
      0,
      'Score: 0',
      expect.any(Object)
    );
  });

  test('create should set score text origin to top-right', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textElement = mockAdd.text.mock.results[0].value;
    expect(textElement.setOrigin).toHaveBeenCalledWith(1, 0);
  });

  test('create should create basket physics object', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockPhysics.add.image).toHaveBeenCalled();
    const basketCall = mockPhysics.add.image.mock.calls.find(call => 
      call[2] === 'basket'
    );
    expect(basketCall).toBeDefined();
  });

  test('create should position basket at bottom-right', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const basketCall = mockPhysics.add.image.mock.calls.find(call => 
      call[2] === 'basket'
    );
    expect(basketCall[0]).toBe(mockScale.width);
    expect(basketCall[1]).toBe(mockScale.height);
  });

  test('create should remove gravity from basket', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    expect(basket.body.setGravityY).toHaveBeenCalledWith(-1);
  });

  test('create should set basket origin to bottom-right', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    expect(basket.setOrigin).toHaveBeenCalledWith(1, 1);
  });

  test('create should set up cursor keys', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockInput.keyboard.createCursorKeys).toHaveBeenCalled();
  });

  test('create should set up mushroom spawn timer', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockTime.addEvent).toHaveBeenCalled();
    const timerCall = mockTime.addEvent.mock.calls[0][0];
    expect(timerCall.delay).toBe(3000);
    expect(timerCall.loop).toBe(true);
  });

  test('update should move basket left when left key is pressed', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Set left key to pressed
    mockInput.keyboard.createCursorKeys.mockReturnValue({
      left: { isDown: true },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    });
    
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    const initialX = basket.x;
    
    config.scene.update.call(mockScene);
    
    expect(basket.x).toBe(initialX - 6);
  });

  test('update should move basket right when right key is pressed', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Set right key to pressed
    mockInput.keyboard.createCursorKeys.mockReturnValue({
      left: { isDown: false },
      right: { isDown: true },
      up: { isDown: false },
      down: { isDown: false }
    });
    
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    const initialX = basket.x;
    
    config.scene.update.call(mockScene);
    
    expect(basket.x).toBe(initialX + 6);
  });

  test('update should move basket up when up key is pressed', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Set up key to pressed
    mockInput.keyboard.createCursorKeys.mockReturnValue({
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: true },
      down: { isDown: false }
    });
    
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    const initialY = basket.y;
    
    config.scene.update.call(mockScene);
    
    expect(basket.y).toBe(initialY - 6);
  });

  test('update should move basket down when down key is pressed', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Set down key to pressed
    mockInput.keyboard.createCursorKeys.mockReturnValue({
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: true }
    });
    
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    const initialY = basket.y;
    
    config.scene.update.call(mockScene);
    
    expect(basket.y).toBe(initialY + 6);
  });

  test('update should detect basket out of bounds', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Move basket out of bounds
    const basket = mockPhysics.add.image.mock.results[0].value;
    basket.y = mockScale.height + 100;
    
    config.scene.update.call(mockScene);
    
    // Should pause physics
    expect(mockPhysics.pause).toHaveBeenCalled();
  });

  test('update should show game over message when basket is out of bounds', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Move basket out of bounds
    const basket = mockPhysics.add.image.mock.results[0].value;
    basket.y = mockScale.height + 100;
    
    const initialTextCalls = mockAdd.text.mock.calls.length;
    
    config.scene.update.call(mockScene);
    
    // Should add game over text
    expect(mockAdd.text.mock.calls.length).toBeGreaterThan(initialTextCalls);
  });

  test('update should set up collider between basket and mushroom', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    config.scene.update.call(mockScene);
    
    expect(mockPhysics.add.collider).toHaveBeenCalled();
  });

  test('collectMushroom should destroy mushroom', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const mockMushroom = {
      destroy: jest.fn()
    };
    const mockBasket = {};
    
    config.scene.collectMushroom.call(mockScene, mockBasket, mockMushroom);
    
    expect(mockMushroom.destroy).toHaveBeenCalled();
  });

  test('collectMushroom should increase score', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const mockMushroom = {
      destroy: jest.fn()
    };
    const mockBasket = {};
    
    const scoreText = mockAdd.text.mock.results[0].value;
    
    config.scene.collectMushroom.call(mockScene, mockBasket, mockMushroom);
    
    // Score should increase by 10
    expect(scoreText.setText).toHaveBeenCalledWith('Score: 10');
  });

  test('collectMushroom should update score text multiple times', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const mockMushroom = {
      destroy: jest.fn()
    };
    const mockBasket = {};
    
    const scoreText = mockAdd.text.mock.results[0].value;
    
    // Collect first mushroom
    config.scene.collectMushroom.call(mockScene, mockBasket, mockMushroom);
    expect(scoreText.setText).toHaveBeenCalledWith('Score: 10');
    
    // Collect second mushroom
    config.scene.collectMushroom.call(mockScene, mockBasket, mockMushroom);
    expect(scoreText.setText).toHaveBeenCalledWith('Score: 20');
  });

  test('basket speed should be 6 pixels', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    mockInput.keyboard.createCursorKeys.mockReturnValue({
      left: { isDown: true },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    });
    
    config.scene.create.call(mockScene);
    
    const basket = mockPhysics.add.image.mock.results[0].value;
    const initialX = basket.x;
    
    config.scene.update.call(mockScene);
    
    // Should move exactly 6 pixels
    expect(basket.x).toBe(initialX - 6);
  });

  test('mushroom spawn timer should use createMushroom callback', () => {
    require('../public/game');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const timerCall = mockTime.addEvent.mock.calls[0][0];
    expect(typeof timerCall.callback).toBe('function');
    expect(timerCall.callbackScope).toBe(mockScene);
  });
});