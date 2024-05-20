const { getUserContext } = require('../public/modules/contextGenerator'); 

describe('contextGenerator function', () => {
  test('should not throw an error', () => {
    expect(() => getUserContext()).not.toThrow();
  });
});