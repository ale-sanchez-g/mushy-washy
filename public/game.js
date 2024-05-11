window.onload = function() {
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 10 }
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
        collectMushroom: collectMushroom
      }
    };
  
    const game = new Phaser.Game(config);
    let cursors;
    let basket;
    let mushroom;
    let score = 0; // Initialize score
    let scoreText; // Declare scoreText outside the functions so it can be accessed in both create and update


    function preload() {
      this.load.image('blue_mushroom', 'assets/blueMushroom.jpeg');
      this.load.image('basket', 'assets/basket.webp');
      // You can add more images for player character, background, etc.
    }

    function create() {
        // Other code...

            // Create score text at the top right of the screen
        scoreText = this.add.text(this.scale.width, 0, 'Score: 0', { fontSize: '32px', fill: 'red' });
        scoreText.setOrigin(1, 0); // Set the origin to the top-right corner

        // Set the scale of the mushroom
        let originalImageSize = 100; // Replace with the actual size
        let desiredSize = 10;
        let scaleRatio = desiredSize / originalImageSize;

        // Initial delay
        let delay = 3000;

        // Function to create a mushroom and a new timer event
        let createMushroom = function() {
            let x = Phaser.Math.Between(0, this.scale.width);
            let y = 0;
            mushroom = this.physics.add.image(x, y, 'blue_mushroom');
            mushroom.setScale(scaleRatio);

            // Stop the current timer event
            if (this.mushroomEvent) this.mushroomEvent.remove();

            // Decrease the delay by 10ms
            delay -= 10;

            // Create a new timer event with the smaller delay
            this.mushroomEvent = this.time.addEvent({
                delay: delay,
                callback: createMushroom,
                callbackScope: this,
                loop: true
            });
        };

        // Create the initial timer event
        this.mushroomEvent = this.time.addEvent({
            delay: delay,
            callback: createMushroom,
            callbackScope: this,
            loop: true
        }); 

        // Set the scale
        let basketImageSize = 100; // Replace with the actual size
        let basketSize = 20;
        let basketScaleRatio = basketSize / basketImageSize;

        // Create the basket at the right edge of the screen, at the bottom
        basket = this.physics.add.image(this.scale.width, this.scale.height, 'basket');
        basket.setOrigin(1, 1); // Set the origin to the bottom-right corner
        basket.setScale(basketScaleRatio);
        basket.body.setGravityY(-1); // Remove gravity from the basket

        // Create cursor keys
        cursors = this.input.keyboard.createCursorKeys();   
    }
  
    function update() {
        // Other code...
    
        // Move the basket left or right
        const basketSpeed = 6;
        if (cursors.left.isDown) {
            basket.x -= basketSpeed;
        } else if (cursors.right.isDown) {
            basket.x += basketSpeed;
        }
        
        if (cursors.up.isDown) {
            basket.y -= basketSpeed;
        } else if (cursors.down.isDown) {
            basket.y += basketSpeed;
        }

        // Check if the basket is outside the screen
        if (basket.y > this.scale.height + 50 ) {
            // Stop the game
            this.physics.pause();

            // Display a message
            let style = { font: "bold 32px Arial", fill: "#f00", boundsAlignH: "center", boundsAlignV: "middle" };
            let text = this.add.text(0, 0, "You lost!", style);
            text.setOrigin(0.5, 0.5);
            text.setPosition(this.scale.width / 2, this.scale.height / 2);
        }

        this.physics.add.collider(basket, mushroom, collectMushroom, null, this);

    }
  
    function collectMushroom(basket, mushroom) {
        mushroom.destroy();

        // Increase score
        score += 10;

        // Update score text
        scoreText.setText('Score: ' + score);
    }

  };
  