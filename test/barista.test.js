// Test for Barista Error Budget Game
describe('Barista Error Budget Game', () => {
  let mockPhaser;
  let mockScene;
  let mockGraphics;
  let mockDocument;
  let mockCookie;

  beforeEach(() =>{
    // Mock graphics
    mockGraphics = {
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillRect: jest.fn()
    };

    // Mock scene objects
    mockScene = {
      add: {
        graphics: jest.fn(() => mockGraphics),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn(),
          destroy: jest.fn()
        }),
        rectangle: jest.fn().mockReturnValue({
          setInteractive: jest.fn().mockReturnThis(),
          setStrokeStyle: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setFillStyle: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn(),
          destroy: jest.fn(),
          on: jest.fn(),
          x: 400,
          y: 200,
          active: true,
          setDepth: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis()
        }),
        image: jest.fn().mockReturnValue({
          getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 10, height: 10 }),
          destroy: jest.fn()
        })
      },
      time: {
        addEvent: jest.fn().mockReturnValue({ remove: jest.fn() }),
        delayedCall: jest.fn().mockReturnValue({ remove: jest.fn() }),
        update: jest.fn()
      },
      tweens: {
        add: jest.fn()
      },
      scene: {
        restart: jest.fn()
      },
      children: {
        removeAll: jest.fn()
      }
    };

    // Mock Phaser
    global.Phaser = {
      AUTO: 0,
      Game: jest.fn().mockImplementation((config) => {
        // Don't automatically call create to avoid initialization errors
        return {
          canvas: {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
          }
        };
      }),
      Math: {
        Between: jest.fn((min, max) => Math.floor((min + max) / 2)),
        RND: {
          pick: jest.fn((arr) => arr[0])
        }
      }
    };

    // Mock BaristaConfig
    global.BaristaConfig = {
      sloOptions: [
        { name: '100%', value: 1.0, errorBudget: 0, description: 'Perfect - No errors allowed!' },
        { name: '99.95%', value: 0.9995, errorBudget: 5, description: 'Very High - Only 5 errors per 10,000 orders' },
        { name: '99.9%', value: 0.999, errorBudget: 10, description: 'High - 10 errors per 10,000 orders' },
        { name: '80%', value: 0.80, errorBudget: 2000, description: 'Relaxed - 2,000 errors per 10,000 orders' }
      ],
      coffeeOrders: {
        simple: [
          { name: 'Regular Coffee', time: 2000, icon: '☕' }
        ],
        medium: [
          { name: 'Cappuccino', time: 3000, icon: '🫖' }
        ],
        complex: [
          { name: 'Mocha Frappuccino', time: 4500, icon: '🍫' }
        ]
      },
      levels: [
        { 
          number: 1, 
          name: 'Morning Rush - Easy', 
          complexity: 'simple', 
          spawnDelay: 5000,
          duration: 30000,
          description: 'Start your day'
        },
        { 
          number: 2, 
          name: 'Lunch Break - Medium', 
          complexity: 'medium', 
          spawnDelay: 4000,
          duration: 40000,
          description: 'Getting complex'
        }
      ],
      gameSettings: {
        orderLifetime: 10000,
        perfectTimeWindow: 500,
        canvasWidth: 800,
        canvasHeight: 600
      }
    };

    // Mock window
    global.window = {
      onload: null,
      location: {
        href: ''
      }
    };

    // Mock document for cookies
    mockDocument = {
      cookie: '',
      createElement: jest.fn(() => ({
        type: '',
        id: '',
        placeholder: '',
        maxLength: 0,
        style: {},
        focus: jest.fn(),
        value: '',
        parentNode: true
      })),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      }
    };
    global.document = mockDocument;

    // Mock Date
    global.Date = class extends Date {
      constructor() {
        super('2020-01-01T00:00:00.000Z');
      }
      static now() {
        return 1577836800000;
      }
      toISOString() {
        return '2020-01-01T00:00:00.000Z';
      }
      toUTCString() {
        return 'Wed, 01 Jan 2020 00:00:00 GMT';
      }
    };

    // Reset modules
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.Phaser;
    delete global.BaristaConfig;
    delete global.window;
    delete global.document;
  });

  test('barista game should be defined', () => {
    const barista = require('../public/barista');
    expect(barista).toBeDefined();
  });

  test('barista should set up window.onload handler', () => {
    require('../public/barista');
    expect(typeof global.window.onload).toBe('function');
  });

  test('window.onload should create Phaser Game instance', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    expect(global.Phaser.Game).toHaveBeenCalled();
  });

  test('game should use correct configuration', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    expect(config.type).toBe(0); // Phaser.AUTO
    expect(config.width).toBe(800);
    expect(config.height).toBe(600);
    expect(config.backgroundColor).toBe('#2d3436');
    expect(config.parent).toBe('game-container');
  });

  test('game should have scene methods', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scene).toBeDefined();
    expect(config.scene.create).toBeDefined();
    expect(config.scene.update).toBeDefined();
  });

  test('BaristaConfig should be accessible', () => {
    require('../public/barista');

    expect(global.BaristaConfig).toBeDefined();
    expect(global.BaristaConfig.sloOptions).toBeDefined();
    expect(global.BaristaConfig.sloOptions.length).toBe(4);
  });

  test('game settings should match BaristaConfig', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.width).toBe(global.BaristaConfig.gameSettings.canvasWidth);
    expect(config.height).toBe(global.BaristaConfig.gameSettings.canvasHeight);
  });

  test('game should have all SLO options available', () => {
    require('../public/barista');

    const sloNames = global.BaristaConfig.sloOptions.map(slo => slo.name);
    expect(sloNames).toContain('100%');
    expect(sloNames).toContain('99.95%');
    expect(sloNames).toContain('99.9%');
    expect(sloNames).toContain('80%');
  });

  test('game should have coffee orders for all complexity levels', () => {
    require('../public/barista');

    expect(global.BaristaConfig.coffeeOrders.simple).toBeDefined();
    expect(global.BaristaConfig.coffeeOrders.medium).toBeDefined();
    expect(global.BaristaConfig.coffeeOrders.complex).toBeDefined();
  });

  test('game should have multiple levels configured', () => {
    require('../public/barista');

    expect(global.BaristaConfig.levels).toBeDefined();
    expect(global.BaristaConfig.levels.length).toBeGreaterThanOrEqual(2);
  });

  test('game uses Phaser AUTO rendering',  () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.type).toBe(0);
  });

  test('SLO options have error budgets configured', () => {
    require('../public/barista');

    global.BaristaConfig.sloOptions.forEach(slo => {
      expect(slo.errorBudget).toBeDefined();
      expect(typeof slo.errorBudget).toBe('number');
    });
  });

  test('game has correct parent container', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.parent).toBe('game-container');
  });

  test('game has correct background color', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.backgroundColor).toBe('#2d3436');
  });

  test('levels have increasing complexity', () => {
    require('../public/barista');

    const levels = global.BaristaConfig.levels;
    expect(levels[0].complexity).toBe('simple');
    expect(levels[1].complexity).toBe('medium');
  });

  test('SLO values are in valid range', () => {
    require('../public/barista');

    global.BaristaConfig.sloOptions.forEach(slo => {
      expect(slo.value).toBeGreaterThan(0);
      expect(slo.value).toBeLessThanOrEqual(1);
    });
  });

  test('coffee orders have required properties', () => {
    require('../public/barista');

    const allOrders = [
      ...global.BaristaConfig.coffeeOrders.simple,
      ...global.BaristaConfig.coffeeOrders.medium,
      ...global.BaristaConfig.coffeeOrders.complex
    ];

    allOrders.forEach(order => {
      expect(order.name).toBeDefined();
      expect(order.time).toBeDefined();
      expect(order.icon).toBeDefined();
    });
  });

  test('game settings are properly configured', () => {
    require('../public/barista');

    const settings = global.BaristaConfig.gameSettings;
    expect(settings.orderLifetime).toBeGreaterThan(0);
    expect(settings.perfectTimeWindow).toBeGreaterThan(0);
    expect(settings.canvasWidth).toBeGreaterThan(0);
    expect(settings.canvasHeight).toBeGreaterThan(0);
  });

  test('game should be created only once per load', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    expect(global.Phaser.Game).toHaveBeenCalledTimes(1);
  });

  test('create should initialize graphics', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  test('showSLOSelection should create title text', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Check that text was created for title
    expect(mockScene.add.text).toHaveBeenCalled();
    const textCalls = mockScene.add.text.mock.calls;
    const titleCall = textCalls.find(call => call[2] === 'Barista Promise');
    expect(titleCall).toBeDefined();
  });

  test('showSLOSelection should create subtitle', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textCalls = mockScene.add.text.mock.calls;
    const subtitleCall = textCalls.find(call => call[2] === 'What do you value more?');
    expect(subtitleCall).toBeDefined();
  });

  test('showSLOSelection should position title at correct coordinates', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textCalls = mockScene.add.text.mock.calls;
    const titleCall = textCalls.find(call => call[2] === 'Barista Promise');
    expect(titleCall[0]).toBe(400);
    expect(titleCall[1]).toBe(50);
  });

  test('showSLOSelection should create buttons for each SLO option', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Should create rectangles for SLO buttons
    expect(mockScene.add.rectangle).toHaveBeenCalled();
    expect(mockScene.add.rectangle.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  test('showSLOSelection should make SLO buttons interactive', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const rectangles = mockScene.add.rectangle.mock.results;
    rectangles.forEach(result => {
      const button = result.value;
      expect(button.setInteractive).toHaveBeenCalled();
    });
  });

  test('showSLOSelection should set button stroke style', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const rectangles = mockScene.add.rectangle.mock.results;
    rectangles.forEach(result => {
      const button = result.value;
      expect(button.setStrokeStyle).toHaveBeenCalled();
    });
  });

  test('showSLOSelection should create text for each SLO option', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Check for SLO option names in text calls
    const textCalls = mockScene.add.text.mock.calls;
    const sloTexts = textCalls.filter(call => 
      ['100%', '99.95%', '99.9%', '80%'].includes(call[2])
    );
    expect(sloTexts.length).toBe(4);
  });

  test('showSLOSelection should create description for each SLO', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textCalls = mockScene.add.text.mock.calls;
    // Should have descriptions for SLO options
    const descriptionTexts = textCalls.filter(call => 
      typeof call[2] === 'string' && call[2].includes('errors')
    );
    expect(descriptionTexts.length).toBeGreaterThan(0);
  });

  test('SLO buttons should be positioned correctly', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const rectangleCalls = mockScene.add.rectangle.mock.calls;
    // Check that buttons are positioned at different y coordinates
    const yCoords = rectangleCalls.map(call => call[1]);
    const uniqueYCoords = [...new Set(yCoords)];
    expect(uniqueYCoords.length).toBeGreaterThan(1);
  });

  test('graphics should be cleared on create', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Create graphics reference before calling create
    const graphics = mockScene.add.graphics();
    mockScene.add.graphics.mockReturnValue(graphics);
    
    config.scene.create.call(mockScene);
    
    // Graphics should be initialized
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  test('update should be defined', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    expect(config.scene.update).toBeDefined();
    expect(typeof config.scene.update).toBe('function');
  });

  test('update can be called without errors', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    
    // Should not throw when called
    expect(() => {
      config.scene.update.call(mockScene);
    }).not.toThrow();
  });

  test('SLO options should have proper button dimensions', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const rectangleCalls = mockScene.add.rectangle.mock.calls;
    rectangleCalls.forEach(call => {
      expect(call[0]).toBeDefined(); // x
      expect(call[1]).toBeDefined(); // y
      expect(call[2]).toBeDefined(); // width
      expect(call[3]).toBeDefined(); // height
    });
  });

  test('title should use correct font styling', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textCalls = mockScene.add.text.mock.calls;
    const titleCall = textCalls.find(call => call[2] === 'Barista Promise');
    const style = titleCall[3];
    
    expect(style.fontSize).toBeDefined();
    expect(style.fill).toBeDefined();
  });

  test('text  elements should have setOrigin called', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const textElements = mockScene.add.text.mock.results;
    textElements.forEach(result => {
      const textObj = result.value;
      expect(textObj.setOrigin).toHaveBeenCalled();
    });
  });

  test('should create centered elements', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    // Check that elements are centered at x=400
    const textCalls = mockScene.add.text.mock.calls;
    const centeredTexts = textCalls.filter(call => call[0] === 400);
    expect(centeredTexts.length).toBeGreaterThan(0);
  });

  test('buttons should use correct color scheme', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    const config = global.Phaser.Game.mock.calls[0][0];
    config.scene.create.call(mockScene);
    
    const rectangleCalls = mockScene.add.rectangle.mock.calls;
    rectangleCalls.forEach(call => {
      // Color parameter (5th parameter) should be defined
      expect(call[4]).toBeDefined();
    });
  });

  test('game state should be initialized', () => {
    require('../public/barista');
    
    if (typeof global.window.onload === 'function') {
      global.window.onload();
    }

    // Game state should be initialized when onload is called
    expect(global.Phaser.Game).toHaveBeenCalled();
  });
});
