// snake.js

const SNAKE_DIRECTION = 5;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const FOOD_MAX_X = 39;
const FOOD_MAX_Y = 29;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000",
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};
const game = new Phaser.Game(config);

let snake;
let food;
let cursors;
let score = 0;
let scoreText;
let direction = "RIGHT";
let nextDirection = "RIGHT";
let snakeSpeed = 100;
let directionChanges = [];


function preload() {
  this.load.image("snake", "assets/body.svg");
  this.load.image("food", "https://labs.phaser.io/assets/sprites/apple.png");
}

function create() {
  snake = this.add.group();
  for (let i = 0; i < 10; i++) {
    snake.create(100 + i * 20, 100, "snake");
  }

  food = this.add.image(400, 300, "food");

  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
  });

  this.time.addEvent({
    delay: snakeSpeed,
    callback: moveSnake,
    callbackScope: this,
    loop: true,
  });
}

function update() {
  let head = snake.getChildren()[0];
  let newHeadX = head.x;
  let newHeadY = head.y;

  if (cursors.left.isDown && direction !== "RIGHT") {
    nextDirection = "LEFT";
  } else if (cursors.right.isDown && direction !== "LEFT") {
    nextDirection = "RIGHT";
  } else if (cursors.up.isDown && direction !== "DOWN") {
    nextDirection = "UP";
  } else if (cursors.down.isDown && direction !== "UP") {
    nextDirection = "DOWN";
  }

  if (nextDirection !== direction) {
    directionChanges.push({
      x: newHeadX,
      y: newHeadY,
      direction: nextDirection,
    });
    direction = nextDirection;
  }
}

function moveSnake() {
  let head = snake.getChildren()[0];
  let newHeadX = head.x;
  let newHeadY = head.y;

  switch (direction) {
    case "LEFT":
      newHeadX -= SNAKE_DIRECTION;
      break;
    case "RIGHT":
      newHeadX += SNAKE_DIRECTION;
      break;
    case "UP":
      newHeadY -= SNAKE_DIRECTION;
      break;
    case "DOWN":
      newHeadY += SNAKE_DIRECTION;
      break;
  }

   // Check if the new head position is outside the game area
   if (newHeadX < 0 || newHeadX >= GAME_WIDTH || newHeadY < 0 || newHeadY >= GAME_HEIGHT) {

            // Display a message
            let style = { font: "bold 32px Arial", fill: "#f00", boundsAlignH: "center", boundsAlignV: "middle" };
            let text = this.add.text(0, 0, "You lost!", style);
            text.setOrigin(0.5, 0.5);
            text.setPosition(this.scale.width / 2, this.scale.height / 2);

            //add link back to welcome page
            let lnkStyle = { font: "bold 32px Arial", fill: "blue", boundsAlignH: "center", boundsAlignV: "middle" };
            let link = this.add.text(0, 0, "Click back to Welcome Page");
            link.setOrigin(0.5, 0.5);
            link.setPosition(this.scale.width / 2, this.scale.height / 2 + 50);
            link.setInteractive();
            link.on('pointerdown', () => {
                window.location.href = '/welcome';
            });
    return;
  }

  let newHead = snake.create(newHeadX, newHeadY, "snake");
  Phaser.Actions.ShiftPosition(snake.getChildren(), newHeadX, newHeadY, 1, 0);

  if (
    Phaser.Geom.Intersects.RectangleToRectangle(
      newHead.getBounds(),
      food.getBounds()
    )
  ) {
    food.setPosition(
      Phaser.Math.Between(0, FOOD_MAX_X) * SNAKE_DIRECTION,
      Phaser.Math.Between(0, FOOD_MAX_Y) * SNAKE_DIRECTION
    );

    score += 10;
    snakeSpeed -= 5;
    this.time.update({
        delay: snakeSpeed,
      });
    scoreText.setText("Score: " + score);
  } else {
    snake.getChildren().pop().destroy();
  }
}
