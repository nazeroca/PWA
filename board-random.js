// ランダム盤面データファイル
// すごろく盤面の色をランダムに生成

// 確率に基づいて色を選択する関数


// 位置に応じて適切なパターンセットからノーツパターンを選択する関数
function getRandomNotePatternWithPosition(color, position) {
  if (color === "red") {
    let patterns = [...redPatterns];
    if (position >= 35) patterns = patterns.concat(redPatterns35);
    if (position >= 70) patterns = patterns.concat(redPatterns70);
    if (position >= 105) patterns = patterns.concat(redPatterns105);

    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  } else if (color === "blue") {
    let patterns = [...bluePatterns];
    if (position >= 35) patterns = patterns.concat(bluePatterns35);
    if (position >= 70) patterns = patterns.concat(bluePatterns70);
    if (position >= 105) patterns = patterns.concat(bluePatterns105);
    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  } else if (color === "green") {
    let patterns = [...greenPatterns];
    if (position >= 35) patterns = patterns.concat(greenPatterns35);
    if (position >= 70) patterns = patterns.concat(greenPatterns70);
    if (position >= 105) patterns = patterns.concat(greenPatterns105);
    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  } else if (color === "yellow") {
    let patterns = [...yellowPatterns];
    if (position >= 35) patterns = patterns.concat(yellowPatterns35);
    if (position >= 70) patterns = patterns.concat(yellowPatterns70);
    if (position >= 105) patterns = patterns.concat(yellowPatterns105);
    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  } else if (color === "black") {
    let patterns = [...blackPatterns];
    if (position >= 35) patterns = patterns.concat(blackPatterns35);
    if (position >= 70) patterns = patterns.concat(blackPatterns70);
    if (position >= 105) patterns = patterns.concat(blackPatterns105);
    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  } else {
    // 白または無色
    let patterns = [...whitePatterns];
    if (position >= 35) patterns = patterns.concat(whitePatterns35);
    if (position >= 70) patterns = patterns.concat(whitePatterns70);
    if (position >= 105) patterns = patterns.concat(whitePatterns105);
    // デバッグログ
    return patterns[Math.floor(getSecureRandom() * patterns.length)];
  }
}


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

// 初期シーケンス生成（色とノーツ内容をセットで）
function generateInitialColorAndPatternSequence(length, startOffset = 0) {
  const colorSeq = [];
  const noteSeq = [];
  for (let i = 0; i < length; i++) {
    const absolutePosition = startOffset + i;
    if (absolutePosition === 0) {
      colorSeq.push(null);
      noteSeq.push(null);
    } else {
      const color = selectRandomColor();
      colorSeq.push(color);
      noteSeq.push(getRandomNotePatternWithPosition(color, absolutePosition));
    }
  }
  return { colorSeq, noteSeq };
}

// ランダム盤面用のボード初期化関数を上書き
function initializeSugorokuBoard() {
  const board = document.getElementById('sugoroku-board');
  const piece = document.getElementById('piece');
  const dimensions = getBoardDimensions();
  
  boardSquares = [];
  
  // 十分に長いランダム色・ノーツ内容シーケンスを生成（1000個）
  const { colorSeq, noteSeq } = generateInitialColorAndPatternSequence(1000, 0);
  colorSequence = colorSeq;
  notePatternSequence = noteSeq;
  
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

    // タップでノーツ内容をぼんやり表示（タイマーなし）
    square.addEventListener('click', (e) => {
      if (window.isNotesPlaying) return;
      e.stopPropagation();
      const idx = displayOffset + i;
      const pattern = notePatternSequence[idx];
      const floating = document.getElementById('floating-pattern-text');
      const color = colorSequence[idx];
      // すでに同じ内容が表示中なら何もしない（紫・黒はそもそも表示しない）
      if (color === 'purple' || color === 'black') {
        if (floating.classList.contains('show')) {
          floating.classList.remove('show');
          setTimeout(() => { floating.style.display = 'none'; }, 150);
        }
        return;
      }
      if (
        floating.classList.contains('show') &&
        (pattern && pattern.desc && floating.textContent === pattern.desc)
      ) {
        return;
      }
      // すでに表示中なら一度即消す（アニメーション付きで消す）
      if (floating.classList.contains('show')) {
        floating.classList.remove('show');
        setTimeout(() => {
          floating.style.display = 'none';
          // 内容セット＆再表示
          if (pattern && pattern.desc) {
            floating.textContent = pattern.desc;
          } else {
            floating.textContent = '';
          }
          if (floating.textContent) {
            floating.style.display = 'block';
            setTimeout(() => floating.classList.add('show'), 10);
          }
        }, 100); // アニメーション消去後に再表示
      } else {
        // 内容セット＆表示
        if (pattern && pattern.desc) {
          floating.textContent = pattern.desc;
        } else {
          floating.textContent = '';
        }
        if (floating.textContent) {
          floating.style.display = 'block';
          setTimeout(() => floating.classList.add('show'), 10);
        }
      }
    });
  }
  // 盤以外をタップしたら消す
  document.addEventListener('click', (e) => {
    // ノーツが流れている間は何もしない
    if (window.isNotesPlaying) return;
    // 盤のマス以外をクリックした場合のみ消す
    const floating = document.getElementById('floating-pattern-text');
    if (floating.classList.contains('show')) {
      floating.classList.remove('show');
      setTimeout(() => { floating.style.display = 'none'; }, 150); // 0.15秒に短縮
    }
  });
  
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
    const currentLength = colorSequence.length;
    const { colorSeq, noteSeq } = generateInitialColorAndPatternSequence(1000, currentLength);
    colorSequence = colorSequence.concat(colorSeq); // nullは含まれないので全て追加
    notePatternSequence = notePatternSequence.concat(noteSeq);
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


