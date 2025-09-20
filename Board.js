// グローバル変数
const passedGlowingLines = new Set(); // 通過済みの光る線を記録するSet

// 動的なサイズ計算関数
function getBoardDimensions() {
  const container = document.getElementById('sugoroku-container');
  if (!container) {
    // フォールバック値 - 420px基準 in vh/vwに変換
    return {
      squareSize: window.innerWidth * 0.095, // 約40px → 9.5vw
      squareGap: window.innerWidth * 0.048, // 約20px → 4.8vw
      squareInterval: window.innerWidth * 0.143 // 約60px → 14.3vw
    };
  }

  const containerWidth = container.offsetWidth;
  const totalSquares = 7;

  // マスのサイズを画面幅の割合 in 設定（vw単位）- もう少し大きく
  const squareSize = window.innerWidth * 0.11; // 11vw（画面幅の11%）

  // マス間の間隔を画面幅の割合 in 設定（vw単位）- 少し詰める
  const squareGap = window.innerWidth * 0.025; // 2.5vw（画面幅の2.5%）

  // 左右のマージンを計算（残りの幅を左右 in 分割）
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

// 動的に中央位置を計算する関数
function calculateCenterPosition() {
  const container = document.getElementById('sugoroku-container');
  const board = document.getElementById('sugoroku-board');

  if (!container || !board) return 50; // フォールバック

  // DOM要素が準備 in きるま in 少し待つ
  if (boardSquares.length === 0) return 50;

  // 最初のマスの実際の位置を取得
  const firstSquare = boardSquares[0];
  if (!firstSquare) return 50;

  const containerRect = container.getBoundingClientRect();
  const squareRect = firstSquare.getBoundingClientRect();

  // コンテナ相対 in の最初のマスの中央位置
  const relativeCenterX = (squareRect.left - containerRect.left) + (squareRect.width / 2);



  return relativeCenterX;
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


  for (let i = 0; i < TOTAL_SQUARES; i++) {
    // 左から右に順番に色を変更（100msずつ遅延）
    setTimeout(() => {
      const actualPosition = displayOffset + i;
      const colorIndex = actualPosition % colorSequence.length;
      const eventIndex = actualPosition % eventSequence.length;
      const color = colorSequence[colorIndex];
      const isEvent = eventSequence[eventIndex];

      // スタートマス（位置0）にはイベントマスを表示しない
      const shouldShowEvent = isEvent && actualPosition > 0;



      updateSquareColor(boardSquares[i], color, shouldShowEvent);
    }, i * 100);
  }

  // 光る線の位置を更新
  setTimeout(updateGlowingLinePosition, TOTAL_SQUARES * 100 + 50);
}

// 光る線の位置と表示を更新する関数（しきい値対応版）
function updateGlowingLinePosition() {
  const thresholds = getThresholds();
  const targetPositions = [thresholds.early, thresholds.mid, thresholds.high];

  targetPositions.forEach(pos => {
    const glowingLine = document.getElementById(`glowing-line-${pos}`);
    if (!glowingLine || passedGlowingLines.has(pos)) {
      if (glowingLine) glowingLine.style.opacity = '0';
      return;
    }

    const squareIndex = pos - displayOffset;

    if (squareIndex >= 0 && squareIndex < TOTAL_SQUARES - 1) {
      const square1 = boardSquares[squareIndex];
      const square2 = boardSquares[squareIndex + 1];

      if (square1 && square2) {
        const container = document.getElementById('sugoroku-container');
        const containerRect = container.getBoundingClientRect();
        const rect1 = square1.getBoundingClientRect();
        const rect2 = square2.getBoundingClientRect();

        const lineLeft = (((rect1.right - containerRect.left) + (rect2.left - containerRect.left)) / 2) - (window.innerWidth * 0.005);

        glowingLine.style.left = `${lineLeft}px`;
        glowingLine.style.opacity = '1';
      } else {
        glowingLine.style.opacity = '0';
      }
    } else {
      glowingLine.style.opacity = '0';
    }
  });
}

// 重みづけされた抽選を行う汎用関数
function selectWeightedRandom(weights) {
  // 重みの合計を計算
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  // 0から合計重みま in の乱数を生成
  const random = getSecureRandom() * totalWeight;

  // 累積重み in 抽選
  let currentWeight = 0;
  for (const [item, weight] of Object.entries(weights)) {
    currentWeight += weight;
    if (random < currentWeight) {
      return item;
    }
  }

  // 安全のため最後のアイテムを返す（通常は到達しない）
  return Object.keys(weights)[Object.keys(weights).length - 1];
}


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
          const currentEventIndex = currentPosition % eventSequence.length;
          const currentColor = colorSequence[currentColorIndex];
          const isCurrentEvent = eventSequence[currentEventIndex];



          // 処理順序：1. イベントの処理 → 2. バグの処理 → 3. マスの処理

          // 1. イベントマスの処理（最優先）
          if (isCurrentEvent) {
            showEventMessage();
            // イベント処理完了後にバグ処理とマス処理を続行
          }

          // 2. バグ効果をチェックして実行（通常マス処理の前）
          const bugPromise = (typeof checkAndExecuteBug !== 'undefined') ?
            checkAndExecuteBug(currentColor, lastDiceResult) : Promise.resolve();

          // 3. バグ処理がある場合は完了を待ってから通常処理
          bugPromise.then(() => {
            // 事前決定したノーツ内容を取得
            const patternIndex = currentPosition % notePatternSequence.length;
            const notePattern = notePatternSequence[patternIndex];
            const difficultyPatterns = getPatternsByDifficulty();
            
            if (currentColor && currentColor !== 'white') {
              // 色別のノーツ流し
              switch (currentColor) {
                case 'red':
                  updateSectionBackground('red');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameA, ...notePattern.params);
                  }, difficultyPatterns.red);
                  break;
                case 'blue':
                  updateSectionBackground('blue');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameR, ...notePattern.params);
                  }, difficultyPatterns.blue);
                  break;
                case 'green':
                  updateSectionBackground('green');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameT2, ...notePattern.params);
                  }, difficultyPatterns.green);
                  break;
                case 'yellow':
                  updateSectionBackground('yellow');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameP, ...notePattern.params);
                  }, difficultyPatterns.yellow);
                  break;
                case 'purple':
                  updateSectionBackground('purple');
                  // バグの候補配列を作成（難易度対応版）
                  const bugCandidates = [];
                  const difficultyBugs = getBugsByDifficulty();
                  if (difficultyBugs && typeof difficultyBugs === 'object') {
                    Object.keys(difficultyBugs).forEach(key => {
                      const bug = difficultyBugs[key];
                      if (!currentBug || bug !== currentBug) {
                        bugCandidates.push({
                          params: [key],
                          desc: `${bug.description}`
                        });
                      }
                    });
                  }
                  let finalBugText = 'バグ発生';
                  if (bugCandidates.length > 0) {
                    const selectedBug = bugCandidates[Math.floor(getSecureRandom() * bugCandidates.length)];
                    finalBugText = selectedBug.desc;
                  }
                  const patternText = document.getElementById('pattern-text');
                  if (patternText) {
                    patternText.textContent = 'BUGs has occurred. ';
                  }
                  showBugRoulette(finalBugText, () => {
                    if (typeof applyBug !== 'undefined') {
                      applyBug();
                    }
                    setTimeout(() => {
                      updateSectionBackground('white');
                      enableDiceSection();;
                    }, 1000);
                  }, bugCandidates);
                  break;
                case 'black':
                  updateSectionBackground('black');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGame, ...notePattern.params);
                  }, difficultyPatterns.black);
                  break;
              }
            } else {
              // 白マスまたは無色マス
              updateSectionBackground('white');
              showPatternRoulette(notePattern.desc, () => {
                startGameCountdown(startGame, ...notePattern.params);
              }, difficultyPatterns.white);
            }
          }).catch(error => {
            // エラーが発生した場合も通常処理を続行
          });
        }, 500);
      }, 300);

      return;
    }

    currentPosition++;

    // 光る線を通過したかチェック（しきい値対応版）
    const thresholds = getThresholds();
    const targetPositions = [thresholds.early, thresholds.mid, thresholds.high];
    targetPositions.forEach(pos => {
      if (currentPosition > pos && !passedGlowingLines.has(pos)) {
        passedGlowingLines.add(pos);
        const glowingLine = document.getElementById(`glowing-line-${pos}`);
        if (glowingLine) {
          glowingLine.classList.add('disappearing');
        }
        // 停止ボタンかスキップボタンのどちらかのインジケーターを1つ回復
        const availableButtons = [];
        
        // 停止ボタンのインジケーターが3未満なら追加可能
        if (typeof IndicatorManager !== 'undefined' && IndicatorManager.stopCount < 3) {
          availableButtons.push('stop');
        }
        
        // スキップボタンのインジケーターが3未満なら追加可能
        if (typeof IndicatorManager !== 'undefined' && IndicatorManager.skipCount < 3) {
          availableButtons.push('skip');
        }
        
        // 数字予測ボタンのインジケーターが3未満なら追加可能
        if (typeof IndicatorManager !== 'undefined' && IndicatorManager.predictCount < 3) {
          availableButtons.push('predict');
        }
        
        // ランダムに選択してインジケーターを追加
        if (availableButtons.length > 0) {
          const selectedButton = availableButtons[Math.floor(getSecureRandom() * availableButtons.length)];
          
          if (selectedButton === 'stop') {
            IndicatorManager.addIndicator('stop');
            // 停止ボタンを光らせる演出
            const controlMatrix = document.getElementById('control-matrix');
            if (controlMatrix) {
              controlMatrix.classList.add('indicator-gained');
              setTimeout(() => {
                controlMatrix.classList.remove('indicator-gained');
              }, 3000);
            }
          } else if (selectedButton === 'skip') {
            IndicatorManager.addIndicator('skip');
            // スキップボタンを光らせる演出
            const skipButton = document.getElementById('skip-button');
            if (skipButton) {
              skipButton.classList.add('indicator-gained');
              setTimeout(() => {
                skipButton.classList.remove('indicator-gained');
              }, 3000);
            }
          } else if (selectedButton === 'predict') {
            IndicatorManager.addIndicator('predict');
            // 数字予測ボタンを光らせる演出
            const predictButton = document.getElementById('number-predict-button');
            if (predictButton) {
              predictButton.classList.add('indicator-gained');
              setTimeout(() => {
                predictButton.classList.remove('indicator-gained');
              }, 3000);
            }
          }
          
        }
      }
    });
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

      // コンテナ相対 in の目標マスの中央位置
      const newLeft = (squareRect.left - containerRect.left) + (squareRect.width / 2);
      piece.style.left = newLeft + 'px';



    }

    // アニメーション完了後にクラスを除去
    setTimeout(() => {
      piece.classList.remove('moving');
    }, 500);

  }, 600); // 600msごとに1マス進む
}

// サイコロの結果をすごろくに反映
function handleDiceResult(diceValue) {

  movePiece(diceValue);
}

// ノーツ内容配列をグローバル in 管理
let notePatternSequence = [];

// 色ごとにノーツパターンを返す関数（難易度対応版）
function getRandomNotePattern(color) {
  const patterns = getPatternsByDifficulty();
  
  if (color === "red") {
    return patterns.red[Math.floor(getSecureRandom() * patterns.red.length)];
  } else if (color === "blue") {
    return patterns.blue[Math.floor(getSecureRandom() * patterns.blue.length)];
  } else if (color === "green") {
    return patterns.green[Math.floor(getSecureRandom() * patterns.green.length)];
  } else if (color === "yellow") {
    return patterns.yellow[Math.floor(getSecureRandom() * patterns.yellow.length)];
  } else if (color === "black") {
    return patterns.black[Math.floor(getSecureRandom() * patterns.black.length)];
  } else {
    // 白または無色
    return patterns.white[Math.floor(getSecureRandom() * patterns.white.length)];
  }
}

