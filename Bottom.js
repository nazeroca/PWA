// ゲーム開始カウントダウン（セクション4で表示）
function startGameCountdown(gameFunction, ...args) {
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;
  
  // 現在のゲーム情報を保存
  currentGameFunction = gameFunction;
  currentGameArgs = args;
  isWaitingForGame = true;
  
  // スキップボタンを有効化
  enableSkipButton();
  
  // カウントダウン要素を作成（セクション4の中央に表示）
  const countdownElement = document.createElement('div');
  countdownElement.className = 'game-countdown';
  countdownElement.id = 'game-countdown';
  countdownElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: min(11.4vh, 10vh);
    font-weight: bold;
    color: #FF4444;
    text-shadow: 0 0 4.29vh rgba(255, 68, 68, 0.8);
    z-index: 1000;
    pointer-events: none;
    font-family: 'Courier New', monospace;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  gameArea.appendChild(countdownElement);
  
  let countdown = 3;
  countdownElement.textContent = countdown;
  countdownElement.classList.add('pulse');
  

  
  // 1秒ごとにカウントダウンを更新
  gameCountdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownElement.textContent = countdown;
      countdownElement.classList.remove('pulse');
      setTimeout(() => countdownElement.classList.add('pulse'), 50);
    } else {
      // カウントダウン完了
      clearInterval(gameCountdownInterval);
      countdownElement.remove();
      executeScheduledGame();
    }
  }, 1000);
  
  // 5秒後の自動実行タイマー
  gameCountdownTimeout = setTimeout(() => {
    executeScheduledGame();
  }, 5000);
}

// スケジュールされたゲームを実行
function executeScheduledGame() {
  if (!isWaitingForGame || !currentGameFunction) return;
  

  
  // カウントダウンをクリア
  clearGameCountdown();
  
  // スキップボタンを無効化
  disableSkipButton();
  
  // ゲームを実行
  isWaitingForGame = false;
  currentGameFunction(...currentGameArgs);
  
  // 実行後にリセット
  currentGameFunction = null;
  currentGameArgs = [];
}

// ゲームをスキップして完了状態にする関数
function skipGameToCompleted() {
  if (!isWaitingForGame) return;
  
  // インジケーターをチェックして消費
  if (!IndicatorManager.consumeIndicator('skip')) {

    return;
  }
  

  
  // SKIP表示
  showSection4Text('skip');
  
  // カウントダウンをクリア
  clearGameCountdown();
  
  // スキップボタンを無効化
  disableSkipButton();
  
  // ゲーム実行せずに完了状態にする
  isWaitingForGame = false;
  isGameActive = false;
  
  // サイコロセクションを有効化（ノーツを流し終えた状態と同じ）
  enableDiceSection();
  
  // 実行後にリセット
  currentGameFunction = null;
  currentGameArgs = [];
  

}

// ゲームカウントダウンをクリア
function clearGameCountdown() {
  if (gameCountdownTimeout) {
    clearTimeout(gameCountdownTimeout);
    gameCountdownTimeout = null;
  }
  if (gameCountdownInterval) {
    clearInterval(gameCountdownInterval);
    gameCountdownInterval = null;
  }
  
  const countdownElement = document.getElementById('game-countdown');
  if (countdownElement) {
    countdownElement.remove();
  }
}

// スキップボタン有効化
function enableSkipButton() {
  const skipButton = document.getElementById('skip-button');
  if (skipButton) {
    skipButton.classList.remove('disabled');
  }
}

// スキップボタン無効化
function disableSkipButton() {
  const skipButton = document.getElementById('skip-button');
  if (skipButton) {
    skipButton.classList.add('disabled');
  }
}

// ノーツ終了時にFINISHを表示（既存の終了処理に追加）
function onNotesFinish() {
  // FINISHテキストを表示
  showSection4Text('finish', 1500);
  
  // サイコロセクションを有効化
  enableDiceSection();
}