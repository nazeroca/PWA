// ランダム盤面データファイル
// すごろく盤面の色をランダムに生成

// 確率に基づいて色を選択する関数


// ランダムな無限の色シーケンスを生成
function generateRandomColorSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    // 確率に基づいて色を選択
    sequence.push(selectRandomColor());
  }
  return sequence;
}

// 初期シーケンス生成（最初だけnull）
function generateInitialColorSequence(length) {
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

// ランダム盤面用のボード初期化関数を上書き
function initializeSugorokuBoard() {
  const board = document.getElementById('sugoroku-board');
  const piece = document.getElementById('piece');
  const dimensions = getBoardDimensions();
  
  boardSquares = [];
  
  // 十分に長いランダム色シーケンスを生成（1000個）
  colorSequence = generateInitialColorSequence(1000);
  
  // イベントマスシーケンスも生成
  eventSequence = generateEventSequence(1000);
  
  // ボードのスタイルを動的に設定（画面幅いっぱいに配置）
  board.style.gap = `${dimensions.squareGap}px`;
  board.style.paddingLeft = `${dimensions.leftMargin}px`;
  board.style.paddingRight = `${dimensions.leftMargin}px`;
  board.style.paddingTop = '1.43vh';
  board.style.paddingBottom = '1.43vh';
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
  }, 300);
}

// ランダム盤面用の色シフト関数
function shiftColorsAndResetPiece() {
  const piece = document.getElementById('piece');
  const board = document.getElementById('sugoroku-board');
  
  // 表示オフセットを更新（コマが進んだ分だけシフト）
  displayOffset = currentPosition;
  
  // 色シーケンスが足りない場合は追加生成
  while (displayOffset + TOTAL_SQUARES >= colorSequence.length) {
    const additionalColors = generateRandomColorSequence(1000);
    colorSequence = colorSequence.concat(additionalColors); // nullは含まれないので全て追加
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
  }, 900);
}


