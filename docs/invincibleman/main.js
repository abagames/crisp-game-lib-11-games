title = "INVINCIBLE MAN";

description = `
[Tap]
 Turn
[Hold]
 Walk outward
`;

characters = [
  `
  ll
  l
 llll
l l
 l ll
l
`,
  `
   ll
  l
llll
  l
ll l
    l
`,
  `
ll ll
l  l
 llll
lllll
lllll
l l l
`,
  `
 ll ll
 l  l
 llll
lllll
lllll
 l l
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 2,
};

let player;
let humans;
let nextHumanTicks;
let enemies;
let nextEnemyTicks;
let explosions;
let multiplier;

function update() {
  if (!ticks) {
    player = { pos: vec(50, 40), va: -1, ticks: 0 };
    humans = times(10, () => ({
      pos: vec(rnd(40, 60), rnd(40, 60)),
      targetPos: vec(rnd(40, 60), rnd(40, 60)),
      vel: vec(),
      ticks: rnd(60),
    }));
    nextHumanTicks = 0;
    enemies = [];
    nextEnemyTicks = 0;
    explosions = [];
    multiplier = 1;
  }
  const sd = difficulty;
  const tc = player.pos.angleTo(50, 50);
  if (input.isJustPressed) {
    play("laser");
    player.va *= -1;
  }
  const px = player.pos.x;
  if (input.isPressed) {
    player.pos.addWithAngle(tc, -sd);
  } else {
    player.pos.addWithAngle(tc + (PI / 2) * player.va, 0.7 * sd);
  }
  player.pos.addWithAngle(tc, (player.pos.distanceTo(50, 50) + 9) * 0.005 * sd);
  player.pos.clamp(0, 100, 0, 100);
  player.ticks += sd;
  color("cyan");
  char(addWithCharCode("a", floor(player.ticks / 30) % 2), player.pos, {
    mirror: { x: player.pos.x > px ? 1 : -1 },
  });
  color("red");
  remove(explosions, (e) => {
    e.radius += e.rv * 0.6 * sd;
    if (e.rv > 0) {
      if (e.radius > 12) {
        e.rv = -1;
      }
    } else {
      if (e.radius < 1) {
        return true;
      }
    }
    arc(e.pos, e.radius);
  });
  nextHumanTicks -= sd;
  if (nextHumanTicks < 0) {
    if (humans.length < 9) {
      const p = vec(50, 50);
      humans.forEach((h) => {
        p.add(h.pos);
      });
      p.div(humans.length + 1);
      humans.push({
        pos: p,
        targetPos: vec(rnd(40, 60), rnd(40, 60)),
        vel: vec(),
        ticks: rnd(60),
      });
    }
    nextHumanTicks = 600;
  }
  color("black");
  remove(humans, (h) => {
    let ta;
    if (enemies.length > 0) {
      const ne = getNearestActor(enemies, h.pos);
      if (ne.pos.distanceTo(h.pos) < 25) {
        ta = ne.pos.angleTo(h.pos);
      }
    }
    if (ta == null) {
      if (h.pos.distanceTo(h.targetPos) < 1) {
        h.targetPos.set(rnd(40, 60), rnd(40, 60));
      }
      ta = h.pos.angleTo(h.targetPos);
    }
    h.vel.addWithAngle(ta, 0.01);
    h.vel.mul(0.9);
    let px = h.pos.x;
    h.pos.add(vec(h.vel).mul(sd));
    h.pos.clamp(10, 90, 10, 90);
    h.ticks += sd;
    const c = char(addWithCharCode("a", floor(h.ticks / 30) % 2), h.pos, {
      mirror: { x: h.pos.x > px ? 1 : -1 },
    });
    if (c.isColliding.rect.red) {
      play("explosion");
      particle(h.pos, 9, 2);
      return true;
    }
  });
  nextEnemyTicks -= sd;
  if (nextEnemyTicks < 0) {
    const ep = vec(50, 50).addWithAngle(rnd(PI * 2), 80);
    const ec = rndi(3, 9);
    times(ec, () => {
      enemies.push({
        pos: vec(ep).add(rnds(9), rnds(9)),
        vel: vec(rnds(1 / sd), rnds(1 / sd)),
        ticks: rnd(60),
      });
    });
    nextEnemyTicks = rnd(70, 99) * sqrt(ec);
  }
  color("red");
  remove(enemies, (e) => {
    let px = e.pos.x;
    if (humans.length > 0) {
      const nh = getNearestActor(humans, e.pos);
      e.vel.addWithAngle(e.pos.angleTo(nh.pos), 0.005);
      e.vel.mul(0.95);
      e.pos.add(vec(e.vel).mul(sd));
    }
    e.ticks += sd;
    const c = char(addWithCharCode("c", floor(e.ticks / 30) % 2), e.pos, {
      mirror: { x: e.pos.x > px ? 1 : -1 },
    }).isColliding;
    if (c.rect.red || c.char.a || c.char.b) {
      play("powerUp");
      explosions.push({
        pos: e.pos,
        radius: 1,
        rv: 1,
      });
      addScore(multiplier, e.pos);
      multiplier++;
      return true;
    }
  });
  if (explosions.length === 0) {
    multiplier = 1;
  }
  if (humans.length === 0) {
    play("lucky");
    end();
  }
}

function getNearestActor(actors, pos) {
  return actors.reduce((a, b) => {
    return a.pos.distanceTo(pos) < b.pos.distanceTo(pos) ? a : b;
  });
}
