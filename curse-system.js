// 呪いシステム管理ファイル
let currentCurse = null;
let lastDiceResult = null;

// 呪いの定義
const CURSES = {
  normalCurse: {
    name: '通常呪術',
    description: '白色停止で1秒5個',
    triggerCondition: (color, diceResult) => color === 'white',
    effect: {
      speed: 1000,
      count: 5,
      type: 'normal'
    }
  }
};

// 呪いを適用する関数
function applyCurse() {
  // 現在は通常呪術のみなので、必ずこれを付与
  currentCurse = CURSES.normalCurse;
  
  console.log('呪いが付与されました:', currentCurse.name);
  
  // セクション7に呪いの内容を表示
  updateCurseDisplay();
}

// 呪いの表示を更新する関数
function updateCurseDisplay() {
  const eventText = document.getElementById('event-text');
  if (!eventText) {
    console.error('イベント表示要素が見つかりません');
    return;
  }
  
  if (currentCurse) {
    eventText.textContent = `${currentCurse.name}: ${currentCurse.description}`;
    eventText.classList.remove('event-active'); // 黄色のクラスを削除
  } else {
    eventText.textContent = 'SYSTEM READY';
    eventText.classList.remove('event-active');
  }
}

// 呪いの効果をチェックして実行する関数
function checkAndExecuteCurse(currentColor, diceResult) {
  if (!currentCurse) {
    console.log('呪いが付与されていません');
    return Promise.resolve();
  }
  
  // 呪いの発動条件をチェック
  if (currentCurse.triggerCondition(currentColor, diceResult)) {
    console.log('呪いが発動しました:', currentCurse.name);
    
    // 呪いによるノーツ処理を実行
    return executeCurseEffect(currentCurse);
  }
  
  return Promise.resolve();
}

// 呪いの効果を実行する関数
function executeCurseEffect(curse) {
  return new Promise((resolve) => {
    console.log(`呪いの効果を実行中: ${curse.name}`);
    
    // セクション7の文字色を紫に変更
    const eventText = document.getElementById('event-text');
    if (eventText) {
      eventText.classList.add('curse-active');
    }
    
    // 呪いのノーツを流す（背景変更なし）
    if (curse.effect.type === 'normal') {
      startCurseGame(curse.effect.speed, curse.effect.count, resolve);
    }
  });
}

// 呪い専用のゲーム開始関数
function startCurseGame(speed, count, callback) {
  // 呪いモードフラグを設定
  isChallengeMode = true; // 試練モードフラグを流用（呪いモードとして）
  
  let curseCircleCount = 0;
  const maxCurseCircles = count;
  let curseCircles = [];
  
  console.log(`呪いのノーツを開始: ${speed}ms間隔で${count}個`);
  
  // 呪いのノーツを生成
  function spawnCurseCircle() {
    if (curseCircleCount >= maxCurseCircles) return;
    
    const circle = document.createElement('div');
    circle.classList.add('circle', 'curse-circle');
    circle.style.backgroundColor = '#8B008B'; // 呪いのノーツは紫色
    
    const gameArea = document.getElementById('game-area');
    gameArea.appendChild(circle);
    curseCircles.push(circle);
    
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
              console.error('呪いノーツ音声再生エラー:', error);
            });
          }
          circle.played = true;
          
          // ヒット数をカウント
          if (typeof hitCount !== 'undefined') {
            hitCount++;
            updateHitCounter();
          }
          
          circle.remove();
          curseCircles = curseCircles.filter(c => c !== circle);
          return;
        }
        requestAnimationFrame(animate);
      } else {
        circle.remove();
        curseCircles = curseCircles.filter(c => c !== circle);
      }
    }
    requestAnimationFrame(animate);
    curseCircleCount++;
  }
  
  // 指定間隔でノーツを生成
  let spawnedCount = 0;
  function spawnNext() {
    if (spawnedCount >= count) return;
    
    if (isNotesFrozen) {
      setTimeout(spawnNext, 100);
      return;
    }
    
    spawnCurseCircle();
    spawnedCount++;
    
    if (spawnedCount < count) {
      setTimeout(spawnNext, speed);
    }
  }
  
  spawnNext();
  
  // 全ての呪いノーツが処理されるまで待機
  function checkCurseEnd() {
    const allGone = curseCircles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133);
    });
    
    if (allGone && curseCircleCount >= maxCurseCircles) {
      console.log('呪いのノーツが全て終了しました');
      
      // 呪いモードを解除
      isChallengeMode = false;
      
      // セクション7の文字色を元に戻す
      const eventText = document.getElementById('event-text');
      if (eventText) {
        eventText.classList.remove('curse-active');
      }
      
      // 呪い処理完了をコールバック
      callback();
    } else {
      setTimeout(checkCurseEnd, 200);
    }
  }
  
  setTimeout(checkCurseEnd, 1000);
}

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
  // 呪い表示を初期化
  updateCurseDisplay();
});
