// Configuration for the Barista Error Budget Game

const BaristaConfig = {
  // SLO Options with their error budgets
  sloOptions: [
    { name: '100%', value: 1.0, errorBudget: 0, description: 'Perfect - No errors allowed!' },
    { name: '99.95%', value: 0.9995, errorBudget: 5, description: 'Very High - Only 5 errors per 10,000 orders' },
    { name: '99.9%', value: 0.999, errorBudget: 10, description: 'High - 10 errors per 10,000 orders' },
    { name: '80%', value: 0.80, errorBudget: 2000, description: 'Relaxed - 2,000 errors per 10,000 orders' }
  ],

  // Coffee order types by complexity
  coffeeOrders: {
    simple: [
      { name: 'Regular Coffee', time: 2000, icon: '☕' },
      { name: 'Black Coffee', time: 2000, icon: '☕' },
      { name: 'Coffee with Milk', time: 2500, icon: '🥛' }
    ],
    medium: [
      { name: 'Cappuccino', time: 3000, icon: '🫖' },
      { name: 'Latte', time: 3000, icon: '🥤' },
      { name: 'Americano', time: 2500, icon: '☕' }
    ],
    complex: [
      { name: 'Oat Milk Latte', time: 3500, icon: '🌾' },
      { name: 'Double Shot Espresso', time: 3000, icon: '⚡' },
      { name: 'Caramel Macchiato', time: 4000, icon: '🍮' },
      { name: 'Mocha Frappuccino', time: 4500, icon: '🍫' },
      { name: 'Vanilla Latte (Extra Hot)', time: 4000, icon: '🔥' }
    ]
  },

  // Level configuration
  levels: [
    { 
      number: 1, 
      name: 'Morning Rush - Easy', 
      complexity: 'simple', 
      spawnDelay: 5000,
      duration: 30000,
      description: 'Start your day with simple orders'
    },
    { 
      number: 2, 
      name: 'Lunch Break - Medium', 
      complexity: 'medium', 
      spawnDelay: 4000,
      duration: 40000,
      description: 'Orders are getting more complex'
    },
    { 
      number: 3, 
      name: 'Afternoon Specialty - Hard', 
      complexity: 'complex', 
      spawnDelay: 3500,
      duration: 50000,
      description: 'Complex specialty drinks'
    },
    { 
      number: 4, 
      name: 'Peak Hour - Expert', 
      complexity: 'complex', 
      spawnDelay: 2500,
      duration: 60000,
      description: 'Fast-paced complex orders'
    }
  ],

  // Game settings
  gameSettings: {
    orderLifetime: 10000, // How long an order stays before timing out
    perfectTimeWindow: 500, // Window for perfect completion bonus
    canvasWidth: 800,
    canvasHeight: 600
  }
};

// Export for Node.js (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaristaConfig;
}
