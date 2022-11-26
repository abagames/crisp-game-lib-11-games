title = "RING BLAST";

description = `
[Slide]
 Change
 angle/speed
`;

characters = [
  `
 bbbb
bBBBBb
bBBBBb
bBBBBb
bBBBBb
 bbbb
`,
  `
 rrrr
rRRRRr
rRRRRr
rRRRRr
rRRRRr
 rrrr
`,
];

options = {
  viewSize: { x: 100, y: 150 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 3,
};

/** @type {{pos: Vector, vel: Vector, side: number, blastTicks: number}[]} */
let stones;
let leftStoneCount;
let nextStoneTime;
let stoneCount;
let stoneAngle;
let stoneSpeed;
let enemyStoneAngle;
let enemyStoneAngleVel;
let enemyStoneSpeed;
let enemyStoneSpeedVel;
/** @type {{radius: number, angle: number, angleWidth: number, angleWidthVel: number}[]} */
let rings;
const centerPos = vec(50, 60);
let multiplier;

function update() {
  if (!ticks) {
    stones = [];
    leftStoneCount = 10;
    nextStoneTime = 1;
    stoneCount = 10;
    stoneAngle = -PI / 2;
    stoneSpeed = 1;
    enemyStoneAngle = PI / 2;
    enemyStoneAngleVel = 1;
    enemyStoneSpeed = 1;
    enemyStoneSpeedVel = 1;
    rings = [];
    multiplier = 1;
  }
  const sd = sqrt(difficulty);
  color("light_purple");
  rect(0, 0, 10, 150);
  rect(90, 0, 10, 150);
  color("light_black");
  rect(10, 119, 80, 1);
  box(50, 60, 3, 3);
  rect(0, 144, (stoneCount + nextStoneTime) * 6, 6);
  color("black");
  if (ticks < 99) {
    text("Slide here", 22, 130);
  }
  times(stoneCount, (i) => {
    char("a", i * 6 + 3, 147);
  });
  stoneAngle = clamp(
    input.pos.angleTo(50, 120),
    -PI / 2 - PI / 3,
    -PI / 2 + PI / 3
  );
  stoneSpeed = clamp((input.pos.y - 120) / 10 + 1, 1, 4);
  bar(50, 120, stoneSpeed * 5, 2, stoneAngle, 0);
  if (stoneCount > 0) {
    char("a", 50, 120);
  }
  enemyStoneAngle += enemyStoneAngleVel * rnd(0.02, 0.03) * sd;
  if (
    (enemyStoneAngle > PI / 2 + PI / 3 && enemyStoneAngleVel > 0) ||
    (enemyStoneAngle < PI / 2 - PI / 3 && enemyStoneAngleVel < 0)
  ) {
    enemyStoneAngleVel *= -1;
  }
  enemyStoneSpeed += enemyStoneSpeedVel * rnd(0.03, 0.04) * sd;
  if (
    (enemyStoneSpeed > 4 && enemyStoneSpeedVel > 0) ||
    (enemyStoneSpeed < 1 && enemyStoneSpeedVel < 0)
  ) {
    enemyStoneSpeedVel *= -1;
  }
  bar(50, 0, enemyStoneSpeed * 5, 2, enemyStoneAngle, 0);
  char("b", 50, 0);
  let blastStoneCount = 0;
  stones.forEach((s) => {
    if (s.side === 2) {
      blastStoneCount++;
    }
  });
  nextStoneTime -= 0.01 * sd;
  if (nextStoneTime <= 0) {
    if (stoneCount === 0) {
      if (rings.length === 0 && blastStoneCount === 0) {
        play("explosion");
        end();
      } else {
        nextStoneTime = 0;
      }
    } else {
      play("laser");
      nextStoneTime = 1;
      stoneCount--;
      stones.push({
        pos: vec(50, 120),
        vel: vec(stoneSpeed).rotate(stoneAngle),
        side: 0,
        blastTicks: 60,
      });
      stones.push({
        pos: vec(50, 0),
        vel: vec(enemyStoneSpeed).rotate(enemyStoneAngle),
        side: 1,
        blastTicks: 60,
      });
    }
  }
  color("purple");
  remove(rings, (r) => {
    r.angleWidth += r.angleWidthVel;
    arc(centerPos, r.radius, 3, r.angle - r.angleWidth, r.angle + r.angleWidth);
    r.radius += 2;
    return r.radius > 99;
  });
  color("black");
  remove(stones, (s) => {
    s.pos.add(s.vel);
    s.vel.mul(0.98);
    if ((s.pos.x < 13 && s.vel.x < 0) || (s.pos.x > 87 && s.vel.x > 0)) {
      s.vel.x *= -1;
    }
    if ((s.pos.y < 3 && s.vel.y < 0) || (s.pos.y > 117 && s.vel.y > 0)) {
      s.vel.y *= -1;
    }
    let ss = s.side;
    if (ss === 2) {
      s.blastTicks--;
      if (s.blastTicks < 1) {
        play("coin");
        const radius = s.pos.distanceTo(centerPos);
        rings.push({
          radius,
          angle: centerPos.angleTo(s.pos),
          angleWidth: 0,
          angleWidthVel: 1 / (radius + 1),
        });
        return true;
      }
      ss = clamp(floor(ticks / s.blastTicks) % 2, 0, 1);
    }
    if (
      char(addWithCharCode("a", ss), s.pos).isColliding.rect.purple &&
      s.side < 2
    ) {
      play("powerUp");
      if (s.side === 0) {
        stoneCount++;
      }
      color(s.side === 1 ? "red" : "blue");
      particle(s.pos);
      addScore(multiplier, s.pos);
      multiplier++;
      return true;
    }
    stones.forEach((as) => {
      if (s === as) {
        return;
      }
      if (s.pos.distanceTo(as.pos) < 6) {
        const v = vec(s.vel);
        addCollidingVelocity(s, as, vec(as.vel));
        addCollidingVelocity(as, s, v);
        s.pos.add(s.vel);
        s.pos.add(s.vel);
        as.pos.add(as.vel);
        as.pos.add(as.vel);
        if (s.side === 1 && as.side === 0) {
          play("click");
          s.side = 2;
        } else if (as.side === 1 && s.side === 0) {
          play("click");
          as.side = 2;
        } else {
          play("hit");
        }
      }
    });
  });
  if (rings.length === 0) {
    multiplier = 1;
  }
}

function addCollidingVelocity(s, as, v) {
  const a = s.pos.angleTo(as.pos);
  const pr = abs(cos(v.angle - a)) * 0.7;
  as.vel.addWithAngle(a, v.length * pr);
  s.vel.addWithAngle(a, -v.length * pr);
}
