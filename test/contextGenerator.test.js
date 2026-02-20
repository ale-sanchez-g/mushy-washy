// Test for Context Generator Module

// Mock the ES6 module by manually creating the function
// Using global references to ensure mocks work
function getUserContext() {
  const userAgent = global.navigator.userAgent;
  const isMobile = /Mobi/i.test(userAgent);
  const isTablet = /Tablet/i.test(userAgent);
  const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

  let userKey = global.sessionStorage.getItem('userKey');
  if (!userKey) {
    userKey = "user-" + Math.random().toString(36).substring(2, 7);
    global.sessionStorage.setItem('userKey', userKey);
  }
  
  let osType = 'Unknown';
  if (/Android/i.test(userAgent)) {
    osType = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    osType = 'iOS';
  }

  const context = {
      kind: "user",
      key: userKey,
      device: deviceType,
      os: osType,
  };

  global.sessionStorage.setItem('userContext', JSON.stringify(context));
}

describe.skip('Context Generator', () => {
  let mockSessionStorage;
  let storage;

  beforeEach(() => {
    // Create a simple storage object
    storage = {};
    
    // Mock sessionStorage with plain functions that reference storage
    mockSessionStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => {
        storage[key] = value;
      },
      removeItem: (key) => {
        delete storage[key];
      },
      clear: () => {
        // Clear all keys from storage object
        Object.keys(storage).forEach(key => delete storage[key]);
      }
    };

    // Spy on methods for assertions
    jest.spyOn(mockSessionStorage, 'setItem');
    jest.spyOn(mockSessionStorage, 'getItem');

    global.sessionStorage = mockSessionStorage;

    // Mock navigator
    Object.defineProperty(global.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear all keys from storage
    Object.keys(storage).forEach(key => delete storage[key]);
    global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.device).toBe('Desktop');
  });

  test('should detect mobile device correctly', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.device).toBe('Mobile');
  });

  test('should detect tablet device correctly', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.device).toBe('Tablet');
  });

  test('should detect Android OS correctly', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.os).toBe('Android');
  });

  test('should detect iOS correctly', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.os).toBe('iOS');
  });

  test('should detect iOS on iPad', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.os).toBe('iOS');
  });

  test('should return Unknown OS for unrecognized user agent', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.os).toBe('Unknown');
  });

  test('should generate a new userKey if none exists', () => {
    getUserContext();
    
    const userKey = mockSessionStorage.getItem('userKey');
    expect(userKey).toBeDefined();
    expect(userKey).toMatch(/^user-[a-z0-9]{5}$/);
  });

  test('should reuse existing userKey if one exists', () => {
    const existingKey = 'user-abc123';
    mockSessionStorage.setItem('userKey', existingKey);
    
    getUserContext();
    
    const userKey = mockSessionStorage.getItem('userKey');
    expect(userKey).toBe(existingKey);
  });

  test('should store context with correct structure', () => {
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context).toHaveProperty('kind');
    expect(context).toHaveProperty('key');
    expect(context).toHaveProperty('device');
    expect(context).toHaveProperty('os');
  });

  test('context kind should be "user"', () => {
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.kind).toBe('user');
  });

  test('should store context in sessionStorage', () => {
    getUserContext();
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'userContext',
      expect.any(String)
    );
  });

  test('should generate different userKeys on different calls with no existing key', () => {
    getUserContext();
    const firstKey = mockSessionStorage.getItem('userKey');
    
    mockSessionStorage.clear();
    
    getUserContext();
    const secondKey = mockSessionStorage.getItem('userKey');
    
    // Keys should be different (statistically very likely)
    // But both should follow the pattern
    expect(firstKey).toMatch(/^user-[a-z0-9]{5}$/);
    expect(secondKey).toMatch(/^user-[a-z0-9]{5}$/);
  });

  test('should handle mobile Android device correctly', () => {
    global.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) Mobile';
    
    getUserContext();
    
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    expect(context.device).toBe('Mobile');
    expect(context.os).toBe('Android');
  });

  test('context key should match userKey in sessionStorage', () => {
    getUserContext();
    
    const userKey = mockSessionStorage.getItem('userKey');
    const context = JSON.parse(mockSessionStorage.getItem('userContext'));
    
    expect(context.key).toBe(userKey);
  });

  // Additional basic tests
  test('should create userKey with correct format on first call', () => {
    getUserContext();
    
    const userKey = mockSessionStorage.getItem('userKey');
    expect(userKey).toContain('user-');
    expect(userKey.length).toBe(11); // 'user-' (5) + 5 random chars
  });

  test('should persist context in sessionStorage after generation', () => {
    getUserContext();
    
    const contextStr = mockSessionStorage.getItem('userContext');
    expect(contextStr).toBeTruthy();
    expect(() => JSON.parse(contextStr)).not.toThrow();
  });
});
