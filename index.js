const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 14;
const cellsVertical = 10; 
const width = window.innerWidth; 
const height = window.innerHeight; 

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width, 
    height 
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  // Top barrier: 400 units over, 0 units down, 800 units wide, 40 units tall
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  // Bottom barrier
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  // Left barrier
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  // Right barrier
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
  let counter = arr.length;

  while(counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// Algorithm for maze generation
const stepThroughCell = (row, column) => { 
  // If visited cell at [row, col], then return early
  if (grid[row][column] === true) {
    return;
  }
  // Mark this cell as being visited
  grid[row][column] = true;
  // Assemble randomly-ordered list of neighbords
  const neighbors = shuffle([
    [row - 1, column, 'up'], // up
    [row, column + 1, 'right'], // right
    [row + 1, column, 'down'], // down
    [row, column - 1, 'left'] // left
  ]);
  console.log(neighbors);
  // For each neighbor, do the following
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
  // See if neighbor is out of bounds
    if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
      continue;
    }
  // If we have visited neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }
  // Remove a wall from either horiz/vert array
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn);
}
  // Visit next cell

};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open === true) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#f55f60'
        }
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#f55f60'
        }
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * .7,
  unitLengthY * .7,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: '#76f09b'
    }
  }
);
World.add(world, goal);

// User ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
  unitLengthX / 2, 
  unitLengthY / 2,
  ballRadius,
  {
    label: 'ball',
    render: {
      fillStyle: '#2fa1d6'
    }
  });
World.add(world, ball);

// Keypresses & controls
document.addEventListener('keydown', event => {
  const {x, y} = ball.velocity;
  if (event.keyCode === 87) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  if (event.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 5, y });
  }

  if (event.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  if (event.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(collision => {
    const labels = ['ball', 'goal'];

    if (
      labels.includes(collision.bodyA.label) && 
      labels.includes(collision.bodyB.label) 
    ) {
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }
  });
});