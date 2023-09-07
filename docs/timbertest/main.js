title = "TIMBER TEST";

description = `
[Tap] Cut a log
`;

characters = [];

options = {
  isPlayingBgm: true,
  seed: 18,
};

let timber;
let cutCount;
let cutIndex;
let pieces;
let saw;
let scoreCountTicks;
let scoreCountIndex;
let turnScore;
let turnIndex;
let isShowingIndicator;

function update() {
  if (!ticks) {
    turnIndex = 0;
    nextTimber();
  }
  color("red");
  rect(timber.x, 20, timber.width, 10);
  saw.x += saw.vx;
  color("black");
  rect(saw.x - 1, 10, 3, input.isJustPressed ? 30 : 7);
  text(`1/${cutCount}`, 5, 35);
  if (scoreCountTicks === 0 && saw.x >= timber.x + timber.width) {
    const size = vec(timber.width, 10);
    pieces.push({
      size,
      pos: vec(timber.x + size.x / 2, 20 + 10 / 2),
      targetPos: vec(50, 40 + cutIndex * 15),
    });
    timber.width = 0;
    cutIndex++;
    scoreCountTicks = 1;
  }
  if (scoreCountTicks === 0 && input.isJustPressed) {
    isShowingIndicator = false;
    const cw = saw.x - timber.x;
    if (cw > 0) {
      play("select");
      const size = vec(cw, 10);
      pieces.push({
        size,
        pos: vec(timber.x + size.x / 2, 20 + 10 / 2),
        targetPos: vec(50, 40 + cutIndex * 15),
      });
      timber.x = saw.x;
      timber.width -= cw;
      cutIndex++;
    }
  }
  pieces.forEach((p) => {
    if (p.pos.distanceTo(p.targetPos) < 1) {
      p.pos = p.targetPos;
    } else {
      p.pos.add(vec(p.targetPos).sub(p.pos).mul(0.1));
    }
    color("red");
    box(p.pos, p.size);
  });
  if (scoreCountTicks > 0) {
    scoreCountTicks += difficulty * (pieces.length + 1) * 0.5;
    const c = clamp(
      floor(scoreCountTicks / 20),
      0,
      Math.max(cutCount, pieces.length)
    );
    times(c, (i) => {
      color("black");
      const y = 40 + i * 15;
      if (i === 0) {
        if (turnScore < 0) {
          color("red");
        }
        text(`${turnScore}`, 80, y);
      } else {
        const pw1 = i - 1 < pieces.length ? pieces[i - 1].size.x : 0;
        const pw2 = i < pieces.length ? pieces[i].size.x : 0;
        const p =
          (pw1 === 0 && pw2 === 0) || i > cutCount
            ? 100
            : floor((abs(pw1 - pw2) / (pw1 + pw2)) * 300);
        text(`-${p}`, 74, y);
        if (i === scoreCountIndex) {
          play("hit");
          turnScore -= p;
          scoreCountIndex++;
        }
      }
    });
  }
  if (saw.x > 160) {
    if (turnScore < 0) {
      play("explosion");
      end();
    } else {
      score += turnScore;
      nextTimber();
    }
  }
  color("black");
  if (turnIndex <= 3 && isShowingIndicator) {
    times(cutCount - 1, (i) => {
      text("^", timber.x + (timber.width / cutCount) * (i + 1), 35);
    });
    text("Cut here!", 32, 38);
  }
}

function nextTimber() {
  play("powerUp");
  const tw = rnd(40, 80);
  timber = { x: (100 - tw) / 2 + rnd((100 - tw) / 3), width: tw };
  cutCount = rndi(2, 5);
  turnScore = (cutCount - 1) * 100;
  cutIndex = 0;
  pieces = [];
  saw = { x: -30, vx: (difficulty / sqrt(cutCount)) * 2 };
  scoreCountTicks = 0;
  scoreCountIndex = 1;
  turnIndex++;
  isShowingIndicator = true;
}
