// 動的なサイズ計算関数
function getBoardDimensions() {
  const container = document.getElementById('sugoroku-container');
  if (!container) {
    // フォールバック値 - 420px基準でvh/vwに変換
    return {
      squareSize: window.innerWidth * 0.095, // 約40px → 9.5vw
      squareGap: window.innerWidth * 0.048, // 約20px → 4.8vw
      squareInterval: window.innerWidth * 0.143 // 約60px → 14.3vw
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
}

// 重みづけされた抽選を行う汎用関数
function selectWeightedRandom(weights) {
  // 重みの合計を計算
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  // 0から合計重みまでの乱数を生成
  const random = getSecureRandom() * totalWeight;

  // 累積重みで抽選
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
            if (currentColor && currentColor !== 'white') {
              // 色別のノーツ流し
              switch (currentColor) {
                case 'red':
                  updateSectionBackground('red');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameA, ...notePattern.params);
                  }, redPatterns);
                  break;
                case 'blue':
                  updateSectionBackground('blue');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameR, ...notePattern.params);
                  }, bluePatterns);
                  break;
                case 'green':
                  updateSectionBackground('green');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameT2, ...notePattern.params);
                  }, greenPatterns);
                  break;
                case 'yellow':
                  updateSectionBackground('yellow');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGameP, ...notePattern.params);
                  }, yellowPatterns);
                  break;
                case 'purple':
                  updateSectionBackground('purple');
                  // バグの候補配列を作成
                  const bugCandidates = [];
                  if (typeof BUGS !== 'undefined') {
                    Object.keys(BUGS).forEach(key => {
                      const bug = BUGS[key];
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
                    patternText.textContent = 'バグ発生';
                  }
                  showBugRoulette(finalBugText, () => {
                    if (typeof applyBug !== 'undefined') {
                      applyBug();
                    }
                    setTimeout(() => {
                      updateSectionBackground('white');
                      enableDiceSection();
                    }, 1000);
                  }, bugCandidates);
                  break;
                case 'black':
                  updateSectionBackground('black');
                  showPatternRoulette(notePattern.desc, () => {
                    startGameCountdown(startGame, ...notePattern.params);
                  }, blackPatterns);
                  break;
              }
            } else {
              // 白マスまたは無色マス
              updateSectionBackground('white');
              showPatternRoulette(notePattern.desc, () => {
                startGameCountdown(startGame, ...notePattern.params);
              }, whitePatterns);
            }
          }).catch(error => {
            console.error('バグ処理エラー:', error);
            // エラーが発生した場合でも通常処理を続行
          });
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

// サイコロの結果をすごろくに反映
function handleDiceResult(diceValue) {

  movePiece(diceValue);
}

// ノーツ内容配列をグローバルで管理
let notePatternSequence = [];

// 色ごとにノーツパターンを返す関数
function getRandomNotePattern(color) {
  if (color === "red") {
    return redPatterns[Math.floor(getSecureRandom() * redPatterns.length)];
  } else if (color === "blue") {
    return bluePatterns[Math.floor(getSecureRandom() * bluePatterns.length)];
  } else if (color === "green") {
    return greenPatterns[Math.floor(getSecureRandom() * greenPatterns.length)];
  } else if (color === "yellow") {
    return yellowPatterns[Math.floor(getSecureRandom() * yellowPatterns.length)];
  } else if (color === "black") {
    return blackPatterns[Math.floor(getSecureRandom() * blackPatterns.length)];
  } else {
    // 白または無色
    return whitePatterns[Math.floor(getSecureRandom() * whitePatterns.length)];
  }
}

const whitePatterns = [
                { params: [10000, 10], desc: "10秒で10回" },
                { params: [4000, 25], desc: "4秒で25回" },
                { params: [4000, 15], desc: "4秒で15回" },
                { params: [3500, 20], desc: "3.5秒で20回" },
                { params: [3000, 30], desc: "3秒で30回" },
                { params: [3000, 20], desc: "3秒で20回" },
                { params: [2500, 25], desc: "2.5秒で25回" },
                { params: [2000, 20], desc: "2秒で20回" },
                { params: [2500, 30], desc: "2.5秒で30回" },
                { params: [2000, 15], desc: "2秒で15回" },
                { params: [1500, 20], desc: "1.5秒で20回" },
                { params: [1300, 15], desc: "1.3秒で15回" },
                { params: [1000, 10], desc: "1秒で10回" },
                { params: [1000, 20], desc: "1秒で20回" },
                { params: [700, 12], desc: "0.7秒で12回" }
              ];

              const yellowPatterns = [
                    { params: [1000, 1, 0.2, 700, 30], desc: "20%0.7秒30回" },
                    { params: [1000, 1, 0.5, 1500, 60], desc: "50%1.5秒60回" },
                    { params: [1000, 1, 0.3, 2000, 45], desc: "30%2秒45回" },
                    { params: [1000, 1, 0.05, 500, 50], desc: "5%0.5秒50回" },
                    { params: [3000, 15, 0.03, 1000, 30], desc: "3秒15回||3%1秒30回" },
                    { params: [3000, 20, 0.05, 500, 10], desc: "3秒20回||5%0.5秒10回" },
                    { params: [3000, 20, 0.2, 1000, 5], desc: "3秒20回||20%1秒5回" },
                    { params: [2000, 12, 0.1, 1000, 5], desc: "2秒12回||10%1秒5回" },
                    { params: [4000, 15, 0.5, 2000, 3], desc: "4秒15回||50%2秒3回" },
                    { params: [4000, 20, 0.1, 1000, 5], desc: "4秒20回||10%1秒5回" },
                    { params: [4000, 25, 0.05, 1000, 20], desc: "4秒25回||5%1秒20回" },
                    { params: [5000, 4, 0.75, 1000, 30], desc: "5秒4回||75%1秒30回" },
                    { params: [1000, 40, 0.03, 5000, 1], desc: "1秒40回||3%5秒休み" },
                    { params: [500, 50, 0.07, 3000, 1], desc: "0.5秒50回||7%3秒休み" },
                    { params: [1200, 70, 0.03, 5000, 1], desc: "1.2秒70回||3%5秒休み" },
                    { params: [700, 30, 0.05, 7000, 1], desc: "0.7秒30回||5%7秒休み" }
                  ];

                  const redPatterns = [
                    { params: [3000, 1000, 2, 20, 0], desc: "3秒⇒1秒20回" },
                    { params: [2000, 500, 1.2, 30, 0], desc: "2秒⇒0.5秒30回" },
                    { params: [5000, 1000, 2, 40, 0], desc: "5秒⇒1秒40回" },
                    { params: [4000, 500, 2.5, 32, 0], desc: "4秒⇒0.5秒32回" },
                    { params: [500, 4000, 0.8, 35, 0], desc: "0.5秒⇒4秒35回" },
                    { params: [1000, 4000, 0.6, 40, 0], desc: "1秒⇒4秒40回" },
                    { params: [4000, 1000, 2, 25, 10], desc: "4秒⇒1秒25回＋10回" },
                    { params: [5000, 1000, 1.5, 30, 10], desc: "5秒⇒1秒30回＋10回" },
                    { params: [4000, 1000, 1, 25, 20], desc: "4秒⇒1秒25回＋20回" },
                    { params: [3000, 700, 2, 25, 10], desc: "3秒⇒0.7秒25回＋10回" },
                    { params: [4000, 800, 3, 20, 10], desc: "4秒⇒0.8秒20回＋10回" }
                  ];

                  const bluePatterns = [
                    { params: [500, 1000, 10, 1], desc: "0.5秒～1秒10回" },
                    { params: [500, 2000, 20, 1], desc: "0.5秒～2秒20回" },
                    { params: [500, 2500, 25, 1], desc: "0.5秒～2.5秒25回" },
                    { params: [500, 3000, 30, 1], desc: "0.5秒～3秒30回" },
                    { params: [500, 3500, 35, 1], desc: "0.5秒～3秒35回" },
                    { params: [500, 4000, 40, 1], desc: "0.5秒～4秒40回" },
                    { params: [1000, 5000, 40, 2], desc: "1秒＞5秒40回" },
                    { params: [1000, 4000, 35, 2], desc: "1秒＞4秒35回" },
                    { params: [1000, 3000, 30, 2], desc: "1秒＞3秒30回" },
                    { params: [500, 5000, 30, 2], desc: "0.5秒＞5秒30回" },
                    { params: [500, 4000, 27, 2], desc: "0.5秒＞4秒27回" },
                    { params: [500, 3000, 25, 2], desc: "0.5秒＞3秒25回" },
                    { params: [500, 2000, 20, 2], desc: "0.5秒＞2秒20回" }
                  ];

                  const greenPatterns = [
                    { params: [4000, 1000, 5, 10, 2], desc: "4秒5回⇔1秒10回×3" },
                    { params: [2000, 1500, 5, 5, 3], desc: "2秒5回⇔1.5秒5回×3" },
                    { params: [2000, 1000, 6, 2, 4], desc: "2秒6回⇔1秒2回×4" },
                    { params: [4000, 1000, 3, 7, 5], desc: "4秒3回⇔1秒7回×5" },
                    { params: [3000, 700, 2, 2, 10], desc: "3秒2回⇔0.7秒2回×10" },
                    { params: [4000, 1200, 3, 10, 6], desc: "4秒3回⇔1.2秒10回×6" },
                    { params: [5000, 2000, 2, 8, 7], desc: "5秒2回⇔2秒8回×7" },
                    { params: [1500, 5000, 9, 1, 5], desc: "1.5秒10回⇔5秒休み×5" },
                    { params: [800, 10000, 14, 1, 3], desc: "0.8秒15回⇔10秒休み×3" },
                    { params: [2000, 10000, 29, 1, 2], desc: "2秒30回⇔10秒休み×2" },
                    { params: [700, 3000, 6, 1, 7], desc: "0.7秒7回⇔3秒休み×7" },
                    { params: [700, 2000, 2, 1, 15], desc: "0.7秒3回⇔2秒休み×15" }
                  ];

                  const blackPatterns = [
                    { params: [800, 30], desc: "0.8秒で30回" },
                    { params: [1200, 50], desc: "1.2秒で50回" }
                  ];