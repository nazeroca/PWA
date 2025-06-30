const gameArea = document.getElementById('game-area');
const hitSound = document.getElementById('hit');

// 音声初期化フラグ
let audioInitialized = false;

// 音声を初期化する関数
function initializeAudio() {
  if (audioInitialized) return;
  
  try {
    hitSound.volume = 0.7; // 音量設定
    hitSound.load(); // 音声ファイルを再読み込み
    console.log('音声初期化成功');
    
    // テスト再生（無音で実行、ブラウザの自動再生ポリシーを回避）
    hitSound.volume = 0;
    hitSound.play().then(() => {
      hitSound.pause();
      hitSound.currentTime = 0;
      hitSound.volume = 0.7;
      audioInitialized = true;
      console.log('音声テスト再生成功 - 準備完了');
    }).catch(error => {
      console.log('音声テスト再生失敗:', error);
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
let stopDuration = 10000; // 停止時間（10秒）
let stopTimeout = null; // 停止タイマーID
let isNotesFrozen = false; // ノーツ停止状態フラグ
let frozenNotes = []; // 停止中のノーツ情報を保存
let hitCount = 0; // ヒット数カウンター
let isChallengeMode = false; // 試練モードフラグ

// ノーツを生成する関数
function spawnCircle() {
  if (circleCount >= maxCircles) return;
  
  console.log(`ノーツ生成: ${circleCount + 1}/${maxCircles}`);
    
  const circle = document.createElement('div');
  circle.classList.add('circle');
  circle.style.backgroundColor = circlecolor;

  gameArea.appendChild(circle);
  circles.push(circle);
  

  
  const startTime = performance.now();
  let pausedTime = 0; // 停止時間を追加
  let isPaused = false;
  let totalPausedDuration = 0; // 累積停止時間

  function animate(currentTime) {
    // 停止中の場合は時間を更新しない
    if (isNotesFrozen) {
      if (!isPaused) {
        pausedTime = currentTime;
        isPaused = true;
        circle.classList.add('frozen');
        // console.log('ノーツを停止:', circle); // ログを簡略化
      }
      requestAnimationFrame(animate);
      return;
    } else if (isPaused) {
      // 再開時に停止時間を累積
      const pauseDuration = currentTime - pausedTime;
      totalPausedDuration += pauseDuration;
      isPaused = false;
      circle.classList.remove('frozen');
      // console.log('ノーツを再開:', circle, '停止時間:', pauseDuration); // ログを簡略化
    }

    // 停止時間を除いた実際の経過時間を計算
    const elapsed = currentTime - startTime - totalPausedDuration;
    const progress = elapsed / fallDuration;
    
    if (progress < 1) {
      const startX = gameArea.clientWidth;
      const endX = -window.innerWidth * 0.133; // ノーツサイズ13.3vwに合わせて調整
      const posX = startX + (endX - startX) * progress;
      circle.style.left = posX + 'px';
      
      // 判定ライン（画面の20%の位置）
      const judgeX = gameArea.clientWidth * 0.2;
      const center = posX + (window.innerWidth * 0.0665); // ノーツサイズ13.3vwの半分
      
      // 判定ラインに到達したら音を鳴らして削除
      if (!circle.played && center <= judgeX) {
        console.log(`音再生実行 - center: ${center}, judgeX: ${judgeX}`);
        console.log('hitSound詳細状態:', {
          readyState: hitSound.readyState,
          duration: hitSound.duration,
          volume: hitSound.volume,
          muted: hitSound.muted,
          src: hitSound.src,
          initialized: audioInitialized
        });
        
        // 音声ファイルの準備ができている場合のみ再生
        if (hitSound.readyState >= 2) { // HAVE_CURRENT_DATA以上
          hitSound.currentTime = 0;
          hitSound.play().then(() => {
            console.log('音再生成功');
          }).catch(error => {
            console.error('音声再生エラー:', error);
            // 再初期化を試行
            initializeAudio();
          });
        } else {
          console.warn('音声ファイルが準備できていません, readyState:', hitSound.readyState);
          // 準備できていなくても音再生を試行
          hitSound.currentTime = 0;
          hitSound.play().catch(error => {
            console.error('音声再生エラー（未準備）:', error);
          });
        }
        circle.played = true;
        
        // ヒット数をカウント
        hitCount++;
        updateHitCounter();
        
        circle.remove();
        circles = circles.filter(c => c !== circle);
        return; // アニメーション終了
      }
      requestAnimationFrame(animate);
    } else {
      // ノーツが画面外に出た場合も削除
      circle.remove();
      circles = circles.filter(c => c !== circle);
    }
  }
  requestAnimationFrame(animate);
  circleCount++;
}

// ゲーム開始関数
function startGame(speed, count) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新



  // サイコロセクションを無効化
  disableDiceSection();

  // 指定された間隔でノーツを生成
  intervalId = setInterval(() => {
    if (!isGameActive || isNotesFrozen) {

      return; // 停止中またはゲーム非アクティブなら生成しない
    }
    

    spawnCircle();
    if (circleCount >= maxCircles) {
      clearInterval(intervalId);

    }
  }, speed);

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection(); // サイコロセクションを有効化
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 徐々に早くなるゲーム開始関数（色付きマス用）- startGames.jsと同じ引数仕様
function startGameA(speed1, speed2, type, count1, count2) {
  circleCount = 0;
  maxCircles = count1 + count2;
  circles = [];
  isGameActive = true;
  let noteIndex = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();



  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;
      
      let delay;
      if (noteIndex <= count1) {
        // 加速期間：count1個のノーツで徐々に加速
        let t = noteIndex / count1;
        let factor = 1 - Math.pow((1 - t), type);
        delay = speed1 - (speed1 - speed2) * factor;
      } else {
        // 最終速度期間：残りのcount2個はspeed2で一定
        delay = speed2;
      }

      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      enableDiceSection();
      showSection4Text('finish'); // FINISH表示

    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// ノーツ動作停止関数
function freezeNotes() {
  if (!isGameActive || isNotesFrozen) return;
  
  // インジケーターをチェックして消費
  if (!IndicatorManager.consumeIndicator('stop')) {

    return;
  }
  
  isNotesFrozen = true;
  
  // STOP表示
  showSection4Text('stop', stopDuration);
  
  // CONTROL MATRIXボタンを無効化
  const controlMatrix = document.getElementById('control-matrix');
  if (controlMatrix) {
    controlMatrix.classList.add('disabled');
  }
  

  
  // 既存のタイムアウトをクリア
  if (stopTimeout) {
    clearTimeout(stopTimeout);
  }
  
  // セクション4にカウントダウン表示を開始
  startStopCountdown(controlMatrix);
  
  // 10秒後にノーツの動きと生成を再開
  stopTimeout = setTimeout(() => {

    isNotesFrozen = false;
    
    // STOP表示を隠す
    hideSection4Text();
    
    // CONTROL MATRIXボタンを有効化（ゲームが実行中の場合のみ）
    if (controlMatrix && isGameActive) {
      controlMatrix.classList.remove('disabled');
    }
    

  }, stopDuration);
}

// 停止時のカウントダウン表示を開始する関数（停止ボタン上に表示）
function startStopCountdown(buttonElement) {
  if (!buttonElement) return;
  
  // カウントダウン要素を作成（停止ボタンの中央に表示）
  const countdownElement = document.createElement('div');
  countdownElement.className = 'stop-countdown';
  countdownElement.id = 'stop-countdown';
  countdownElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: #00FFFF;
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
    z-index: 1000;
    pointer-events: none;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  buttonElement.appendChild(countdownElement);
  
  let countdown = 10;
  countdownElement.textContent = countdown;
  

  
  // 1秒ごとにカウントダウンを更新
  const stopCountdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownElement.textContent = countdown;
    } else {
      // カウントダウン完了
      clearInterval(stopCountdownInterval);
      countdownElement.remove();
    }
  }, 1000);
}


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
    console.log('試練モード中のため、青ダイスは有効化しません');
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

// 2Dサイコロ機能（ドット表示）
const diceButton = document.getElementById('dice-button');
const diceContainer = document.getElementById('dice-container');
const dice = document.getElementById('dice');
const diceDisplay = document.getElementById('dice-display');

let isRolling = false;

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
  const result = Math.floor(Math.random() * 6) + 1;

  
  // 回転中にランダムなドットパターンを表示
  let rollCount = 0;
  const maxRolls = 15;
  const rollInterval = setInterval(() => {
    const randomFace = Math.floor(Math.random() * 6) + 1;
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

// 緑色のサイコロ用の変数と要素
const greenDiceButton = document.getElementById('green-dice-button');
const greenDiceContainer = document.getElementById('green-dice-container');
const greenDice = document.getElementById('green-dice');
const greenDiceDisplay = document.getElementById('green-dice-display');

let isGreenRolling = false;

// 緑色のサイコロボタンの有効化・無効化
function enableGreenDiceButton() {
  if (greenDiceButton) {
    greenDiceButton.classList.remove('dice-disabled');
  }
}

function disableGreenDiceButton() {
  if (greenDiceButton) {
    greenDiceButton.classList.add('dice-disabled');
  }
}

function showGreenDiceFace(number) {
  // 要素の存在チェック
  if (!greenDiceDisplay) {
    console.error('緑色のサイコロ表示要素が見つかりません');
    return;
  }
  
  // 全てのfaceクラスを削除
  greenDiceDisplay.className = 'dice-dots';
  // 指定された数字のfaceクラスを追加
  greenDiceDisplay.classList.add(`face-${number}`);
}

function rollGreenDice() {
  if (isGreenRolling) return; // 既に回転中は無効
  
  // 要素の存在チェック
  if (!greenDice || !greenDiceDisplay) {
    console.error('緑色のサイコロ要素が見つかりません');
    return;
  }
  
  isGreenRolling = true;
  disableGreenDiceButton(); // 緑色のサイコロを無効化
  greenDice.classList.add('rolling');
  
  // 先に乱数で結果を決定（1-6）
  const result = Math.floor(Math.random() * 6) + 1;

  
  // 回転中にランダムなドットパターンを表示
  let rollCount = 0;
  const maxRolls = 15;
  const rollInterval = setInterval(() => {
    const randomFace = Math.floor(Math.random() * 6) + 1;
    showGreenDiceFace(randomFace);
    rollCount++;
    
    if (rollCount >= maxRolls) {
      clearInterval(rollInterval);
      showGreenDiceFace(result);
      greenDice.classList.remove('rolling');
      
      // 結果処理完了後、少し待ってからサイコロを有効に戻す
      setTimeout(() => {
        isGreenRolling = false;
        enableGreenDiceButton();
      }, 500);
      
      // 緑色のサイコロの結果をログに表示（コンソール）
      console.log(`緑色のサイコロ結果: ${result}`);
    }
  }, 60); // 60msごとにドットパターンを変更
}

// LOG TRACEボタンにクリックイベントを追加
if (diceButton) {
  diceButton.addEventListener('click', rollDice);
}

// 緑色のサイコロボタンにクリックイベントを追加
if (greenDiceButton) {
  greenDiceButton.addEventListener('click', rollGreenDice);
}

// 緑色のサイコロボタンの初期化（無効状態）
if (greenDiceButton) {
  disableGreenDiceButton(); // 初期状態では無効
  // 初期状態で1の目を表示
  showGreenDiceFace(1);
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
  // システムタイマーを開始
  startSystemTimer();
  
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

// 動的なサイズ計算関数
function getBoardDimensions() {
  const container = document.getElementById('sugoroku-container');
  if (!container) {
    // フォールバック値
    return {
      squareSize: 40,
      squareGap: 20,
      squareInterval: 60
    };
  }
  
  const containerWidth = container.offsetWidth;
  const totalSquares = 7;
  
  // マスのサイズを画面幅の割合で設定（vw単位）- もう少し大きく
  const squareSize = window.innerWidth * 0.11; // 11vw（画面幅の11%）
  
  // マス間の間隔を画面幅の割合で設定（vw単位）- 少し詰める
  const squareGap = window.innerWidth * 0.025; // 2.5vw（画面幅の2.5%）
  
  // 左右のマージンを計算（残りの幅を左右で分割）
  const totalSquareWidth = squareSize * totalSquares;
  const totalGapWidth = squareGap * (totalSquares - 1);
  const totalUsedWidth = totalSquareWidth + totalGapWidth;
  const leftMargin = (containerWidth - totalUsedWidth) / 2;
  
  const squareInterval = squareSize + squareGap;
  

  
  return {
    squareSize: squareSize,
    squareGap: squareGap,
    squareInterval: squareInterval,
    leftMargin: leftMargin
  };
}

const TOTAL_SQUARES = 7; // 表示する固定マス数
const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'white', 'black'];
let colorSequence = []; // 無限の色シーケンス
let boardSquares = []; // 固定された7つのマス要素

// 動的に中央位置を計算する関数
function calculateCenterPosition() {
  const container = document.getElementById('sugoroku-container');
  const board = document.getElementById('sugoroku-board');
  
  if (!container || !board) return 50; // フォールバック
  
  // DOM要素が準備できるまで少し待つ
  if (boardSquares.length === 0) return 50;
  
  // 最初のマスの実際の位置を取得
  const firstSquare = boardSquares[0];
  if (!firstSquare) return 50;
  
  const containerRect = container.getBoundingClientRect();
  const squareRect = firstSquare.getBoundingClientRect();
  
  // コンテナ相対での最初のマスの中央位置
  const relativeCenterX = (squareRect.left - containerRect.left) + (squareRect.width / 2);
  

  
  return relativeCenterX;
}

// 盤面生成関数は board-fixed.js または board-random.js で定義

// 固定マスを作成する関数
function createFixedSquare(index) {
  const square = document.createElement('div');
  const dimensions = getBoardDimensions();
  
  square.classList.add('board-square');
  square.setAttribute('data-display-index', index);
  square.id = `display-square-${index}`;
  
  // 動的サイズを適用
  square.style.width = `${dimensions.squareSize}px`;
  square.style.height = `${dimensions.squareSize}px`;
  
  return square;
}

// マスの色を更新する関数
function updateSquareColor(squareElement, colorName) {
  // 既存の色クラスを全て削除
  colors.forEach(color => squareElement.classList.remove(color));
  
  // デバッグ用ログ

  
  // 色変更アニメーションクラスを追加
  squareElement.classList.add('color-shifting');
  
  // 新しい色クラスを追加（nullの場合は無色）
  if (colorName) {
    squareElement.classList.add(colorName);
  }
  
  // 短時間後にアニメーションクラスを削除
  setTimeout(() => {
    squareElement.classList.remove('color-shifting');
  }, 800);
}

// すべてのマスの色を更新（左から右に順番に）
function updateAllSquareColors() {

  
  for (let i = 0; i < TOTAL_SQUARES; i++) {
    // 左から右に順番に色を変更（100msずつ遅延）
    setTimeout(() => {
      const actualPosition = displayOffset + i;
      const colorIndex = actualPosition % colorSequence.length;
      const color = colorSequence[colorIndex];
      


      
      updateSquareColor(boardSquares[i], color);
    }, i * 100);
  }
}

// すごろく盤の初期化関数は board-fixed.js または board-random.js で定義

// コマを指定の位置に移動させる（新システム）
function movePiece(steps) {
  const piece = document.getElementById('piece');
  let moveCount = 0;
  

  
  const moveInterval = setInterval(() => {
    if (moveCount >= steps) {
      clearInterval(moveInterval);
      
      // 移動完了後に色をシフトして、コマを最初の位置に戻す
      setTimeout(() => {
        shiftColorsAndResetPiece();
        
        // 移動完了後にマスの色に応じてノーツを流す
        setTimeout(() => {
          const currentColorIndex = currentPosition % colorSequence.length;
          const currentColor = colorSequence[currentColorIndex];
          

          
          if (currentColor && currentColor !== 'white') {
            // 色別のノーツ流し
            switch(currentColor) {
              case 'red':
                // 赤マス：加速ノーツ

                const redPatterns = [
                  { params: [3000, 1000, 2, 30, 0], desc: "3秒⇒1秒20回" },
                  { params: [4000, 1000, 2, 25, 10], desc: "4秒⇒1秒25回＋10回" },
                  { params: [5000, 800, 1.2, 50], desc: "2秒⇒1秒50回" },
                  { params: [5000, 1000, 1.5, 30, 10], desc: "5秒⇒1秒40回＋10回" },
                  { params: [4000, 800, 3, 20, 10], desc: "4秒⇒0.8秒20回＋10回" }
                ];
                const redPattern = redPatterns[Math.floor(Math.random() * redPatterns.length)];
                updateSectionBackground('red');
                showPatternRoulette(redPattern.desc, () => {
                  startGameCountdown(startGameA, ...redPattern.params);
                }, redPatterns);
                break;
                
              case 'blue':
                // 青マス：ランダム間隔ノーツ

                const bluePatterns = [
                  { params: [500, 2000, 20, 1], desc: "0.5秒～2秒20回" },
                  { params: [500, 3000, 30, 1], desc: "0.5秒～3秒30回" },
                  { params: [500, 4000, 40, 1], desc: "0.5秒～4秒40回" },
                  { params: [1000, 5000, 40, 2], desc: "1秒＞3秒40回" },
                  { params: [500, 3000, 25, 2], desc: "0.5秒＞3秒25回" }
                ];
                const bluePattern = bluePatterns[Math.floor(Math.random() * bluePatterns.length)];
                updateSectionBackground('blue');
                showPatternRoulette(bluePattern.desc, () => {
                  startGameCountdown(startGameR, ...bluePattern.params);
                }, bluePatterns);
                break;
                
              case 'green':
                // 緑マス：段階的速度変化ノーツ

                const greenPatterns = [
                  { params: [4000, 1000, 10, 5, 2], desc: "4秒10回⇔1秒5回×3" },
                  { params: [2000, 1500, 5, 5, 3], desc: "2秒5回⇔1.5秒5回×3" },
                  { params: [2000, 1000, 6, 2, 3], desc: "2秒6回⇔1秒2回×3" },
                  { params: [4000, 1000, 3, 7, 5], desc: "4秒3回⇔1秒7回×5" },
                  { params: [3000, 700, 2, 2, 9], desc: "3秒2回⇔0.7秒2回×9" }
                ];
                const greenPattern = greenPatterns[Math.floor(Math.random() * greenPatterns.length)];
                updateSectionBackground('green');
                showPatternRoulette(greenPattern.desc, () => {
                  startGameCountdown(startGameT2, ...greenPattern.params);
                }, greenPatterns);
                break;
                
              case 'purple':
                // 紫マス：確率的爆弾ノーツ

                const purplePatterns = [
                  { params: [3000, 15, 0.01, 1000, 30], desc: "3秒15回||1%1秒30回" },
                  { params: [3000, 20, 0.05, 500, 10], desc: "3秒20回||5%0.5秒10回" },
                  { params: [2000, 12, 0.1, 10, 4], desc: "2秒12回||10%0.1秒4回" },
                  { params: [4000, 15, 0.5, 2000, 3], desc: "4秒15回||50%2秒3回" },
                  { params: [1000, 30, 0.03, 5000, 1], desc: "1秒30回||3%5秒1回" }
                ];
                const purplePattern = purplePatterns[Math.floor(Math.random() * purplePatterns.length)];
                updateSectionBackground('purple');
                showPatternRoulette(purplePattern.desc, () => {
                  startGameCountdown(startGameP, ...purplePattern.params);
                }, purplePatterns);
                break;
                
              case 'yellow':
                // 黄マス：試練システム
                updateSectionBackground('yellow');
                executeYellowSquareChallenge();
                return; // 通常の処理をスキップ
                
              case 'black':
                // 黒マス：等間隔ノーツ（白マスと同様）

                const blackPatterns = [
                  { params: [500, 30], desc: "0.5秒で30回" },
                  { params: [800, 40], desc: "0.8秒で40回" },
                  { params: [1000, 50], desc: "1秒で50回" }
                ];
                const blackPattern = blackPatterns[Math.floor(Math.random() * blackPatterns.length)];
                updateSectionBackground('black');
                showPatternRoulette(blackPattern.desc, () => {
                  startGameCountdown(startGame, ...blackPattern.params);
                }, blackPatterns);
                break;
            }
          } else {
            // 白マスまたは無色マス：ランダムパターンから選択

            const whitePatterns = [
              { params: [4000, 20], desc: "4秒で20回" },
              { params: [3000, 15], desc: "3秒で15回" },
              { params: [3000, 20], desc: "3秒で20回" },
              { params: [2500, 30], desc: "2.5秒で30回" },
              { params: [2000, 30], desc: "2秒で30回" },
              { params: [1000, 15], desc: "1秒で15回" },
              { params: [700, 10], desc: "0.7秒で10回" }
            ];
            const whitePattern = whitePatterns[Math.floor(Math.random() * whitePatterns.length)];
            updateSectionBackground('white');
            showPatternRoulette(whitePattern.desc, () => {
              startGameCountdown(startGame, ...whitePattern.params);
            }, whitePatterns);
          }
        }, 500);
      }, 300);
      
      return;
    }
    
    currentPosition++;
    moveCount++;
    
    // コマに移動アニメーションクラスを追加
    piece.classList.add('moving');
    
    // 移動先のマスを取得（次のマスがない場合は最後のマス）
    const targetSquareIndex = Math.min(moveCount, TOTAL_SQUARES - 1);
    const targetSquare = boardSquares[targetSquareIndex];
    
    if (targetSquare) {
      const container = document.getElementById('sugoroku-container');
      const containerRect = container.getBoundingClientRect();
      const squareRect = targetSquare.getBoundingClientRect();
      
      // コンテナ相対での目標マスの中央位置
      const newLeft = (squareRect.left - containerRect.left) + (squareRect.width / 2);
      piece.style.left = newLeft + 'px';
      


    }
    
    // アニメーション完了後にクラスを除去
    setTimeout(() => {
      piece.classList.remove('moving');
    }, 500);
    
  }, 600); // 600msごとに1マス進む
}

// 色シフト関数は board-fixed.js または board-random.js で定義

// セクション2の背景色を更新する関数
function updateSectionBackground(color) {
  const section2 = document.querySelector('.section-2');
  if (!section2) return;
  
  // 既存の色クラスを削除
  section2.classList.remove('bg-red', 'bg-blue', 'bg-green', 'bg-yellow', 'bg-purple', 'bg-white');
  
  // 新しい色クラスを追加
  if (color) {
    section2.classList.add(`bg-${color}`);
  }
}

// サイコロの結果をすごろくに反映
function handleDiceResult(diceValue) {

  movePiece(diceValue);
}

// システムタイマー関連
let systemStartTime = Date.now();
let timerInterval = null;

// タイマー表示を更新する関数
function updateSystemTimer() {
  const now = Date.now();
  const elapsed = now - systemStartTime;
  
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
  
  const formattedTime = 
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0');
  
  const timerElement = document.getElementById('system-timer');
  if (timerElement) {
    timerElement.textContent = formattedTime;
  }
}

// タイマーを開始する関数
function startSystemTimer() {
  // 初期表示を更新
  updateSystemTimer();
  
  // 1秒ごとに更新
  timerInterval = setInterval(updateSystemTimer, 1000);
}

// データストリーム情報を更新する関数
function updateDataStream(position, color) {
  const positionInfo = document.getElementById('position-info');
  
  if (positionInfo) {
    positionInfo.textContent = `POSITION: ${position.toString().padStart(3, '0')}`;
  }
}

// ヒットカウンターを更新する関数
function updateHitCounter() {
  const hitCounterElement = document.getElementById('hit-counter');
  if (hitCounterElement) {
    hitCounterElement.textContent = `HITS: ${hitCount.toString().padStart(3, '0')}`;


    // ヒット時のエフェクト
    hitCounterElement.style.animation = 'none';
    setTimeout(() => {
      hitCounterElement.style.animation = 'data-stream 4s linear infinite';
    }, 10);
  }
}

// タイマーとデータストリームを開始
startSystemTimer();
updateDataStream(currentPosition, colorSequence[currentPosition]);

// ランダム間隔ノーツ流し関数（青マス用）- startGameRとstartGameR2を統合
function startGameR(speed1, speed2, count, type) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();




  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (circleCount < maxCircles) {
      spawnCircle();
      
      let delay;
      if (type === 1) {
        // startGameR: 均等分布ランダム
        delay = speed1 + Math.random() * (speed2 - speed1);
      } else {
        // startGameR2: 重み付き分布ランダム
        const u = Math.random();
        const factor = 1 - Math.sqrt(1 - u * u);
        delay = speed1 + factor * (speed2 - speed1);
      }
      
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 段階的速度変化ノーツ流し関数（緑マス用）- startGameT2ベース
function startGameT2(speed1, speed2, count1, count2, sets) {
  circleCount = 0;
  maxCircles = sets * (count1 + count2);
  circles = [];
  isGameActive = true;
  let noteIndex = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();



  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      // セット内でのインデックスを計算
      const indexInSet = (noteIndex - 1) % (count1 + count2);
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

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 確率的爆弾ノーツ流し関数（紫マス用）- startGamePベース
function startGameP(speed1, count1, probability, speed2, count2) {
  circleCount = 0;
  maxCircles = 1000; // 最大値を設定（実際は動的に決まる）
  circles = [];
  isGameActive = true;
  let mainSpawned = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();




  function spawnMain() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnMain, 100);
      return;
    }
    
    if (mainSpawned < count1) {
      // 確率的に爆弾グループを発生させる
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
      // メインループ完了後、終了チェック開始
      setTimeout(checkEnd, 1000);
    }
  }

  function spawnExtraGroup(callbackExtra) {
    let extraSpawned = 0;
    function spawnExtraOne() {
      if (!isGameActive) return;
      
      if (isNotesFrozen) {
        // 停止中はスポーン一時停止
        setTimeout(spawnExtraOne, 100);
        return;
      }
      
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
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  }

  spawnMain();
}

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
  
  // ルーレット開始
  patternRoulette.classList.add('spinning');
  
  let spinCount = 0;
  const maxSpins = 20; // 変化回数
  
  const spinInterval = setInterval(() => {
    // 候補配列がある場合は候補からランダム選択、なければ従来の数字変化
    if (patternCandidates && patternCandidates.length > 0) {
      // 候補のdescからランダムに選択して表示
      const randomPattern = patternCandidates[Math.floor(Math.random() * patternCandidates.length)];
      patternText.textContent = randomPattern.desc;
    } else {
      // 従来の数字変化（後方互換性のため）
      const currentText = finalPattern.replace(/(\d+\.?\d*)(\D*)/g, (match, number, suffix) => {
        if (suffix.includes('秒')) {
          const randomFloat = (Math.random() * 9.8 + 0.1);
          return randomFloat.toFixed(1) + suffix;
        } else {
          const digits = number.length;
          const randomNum = Math.floor(Math.random() * Math.pow(10, digits));
          return randomNum.toString().padStart(digits, '0') + suffix;
        }
      });
      patternText.textContent = currentText;
    }
    
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
      }, 300);
    }
  }, 80); // 間隔を少し長くして読みやすく
}

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
    font-size: min(80px, 10vh);
    font-weight: bold;
    color: #FF4444;
    text-shadow: 0 0 30px rgba(255, 68, 68, 0.8);
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
  
  // インジケーターの表示を更新
  updateIndicators(buttonType, count) {
    const button = buttonType === 'stop' ? 
      document.getElementById('control-matrix') : 
      document.getElementById('skip-button');
    
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
    const currentCount = buttonType === 'stop' ? this.stopCount : this.skipCount;
    
    if (currentCount <= 0) {

      return false;
    }
    
    if (buttonType === 'stop') {
      this.stopCount--;
      this.updateIndicators('stop', this.stopCount);
    } else {
      this.skipCount--;
      this.updateIndicators('skip', this.skipCount);
    }
    

    return true;
  },
  
  // インジケーターを追加（黄色マス用）
  addIndicator(buttonType) {
    if (buttonType === 'stop') {
      this.stopCount = Math.min(this.stopCount + 1, 3);
      this.updateIndicators('stop', this.stopCount);
    } else {
      this.skipCount = Math.min(this.skipCount + 1, 3);
      this.updateIndicators('skip', this.skipCount);
    }
    

  },
  
  // 初期化
  initialize() {
    this.updateIndicators('stop', this.stopCount);
    this.updateIndicators('skip', this.skipCount);

  }
};

// インジケーターシステム初期化
IndicatorManager.initialize();

// サイコロボタンの初期化（有効状態）
enableDiceButton();

// セクション4テキスト表示制御
const section4Text = document.getElementById('section-4-text');

// テキスト表示関数
function showSection4Text(type, duration = 1500) {
  if (!section4Text) return;
  
  // 試練モード中でfinishの場合は表示しない
  if (type === 'finish' && isChallengeMode) {
    console.log('試練モード中のため、FINISHは表示しません');
    return;
  }
  
  // 既存のクラスを削除
  section4Text.classList.remove('visible', 'finish', 'stop', 'skip');
  section4Text.textContent = '';
  
  // テキストとクラスを設定
  switch (type) {
    case 'finish':
      section4Text.textContent = 'FINISH';
      section4Text.classList.add('finish');
      break;
    case 'stop':
      section4Text.textContent = 'STOP';
      section4Text.classList.add('stop');
      break;
    case 'skip':
      section4Text.textContent = 'SKIP';
      section4Text.classList.add('skip');
      break;
    default:
      return;
  }
  
  // 表示
  section4Text.classList.add('visible');
  
  // 指定時間後に非表示（skipの場合はアニメーション終了後自動非表示）
  if (type !== 'skip') {
    setTimeout(() => {
      section4Text.classList.remove('visible');
    }, duration);
  } else {
    // skipアニメーションは1.5秒で終了
    setTimeout(() => {
      section4Text.classList.remove('visible');
    }, 1500);
  }
}

// テキストを隠す関数
function hideSection4Text() {
  if (section4Text) {
    section4Text.classList.remove('visible');
  }
}

// ノーツ終了時にFINISHを表示（既存の終了処理に追加）
function onNotesFinish() {
  // FINISHテキストを表示
  showSection4Text('finish', 1500);
  
  // サイコロセクションを有効化
  enableDiceSection();
}

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

// ==============================================
// 黄色マス試練システム
// ==============================================

// 試練の定義配列（新しい試練を追加するときはここに追加）
const YELLOW_CHALLENGES = [
  {
    name: 'diceMultiplyChallenge',
    description: '緑ダイス×20個ノーツ',
    execute: executeDiceMultiplyChallenge
  },
  {
    name: 'progressiveChallenge',
    description: '段階的チャレンジ',
    execute: executeProgressiveChallenge
  }
  // 新しい試練を追加する場合は、ここにオブジェクトを追加します
  // 例：
  // {
  //   name: 'newChallenge',
  //   description: '新しい試練の説明',
  //   execute: executeNewChallenge
  // }
];

// 黄色マスの試練を実行する関数
function executeYellowSquareChallenge() {
  console.log('黄色マス試練開始');
  
  // 複数の試練からランダムに選択
  const challenge = YELLOW_CHALLENGES[Math.floor(Math.random() * YELLOW_CHALLENGES.length)];
  
  console.log(`試練実行: ${challenge.description}`);
  challenge.execute();
}

// 試練1: 緑ダイス×20個ノーツ
function executeDiceMultiplyChallenge() {
  showPatternRoulette('試練開始：緑ダイス×20個ノーツ', () => {
    // 緑のサイコロを有効化
    enableGreenDiceButton();
    
    // パターン表示を更新
    updateEventDisplay('緑ダイスを振ってください');
    
    console.log('緑ダイス有効化完了。ユーザーのクリックを待機中...');
    
    // 緑のサイコロが振られるのを待つ
    waitForGreenDiceRoll().then((diceValue) => {
      console.log('緑ダイス結果受信:', diceValue);
      
      // 緑のサイコロを再び無効化
      disableGreenDiceButton();
      
      // ノーツ数を計算
      const notesCount = diceValue * 20;
      
      console.log(`緑ダイス結果: ${diceValue}, ノーツ数: ${notesCount}`);
      console.log('ノーツ流し開始...');
      
      // ルーレット演出なしで即座に特殊ノーツを流す
      executeSpecialNotesFlow(notesCount).then(() => {
        console.log('ノーツ流し完了');
        // 試練完了後、青ダイスを有効化
        setTimeout(() => {
          enableDiceSection();
        }, 1000);
      }).catch((error) => {
        console.error('ノーツ流し処理でエラー:', error);
        enableDiceSection();
      });
    }).catch((error) => {
      console.error('サイコロ処理でエラー:', error);
      disableGreenDiceButton();
      enableDiceSection();
    });
  });
}

// 試練2: 段階的チャレンジ
function executeProgressiveChallenge() {
  showPatternRoulette('試練開始：段階的チャレンジ', () => {
    // 段階的チャレンジを開始
    startProgressiveChallenge();
  });
}

// 段階的チャレンジのメイン処理
function startProgressiveChallenge() {
  // チャレンジの段階設定
  const challengeStages = [
    { notesCount: 5, clearValues: [1], description: '5ノーツ → 1でクリア' },
    { notesCount: 10, clearValues: [1, 2], description: '10ノーツ → 1,2でクリア' },
    { notesCount: 15, clearValues: [1, 2, 3], description: '15ノーツ → 1,2,3でクリア' },
    { notesCount: 20, clearValues: [1, 2, 3, 4], description: '20ノーツ → 1,2,3,4でクリア' },
    { notesCount: 25, clearValues: [1, 2, 3, 4, 5], description: '25ノーツ → 1,2,3,4,5でクリア' },
    { notesCount: 30, clearValues: [1, 2, 3, 4, 5, 6], description: '30ノーツ → 自動クリア' }
  ];
  
  let currentStage = 0;
  
  function executeStage() {
    const stage = challengeStages[currentStage];
    console.log(`段階 ${currentStage + 1}: ${stage.description}`);
    
    updateEventDisplay(`段階 ${currentStage + 1}: ${stage.notesCount}ノーツ`);
    
    executeSpecialNotesFlow(stage.notesCount).then(() => {
      console.log(`段階 ${currentStage + 1} ノーツ流し完了`);
      
      // 最終段階の場合は自動クリア
      if (currentStage === challengeStages.length - 1) {
        console.log('最終段階 - 自動クリア');
        showSection4Text('finish', 2000);
        setTimeout(() => {
          enableDiceSection();
        }, 2000);
        return;
      }
      
      // 緑ダイスを有効化してクリア判定
      enableGreenDiceButton();
      updateEventDisplay(`緑ダイス: ${stage.clearValues.join(',')}でクリア`);
      
      waitForGreenDiceRoll().then((diceValue) => {
        console.log(`段階 ${currentStage + 1} ダイス結果: ${diceValue}`);
        disableGreenDiceButton();
        
        // クリア判定
        if (stage.clearValues.includes(diceValue)) {
          // クリア成功
          console.log(`段階 ${currentStage + 1} クリア成功!`);
          showSection4Text('finish', 2000);
          setTimeout(() => {
            enableDiceSection();
          }, 2000);
        } else {
          // 失敗 - 次の段階へ
          console.log(`段階 ${currentStage + 1} 失敗 - 次の段階へ`);
          currentStage++;
          if (currentStage < challengeStages.length) {
            setTimeout(() => {
              executeStage();
            }, 1000);
          } else {
            // 全段階失敗（通常は発生しない）
            console.log('全段階失敗');
            enableDiceSection();
          }
        }
      }).catch((error) => {
        console.error('段階的チャレンジでエラー:', error);
        disableGreenDiceButton();
        enableDiceSection();
      });
    }).catch((error) => {
      console.error('ノーツ流し処理でエラー:', error);
      enableDiceSection();
    });
  }
  
  // 最初の段階を開始
  executeStage();
}

// 緑のサイコロが振られるのを待つPromise
function waitForGreenDiceRoll() {
  return new Promise((resolve) => {
    console.log('緑ダイス待機開始');
    
    // 一時的なリスナーを作成
    function handleGreenDiceClick() {
      console.log('緑ダイスクリックイベント受信');
      
      if (isGreenRolling) {
        console.log('既に回転中のため無視');
        return;
      }
      
      // 元のイベントリスナーを削除
      greenDiceButton.removeEventListener('click', handleGreenDiceClick);
      console.log('一時リスナー削除');
      
      isGreenRolling = true;
      disableGreenDiceButton();
      greenDice.classList.add('rolling');
      
      // 先に乱数で結果を決定（1-6）
      const result = Math.floor(Math.random() * 6) + 1;
      console.log('サイコロ結果決定:', result);
      
      // 回転中にランダムなドットパターンを表示
      let rollCount = 0;
      const maxRolls = 15;
      const rollInterval = setInterval(() => {
        const randomFace = Math.floor(Math.random() * 6) + 1;
        showGreenDiceFace(randomFace);
        rollCount++;
        
        if (rollCount >= maxRolls) {
          clearInterval(rollInterval);
          showGreenDiceFace(result);
          greenDice.classList.remove('rolling');
          
          setTimeout(() => {
            isGreenRolling = false;
            
            // 元のイベントリスナーを復活させる
            greenDiceButton.addEventListener('click', rollGreenDice);
            console.log('元のリスナー復活');
            
            // 結果を返す
            console.log('Promise resolve:', result);
            resolve(result);
          }, 500);
          
          console.log(`緑色のサイコロ結果: ${result}`);
        }
      }, 60);
    }
    
    // 元のイベントリスナーを削除
    greenDiceButton.removeEventListener('click', rollGreenDice);
    console.log('元のリスナー削除');
    
    // 新しいリスナーを追加
    greenDiceButton.addEventListener('click', handleGreenDiceClick);
    console.log('新しいリスナー追加');
  });
}

// 特殊ノーツ流し処理（Promise版）
function executeSpecialNotesFlow(count) {
  return new Promise((resolve) => {
    console.log(`${count}個のノーツを流します`);
    console.log('hitSound状態チェック:', {
      src: hitSound ? hitSound.src : 'hitSound要素なし',
      readyState: hitSound ? hitSound.readyState : 'N/A',
      volume: hitSound ? hitSound.volume : 'N/A',
      initialized: audioInitialized
    });
    
    // ノーツ流し用の間隔計算を調整
    // 20個のノーツなら300ms間隔、40個なら200ms間隔程度に
    const interval = Math.max(150, Math.min(400, Math.floor(6000 / count)));
    
    console.log(`ノーツ間隔: ${interval}ms, fallDuration: ${fallDuration}ms`);
    
    // 試練専用の関数を使用（FINISHと青ダイスは表示しない）
    startChallengeNotesFlow(interval, count, resolve);
  });
}

// 既存のstartGame関数をベースに、コールバック付きバージョンを作成
function startGameWithCallback(speed, count, onComplete) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  hitCount = 0;
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter();

  console.log(`ゲーム開始: ${count}個のノーツ, 間隔: ${speed}ms`);

  // サイコロセクションを無効化
  disableDiceSection();

  // 指定された間隔でノーツを生成
  intervalId = setInterval(() => {
    if (!isGameActive || isNotesFrozen) {
      return; // 停止中またはゲーム非アクティブなら生成しない
    }
    
    spawnCircle();
    if (circleCount >= maxCircles) {
      clearInterval(intervalId);
      console.log('ノーツ生成完了');
    }
  }, speed);

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      enableDiceSection(); // サイコロセクションを有効化
      showSection4Text('finish'); // FINISH表示
      console.log('全ノーツ処理完了');
      
      // コールバックを実行
      if (onComplete) {
        setTimeout(() => {
          console.log('コールバック実行');
          onComplete();
        }, 1000);
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 試練専用のノーツ流し関数（FINISHと青ダイスを表示しない）
function startChallengeNotesFlow(speed, count, onComplete) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  hitCount = 0;
  isChallengeMode = true; // 試練モードフラグを設定
  updateHitCounter();

  console.log(`試練ノーツ開始: ${count}個のノーツ, 間隔: ${speed}ms`);

  // サイコロセクションを無効化
  disableDiceSection();

  // 指定された間隔でノーツを生成
  intervalId = setInterval(() => {
    if (!isGameActive || isNotesFrozen) {
      return; // 停止中またはゲーム非アクティブなら生成しない
    }
    
    spawnCircle();
    if (circleCount >= maxCircles) {
      clearInterval(intervalId);
      console.log('試練ノーツ生成完了');
    }
  }, speed);

  // 全てのノーツが処理されたかチェック（FINISHと青ダイスは表示しない）
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      isChallengeMode = false; // 試練モードを解除
      console.log('試練ノーツ処理完了');
      
      // コールバックを実行（FINISHと青ダイスは表示しない）
      if (onComplete) {
        setTimeout(() => {
          console.log('試練コールバック実行');
          onComplete();
        }, 1000);
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// イベント表示を更新する関数
function updateEventDisplay(message) {
  const eventText = document.getElementById('event-text');
  if (eventText) {
    eventText.textContent = message || 'SYSTEM READY';
  }
}

// ==============================================
// 新しい試練を追加する方法：
// 
// 1. YELLOW_CHALLENGES配列に新しい試練オブジェクトを追加
// 2. 対応する実行関数を作成
// 
// 例：
// function executeNewChallenge() {
//   showPatternRoulette('新しい試練の説明', () => {
//     // 試練の処理をここに書く
//     // 最後に enableDiceSection() を呼ぶこと
//   });
// }
// ==============================================