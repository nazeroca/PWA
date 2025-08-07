const gameArea = document.getElementById('game-area');
const hitSound = document.getElementById('hit');

// 数字予測ボタン関連
let currentPredictNumber = 1;
let isNumberPredictEnabled = false;

// 音声初期化フラグ
let audioInitialized = false;

// 音声を初期化する関数
function initializeAudio() {
  if (audioInitialized) return;
  
  try {
    hitSound.volume = 0.7; // 音量設定
    hitSound.load(); // 音声ファイルを再読み込み

    
    // テスト再生（無音で実行、ブラウザの自動再生ポリシーを回避）
    hitSound.volume = 0;
    hitSound.play().then(() => {
      hitSound.pause();
      hitSound.currentTime = 0;
      hitSound.volume = 0.7;
      audioInitialized = true;

    }).catch(error => {

      // テスト再生が失敗してもvolume等は設定済みなので継続
      hitSound.volume = 0.7;
      audioInitialized = true;
    });
  } catch (error) {
    console.error('音声初期化エラー:', error);
  }
}

// ページロード時の音声初期化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeAudio, 1000); // 1秒後に初期化
});

// ユーザーの最初のクリック時に音声を有効化
document.addEventListener('click', function enableAudioOnFirstClick() {
  initializeAudio();
  // 一度だけ実行
  document.removeEventListener('click', enableAudioOnFirstClick);
}, { once: true });

// ゲーム関連変数
let fallDuration = 3000;
let intervalId = null;
let circleCount = 0;
let maxCircles = 100;
let circles = [];
let circlecolor = '#fff';
let isGameActive = false; // ゲーム実行中フラグ
let stopDuration = 30000; // 停止時間（10秒）
let stopTimeout = null; // 停止タイマーID
let isNotesFrozen = false; // ノーツ停止状態フラグ
let frozenNotes = []; // 停止中のノーツ情報を保存
let hitCount = 0; // ヒット数カウンター（内部処理用、リセットされる）
let totalHitCount = 0; // 累計ヒット数（表示用、リセットされない）
let isChallengeMode = false; // 試練モードフラグ



// 2Dサイコロ機能（ドット表示）
const diceButton = document.getElementById('dice-button');
const diceContainer = document.getElementById('dice-container');
const dice = document.getElementById('dice');
const diceDisplay = document.getElementById('dice-display');

let isRolling = false;




// LOG TRACEボタンにクリックイベントを追加
if (diceButton) {
  diceButton.addEventListener('click', rollDice);
}


// CONTROL MATRIXセクション全体にクリックイベントを追加
const controlMatrix = document.getElementById('control-matrix');
if (controlMatrix) {
  controlMatrix.addEventListener('click', () => {

    
    // ゲーム実行中かつ非停止中、かつボタンが有効、かつインジケーターがある場合のみ動作
    if (isGameActive && !isNotesFrozen && !controlMatrix.classList.contains('disabled') && 
        !controlMatrix.classList.contains('no-indicators') && IndicatorManager.stopCount > 0) {

      freezeNotes();
    } else {
      console.log('停止機能は実行されません - 条件:', {
        isGameActive,
        isNotesFrozen,
        isDisabled: controlMatrix.classList.contains('disabled'),
        hasIndicators: IndicatorManager.stopCount > 0
      });
    }
  });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
  // タイマーは最初のサイコロで開始するため、ここでは開始しない
  // startSystemTimer();
  
  // タイマー表示を初期化（0:00）
  const timerElement = document.getElementById('system-timer');
  if (timerElement) {
    timerElement.textContent = '0:00';
  }
  
  // データストリームを初期化
  updateDataStream(0, null);
  
  // ヒットカウンターを初期化
  updateHitCounter();
  
  // すごろく盤を初期化
  initializeSugorokuBoard();
  
  // CONTROL MATRIXを初期状態で無効化（ノーツが流れていない状態）
  const controlMatrix = document.getElementById('control-matrix');
  if (controlMatrix) {
    controlMatrix.classList.add('disabled');
  }
  
  // スキップボタンを初期状態で無効化
  disableSkipButton();
  
  // セクション2の背景を初期状態（白）に設定
  updateSectionBackground('white');
  
  // インジケーターシステムを初期化
  IndicatorManager.initialize();
  
  // 数字予測ボタンを初期化
  disableNumberPredictButton(); // 初期状態では無効
  
  // テスト用：ノーツを1つ生成してテスト

  const testCircle = document.createElement('div');
  testCircle.classList.add('circle');
  testCircle.style.backgroundColor = '#fff';
  testCircle.id = 'test-circle';
  gameArea.appendChild(testCircle);

  
  // 初期ノーツは削除（最初は何も流さない）

});

// すごろく盤関連の変数
let currentPosition = 0; // プレイヤーの実際の位置
let displayOffset = 0; // 表示用のオフセット



const TOTAL_SQUARES = 7; // 表示する固定マス数
const colors = ['red', 'blue', 'green', 'purple', 'yellow', 'white', 'black'];
let colorSequence = []; // 無限の色シーケンス
let eventSequence = []; // イベントマス情報の無限シーケンス
let boardSquares = []; // 固定された7つのマス要素




// セクション2の背景色を更新する関数
function updateSectionBackground(color) {
  const section2 = document.querySelector('.section-2');
  if (!section2) return;
  
  // 既存の色クラスを削除
  section2.classList.remove('bg-red', 'bg-blue', 'bg-green', 'bg-purple', 'bg-yellow', 'bg-white', 'bg-black', 'bg-bug');
  
  // 新しい色クラスを追加
  if (color) {
    section2.classList.add(`bg-${color}`);
  }
}



// システムタイマー関連
let systemStartTime = Date.now();
let timerInterval = null;
let isFirstDiceRoll = true; // 初回サイコロ判定フラグ

function updateSystemTimer() {
  const now = Date.now();
  const elapsed = now - systemStartTime;

  // 分数を60分を超えてもそのままカウント
  const totalMinutes = Math.floor(elapsed / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

  const formattedTime =
    String(totalMinutes) + ':' +
    String(seconds).padStart(2, '0');

  const timerElement = document.getElementById('system-timer');
  if (timerElement) {
    // テキストは常に更新
    timerElement.textContent = formattedTime;

    // 1分ごと（秒数が0の時）にアニメーションを実行（ただし開始時を除く）
    if (seconds === 0 && elapsed > 0) {
      timerElement.classList.add('updated');
      setTimeout(() => {
        timerElement.classList.remove('updated');
      }, 500);
    }
  }
}


// タイマーを開始する関数
function startSystemTimer() {
  // サイコロを振った瞬間を開始時刻に設定
  systemStartTime = Date.now();
  
  // 初期表示を更新
  updateSystemTimer();
  
  // 1秒ごとに更新
  timerInterval = setInterval(updateSystemTimer, 1000);
}

// データストリーム情報を更新する関数
function updateDataStream(position, color) {
  const positionInfo = document.getElementById('position-info');
  
  if (positionInfo) {
    const newPositionText = position.toString().padStart(3, '0');
    if (positionInfo.textContent !== newPositionText) {
      positionInfo.textContent = newPositionText;
      // アニメーションクラスを追加
      positionInfo.classList.add('updated');
      setTimeout(() => {
        positionInfo.classList.remove('updated');
      }, 500);
    }
  }
}

// ヒットカウンターを更新する関数
function updateHitCounter() {
  const hitCounterElement = document.getElementById('hit-counter');
  if (hitCounterElement) {
    hitCounterElement.textContent = totalHitCount.toString().padStart(4, '0');

    // ヒット時のエフェクト
    hitCounterElement.classList.add('updated');
    setTimeout(() => {
      hitCounterElement.classList.remove('updated');
    }, 500);
  }
}

// タイマーとデータストリームを開始
// startSystemTimer(); // 初回サイコロで開始するためコメントアウト
updateDataStream(currentPosition, colorSequence[currentPosition]);



// パターン表示とカウントダウン関連の変数
let gameCountdownTimeout = null;
let gameCountdownInterval = null;
let isWaitingForGame = false;
let currentGameFunction = null;
let currentGameArgs = [];

// パターンルーレット表示（候補desc切り替え演出）
function showPatternRoulette(finalPattern, callback, patternCandidates = null) {
  const patternRoulette = document.getElementById('pattern-roulette');
  const patternText = document.getElementById('pattern-text');
  
  if (!patternRoulette || !patternText) return;
  
  // 候補配列が必須
  if (!patternCandidates || patternCandidates.length === 0) {
    console.warn('patternCandidates is required for pattern roulette');
    if (callback) callback();
    return;
  }
  
  // ルーレット開始
  patternRoulette.classList.add('spinning');
  
  let spinCount = 0;
  const maxSpins = 30; // 変化回数
  
  const spinInterval = setInterval(() => {
    // 候補のdescからランダムに選択して表示
    const randomPattern = patternCandidates[Math.floor(getSecureRandom() * patternCandidates.length)];
    patternText.textContent = randomPattern.desc;
    
    spinCount++;
    
    if (spinCount >= maxSpins) {
      clearInterval(spinInterval);
      
      // 最終パターンを表示
      patternText.textContent = finalPattern;
      patternText.classList.add('final');
      
      // スピンアニメーション終了
      setTimeout(() => {
        patternRoulette.classList.remove('spinning');
        patternText.classList.remove('final');
        if (callback) callback();
      }, 200);
    }
  }, 30); // 間隔を少し長くして読みやすく
}

// セクション7でのルーレット演出（バグ用）
function showBugRoulette(finalBug, callback, bugCandidates = null) {
  const eventDisplay = document.getElementById('event-display');
  const eventText = document.getElementById('event-text');
  
  if (!eventDisplay || !eventText) return;
  
  // 候補配列が必須
  if (!bugCandidates || bugCandidates.length === 0) {
    console.warn('bugCandidates is required for bug roulette');
    if (callback) callback();
    return;
  }
  
  // ルーレット開始
  eventDisplay.classList.add('spinning');
  
  let spinCount = 0;
  const maxSpins = 30; // 変化回数
  
  const spinInterval = setInterval(() => {
    // 候補のdescからランダムに選択して表示
    const randomBug = bugCandidates[Math.floor(getSecureRandom() * bugCandidates.length)];
    eventText.textContent = randomBug.desc;
    
    spinCount++;
    
    if (spinCount >= maxSpins) {
      clearInterval(spinInterval);
      
      // 最終バグを表示
      eventText.textContent = finalBug;
      eventText.classList.add('final');
      
      // スピンアニメーション終了
      setTimeout(() => {
        eventDisplay.classList.remove('spinning');
        eventText.classList.remove('final');
        if (callback) callback();
      }, 200);
    }
  }, 30); // 間隔を少し長くして読みやすく
}





// スキップボタンクリックイベント
const skipButton = document.getElementById('skip-button');
if (skipButton) {
  skipButton.addEventListener('click', () => {

    if (isWaitingForGame && !skipButton.classList.contains('disabled') && 
        !skipButton.classList.contains('no-indicators') && IndicatorManager.skipCount > 0) {

      skipGameToCompleted();
    }
  });
}

// インジケーター管理システム
const IndicatorManager = {
  stopCount: 1,
  skipCount: 1,
  predictCount: 1, // 数字予測ボタン用
  
  // インジケーターの表示を更新
  updateIndicators(buttonType, count) {
    let button;
    if (buttonType === 'stop') {
      button = document.getElementById('control-matrix');
    } else if (buttonType === 'skip') {
      button = document.getElementById('skip-button');
    } else if (buttonType === 'predict') {
      button = document.getElementById('number-predict-button');
    }
    
    if (!button) return;
    
    const indicators = button.querySelectorAll('.indicator');
    
    // 全てのインジケーターをリセット
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // 左詰めで指定された数だけ点灯
    for (let i = 0; i < Math.min(count, 3); i++) {
      indicators[i].classList.add('active');
    }
    
    // インジケーターが0個の場合はボタンを無効化
    if (count === 0) {
      button.classList.add('no-indicators');
    } else {
      button.classList.remove('no-indicators');
    }


  },
  
  // インジケーターを消費（右から消える）
  consumeIndicator(buttonType) {
    let currentCount;
    if (buttonType === 'stop') {
      currentCount = this.stopCount;
    } else if (buttonType === 'skip') {
      currentCount = this.skipCount;
    } else if (buttonType === 'predict') {
      currentCount = this.predictCount;
    }
    
    if (currentCount <= 0) {
      return false;
    }
    
    if (buttonType === 'stop') {
      this.stopCount--;
      this.updateIndicators('stop', this.stopCount);
    } else if (buttonType === 'skip') {
      this.skipCount--;
      this.updateIndicators('skip', this.skipCount);
    } else if (buttonType === 'predict') {
      this.predictCount--;
      this.updateIndicators('predict', this.predictCount);
    }

    return true;
  },
  
  // インジケーターを追加（黄色マス用）
  addIndicator(buttonType) {
    if (buttonType === 'stop') {
      this.stopCount = Math.min(this.stopCount + 1, 3);
      this.updateIndicators('stop', this.stopCount);
    } else if (buttonType === 'skip') {
      this.skipCount = Math.min(this.skipCount + 1, 3);
      this.updateIndicators('skip', this.skipCount);
    } else if (buttonType === 'predict') {
      this.predictCount = Math.min(this.predictCount + 1, 3);
      // インジケーター表示のみ更新、ボタン状態は変更しない
      const button = document.getElementById('number-predict-button');
      if (button) {
        const indicators = button.querySelectorAll('.indicator');
        indicators.forEach(indicator => indicator.classList.remove('active'));
        for (let i = 0; i < Math.min(this.predictCount, 3); i++) {
          indicators[i].classList.add('active');
        }
        // ボタンの有効/無効状態は変更しない
      }
    }
    

  },
  
  // 初期化
  initialize() {
    this.updateIndicators('stop', this.stopCount);
    this.updateIndicators('skip', this.skipCount);
    this.updateIndicators('predict', this.predictCount);
  }
};

// インジケーターを1つ追加する関数
function addIndicator(buttonId) {
  // IndicatorManagerを使って正しく管理
  if (buttonId === 'control-matrix') {
    IndicatorManager.addIndicator('stop');
    // 停止ボタンを光らせる
    const controlMatrix = document.getElementById('control-matrix');
    if (controlMatrix) {
      controlMatrix.classList.add('indicator-gained');
      setTimeout(() => {
        controlMatrix.classList.remove('indicator-gained');
      }, 3000);
    }
  } else if (buttonId === 'skip-button') {
    IndicatorManager.addIndicator('skip');
    // スキップボタンを光らせる
    const skipButton = document.getElementById('skip-button');
    if (skipButton) {
      skipButton.classList.add('indicator-gained');
      setTimeout(() => {
        skipButton.classList.remove('indicator-gained');
      }, 3000);
    }
  } else if (buttonId === 'number-predict-button') {
    IndicatorManager.addIndicator('predict');
    // 数字予測ボタンを光らせる
    const predictButton = document.getElementById('number-predict-button');
    if (predictButton) {
      predictButton.classList.add('indicator-gained');
      setTimeout(() => {
        predictButton.classList.remove('indicator-gained');
      }, 3000);
    }
  }
}

// インジケーターシステム初期化
IndicatorManager.initialize();

// 数字予測ボタンの初期数字設定
updatePredictNumber();

// サイコロボタンの初期化（有効状態）
enableDiceButton();

// セクション4テキスト表示制御
const section4Text = document.getElementById('section-4-text');





// ノーツが全て処理された後に呼び出し
const originalCheckEnd = () => {
  const allGone = circles.every(c => {
    const left = parseInt(c.style.left || '9999', 10);
    return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
  });
  
  if (allGone && circleCount >= maxCircles) {
    isGameActive = false;
    enableDiceSection();

    
    // ノーツ終了処理を追加
    onNotesFinish();
  } else {
    setTimeout(originalCheckEnd, 200);
  }
};

setTimeout(originalCheckEnd, 1000);

function getSecureRandom() {
  // Web Crypto APIを使用
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1); // 0-1の範囲に正規化
  }
  
  // フォールバック: より複雑な疑似乱数生成
  const now = Date.now();
  const performanceNow = performance.now();
  const seed = now + performanceNow + getSecureRandom() * 1000000;
  
  // Linear Congruential Generator (LCG) の改良版
  let x = Math.sin(seed) * 10000;
  x = x - Math.floor(x);
  x = Math.sin(x * 12.9898) * 43758.5453;
  x = x - Math.floor(x);
  
  return x;
}

// 数字予測ボタン関連の機能
function updatePredictNumber() {
  const oldNumber = currentPredictNumber;
  currentPredictNumber = Math.floor(getSecureRandom() * 6) + 1;
  console.log(`数字予測ボタン: ${oldNumber} → ${currentPredictNumber}`);
  const numberDisplay = document.getElementById('predict-number');
  if (numberDisplay) {
    numberDisplay.textContent = currentPredictNumber;
    console.log('画面表示も更新されました');
  } else {
    console.log('predict-number要素が見つかりません');
  }
}

function enableNumberPredictButton() {
  const button = document.getElementById('number-predict-button');
  if (button && IndicatorManager.predictCount > 0) {
    button.classList.remove('disabled', 'no-indicators');
    isNumberPredictEnabled = true;
    // 数字更新は結果確定時に行う
  } else if (button) {
    // インジケーターが0の場合は無効化
    button.classList.add('no-indicators');
    button.classList.remove('disabled');
    isNumberPredictEnabled = false;
  }
}

function disableNumberPredictButton() {
  const button = document.getElementById('number-predict-button');
  if (button) {
    button.classList.add('no-indicators');
    button.classList.remove('disabled');
    isNumberPredictEnabled = false;
  }
}

// 数字予測ボタンのクリック処理
const numberPredictButton = document.getElementById('number-predict-button');
if (numberPredictButton) {
  numberPredictButton.addEventListener('click', () => {
    if (!isNumberPredictEnabled || numberPredictButton.classList.contains('disabled') || 
        numberPredictButton.classList.contains('no-indicators')) return;
    
    // インジケーターを消費
    if (!IndicatorManager.consumeIndicator('predict')) {
      console.log('数字予測ボタン: インジケーターがありません');
      return;
    }
    
    console.log('数字予測ボタンが押されました。数字:', currentPredictNumber);
    
    // サイコロを「振った扱い」にする処理
    // 1. 自動振りタイマーを中断
    if (typeof autoRollTimeout !== 'undefined' && autoRollTimeout) {
      clearTimeout(autoRollTimeout);
      autoRollTimeout = null;
    }
    if (typeof blinkTimeout !== 'undefined' && blinkTimeout) {
      clearTimeout(blinkTimeout);
      blinkTimeout = null;
    }
    
    // 2. サイコロボタンの点滅を停止
    const diceButton = document.getElementById('dice-button');
    if (diceButton) {
      diceButton.classList.remove('dice-blink-slow', 'dice-blink-fast', 'dice-waiting');
    }
    
    // 3. サイコロを無効化（振った扱いにする）
    if (typeof disableDiceButton === 'function') {
      disableDiceButton();
    }
    
    // 4. 初回サイコロの場合、タイマーを開始
    if (typeof isFirstDiceRoll !== 'undefined' && isFirstDiceRoll) {
      isFirstDiceRoll = false;
      if (typeof startSystemTimer === 'function') {
        startSystemTimer();
      }
    }
    
    // 5. ボタンに表示されている数字分だけ進む
    if (typeof handleDiceResult === 'function') {
      handleDiceResult(currentPredictNumber);
    }
    
    // 6. 新しい数字を生成してボタンの状態を更新
    updatePredictNumber(); // 次回用の新しい数字を生成
    if (IndicatorManager.predictCount <= 0) {
      disableNumberPredictButton();
    }
  });
}



