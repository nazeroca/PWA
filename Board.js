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
                  
                  // SPACE（現在位置）に応じた追加パターン（1回だけ追加）
                  if (currentPosition >= 10 && !redPatterns.some(p => p.params.join(',') === '6000,500,1.8,60,0')) {
                    redPatterns.push({ params: [6000, 500, 1.8, 60, 0], desc: "6秒⇒0.5秒60回" });
                  }
                  
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
                  // 黄マス：バグ発生
                  updateSectionBackground('yellow');
                  
                  // バグの候補配列を作成
                  const bugCandidates = [];
                  if (typeof BUGS !== 'undefined') {
                    Object.keys(BUGS).forEach(key => {
                      const bug = BUGS[key];
                      // 現在のバグは除外
                      if (!currentBug || bug !== currentBug) {
                        bugCandidates.push({
                          params: [key],
                          desc: `${bug.name}: ${bug.description}`
                        });
                      }
                    });
                  }
                  
                  // バグが決定された場合の最終表示テキストを取得
                  let finalBugText = 'バグ発生';
                  if (bugCandidates.length > 0) {
                    const selectedBug = bugCandidates[Math.floor(Math.random() * bugCandidates.length)];
                    finalBugText = selectedBug.desc;
                  }
                  
                  // セクション2には固定テキストを表示
                  const patternText = document.getElementById('pattern-text');
                  if (patternText) {
                    patternText.textContent = 'バグ発生';
                  }
                  
                  // セクション7でバグルーレット演出を表示
                  showBugRoulette(finalBugText, () => {
                    if (typeof applyBug !== 'undefined') {
                      applyBug();
                    }
                    // バグ発生後にサイコロを有効化
                    setTimeout(() => {
                      updateSectionBackground('white'); // 背景を元に戻す
                      enableDiceSection();
                    }, 1000);
                  }, bugCandidates);
                  break;
                  
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