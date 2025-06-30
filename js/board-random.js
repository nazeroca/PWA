// ランダム盤面データファイル
// すごろく盤面の色をランダムに生成

// 確率に基づいて色を選択する関数
function selectRandomColor() {
  const random = Math.random() * 100; // 0-100の乱数
  
  if (random < 50) {
    // 50%の確率で白（通常ノーツ）
    return 'yellow';
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

// ランダムな無限の色シーケンスを生成
function generateRandomColorSequence(length) {
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
  colorSequence = generateRandomColorSequence(1000);
  
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
    colorSequence = colorSequence.concat(additionalColors.slice(1)); // 最初の無色は除く
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

console.log('ランダム盤面モードが読み込まれました');
