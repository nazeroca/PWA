// サイコロセクション無効化
function disableDiceSection() {
  const diceContainer = document.getElementById('dice-container');
  const section6 = document.querySelector('.section-6');
  const controlMatrix = document.getElementById('control-matrix');
  
  if (diceContainer) {
    diceContainer.classList.add('disabled');
  }
  if (section6) {
    section6.classList.add('disabled');
  }
  // ゲーム開始時にCONTROL MATRIXを有効化
  if (controlMatrix) {
    controlMatrix.classList.remove('disabled');
  }
  
  // サイコロボタンを無効化（ゲーム開始時は既に無効化されているが念のため）
  // disableDiceButton(); // rollDice関数内で既に無効化されているのでコメントアウト
}

// サイコロセクション有効化
function enableDiceSection() {
  // 試練モード中は青ダイスを有効化しない
  if (isChallengeMode) {

    return;
  }
  
  const diceContainer = document.getElementById('dice-container');
  const section6 = document.querySelector('.section-6');
  const controlMatrix = document.getElementById('control-matrix');
  
  if (diceContainer) {
    diceContainer.classList.remove('disabled');
  }
  if (section6) {
    section6.classList.remove('disabled');
  }
  // ゲーム終了時にCONTROL MATRIXを無効化
  if (controlMatrix) {
    controlMatrix.classList.add('disabled');
  }
  
  // 停止状態もリセット
  isNotesFrozen = false;
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  
  // 停止カウントダウン表示も削除
  const stopCountdownElement = document.getElementById('stop-countdown');
  if (stopCountdownElement) {
    stopCountdownElement.remove();
  }
  
  // サイコロボタンを有効化
  enableDiceButton();
}

// サイコロボタンの有効化・無効化
function enableDiceButton() {
  if (diceButton) {
    diceButton.classList.remove('dice-disabled');

  }
}

function disableDiceButton() {
  if (diceButton) {
    diceButton.classList.add('dice-disabled');

  }
}

function showDiceFace(number) {
  // 全てのfaceクラスを削除
  diceDisplay.className = 'dice-dots';
  // 指定された数字のfaceクラスを追加
  diceDisplay.classList.add(`face-${number}`);
}

function rollDice() {
  if (isRolling || isGameActive || diceButton.classList.contains('dice-disabled')) return; // ゲーム中または無効化中は無効
  
  isRolling = true;
  disableDiceButton(); // サイコロを無効化
  dice.classList.add('rolling');
  
  // 先に乱数で結果を決定（1-6）
  const result = Math.floor(getSecureRandom() * 6) + 1;

  
  // 回転中にランダムなドットパターンを表示
  let rollCount = 0;
  const maxRolls = 15;
  const rollInterval = setInterval(() => {
    const randomFace = Math.floor(getSecureRandom() * 6) + 1;
    showDiceFace(randomFace);
    rollCount++;
    
    if (rollCount >= maxRolls) {
      clearInterval(rollInterval);
      showDiceFace(result);
      dice.classList.remove('rolling');
      
      // 結果処理完了後、少し待ってからサイコロを有効に戻す
      setTimeout(() => {
        isRolling = false;
      }, 500);
      
      // すごろく盤のコマを移動
      handleDiceResult(result);
    }
  }, 60); // 60msごとにドットパターンを変更
}