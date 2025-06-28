function spawnCircle() {
  if (circleCount >= maxCircles) return;
  const circle = document.createElement('div');
  circle.classList.add('circle');
  circle.style.backgroundColor = circlecolor;

  gameArea.appendChild(circle);
  circles.push(circle);
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = elapsed / fallDuration;
    if (progress < 1) {
      const startX = gameArea.clientWidth;
      const endX = -80;
      const posX = startX + (endX - startX) * progress;
      circle.style.left = posX + 'px';
      const judgeX = gameArea.clientWidth * 0.2;
      const center = posX + 40;
      if (!circle.played && center - judgeX < 0) {
        hitSound.currentTime = 0;
        hitSound.play().catch(error => console.error('音声再生エラー:', error));
        circle.played = true;
        circle.remove();
        circles = circles.filter(c => c !== circle);
      }
      requestAnimationFrame(animate);
    } else {
      circle.remove();
      circles = circles.filter(c => c !== circle);
    }
  }
  requestAnimationFrame(animate);
  circleCount++;
}


function startGame(speed, count, onEnd) {
  circleCount = 0;
  maxCircles = count;
  circles = [];

  intervalId = setInterval(() => {
    spawnCircle();
    if (circleCount >= maxCircles) clearInterval(intervalId);
  }, speed);

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}


function startGameR(speed1, speed2, count, onEnd) {
  circleCount = 0;
  maxCircles = count;
  circles = [];

  function spawnNext() {
    if (circleCount < maxCircles) {
      spawnCircle();
      let delay = speed1 + Math.random() * (speed2 - speed1);
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}


function startGameR2(speed1, speed2, count, onEnd) {
  circleCount = 0;
  maxCircles = count;
  circles = [];

  function spawnNext() {
    if (circleCount < maxCircles) {
      spawnCircle();
      const u = Math.random();
      const factor = 1 - Math.sqrt(1 - u * u);
      const delay = speed1 + factor * (speed2 - speed1);
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}


function startGameA(speed1, speed2, type, count1, count2, onEnd) {
  circleCount = 0;
  maxCircles = count1 + count2;
  circles = [];
  let noteIndex = 0;

  function spawnNext() {
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      let delay;
      if (noteIndex <= count1) {
        let t = noteIndex / count1;
        let factor = 1 - Math.pow((1 - t), type);
        delay = speed1 - (speed1 - speed2) * factor;
      } else {
        delay = speed2;
      }
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}

function startGameA2(speed1, speed2, speed3, type1, count1, type2, count2, onEnd) {
  circleCount = 0;
  maxCircles = count1 + count2;
  circles = [];
  let noteIndex = 0;

  function spawnNext() {
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      let delay;
      if (noteIndex <= count1) {
        let t = noteIndex / count1;
        let factor = 1 - Math.pow((1 - t), type1);
        delay = speed1 - (speed1 - speed2) * factor;
      } else {
        let noteIndex2 = noteIndex - count1;
        let t = noteIndex2 / count2;
        let factor = 1 - Math.pow((1 - t), type2);
        delay = speed2 - (speed2 - speed3) * factor;
      }

      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}


function startGameT(speed1, speed2, speed3, count1, count2, count3, onEnd) {
  circleCount = 0;
  maxCircles = count1 + count2 + count3;
  circles = [];
  let noteIndex = 0;

  function spawnNext() {
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      let delay;
      if (noteIndex < count1) {
        delay = speed1;
      } else if (noteIndex < count1 + count2) {
        delay = speed2;
      } else {
        delay = speed3;
      }

      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}

function startGameT2(speed1, speed2, count1, count2, sets, onEnd) {
  circleCount = 0;
  maxCircles = sets * (count1 + count2);
  circles = [];
  let noteIndex = 0;

  function spawnNext() {
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      let indexInSet = (noteIndex - 1) % (count1 + count2);
      let delay;
      if (indexInSet < count1) {
        delay = speed1;
      } else {
        delay = speed2;
      }

      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone && circleCount >= maxCircles) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  setTimeout(checkEnd, 1000);
}


function startGameP(speed1, count1, probability, speed2, count2, onEnd) {
  circleCount = 0;
  maxCircles = 1000;
  circles = [];
  let mainSpawned = 0;

  function spawnMain() {
    if (mainSpawned < count1) {
      if (Math.random() <= probability) {
        spawnExtraGroup(() => {
          mainSpawned++;
          setTimeout(spawnMain, speed1);
        });
        return;
      }
      spawnCircle();
      mainSpawned++;
      setTimeout(spawnMain, speed1);
    } else {
      checkEnd();
    }
  }

  function spawnExtraGroup(callbackExtra) {
    let extraSpawned = 0;
    function spawnExtraOne() {
      if (extraSpawned < count2) {
        spawnCircle();
        extraSpawned++;
        setTimeout(spawnExtraOne, speed2);
      } else {
        callbackExtra();
      }
    }
    spawnExtraOne();
  }

  function checkEnd() {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -80;
    });
    if (allGone) {
      if (onEnd) onEnd();
    } else {
      setTimeout(checkEnd, 200);
    }
  }

  spawnMain();
}


