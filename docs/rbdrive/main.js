title = "RB DRIVE";

description = `
[Tap]
 Change Lane
`;

characters = [
  `
rrrrr
 rrrrr
 rrrrr
rrrrr
`,
  `
llll
  llll
  llll
llll
`,
  `
 llll
lwwwwl
 llll
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 10,
};

/** @type {{angle: number, prevAngle: number, phase: number, color: number}[]} */
let cars;
let nextCarTicks;
let nextColor;
let nextColorCount;
let laneValues;
let laneAngle;
const angleOffsets = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

function update() {
  if (!ticks) {
    cars = [];
    laneValues = times(4, () => 0.7);
    nextCarTicks = nextColorCount = 0;
    nextColor = rndi(0, 2);
    laneAngle = 3;
  }
  const sd = sqrt(difficulty);
  drawLanes();
  if (input.isJustPressed) {
    play("select", { seed: 3 });
    laneAngle = wrap(laneAngle + 1, 0, 4);
  }
  const ao = angleOffsets[laneAngle];
  const lpo = laneAngle === 1 || laneAngle === 2 ? 51 : 50;
  const lp = vec(ao)
    .mul(10 + ((ticks / 5) % 7))
    .add(lpo, lpo);
  color("black");
  times(6, () => {
    char("c", lp, { rotation: laneAngle });
    lp.add(ao.x * 7, ao.y * 7);
  });
  nextCarTicks -= sd;
  if (nextCarTicks < 0) {
    play("click");
    nextColorCount--;
    if (nextColorCount < 0) {
      nextColor = wrap(nextColor + 1, 0, 2);
      nextColorCount = rndi(1, 4);
    }
    cars.push({ angle: rndi(4), prevAngle: 0, phase: 0, color: nextColor });
    nextCarTicks += rnd(80, 99);
  }
  const cp = vec();
  const cpo = vec();
  remove(cars, (c) => {
    const ao = angleOffsets[c.angle];
    const aoo = angleOffsets[wrap(c.angle + 1, 0, 4)];
    if (c.phase < 1) {
      cp.set(ao)
        .mul((1 - c.phase) * 40 + 10)
        .add(50 + aoo.x * 5, 50 + aoo.y * 5);
    } else if (c.phase < 2) {
      const pao = angleOffsets[c.prevAngle];
      const paoo = angleOffsets[wrap(c.prevAngle + 1, 0, 4)];
      cp.set(pao)
        .mul(10)
        .add(paoo.x * 5, paoo.y * 5);
      cpo
        .set(ao)
        .mul(10)
        .sub(aoo.x * 5, aoo.y * 5)
        .sub(cp)
        .mul(c.phase - 1);
      cp.add(cpo).add(50, 50);
    } else {
      cp.set(ao)
        .mul((c.phase - 2) * 40 + 10)
        .add(50 - aoo.x * 5, 50 - aoo.y * 5);
    }
    char(addWithCharCode("a", c.color), cp, {
      rotation: c.angle + (c.phase < 1 ? 2 : 0),
    });
    const pp = c.phase;
    c.phase += sd * (c.phase > 1 && c.phase < 2 ? 0.05 : 0.01);
    if (pp < 1 && c.phase >= 1) {
      play("hit", { seed: 1 });
      c.prevAngle = c.angle;
      if (c.angle !== laneAngle) {
        c.angle = laneAngle;
      } else {
        c.angle = wrap(c.angle + 2, 0, 4);
      }
    }
    if (c.phase > 3) {
      if (c.angle % 2 === c.color) {
        play("explosion");
        laneValues[c.angle] *= 0.66;
      } else {
        play("powerUp", { seed: 2 });
        laneValues[c.angle] += 0.3;
        if (laneValues[c.angle] > 1) {
          laneValues[c.angle] = 1;
        }
        addScore(1);
      }
      return true;
    }
  });
  times(4, (i) => {
    laneValues[i] -= sd * 0.0006;
    if (laneValues[i] < 0.01) {
      play("random");
      end();
    }
  });
}

function drawLanes() {
  color("light_red");
  rect(41, 0, 19, laneValues[3] * 42);
  rect(41, 100, 19, -laneValues[1] * 41);
  color("light_black");
  rect(100, 41, -laneValues[0] * 41, 19);
  rect(0, 41, laneValues[2] * 42, 19);
  color("black");
  rect(40, 0, 1, 40);
  rect(40, 60, 1, 40);
  rect(60, 0, 1, 40);
  rect(60, 60, 1, 40);
  rect(0, 40, 41, 1);
  rect(60, 40, 40, 1);
  rect(0, 60, 40, 1);
  rect(60, 60, 40, 1);
}
