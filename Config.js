function selectRandomColor(position = 0) {
  // 位置に応じた色の重みを設定
  let colorWeights;
  
  if (position < 35) {
    // 初期段階（位置0-34）- 基本的な重みづけ
    colorWeights = {
      white: 12,
      black: 0,
      red: 5,
      blue: 5,
      green: 5,
      purple: 7,
      yellow: 5
    };
  } else if (position < 70) {
    // 中級段階（位置35-69）- 色付きマスが増加、黒マス出現率上昇
    colorWeights = {
      white: 10,
      black: 2,
      red: 5,
      blue: 5,
      green: 5,
      purple: 5,
      yellow: 5
    };
  } else if (position < 105) {
    // 上級段階（位置70-104）- さらに色付きマス増加
    colorWeights = {
      white: 8,
      black: 4,
      red: 5,
      blue: 5,
      green: 5,
      purple: 5,
      yellow: 5
    };
  } else {
    // 最高難易度（位置105以降）- 色付きマス中心、黒マス最高
    colorWeights = {
      white: 5,
      black: 7,
      red: 5,
      blue: 5,
      green: 5,
      purple: 5,
      yellow: 5
    };
  }
  
  // 重みづけされた抽選を行う
  return selectWeightedRandom(colorWeights);
}


// イベントマスシーケンスを生成する関数
function generateEventSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    // 10分の1の確率でイベントマス
    sequence.push(getSecureRandom() < 0.1);
  }
  return sequence;
}

// // テスト用: 120までのマスの色を確認する関数
// function testColorDistribution() {
//   console.log("=== 120までのマスの色分布テスト ===");
//   console.log("位置0は常にnull（スタートマス）");
//   console.log("");

//   // 各段階の統計を取るための変数
//   const stages = [
//     { name: "初期段階(1-34)", start: 1, end: 34, colors: {} },
//     { name: "中級段階(35-69)", start: 35, end: 69, colors: {} },
//     { name: "上級段階(70-104)", start: 70, end: 104, colors: {} },
//     { name: "最高難易度(105-120)", start: 105, end: 120, colors: {} }
//   ];

//   // 色の初期化
//   const allColors = ['white', 'black', 'red', 'blue', 'green', 'purple', 'yellow'];
//   stages.forEach(stage => {
//     allColors.forEach(color => {
//       stage.colors[color] = 0;
//     });
//   });

//   // 120個のマスの色を生成してログ出力
//   for (let i = 0; i <= 120; i++) {
//     let color;
//     if (i === 0) {
//       color = null; // スタートマス
//       console.log(`位置 ${i.toString().padStart(3)}: null (スタートマス)`);
//     } else {
//       color = selectRandomColor(i);
//       console.log(`位置 ${i.toString().padStart(3)}: ${color}`);
      
//       // 統計に追加
//       stages.forEach(stage => {
//         if (i >= stage.start && i <= stage.end) {
//           stage.colors[color]++;
//         }
//       });
//     }
//   }

//   console.log("\n=== 各段階の色分布統計 ===");
//   stages.forEach(stage => {
//     console.log(`\n${stage.name}:`);
//     const total = stage.end - stage.start + 1;
//     allColors.forEach(color => {
//       const count = stage.colors[color];
//       const percentage = ((count / total) * 100).toFixed(1);
//       console.log(`  ${color.padEnd(6)}: ${count.toString().padStart(2)}個 (${percentage}%)`);
//     });
//   });

//   console.log("\n=== 重みづけ設定確認 ===");
//   [10, 40, 80, 110].forEach(pos => {
//     console.log(`\n位置${pos}での重みづけ:`);
    
//     let colorWeights;
//     if (pos < 35) {
//       colorWeights = { white: 12, black: 0, red: 5, blue: 5, green: 5, purple: 7, yellow: 5 };
//       console.log("  段階: 初期段階");
//     } else if (pos < 70) {
//       colorWeights = { white: 10, black: 2, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 };
//       console.log("  段階: 中級段階");
//     } else if (pos < 105) {
//       colorWeights = { white: 8, black: 4, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 };
//       console.log("  段階: 上級段階");
//     } else {
//       colorWeights = { white: 5, black: 8, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 };
//       console.log("  段階: 最高難易度");
//     }
    
//     const total = Object.values(colorWeights).reduce((sum, weight) => sum + weight, 0);
//     Object.entries(colorWeights).forEach(([color, weight]) => {
//       const percentage = ((weight / total) * 100).toFixed(1);
//       console.log(`  ${color.padEnd(6)}: 重み${weight} (${percentage}%)`);
//     });
//   });
// }

// // テスト関数を実行（コンソールで testColorDistribution() を呼び出してください）
