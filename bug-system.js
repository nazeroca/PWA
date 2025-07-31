// バグシステム管理ファイル
let currentBug = null;
let lastDiceResult = null;
let lastHitCount = 0; // 前回の移動後のHITS値を記録

// バグの定義
const BUGS = {
  normalBug: {
    description: '白マス停止時に1秒10回',
    triggerCondition: (color, diceResult) => color === 'white',
    effect: {
      speed: 1000,
      count: 10,
      type: 'normal'
    }
  },
  mutationBug: {
    description: '紫マス停止時に1秒40個',
    triggerCondition: (color, diceResult) => color === 'purple',
    effect: {
      speed: 1000,
      count: 40,
      type: 'normal'
    }
  },
  independentBug: {
    description: 'SPACE素数で1.7秒17個',
    triggerCondition: (color, diceResult) => {
      // 現在の位置が素数かチェック
      return isPrime(currentPosition);
    },
    effect: {
      speed: 1700,
      count: 17,
      type: 'normal'
    }
  },
  loadBug: {
    description: 'HITS+50回で2秒20個',
    triggerCondition: (color, diceResult) => {
      // 前回から50以上HITSが増加したかチェック
      const currentHitCount = (typeof hitCount !== 'undefined') ? hitCount : 0;
      const increase = currentHitCount - lastHitCount;
      return increase >= 50;
    },
    effect: {
      speed: 2000,
      count: 20,
      type: 'normal'
    }
  },
  unluckyBug: {
    description: '1の目で0.7秒15個',
    triggerCondition: (color, diceResult) => diceResult === 1,
    effect: {
      speed: 700,
      count: 15,
      type: 'normal'
    }
  }
};

// 素数判定関数
function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

// バグを適用する関数
function applyBug() {
  // 利用可能なバグのリストを作成（現在のバグは除外）
  const availableBugs = Object.keys(BUGS).filter(key => {
    return !currentBug || BUGS[key] !== currentBug;
  });
  
  // ランダムにバグを選択
  const randomIndex = Math.floor(getSecureRandom() * availableBugs.length);
  const selectedBugKey = availableBugs[randomIndex];
  currentBug = BUGS[selectedBugKey];
  

  
  // セクション7にバグの内容を表示
  updateBugDisplay();
}

// バグの表示を更新する関数
function updateBugDisplay() {
  const eventText = document.getElementById('event-text');
  if (!eventText) {
    console.error('イベント表示要素が見つかりません');
    return;
  }
  
  if (currentBug) {
    eventText.textContent = `${currentBug.description}`;
    eventText.classList.remove('event-active'); // 黄色のクラスを削除
  } else {
    eventText.textContent = 'SYSTEM READY';
    eventText.classList.remove('event-active');
  }
}

// バグの効果をチェックして実行する関数
function checkAndExecuteBug(currentColor, diceResult) {
  if (!currentBug) {

    // lastHitCountを更新
    if (typeof hitCount !== 'undefined') {
      lastHitCount = hitCount;
    }
    return Promise.resolve();
  }
  
  // バグの発動条件をチェック
  if (currentBug.triggerCondition(currentColor, diceResult)) {

    
    // バグによるノーツ処理を実行
    const bugPromise = executeBugEffect(currentBug);
    
    // 負荷呪術の場合、発動後にlastHitCountを更新
    if (currentBug === BUGS.loadBug) {
      bugPromise.then(() => {
        if (typeof hitCount !== 'undefined') {
          lastHitCount = hitCount;
        }
      });
    }
    
    return bugPromise;
  }
  
  // バグが発動しなかった場合もlastHitCountを更新
  if (typeof hitCount !== 'undefined') {
    lastHitCount = hitCount;
  }
  
  return Promise.resolve();
}

// バグの効果を実行する関数
function executeBugEffect(bug) {
  return new Promise((resolve) => {

    
    // セクション7の文字色を紫に変更
    const eventText = document.getElementById('event-text');
    if (eventText) {
      eventText.classList.add('bug-active');
    }
    
    // バグのノーツを流す（背景変更なし）
    if (bug.effect.type === 'normal') {
      startBugGame(bug.effect.speed, bug.effect.count, resolve);
    }
  });
}

// バグ専用のゲーム開始関数
function startBugGame(speed, count, callback) {
  // バグモードフラグを設定
  isChallengeMode = true; // 試練モードフラグを流用（バグモードとして）
  
  let bugCircleCount = 0;
  const maxBugCircles = count;
  let bugCircles = [];
  

  
  // バグのノーツを生成
  function spawnBugCircle() {
    if (bugCircleCount >= maxBugCircles) return;
    
    const circle = document.createElement('div');
    circle.classList.add('circle', 'bug-circle');
    circle.style.backgroundColor = '#8B008B'; // バグのノーツは紫色
    
    const gameArea = document.getElementById('game-area');
    gameArea.appendChild(circle);
    bugCircles.push(circle);
    
    // 通常のノーツと同じアニメーション処理
    const startTime = performance.now();
    let pausedTime = 0;
    let isPaused = false;
    let totalPausedDuration = 0;
    
    function animate(currentTime) {
      // 停止中の場合は時間を更新しない
      if (isNotesFrozen) {
        if (!isPaused) {
          pausedTime = currentTime;
          isPaused = true;
          circle.classList.add('frozen');
        }
        requestAnimationFrame(animate);
        return;
      } else if (isPaused) {
        const pauseDuration = currentTime - pausedTime;
        totalPausedDuration += pauseDuration;
        isPaused = false;
        circle.classList.remove('frozen');
      }
      
      const elapsed = currentTime - startTime - totalPausedDuration;
      const progress = elapsed / fallDuration;
      
      if (progress < 1) {
        const startX = gameArea.clientWidth;
        const endX = -window.innerWidth * 0.133;
        const posX = startX + (endX - startX) * progress;
        circle.style.left = posX + 'px';
        
        // 判定ライン処理
        const judgeX = gameArea.clientWidth * 0.2;
        const center = posX + (window.innerWidth * 0.0665);
        
        if (!circle.played && center <= judgeX) {
          // 音声再生
          const hitSound = document.getElementById('hit');
          if (hitSound && hitSound.readyState >= 2) {
            hitSound.currentTime = 0;
            hitSound.play().catch(error => {
              console.error('バグノーツ音声再生エラー:', error);
            });
          }
          circle.played = true;
          
          // ヒット数をカウント
          if (typeof hitCount !== 'undefined') {
            hitCount++;
            totalHitCount++; // 累計ヒット数も更新
            updateHitCounter();
          }
          
          circle.remove();
          bugCircles = bugCircles.filter(c => c !== circle);
          return;
        }
        requestAnimationFrame(animate);
      } else {
        circle.remove();
        bugCircles = bugCircles.filter(c => c !== circle);
      }
    }
    requestAnimationFrame(animate);
    bugCircleCount++;
  }
  
  // 指定間隔でノーツを生成
  let spawnedCount = 0;
  function spawnNext() {
    if (spawnedCount >= count) return;
    
    if (isNotesFrozen) {
      setTimeout(spawnNext, 100);
      return;
    }
    
    spawnBugCircle();
    spawnedCount++;
    
    if (spawnedCount < count) {
      setTimeout(spawnNext, speed);
    }
  }
  
  spawnNext();
  
  // 全てのバグノーツが処理されるまで待機
  function checkBugEnd() {
    const allGone = bugCircles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133);
    });
    
    if (allGone && bugCircleCount >= maxBugCircles) {

      
      // バグモードを解除
      isChallengeMode = false;
      
      // セクション7の文字色を元に戻す
      const eventText = document.getElementById('event-text');
      if (eventText) {
        eventText.classList.remove('bug-active');
      }
      
      // バグ処理完了をコールバック
      callback();
    } else {
      setTimeout(checkBugEnd, 200);
    }
  }
  
  setTimeout(checkBugEnd, 1000);
}

// バグを削除する関数
function purgeBug() {
  // バグがかかっていない場合は何もしない
  if (!currentBug) {

    return;
  }
  

  
  // セクション7のバグ表示に近未来的な消去アニメーションを適用
  const eventText = document.getElementById('event-text');
  if (eventText) {
    // 消去アニメーションを開始
    eventText.classList.add('bug-purge-animation');
    
    // アニメーション完了後にバグをクリア
    setTimeout(() => {
      // バグをクリア
      currentBug = null;
      
      // セクション7のバグ表示を更新
      updateBugDisplay();
      
      // アニメーションクラスとバグ色を解除
      eventText.classList.remove('bug-purge-animation', 'bug-active');
      

    }, 1500);
  } else {
    // eventTextが見つからない場合は即座に削除
    currentBug = null;
    updateBugDisplay();

  }
}

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
  // バグ表示を初期化
  updateBugDisplay();
  
  // lastHitCountを初期化
  if (typeof hitCount !== 'undefined') {
    lastHitCount = hitCount;
  }
});
