// Test for Barista Game Configuration

describe('Barista Game Configuration', () => {
  let BaristaConfig;

  beforeAll(() => {
    // Mock the browser environment
    global.BaristaConfig = require('../public/baristaConfig.js');
    BaristaConfig = global.BaristaConfig;
  });

  test('BaristaConfig should be defined', () => {
    expect(BaristaConfig).toBeDefined();
  });

  test('should have 4 SLO options', () => {
    expect(BaristaConfig.sloOptions).toHaveLength(4);
  });

  test('SLO options should include 100%, 99.95%, 99.9%, and 80%', () => {
    const sloNames = BaristaConfig.sloOptions.map(slo => slo.name);
    expect(sloNames).toContain('100%');
    expect(sloNames).toContain('99.95%');
    expect(sloNames).toContain('99.9%');
    expect(sloNames).toContain('80%');
  });

  test('100% SLO should have 0 error budget', () => {
    const perfectSLO = BaristaConfig.sloOptions.find(slo => slo.name === '100%');
    expect(perfectSLO.errorBudget).toBe(0);
  });

  test('80% SLO should have the largest error budget', () => {
    const relaxedSLO = BaristaConfig.sloOptions.find(slo => slo.name === '80%');
    expect(relaxedSLO.errorBudget).toBeGreaterThan(0);
    
    // Should have larger budget than other options
    BaristaConfig.sloOptions.forEach(slo => {
      if (slo.name !== '80%') {
        expect(relaxedSLO.errorBudget).toBeGreaterThan(slo.errorBudget);
      }
    });
  });

  test('should have coffee orders for all complexity levels', () => {
    expect(BaristaConfig.coffeeOrders.simple).toBeDefined();
    expect(BaristaConfig.coffeeOrders.medium).toBeDefined();
    expect(BaristaConfig.coffeeOrders.complex).toBeDefined();
  });

  test('complex orders should take longer than simple orders', () => {
    const simpleOrder = BaristaConfig.coffeeOrders.simple[0];
    const complexOrder = BaristaConfig.coffeeOrders.complex[0];
    expect(complexOrder.time).toBeGreaterThanOrEqual(simpleOrder.time);
  });

  test('should have 4 levels defined', () => {
    expect(BaristaConfig.levels).toHaveLength(4);
  });

  test('levels should have increasing difficulty (decreasing spawn delay)', () => {
    for (let i = 1; i < BaristaConfig.levels.length; i++) {
      expect(BaristaConfig.levels[i].spawnDelay).toBeLessThanOrEqual(
        BaristaConfig.levels[i - 1].spawnDelay
      );
    }
  });

  test('game settings should be defined', () => {
    expect(BaristaConfig.gameSettings).toBeDefined();
    expect(BaristaConfig.gameSettings.orderLifetime).toBeGreaterThan(0);
    expect(BaristaConfig.gameSettings.canvasWidth).toBeGreaterThan(0);
    expect(BaristaConfig.gameSettings.canvasHeight).toBeGreaterThan(0);
  });
});
