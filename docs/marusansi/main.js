title = "MARUSANSI";

description = `
   Tap
to start
`;

characters = [
  `
 rrr
rRRRr
rRRRr
rRRRr
 rrr
`,
  `
  g
 gGg
 gGg
gGGGg
ggggg
`,
  `
bbbbb
bBBBb
bBBBb
bBBBb
bbbbb
`,
  `
 RRR
R   R
R   R
R   R
 RRR
`,
  `
  G
 G G
 G G
G   G
GGGGG
`,
  `
BBBBB
B   B
B   B
B   B
BBBBB
`,
  `
  l
 lll
l l l
  l
  l
`,
  `
  l
  l
l l l
 lll
  l
`,
];

options = {
  viewSize: { x: 80, y: 80 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 9,
};

const gridSize = vec(6, 12);
/** @type {number[][]} */
let grid;
/** @type {number[]} */
let gridHeight;
/** @type {number[][]} */
let hGrid;
/** @type {number[][]} */
let vGrid;
/** @type {boolean[][]} */
let sGrid;
/** @type {number[]} */
let blocks;
/** @type {number[]} */
let nextRow;
let nextRowTicks;
let chainingTicks;
let fallingTicks;
let multiplier;
let message;
let messageTicks;
let startTicks;

function update() {
  if (!ticks) {
    grid = times(gridSize.x, () => times(gridSize.y, () => 0));
    gridHeight = times(gridSize.x, () => 0);
    hGrid = times(gridSize.x, () => times(gridSize.y, () => 0));
    vGrid = times(gridSize.x, () => times(gridSize.y, () => 0));
    sGrid = times(gridSize.x, () => times(gridSize.y, () => false));
    blocks = times(2, (i) => i + 1);
    nextRow = times(gridSize.x, () => 0);
    nextRowTicks = 0;
    calcGridHeight();
    setNextRow();
    chainingTicks = fallingTicks = 0;
    multiplier = 1;
    message = "";
    messageTicks = 0;
    startTicks = isReplaying ? 0 : 270;
  }
  color("light_black");
  rect(20, gridSize.y * 6, 40, 1);
  color("black");
  let chainingIndex = chainingTicks > 0 ? floor(chainingTicks / 5) : 0;
  times(gridSize.x, (x) =>
    times(gridSize.y, (y) => {
      const g = grid[x][y];
      if (g === 0) {
        return;
      }
      const p = calcPixelPosition(x, y);
      const vh = vGrid[x][y] > 0 ? vGrid[x][y] : hGrid[x][y];
      if (sGrid[x][y] || vh > 0) {
        color("yellow");
        box(p.x, p.y, 6, 6);
        color("black");
      }
      if (vh > 0) {
        if (vh === chainingIndex) {
          play("coin");
        } else if (vh < chainingIndex) {
          const cg = ((vh - 1) % 3) + 1;
          char(addWithCharCode("a", cg - 1), p.x, p.y);
        } else {
          char(addWithCharCode("d", g - 1), p.x, p.y);
        }
      } else {
        char(addWithCharCode("a", g - 1), p.x, p.y);
      }
    })
  );
  if (messageTicks > 0) {
    messageTicks--;
    text(message, 3, 9);
  }
  if (fallingTicks > 0) {
    fallingTicks++;
    if (fallingTicks % 5 === 0) {
      if (!fallBlocks()) {
        fallingTicks = 0;
        nextRowTicks = 0;
        calcGridHeight();
        checkGridSequence();
        setNextRow();
      }
    }
    return;
  }
  if (chainingTicks > 0) {
    chainingTicks++;
    if (chainingTicks > 50) {
      chainingTicks = 0;
      changeSequence();
      checkGridSequence();
      if (chainingTicks === 0 || multiplier >= 32) {
        chainingTicks = 0;
        clearSequence();
      }
    }
    return;
  }
  let bx = -1;
  let hasPlace = false;
  times(gridSize.x, (x) => {
    const h = gridHeight[x];
    if (h < gridSize.y - 1) {
      hasPlace = true;
      const p = calcPixelPosition(x, h + 1);
      const isSelected =
        input.pos.x >= p.x - 3 &&
        input.pos.x < p.x + 3 &&
        input.pos.y >= p.y - 3 &&
        input.pos.y < p.y + 9;
      blocks.forEach((b, i) => {
        if (!isSelected) {
          color("light_black");
        }
        char(addWithCharCode("d", b - 1), p.x, p.y + i * 6);
        color("black");
      });
      if (isSelected) {
        bx = x;
      }
    }
  });
  if (!hasPlace) {
    play("explosion");
    color("white");
    rect(20, 0, 40, 6);
    rect(20, 30, 40, 20);
    color("black");
    end();
    return;
  }
  let isNextRowSelected = input.pos.y >= gridSize.y * 6;
  color("light_purple");
  nextRowTicks += sqrt(sqrt(difficulty));
  rect(20, 80, 40, -nextRowTicks / 50);
  color("black");
  times(gridSize.x, (x) => {
    const p = calcPixelPosition(x, -1);
    char(
      addWithCharCode(isNextRowSelected ? "a" : "d", nextRow[x] - 1),
      p.x,
      p.y
    );
  });
  if (nextRowTicks > 400) {
    addNextRow();
    return;
  }
  if (input.isJustPressed) {
    if (isNextRowSelected) {
      addNextRow();
    } else if (bx >= 0) {
      play("select");
      const y = gridHeight[bx];
      grid[bx][y + 1] = blocks[0];
      grid[bx][y] = blocks[1];
      multiplier = 1;
      setNextBlock();
      calcGridHeight();
      checkGridSequence();
    } else {
      play("click");
      const tb = blocks[0];
      blocks[0] = blocks[1];
      blocks[1] = tb;
    }
  }
  startTicks--;
  if (startTicks > 0) {
    text("Tap\nto", 3, 40);
    text("rotate", 26, 30);
    text("place", 26, 66);
    text("add", 26, 76);
    text("blo\ncks", 65, 40);
  }
}

function setNextBlock() {
  const pbs = [blocks[0], blocks[1]];
  times(2, (i) => {
    blocks[i] = rndi(1, 4);
  });
  if (blocks[0] === pbs[0] && blocks[1] === pbs[1]) {
    blocks[0] = (blocks[0] % 3) + 1;
  }
}

function calcGridHeight() {
  times(gridSize.x, (x) => {
    let y = 0;
    for (; y < gridSize.y; y++) {
      if (grid[x][y] === 0) {
        break;
      }
    }
    gridHeight[x] = y;
  });
}

function checkGridSequence() {
  let existsSequence = false;
  let count = 0;
  times(gridSize.x, (x) =>
    times(gridSize.y, (y) => {
      const g = grid[x][y];
      if (g === 0) {
        return;
      }
      if (
        hGrid[x][y] === 0 &&
        x < gridSize.x - 2 &&
        grid[x + 1][y] === g &&
        grid[x + 2][y] === g
      ) {
        existsSequence = true;
        let i = g;
        for (let gx = x; gx < gridSize.x; gx++) {
          i++;
          if ((i - 1) % 3 === g - 1) {
            i++;
          }
          if (grid[gx][y] !== g) {
            break;
          }
          hGrid[gx][y] = i;
          count++;
        }
      }
      if (
        vGrid[x][y] === 0 &&
        y < gridSize.y - 2 &&
        grid[x][y + 1] === g &&
        grid[x][y + 2] === g
      ) {
        existsSequence = true;
        let i = g;
        for (let gy = y; gy < gridSize.y; gy++) {
          i++;
          if ((i - 1) % 3 === g - 1) {
            i++;
          }
          if (grid[x][gy] !== g) {
            break;
          }
          vGrid[x][gy] = i;
          count++;
        }
      }
    })
  );
  if (existsSequence) {
    const sc = count * multiplier;
    message = `${count}x${multiplier}=${sc}`;
    messageTicks = 60;
    addScore(sc);
    chainingTicks = 1;
    multiplier++;
    play("powerUp");
  }
}

function changeSequence() {
  times(gridSize.x, (x) =>
    times(gridSize.y, (y) => {
      const vh = vGrid[x][y] > 0 ? vGrid[x][y] : hGrid[x][y];
      if (vh > 0) {
        grid[x][y] = ((vh - 1) % 3) + 1;
        sGrid[x][y] = true;
        vGrid[x][y] = hGrid[x][y] = 0;
      }
    })
  );
}

function clearSequence() {
  play("jump");
  const cs = ["", "red", "green", "blue"];
  times(gridSize.x, (x) =>
    times(gridSize.y, (y) => {
      if (sGrid[x][y]) {
        // @ts-ignore
        color(cs[grid[x][y]]);
        const p = calcPixelPosition(x, y);
        particle(p.x, p.y);
        grid[x][y] = 0;
      }
    })
  );
  color("black");
  fallingTicks = 1;
}

function fallBlocks() {
  let isFalling = false;
  times(gridSize.x, (x) =>
    times(gridSize.y, (y) => {
      if (sGrid[x][y]) {
        isFalling = true;
        for (let gy = y; gy < gridSize.y - 1; gy++) {
          grid[x][gy] = grid[x][gy + 1];
          sGrid[x][gy] = sGrid[x][gy + 1];
        }
        grid[x][gridSize.y - 1] = 0;
        sGrid[x][gridSize.y - 1] = false;
      }
    })
  );
  return isFalling;
}

function setNextRow() {
  play("laser");
  times(gridSize.x, (x) => {
    const cs = [];
    times(3, (i) => {
      const c = i + 1;
      if (grid[x][0] === c && grid[x][1] === c) {
        return;
      }
      if (x > 1 && nextRow[x - 1] === c && nextRow[x - 2] === c) {
        return;
      }
      cs.push(c);
    });
    if (cs.length === 0) {
      cs.push(rndi(1, 4));
    }
    nextRow[x] = cs[rndi(cs.length)];
  });
}

function addNextRow() {
  times(gridSize.x, (x) => {
    for (let y = gridSize.y - 1; y > 0; y--) {
      grid[x][y] = grid[x][y - 1];
    }
    grid[x][0] = nextRow[x];
  });
  setNextRow();
  calcGridHeight();
  nextRowTicks = 0;
}

const pixelPos = vec();

function calcPixelPosition(x, y) {
  pixelPos.set(
    40 - (gridSize.x * 6) / 2 + x * 6 + 3,
    gridSize.y * 6 - y * 6 - 3
  );
  return pixelPos;
}

function drawLineRect(x, y, width, height) {
  rect(x, y, width, 1);
  rect(x, y + height - 1, width, 1);
  rect(x, y, 1, height);
  rect(x + width - 1, y, 1, height);
}
