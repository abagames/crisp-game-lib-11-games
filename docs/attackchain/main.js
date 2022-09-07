title = "ATTACK CHAIN";

description = `
[Tap]
 Select card
`;

characters = [];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 2,
};

/** @type {{v: number, type: "red" | "blue" | "green", isValid: boolean}[]} */
let cards;
let barY;
let totalDamage;
let totalDamageTicks;
let damage;
let damageTicks;
let lastAttackType;
let message;
let messageColor;
let messageTicks;
let turn;
let totalTurn;
let multiplier;

function update() {
  if (!ticks) {
    barY = 0;
    totalDamage = 0;
    totalDamageTicks = 0;
    damage = 0;
    damageTicks = 0;
    lastAttackType = undefined;
    message = "";
    messageColor = "black";
    messageTicks = 0;
    turn = 0;
    totalTurn = 0;
    multiplier = 1;
    initCards();
  }
  cards.forEach((c, i) => {
    if (!c.isValid) {
      return;
    }
    const x = (i * 80) / 5 + 10;
    color(c.type);
    box(x, 90, 6);
    color("black");
    text(`${c.v}`, x - (c.v > 99 ? 6 : 3), 82);
  });
  color("black");
  rect(0, 75, 100, 1);
  color("red");
  barY += (difficulty + sqrt(multiplier)) * 0.002;
  if (damageTicks <= 0 && totalDamageTicks <= 0 && barY >= 75) {
    play("explosion");
    barY = 75;
    end();
  }
  rect(0, barY, 100, 1);
  color("black");
  if (damageTicks <= 0 && totalDamageTicks <= 0 && input.isJustPressed) {
    const i = floor((input.pos.x - 0) / (100 / 6));
    if (i >= 0 && i < 6 && cards[i].isValid) {
      play("select");
      barY += difficulty + sqrt(multiplier) * 0.05;
      const c = cards[i];
      c.isValid = false;
      if (turn === 0 && c.type === "red") {
        setMessage("First x1.25", "red");
        damage = c.v * 1.25;
      } else if (c.type === "green") {
        if (totalDamage > 99) {
          damage = 0;
          setMessage("Limit <=99", "green");
        } else if (totalDamage + c.v > 99) {
          damage = 99 - totalDamage;
          setMessage("Limit <=99", "green");
        } else {
          damage = c.v;
        }
      } else {
        damage = c.v;
      }
      damage = floor(damage);
      damageTicks = 30;
      turn++;
      lastAttackType = c.type;
      c.v = floor(c.v * 1.1 + 10);
    }
  }
  if (damageTicks > 0) {
    damageTicks -= difficulty;
    text(`${damage}`, 50 - (damage > 99 ? 6 : 3), 45 + damageTicks / 2);
    if (damageTicks <= 0) {
      play("hit");
      totalDamage += damage;
      if (totalDamage >= 100 || cardCount() === 0) {
        totalDamageTicks = 30;
      }
    }
  }
  text(
    `${totalDamage}`,
    50 - (totalDamage > 99 ? 12 : totalDamage > 9 ? 6 : 0),
    totalDamageTicks > 0 ? totalDamageTicks : 30,
    {
      scale: { x: 2, y: 2 },
    }
  );
  text(
    "%",
    59 + (totalDamage > 99 ? 12 : totalDamage > 9 ? 6 : 0),
    (totalDamageTicks > 0 ? totalDamageTicks : 30) + 3
  );
  if (totalDamageTicks > 0) {
    totalDamageTicks -= difficulty;
    if (totalDamageTicks <= 0) {
      play("click");
      addScore(totalDamage * multiplier);
      if (totalDamage >= 115) {
        barY -=
          ((totalDamage - 115) * sqrt(totalDamage - 115)) / sqrt(multiplier);
      }
      if (barY < 0) {
        barY = 0;
      }
      let rc = 0;
      let m = "";
      let cl = "black";
      if (totalDamage >= 200) {
        m = "AMAZING";
        rc = 3;
      } else if (totalDamage >= 150) {
        m = "BRAVO";
        rc = 2;
      } else if (totalDamage >= 100) {
        m = "COOL";
        rc = 1;
      }
      if (rc > 0 && lastAttackType === "blue") {
        m += " B_Return";
        cl = "blue";
      }
      setMessage(m, cl);
      turn = 0;
      totalTurn++;
      totalDamage = 0;
      returnCards(rc, lastAttackType === "blue");
      if (cardCount() === 0 || totalTurn > 6) {
        totalTurn = 0;
        multiplier++;
        initCards();
      }
    }
  }
  text(`x${multiplier}`, 3, 9);
  if (messageTicks > 0) {
    messageTicks -= difficulty;
    color(messageColor);
    text(message, 50 - message.length * 3, 70);
  }
}

function initCards() {
  play("powerUp");
  let greenCount = 2;
  cards = times(6, () => {
    /** @type {"red" | "blue" | "green"} */
    let type;
    if (rnd() < 0.2 && greenCount > 0) {
      type = "green";
      greenCount--;
    } else {
      type = rnd() < 0.5 ? "red" : "blue";
    }
    return {
      v: floor(rndi(3, 7) * (4 + sqrt(clamp(multiplier, 1, 20)))),
      type,
      isValid: true,
    };
  });
}

function returnCards(count, isBestReturner) {
  if (count === 0) {
    return;
  }
  if (isBestReturner) {
    let bi = 0;
    let bv = 0;
    cards.forEach((c, i) => {
      if (!c.isValid && c.v > bv) {
        bv = c.v;
        bi = i;
      }
    });
    cards[bi].isValid = true;
    count--;
  }
  times(count, () => {
    let ivi = [];
    cards.forEach((c, i) => {
      if (!c.isValid) {
        ivi.push(i);
      }
    });
    if (ivi.length > 0) {
      cards[ivi[rndi(ivi.length)]].isValid = true;
    }
  });
}

function cardCount() {
  let v = 0;
  cards.forEach((c) => {
    v += c.isValid ? 1 : 0;
  });
  return v;
}

function setMessage(m, cl = "black") {
  if (m.length === 0) {
    return;
  }
  message = m;
  messageColor = cl;
  messageTicks = 60;
}
