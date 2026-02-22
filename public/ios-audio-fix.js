/**
 * iOS Safari Web Audio API Fix
 * 
 * iOS Safari requires AudioContext.resume() to be called synchronously
 * inside a user gesture handler (click/touchstart). This script ensures
 * audio is properly unlocked on first user interaction.
 * 
 * Fixes GitHub Issue #12: iOS Audio issue
 */
(function() {
  'use strict';

  // Detect iOS Safari
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  var isUnlocked = false;
  var audioContext = null;

  /**
   * Resume AudioContext synchronously - must be called directly in gesture handler
   */
  function unlockAudio() {
    if (isUnlocked) return;

    // Try to get Phaser's audio context if available
    if (window.Phaser && Phaser.Sound && Phaser.Sound.WebAudioSoundManager) {
      // Phaser 3 stores context differently based on version
      var game = window.game;
      if (game && game.sound && game.sound.context) {
        audioContext = game.sound.context;
      }
    }

    // Also check for any global AudioContext
    if (!audioContext && window.AudioContext) {
      // Find existing AudioContext instances
      var contexts = [];
      
      // Check Phaser game instances
      if (typeof Phaser !== 'undefined') {
        var games = Phaser.GAMES || [];
        games.forEach(function(g) {
          if (g && g.sound && g.sound.context) {
            contexts.push(g.sound.context);
          }
        });
      }

      // Resume all found contexts
      contexts.forEach(function(ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      });
    }

    // Create and resume a temporary context to trigger iOS audio unlock
    try {
      var tempContext = new (window.AudioContext || window.webkitAudioContext)();
      if (tempContext.state === 'suspended') {
        tempContext.resume().then(function() {
          // Play a silent buffer to fully unlock audio
          var buffer = tempContext.createBuffer(1, 1, 22050);
          var source = tempContext.createBufferSource();
          source.buffer = buffer;
          source.connect(tempContext.destination);
          source.start(0);
        }).catch(function() {
          // Ignore errors - we tried our best
        });
      }
    } catch (e) {
      // AudioContext not supported
    }

    isUnlocked = true;
  }

  /**
   * Set up user interaction listeners for audio unlock
   */
  function setupAudioUnlock() {
    var events = ['touchstart', 'touchend', 'click', 'keydown'];
    
    function handler(e) {
      // Call unlock synchronously in the gesture handler
      unlockAudio();
      
      // Also try to resume any Phaser audio contexts that may have been created
      if (typeof Phaser !== 'undefined' && Phaser.GAMES) {
        Phaser.GAMES.forEach(function(game) {
          if (game && game.sound && game.sound.context) {
            var ctx = game.sound.context;
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
          }
        });
      }

      // Remove listeners after first interaction
      events.forEach(function(event) {
        document.removeEventListener(event, handler, true);
      });
    }

    // Add listeners with capture to ensure we get the event first
    events.forEach(function(event) {
      document.addEventListener(event, handler, true);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAudioUnlock);
  } else {
    setupAudioUnlock();
  }

  // Also hook into Phaser game creation if possible
  var originalGame = window.Phaser && Phaser.Game;
  if (originalGame) {
    Phaser.Game = function() {
      var game = new (Function.prototype.bind.apply(originalGame, [null].concat(Array.prototype.slice.call(arguments))))();
      
      // Ensure audio context is resumed on first interaction
      var unlockPhaserAudio = function() {
        if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
          game.sound.context.resume();
        }
      };
      
      document.addEventListener('touchstart', unlockPhaserAudio, { once: true });
      document.addEventListener('click', unlockPhaserAudio, { once: true });
      
      return game;
    };
    Phaser.Game.prototype = originalGame.prototype;
  }

  // Expose for manual triggering if needed
  window.unlockIOSAudio = unlockAudio;

})();
