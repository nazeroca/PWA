const gameArea = document.getElementById('game-area');
const hitSound = document.getElementById('hit');

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

// ノーツを生成する関数
function spawnCircle() {
  if (circleCount >= maxCircles) return;
  
  console.log('ノーツを生成中:', circleCount + 1, '/', maxCircles); // デバッグログ追加
  
  const circle = document.createElement('div');
  circle.classList.add('circle');
  circle.style.backgroundColor = circlecolor;

  gameArea.appendChild(circle);
  circles.push(circle);
  
  console.log('ノーツをDOMに追加:', circle); // デバッグログ追加
  
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
        hitSound.currentTime = 0;
        hitSound.play().catch(error => console.error('音声再生エラー:', error));
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
  updateHitCounter(); // 表示を更新

  console.log('ゲーム開始:', speed + 'ms間隔で' + count + '個のノーツ'); // デバッグログ追加

  // サイコロセクションを無効化
  disableDiceSection();

  // 指定された間隔でノーツを生成
  intervalId = setInterval(() => {
    if (!isGameActive || isNotesFrozen) {
      console.log('ノーツ生成スキップ - ゲーム状態:', isGameActive, '停止中:', isNotesFrozen); // デバッグログ追加
      return; // 停止中またはゲーム非アクティブなら生成しない
    }
    
    console.log('ノーツ生成タイマー実行中'); // デバッグログ追加
    spawnCircle();
    if (circleCount >= maxCircles) {
      clearInterval(intervalId);
      console.log('ノーツ生成完了'); // デバッグログ追加
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
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();

  console.log(`加速ゲーム開始 - 初期速度:${speed1}ms, 最終速度:${speed2}ms, 加速タイプ:${type}, 加速期間:${count1}個, 最終速度期間:${count2}個`);

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
      console.log(`ノーツ${noteIndex}/${maxCircles} - 次の間隔: ${Math.round(delay)}ms`);
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
      console.log('加速ゲーム完了');
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
    console.log('停止インジケーターが不足しています');
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
  
  console.log('🛑 ノーツ動作と生成を10秒間停止 - 現在のノーツ数:', circles.length, '生成済み数:', circleCount);
  
  // 既存のタイムアウトをクリア
  if (stopTimeout) {
    clearTimeout(stopTimeout);
  }
  
  // セクション4にカウントダウン表示を開始
  startStopCountdown(controlMatrix);
  
  // 10秒後にノーツの動きと生成を再開
  stopTimeout = setTimeout(() => {
    console.log('⏱️ 10秒経過 - ノーツ動作と生成を再開します');
    isNotesFrozen = false;
    
    // STOP表示を隠す
    hideSection4Text();
    
    // CONTROL MATRIXボタンを有効化（ゲームが実行中の場合のみ）
    if (controlMatrix && isGameActive) {
      controlMatrix.classList.remove('disabled');
    }
    
    console.log('▶️ ノーツ動作と生成を再開 - 残りノーツ数:', circles.length, '残り生成数:', maxCircles - circleCount);
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
  
  console.log('停止カウントダウン10秒開始（停止ボタン上）');
  
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
    console.log('サイコロボタンを有効化しました');
  }
}

function disableDiceButton() {
  if (diceButton) {
    diceButton.classList.add('dice-disabled');
    console.log('サイコロボタンを無効化しました');
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
  console.log('🎲 サイコロの結果:', result);
  
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

// LOG TRACEボタンにクリックイベントを追加
if (diceButton) {
  diceButton.addEventListener('click', rollDice);
}

// CONTROL MATRIXセクション全体にクリックイベントを追加
const controlMatrix = document.getElementById('control-matrix');
if (controlMatrix) {
  controlMatrix.addEventListener('click', () => {
    console.log('CONTROL MATRIXクリック - ゲーム中:', isGameActive, '停止中:', isNotesFrozen);
    
    // ゲーム実行中かつ非停止中、かつボタンが有効、かつインジケーターがある場合のみ動作
    if (isGameActive && !isNotesFrozen && !controlMatrix.classList.contains('disabled') && 
        !controlMatrix.classList.contains('no-indicators') && IndicatorManager.stopCount > 0) {
      console.log('停止機能を実行します');
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
  console.log('テスト用ノーツを生成します');
  const testCircle = document.createElement('div');
  testCircle.classList.add('circle');
  testCircle.style.backgroundColor = '#fff';
  testCircle.id = 'test-circle';
  gameArea.appendChild(testCircle);
  console.log('テスト用ノーツを追加しました:', testCircle);
  
  // 初期ノーツは削除（最初は何も流さない）
  console.log('初期化完了 - 初期ノーツは流しません');
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
  
  console.log(`動的サイズ計算: 幅=${containerWidth}px, マスサイズ=${squareSize}px（5vw）, ギャップ=${squareGap}px（1vw）, 左マージン=${leftMargin}px`);
  
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
let eventSequence = []; // イベントマス情報の無限シーケンス
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
  
  console.log(`実際の位置計算: コンテナ=${containerRect.left}, マス=${squareRect.left}, 幅=${squareRect.width}, 中央=${relativeCenterX}`);
  
  return relativeCenterX;
}

// 確率に基づいて色を選択する関数
function selectRandomColor() {
  const random = Math.random() * 100; // 0-100の乱数
  
  if (random < 50) {
    // 50%の確率で白（通常ノーツ）
    return 'white';
  } else if (random < 60) {
    // 10%の確率で紫（加速ノーツ）
    return 'purple';
  } else {
    // 残り40%を5色で等分（各8%、全て加速ノーツ）
    const remainingColors = ['red', 'blue', 'green', 'yellow', 'black'];
    const index = Math.floor((random - 60) / 8); // 0-4の範囲
    return remainingColors[Math.min(index, 4)]; // 安全のため上限を4に制限
  }
}

// 無限の色シーケンスを生成
function generateColorSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      // 最初のマスは無色（デフォルト）
      sequence.push(null);
    } else {
      // 確率に基づいて色を選択
      sequence.push(selectRandomColor());
    }
  }
  return sequence;
}

// イベントマスシーケンスを生成する関数
function generateEventSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    // 2分の1の確率でイベントマス（一時的に確率を上げています）
    sequence.push(Math.random() < 0.5);
  }
  return sequence;
}

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
function updateSquareColor(squareElement, colorName, isEventSquare = false) {
  // 既存の色クラスを全て削除
  colors.forEach(color => squareElement.classList.remove(color));
  
  // 既存のイベントマーカーを削除
  const existingMarker = squareElement.querySelector('.event-marker');
  if (existingMarker) {
    existingMarker.remove();
  }
  
  // デバッグ用ログ
  console.log(`マス ${squareElement.id} の色を ${colorName || 'デフォルト'} に変更, イベント: ${isEventSquare}`);
  
  // 色変更アニメーションクラスを追加
  squareElement.classList.add('color-shifting');
  
  // 新しい色クラスを追加（nullの場合は無色）
  if (colorName) {
    squareElement.classList.add(colorName);
  }
  
  // イベントマスの場合は「E」マーカーを追加
  if (isEventSquare) {
    const eventMarker = document.createElement('div');
    eventMarker.classList.add('event-marker');
    eventMarker.textContent = 'E';
    squareElement.appendChild(eventMarker);
  }
  
  // 短時間後にアニメーションクラスを削除
  setTimeout(() => {
    squareElement.classList.remove('color-shifting');
  }, 800);
}

// すべてのマスの色を更新（左から右に順番に）
function updateAllSquareColors() {
  console.log(`色更新開始: displayOffset=${displayOffset}, colorSequence長さ=${colorSequence.length}`);
  
  for (let i = 0; i < TOTAL_SQUARES; i++) {
    // 左から右に順番に色を変更（100msずつ遅延）
    setTimeout(() => {
      const actualPosition = displayOffset + i;
      const colorIndex = actualPosition % colorSequence.length;
      const eventIndex = actualPosition % eventSequence.length;
      const color = colorSequence[colorIndex];
      const isEvent = eventSequence[eventIndex];
      
      console.log(`マス${i}: actualPosition=${actualPosition}, colorIndex=${colorIndex}, color=${color}, isEvent=${isEvent}`);
      
      updateSquareColor(boardSquares[i], color, isEvent);
    }, i * 100);
  }
}

// すごろく盤の初期化
function initializeSugorokuBoard() {
  const board = document.getElementById('sugoroku-board');
  const piece = document.getElementById('piece');
  const dimensions = getBoardDimensions();
  
  boardSquares = [];
  
  // 十分に長い色シーケンスを生成（1000個）
  colorSequence = generateColorSequence(1000);
  // イベントマスシーケンスも生成
  eventSequence = generateEventSequence(1000);
  
  // ボードのスタイルを動的に設定（画面幅いっぱいに配置）
  board.style.gap = `${dimensions.squareGap}px`;
  board.style.paddingLeft = `${dimensions.leftMargin}px`;
  board.style.paddingRight = `${dimensions.leftMargin}px`;
  board.style.paddingTop = '10px';
  board.style.paddingBottom = '10px';
  board.style.justifyContent = 'flex-start'; // 左から均等配置
  
  // 7つの固定マスを作成
  for (let i = 0; i < TOTAL_SQUARES; i++) {
    const square = createFixedSquare(i);
    board.appendChild(square);
    boardSquares.push(square);
  }
  
  // 初期の色を設定
  updateAllSquareColors();
  
  // コマの初期位置を設定（長めの遅延でDOM構築完了を確実に待つ）
  setTimeout(() => {
    const centerPosition = calculateCenterPosition();
    piece.style.left = centerPosition + 'px';
    console.log(`コマの初期位置設定: ${centerPosition}px`);
  }, 300);
}

// 10の倍数マス目の境界線を更新する関数
// コマを指定の位置に移動させる（新システム）
function movePiece(steps) {
  const piece = document.getElementById('piece');
  let moveCount = 0;
  
  console.log(`コマ移動開始: ${steps}歩進む`);
  
  const moveInterval = setInterval(() => {
    if (moveCount >= steps) {
      clearInterval(moveInterval);
      
      // 移動完了後に色をシフトして、コマを最初の位置に戻す
      setTimeout(() => {
        shiftColorsAndResetPiece();
        
        // 移動完了後にマスの色に応じてノーツを流す
        setTimeout(() => {
          const currentColorIndex = currentPosition % colorSequence.length;
          const currentEventIndex = currentPosition % eventSequence.length;
          const currentColor = colorSequence[currentColorIndex];
          const isCurrentEvent = eventSequence[currentEventIndex];
          
          console.log('移動完了 - 現在のマスの色:', currentColor || 'デフォルト', ', イベント:', isCurrentEvent);
          
          // イベントマスをチェック
          if (isCurrentEvent) {
            showEventMessage();
            // イベントマスでもノーツ処理は続行
          }
          
          if (currentColor && currentColor !== 'white') {
            // 色別のノーツ流し
            switch(currentColor) {
              case 'red':
                // 赤マス：加速ノーツ
                console.log(`赤マス - 加速ノーツを流します`);
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
                console.log(`青マス - ランダム間隔ノーツを流します`);
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
                console.log(`緑マス - 段階的速度変化ノーツを流します`);
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
                console.log(`紫マス - 確率的爆弾ノーツを流します`);
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
                // 黄マス：白マスと同じ処理
                console.log('黄マス - ランダムパターンを流します');
                const yellowPatterns = [
                  { params: [4000, 20], desc: "4秒で20回" },
                  { params: [3000, 15], desc: "3秒で15回" },
                  { params: [3000, 20], desc: "3秒で20回" },
                  { params: [2500, 30], desc: "2.5秒で30回" },
                  { params: [2000, 30], desc: "2秒で30回" },
                  { params: [1000, 15], desc: "1秒で15回" },
                  { params: [700, 10], desc: "0.7秒で10回" }
                ];
                const yellowPattern = yellowPatterns[Math.floor(Math.random() * yellowPatterns.length)];
                updateSectionBackground('yellow');
                showPatternRoulette(yellowPattern.desc, () => {
                  startGameCountdown(startGame, ...yellowPattern.params);
                }, yellowPatterns);
                break;
                
              case 'black':
                // 黒マス：等間隔ノーツ（白マスと同様）
                console.log(`黒マス - 等間隔ノーツを流します`);
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
            console.log('白マスまたは無色マス - ランダムパターンを流します');
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
      
      console.log(`コマ移動: ${moveCount}マス目, 目標マス[${targetSquareIndex}], 位置: ${newLeft}px`);
    }
    
    // アニメーション完了後にクラスを除去
    setTimeout(() => {
      piece.classList.remove('moving');
    }, 500);
    
  }, 600); // 600msごとに1マス進む
}

// 色をシフトしてコマを最初の位置に戻す
function shiftColorsAndResetPiece() {
  const piece = document.getElementById('piece');
  const board = document.getElementById('sugoroku-board');
  
  // 表示オフセットを更新（コマが進んだ分だけシフト）
  displayOffset = currentPosition;
  
  // 色シーケンスが足りない場合は追加生成
  while (displayOffset + TOTAL_SQUARES >= colorSequence.length) {
    const additionalColors = generateColorSequence(1000);
    colorSequence = colorSequence.concat(additionalColors.slice(1)); // 最初の無色は除く
  }
  
  // イベントシーケンスが足りない場合は追加生成
  while (displayOffset + TOTAL_SQUARES >= eventSequence.length) {
    const additionalEvents = generateEventSequence(1000);
    eventSequence = eventSequence.concat(additionalEvents);
  }
  
  // ボード全体にシフトアニメーションを追加
  board.classList.add('shifting');
  
  // 全マスの色を更新（順次アニメーション付き）
  updateAllSquareColors();
  
  // コマを最初の位置に戻す（動的計算）
  const centerPosition = calculateCenterPosition();
  piece.style.left = centerPosition + 'px';
  
  console.log(`コマを初期位置に戻す: ${centerPosition}px`);
  
  // ボードアニメーションクラスを削除
  setTimeout(() => {
    board.classList.remove('shifting');
  }, 800);
  
  // 現在のマスの色を取得してデータストリームを更新
  const currentColorIndex = currentPosition % colorSequence.length;
  const currentColor = colorSequence[currentColorIndex];
  
  // データストリームを更新（少し遅延してアニメーション完了後に）
  setTimeout(() => {
    updateDataStream(currentPosition, currentColor);
    console.log(`データストリーム更新: 位置=${currentPosition}, 色=${currentColor || 'デフォルト'}`);
  }, 900);
}

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
  
  console.log(`セクション2の背景色を${color}に変更`);
}

// サイコロの結果をすごろくに反映
function handleDiceResult(diceValue) {
  console.log(`サイコロの出目: ${diceValue}, コマを${diceValue}マス進めます`);
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
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();

  console.log(`ランダムゲーム開始 - 速度範囲:${speed1}-${speed2}ms, 個数:${count}, タイプ:${type === 1 ? 'uniform' : 'weighted'}`);

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
      enableDiceSection();
      showSection4Text('finish'); // FINISH表示
      console.log('ランダムゲーム完了');
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
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();

  console.log(`段階的ゲーム開始 - 速度1:${speed1}ms(${count1}個), 速度2:${speed2}ms(${count2}個), セット数:${sets}`);

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
      enableDiceSection();
      showSection4Text('finish'); // FINISH表示
      console.log('段階的ゲーム完了');
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
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();

  console.log(`確率的ゲーム開始 - メイン速度:${speed1}ms(${count1}個), 確率:${probability}, 爆弾速度:${speed2}ms(${count2}個)`);

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
      enableDiceSection();
      showSection4Text('finish'); // FINISH表示
      console.log('確率的ゲーム完了');
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
  
  console.log('ゲーム開始3秒カウントダウン開始（セクション4）');
  
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
  
  console.log('スケジュールされたゲームを実行');
  
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
    console.log('スキップインジケーターが不足しています');
    return;
  }
  
  console.log('ゲームをスキップして完了状態にします');
  
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
  
  console.log('スキップ完了 - サイコロを振れる状態になりました');
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
    console.log('スキップボタンクリック - 待機中:', isWaitingForGame);
    if (isWaitingForGame && !skipButton.classList.contains('disabled') && 
        !skipButton.classList.contains('no-indicators') && IndicatorManager.skipCount > 0) {
      console.log('ゲームをスキップして完了状態にします');
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
    
    // 現在のアクティブな数を確認
    const currentActiveCount = button.querySelectorAll('.indicator.active').length;
    
    // 増加の場合：左から順番に点灯
    if (count > currentActiveCount) {
      for (let i = currentActiveCount; i < Math.min(count, 3); i++) {
        indicators[i].classList.add('active');
      }
    }
    // 減少の場合：右から順番に消灯
    else if (count < currentActiveCount) {
      for (let i = currentActiveCount - 1; i >= count; i--) {
        indicators[i].classList.remove('active');
      }
    }
    
    // インジケーターが0個の場合はボタンを無効化
    if (count === 0) {
      button.classList.add('no-indicators');
    } else {
      button.classList.remove('no-indicators');
    }
    
    console.log(`${buttonType}インジケーター更新: ${currentActiveCount}個 → ${count}個`);
  },
  
  // インジケーターを消費（右から消える）
  consumeIndicator(buttonType) {
    const currentCount = buttonType === 'stop' ? this.stopCount : this.skipCount;
    
    if (currentCount <= 0) {
      console.log(`${buttonType}インジケーターが足りません`);
      return false;
    }
    
    if (buttonType === 'stop') {
      this.stopCount--;
      this.updateIndicators('stop', this.stopCount);
    } else {
      this.skipCount--;
      this.updateIndicators('skip', this.skipCount);
    }
    
    console.log(`${buttonType}インジケーターを消費: 残り${buttonType === 'stop' ? this.stopCount : this.skipCount}個`);
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
    
    console.log(`${buttonType}インジケーターを追加: 現在${buttonType === 'stop' ? this.stopCount : this.skipCount}個`);
  },
  
  // 初期化
  initialize() {
    this.updateIndicators('stop', this.stopCount);
    this.updateIndicators('skip', this.skipCount);
    console.log('インジケーターシステム初期化完了');
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
    console.log('ゲーム完了');
    
    // ノーツ終了処理を追加
    onNotesFinish();
  } else {
    setTimeout(originalCheckEnd, 200);
  }
};

setTimeout(originalCheckEnd, 1000);

// イベント発生メッセージを表示する関数
function showEventMessage() {
  const eventText = document.getElementById('event-text');
  
  // ランダムでイベントを選択（4つのうち1つ）
  const eventType = Math.floor(Math.random() * 4);
  let eventMessage = '';
  
  switch(eventType) {
    case 0:
      // 停止ボタンのインジケーターを1つ増加
      addIndicator('control-matrix');
      eventMessage = '停止ボタン強化';
      break;
    case 1:
      // スキップボタンのインジケーターを1つ増加
      addIndicator('skip-button');
      eventMessage = 'スキップボタン強化';
      break;
    case 2:
      // 5マス戻る
      moveBackFiveSquares();
      eventMessage = '5マス後退';
      break;
    case 3:
      // 前方5マスを黒色にする
      changeForwardSquaresToBlack();
      eventMessage = '前方妨害';
      break;
  }
  
  // イベント発生表示
  eventText.textContent = eventMessage;
  eventText.classList.add('event-active');
  
  console.log(`イベントマスに到着 - ${eventMessage}！`);
  
  // 3秒後に元に戻す
  setTimeout(() => {
    eventText.textContent = 'SYSTEM READY';
    eventText.classList.remove('event-active');
  }, 3000);
}

// インジケーターを1つ追加する関数
function addIndicator(buttonId) {
  const button = document.getElementById(buttonId);
  const indicators = button.querySelectorAll('.indicator');
  
  // 既にすべてのインジケーターがアクティブな場合は何もしない
  if (indicators.length === 0) return;
  
  // 非アクティブなインジケーターを探してアクティブにする
  for (let indicator of indicators) {
    if (!indicator.classList.contains('active')) {
      indicator.classList.add('active');
      console.log(`${buttonId}のインジケーターを1つ追加`);
      break;
    }
  }
}

// 5マス戻る関数
function moveBackFiveSquares() {
  if (currentPosition >= 5) {
    currentPosition -= 5;
    console.log(`5マス後退: 現在位置=${currentPosition}`);
    
    // 色をシフトして表示を更新
    shiftColorsAndResetPiece();
  } else {
    // 5マス未満の場合は最初の位置に戻る
    currentPosition = 0;
    console.log(`5マス後退: 最初の位置に戻る`);
    shiftColorsAndResetPiece();
  }
}

// 前方5マスを黒色にする関数
function changeForwardSquaresToBlack() {
  console.log('前方5マスを黒色に変更開始');
  
  // 自分のいるマスの次から5マス先まで黒色に変更
  for (let i = 1; i <= 5; i++) {
    const targetPosition = currentPosition + i;
    const colorIndex = targetPosition % colorSequence.length;
    
    // 色シーケンスを黒色に変更
    colorSequence[colorIndex] = 'black';
    
    console.log(`マス${targetPosition}を黒色に変更`);
  }
  
  // 色の変更を即座に反映
  updateAllSquareColors();
}