// 固定盤面データファイル
// すごろく盤面の色と配置を固定で定義

// 固定盤面定義：各マスの色とパターンを直接指定
// 各要素は { color, params, desc, specialActions } または null（無色・スタート地点）
const FIXED_BOARD_SEQUENCE = [
  null,      // 0: 最初のマス（無色・スタート地点）
  { color: 'red', params: [3000, 1000, 2, 30, 0], desc: "3秒⇒1秒30回" },          // 1: 赤マス
  { color: 'white', params: [3000, 20], desc: "3秒で20回" },                       // 2: 白マス
  { 
    color: 'yellow', 
    desc: "特殊処理A", 
    specialActions: [
      { type: 'diceMultiply', desc: "サイコロ×20個ノーツ" },
      { type: 'fiveNotesLoop', desc: "5個ノーツ→1が出るまで継続" },
      { type: 'tenNotesFixed', desc: "固定10個ノーツ" }
    ]
  }, // 3: 黄マス（特殊処理A）
  { color: 'blue', params: [500, 2000, 20, 1], desc: "0.5秒～2秒20回" },          // 4: 青マス
  { color: 'green', params: [4000, 1000, 10, 5, 2], desc: "4秒10回⇔1秒5回×2" },  // 5: 緑マス
  { 
    color: 'yellow', 
    desc: "特殊処理B", 
    specialActions: [
      { type: 'diceMultiply', desc: "サイコロ×20個ノーツ" },
      { type: 'doubleDiceMultiply', desc: "サイコロ2回×10個ノーツ" }
    ]
  }, // 6: 黄マス（特殊処理B）
  { color: 'purple', params: [3000, 15, 0.01, 1000, 30], desc: "3秒15回||1%1秒30回" }, // 7: 紫マス
  { 
    color: 'yellow', 
    desc: "特殊処理C", 
    specialActions: [
      { type: 'fiveNotesLoop', desc: "5個ノーツ→1が出るまで継続" },
      { type: 'luckyDraw', desc: "ラッキードロー" }
    ]
  }, // 8: 黄マス（特殊処理C）
  null       // 9: ゴール地点
];

// 固定盤面用の色シーケンス生成関数
function generateFixedColorSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    // 固定配列の範囲内なら固定色を使用、範囲外ならループ
    const index = i % FIXED_BOARD_SEQUENCE.length;
    const boardData = FIXED_BOARD_SEQUENCE[index];
    
    if (boardData === null) {
      sequence.push(null);
    } else {
      sequence.push(boardData.color);
    }
  }
  return sequence;
}

// 位置に基づいて固定パターンを取得する関数
function getFixedBoardData(position) {
  const index = position % FIXED_BOARD_SEQUENCE.length;
  return FIXED_BOARD_SEQUENCE[index];
}

// 固定盤面用のボード初期化関数を上書き
function initializeSugorokuBoard() {
  const board = document.getElementById('sugoroku-board');
  const piece = document.getElementById('piece');
  const dimensions = getBoardDimensions();
  
  boardSquares = [];
  
  // 固定の色シーケンスを使用（1000個分）
  colorSequence = generateFixedColorSequence(1000);
  
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

// 固定盤面用の色シフト関数
function shiftColorsAndResetPiece() {
  const piece = document.getElementById('piece');
  const board = document.getElementById('sugoroku-board');
  const goalPosition = FIXED_BOARD_SEQUENCE.length - 1; // ゴールの位置
  
  // ゴールまでの残りマス数を計算
  const remainingToGoal = goalPosition - currentPosition;
  
  // ゴールまでの残りマス数が6以下の場合、スクロールを停止してゴールを7マス目に固定
  if (remainingToGoal <= 6) {
    // ゴールが7マス目（インデックス6）に来るように表示オフセットを調整
    displayOffset = goalPosition - (TOTAL_SQUARES - 1);
  } else {
    // 通常のスクロール処理
    displayOffset = currentPosition;
  }
  
  // 固定色シーケンスは循環するので追加生成は不要
  // 必要に応じて拡張
  while (displayOffset + TOTAL_SQUARES >= colorSequence.length) {
    const additionalColors = generateFixedColorSequence(1000);
    colorSequence = colorSequence.concat(additionalColors.slice(1));
  }
  
  // ボード全体にシフトアニメーションを追加
  board.classList.add('shifting');
  
  // 全マスの色を更新（順次アニメーション付き）
  updateAllSquareColors();
  
  // コマの初期位置を設定（現在位置に基づいて動的計算）
  const pieceDisplayIndex = currentPosition - displayOffset;
  const pieceSquare = boardSquares[pieceDisplayIndex];
  
  if (pieceSquare) {
    const container = document.getElementById('sugoroku-container');
    const containerRect = container.getBoundingClientRect();
    const squareRect = pieceSquare.getBoundingClientRect();
    
    // コンテナ相対でのコマの中央位置
    const newLeft = (squareRect.left - containerRect.left) + (squareRect.width / 2);
    piece.style.left = newLeft + 'px';
  } else {
    // フォールバック：最初のマスの中央位置
    const centerPosition = calculateCenterPosition();
    piece.style.left = centerPosition + 'px';
  }
  
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

// 固定盤面用のノーツパターン定義は削除（FIXED_BOARD_SEQUENCEに統合）

// movePiece関数を上書きして固定パターン＋ゴール機能を使用
function movePiece(steps) {
  const piece = document.getElementById('piece');
  let moveCount = 0;
  const goalPosition = FIXED_BOARD_SEQUENCE.length - 1; // ゴールの位置（配列の最後）
  let isReversing = false; // 折り返し中かどうかのフラグ
  
  const moveInterval = setInterval(() => {
    if (moveCount >= steps) {
      clearInterval(moveInterval);
      
      // ゴール判定
      if (currentPosition === goalPosition) {
        // ゴール到達！
        updateSectionBackground('white');
        showPatternRoulette('GOAL REACHED!', () => {
          console.log('ゲームクリア！');
          // ゴール時の処理をここに追加可能
        });
        return;
      }
      
      // 移動完了後に色をシフトして、コマを最初の位置に戻す
      setTimeout(() => {
        shiftColorsAndResetPiece();
        
        // 移動完了後にマスの色に応じてノーツを流す（固定パターン使用）
        setTimeout(() => {
          const boardData = getFixedBoardData(currentPosition);
          
          if (boardData && boardData.color) {
            // 固定パターンを使用
            switch(boardData.color) {
              case 'red':
                // 赤マス：加速ノーツ（固定パターン）
                updateSectionBackground('red');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGameA, ...boardData.params);
                });
                break;
                
              case 'blue':
                // 青マス：ランダム間隔ノーツ（固定パターン）
                updateSectionBackground('blue');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGameR, ...boardData.params);
                });
                break;
                
              case 'green':
                // 緑マス：段階的速度変化ノーツ（固定パターン）
                updateSectionBackground('green');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGameT2, ...boardData.params);
                });
                break;
                
              case 'purple':
                // 紫マス：確率的爆弾ノーツ（固定パターン）
                updateSectionBackground('purple');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGameP, ...boardData.params);
                });
                break;
                
              case 'yellow':
                // 黄マス：特殊処理
                updateSectionBackground('yellow');
                
                // 特殊処理を実行
                if (boardData.specialActions) {
                  executeYellowSquareSpecialAction(boardData.specialActions);
                } else {
                  // フォールバック（特殊処理が定義されていない場合）
                  showPatternRoulette(boardData.desc, () => {
                    setTimeout(() => {
                      enableDiceSection();
                    }, 3000);
                  });
                }
                return; // 通常の処理をスキップ
                
              case 'black':
                // 黒マス：等間隔ノーツ（固定パターン）
                updateSectionBackground('black');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGame, ...boardData.params);
                });
                break;
                
              case 'white':
                // 白マス：等間隔ノーツ（固定パターン）
                updateSectionBackground('white');
                showPatternRoulette(boardData.desc, () => {
                  startGameCountdown(startGame, ...boardData.params);
                });
                break;
            }
          }
        }, 500);
      }, 300);
      
      return;
    }
    
    // 次の位置を計算（折り返し処理を含む）
    let nextPosition;
    
    if (isReversing) {
      // 折り返し中は後退
      nextPosition = currentPosition - 1;
      // 0まで戻ったら前進に戻る（通常はここまで来ない）
      if (nextPosition < 0) {
        nextPosition = 0;
        isReversing = false;
      }
    } else {
      // 通常の前進
      nextPosition = currentPosition + 1;
      
      // ゴールを超えた場合、折り返しモードに入る
      if (nextPosition > goalPosition) {
        nextPosition = goalPosition - 1; // ゴールの1つ前に戻る
        isReversing = true; // 折り返しモードを有効にする
      }
    }
    
    currentPosition = nextPosition;
    moveCount++;
    
    // コマに移動アニメーションクラスを追加
    piece.classList.add('moving');
    
    // 表示位置を計算（現在の表示オフセットに基づく）
    const pieceDisplayIndex = currentPosition - displayOffset;
    
    // 表示範囲内の場合のみコマを移動
    if (pieceDisplayIndex >= 0 && pieceDisplayIndex < TOTAL_SQUARES) {
      const targetSquare = boardSquares[pieceDisplayIndex];
      
      if (targetSquare) {
        const container = document.getElementById('sugoroku-container');
        const containerRect = container.getBoundingClientRect();
        const squareRect = targetSquare.getBoundingClientRect();
        
        // コンテナ相対での目標マスの中央位置
        const newLeft = (squareRect.left - containerRect.left) + (squareRect.width / 2);
        piece.style.left = newLeft + 'px';
      }
    }
    
    // アニメーション完了後にクラスを除去
    setTimeout(() => {
      piece.classList.remove('moving');
    }, 500);
    
  }, 600); // 600msごとに1マス進む
}

// 黄色マスの特殊処理を実行する関数
async function executeYellowSquareSpecialAction(specialActions) {
  if (!specialActions || specialActions.length === 0) {
    console.log('特殊処理が定義されていません');
    return;
  }
  
  // ランダムに1つの特殊処理を選択
  const randomIndex = Math.floor(Math.random() * specialActions.length);
  const selectedAction = specialActions[randomIndex];
  
  console.log(`特殊処理実行: ${selectedAction.desc}`);
  
  // 特殊処理の種類に応じて実行
  switch (selectedAction.type) {
    case 'diceMultiply':
      await executeDiceMultiplySpecial();
      break;
    case 'fiveNotesLoop':
      await executeFiveNotesLoopSpecial();
      break;
    case 'tenNotesFixed':
      await executeTenNotesFixedSpecial();
      break;
    case 'doubleDiceMultiply':
      await executeDoubleDiceMultiplySpecial();
      break;
    case 'luckyDraw':
      await executeLuckyDrawSpecial();
      break;
    default:
      console.log(`未知の特殊処理: ${selectedAction.type}`);
      break;
  }
}

// サイコロ×20個ノーツの特殊処理
async function executeDiceMultiplySpecial() {
  // サイコロを振る
  const diceValue = Math.floor(Math.random() * 6) + 1;
  
  // サイコロ演出
  await showDiceAnimation(diceValue);
  
  // ノーツ数を計算（サイコロ×20）
  const notesCount = diceValue * 20;
  
  console.log(`サイコロ: ${diceValue}, ノーツ数: ${notesCount}`);
  
  // 特殊ノーツ流し処理を実行
  await executeSpecialNotesFlow(notesCount, `サイコロ${diceValue}×20 = ${notesCount}個ノーツ`);
  
  // 処理完了後、再度サイコロを振って進む
  await continueGameAfterSpecial();
}

// 5個ノーツ→1が出るまで継続の特殊処理
async function executeFiveNotesLoopSpecial() {
  let loopCount = 0;
  let diceValue;
  
  do {
    loopCount++;
    
    // 5個ノーツを流す
    await executeSpecialNotesFlow(5, `${loopCount}回目: 5個ノーツ`);
    
    // サイコロを振る
    diceValue = Math.floor(Math.random() * 6) + 1;
    await showDiceAnimation(diceValue);
    
    console.log(`${loopCount}回目: サイコロ${diceValue}`);
    
  } while (diceValue !== 1);
  
  console.log(`${loopCount}回で1が出ました！`);
  
  // 処理完了後、再度サイコロを振って進む
  await continueGameAfterSpecial();
}

// 固定10個ノーツの特殊処理
async function executeTenNotesFixedSpecial() {
  console.log('固定10個ノーツ処理を実行');
  
  // 固定で10個ノーツを流す
  await executeSpecialNotesFlow(10, '固定10個ノーツ');
  
  // 処理完了後、再度サイコロを振って進む
  await continueGameAfterSpecial();
}

// サイコロ2回×10個ノーツの特殊処理
async function executeDoubleDiceMultiplySpecial() {
  let totalNotes = 0;
  
  // 1回目のサイコロ
  const diceValue1 = Math.floor(Math.random() * 6) + 1;
  await showDiceAnimation(diceValue1);
  
  // 2回目のサイコロ
  const diceValue2 = Math.floor(Math.random() * 6) + 1;
  await showDiceAnimation(diceValue2);
  
  // ノーツ数を計算（サイコロ2回の合計×10）
  totalNotes = (diceValue1 + diceValue2) * 10;
  
  console.log(`サイコロ1: ${diceValue1}, サイコロ2: ${diceValue2}, 合計: ${diceValue1 + diceValue2}, ノーツ数: ${totalNotes}`);
  
  // 特殊ノーツ流し処理を実行
  await executeSpecialNotesFlow(totalNotes, `サイコロ${diceValue1}+${diceValue2}×10 = ${totalNotes}個ノーツ`);
  
  // 処理完了後、再度サイコロを振って進む
  await continueGameAfterSpecial();
}

// ラッキードローの特殊処理
async function executeLuckyDrawSpecial() {
  // ラッキードロー抽選
  const luckyNumber = Math.floor(Math.random() * 100) + 1; // 1-100
  let notesCount;
  let description;
  
  if (luckyNumber <= 10) {
    // 10%の確率で大当たり
    notesCount = 100;
    description = `大当たり！${notesCount}個ノーツ`;
  } else if (luckyNumber <= 30) {
    // 20%の確率で中当たり
    notesCount = 50;
    description = `中当たり！${notesCount}個ノーツ`;
  } else if (luckyNumber <= 60) {
    // 30%の確率で小当たり
    notesCount = 20;
    description = `小当たり！${notesCount}個ノーツ`;
  } else {
    // 40%の確率でハズレ
    notesCount = 5;
    description = `ハズレ...${notesCount}個ノーツ`;
  }
  
  console.log(`ラッキードロー結果: ${luckyNumber}/100 - ${description}`);
  
  // 抽選演出
  updateCurrentColorDisplay('yellow', 'ラッキードロー抽選中...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 特殊ノーツ流し処理を実行
  await executeSpecialNotesFlow(notesCount, description);
  
  // 処理完了後、再度サイコロを振って進む
  await continueGameAfterSpecial();
}

console.log('固定盤面モード（固定パターン）が読み込まれました');
