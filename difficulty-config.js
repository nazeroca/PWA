// 難易度設定管理ファイル
let currentDifficulty = 'NORMAL'; // デフォルト難易度

// 難易度別の色選択重みづけ
const difficultyColorWeights = {
  NORMAL: {
    early: { white: 20, black: 0, red: 5, blue: 5, green: 5, purple: 10, yellow: 5 },
    mid: { white: 10, black: 2, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 },
    high: { white: 8, black: 4, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 },
    max: { white: 5, black: 7, red: 5, blue: 5, green: 5, purple: 5, yellow: 5 }
  }
};

// 難易度別のバグ定義
const difficultyBugs = {
  NORMAL: {
    // NORMAL用のバグ（既存のBUGSオブジェクトから移動）
    normalBug: {
      description: '白マス停止時に1秒10回',
      triggerCondition: (color, diceResult) => color === 'white',
      effect: {
        speed: 1000,
        count: 10,
        type: 'normal'
      }
    },
    mutationBug: {
      description: '紫マス停止時に1秒30個',
      triggerCondition: (color, diceResult) => color === 'purple',
      effect: {
        speed: 1000,
        count: 30,
        type: 'normal'
      }
    },
    independentBug: {
      description: 'SPACE素数で1.7秒17個',
      triggerCondition: (color, diceResult) => {
        // 現在の位置が素数かチェック
        return isPrime(currentPosition);
      },
      effect: {
        speed: 1700,
        count: 17,
        type: 'normal'
      }
    },
    loadBug: {
      description: 'HITS+35回で2秒20個',
      triggerCondition: (color, diceResult) => {
        // 前回から35以上HITSが増加したかチェック
        const currentHitCount = (typeof hitCount !== 'undefined') ? hitCount : 0;
        const increase = currentHitCount - lastHitCount;
        return increase >= 35;
      },
      effect: {
        speed: 2000,
        count: 20,
        type: 'normal'
      }
    },
    unluckyBug: {
      description: '1の目で0.7秒15個',
      triggerCondition: (color, diceResult) => diceResult === 1,
      effect: {
        speed: 700,
        count: 15,
        type: 'normal'
      }
    }
  }
};

// 難易度別のパターン配列
const difficultyPatterns = {
  NORMAL: {
    // NORMALの配列は既存のBoard.jsのパターンを参照
    // 実際の値は後でBoard.jsから移動する予定
    white: [
      { params: [4000, 25], desc: "4.0s in 25X" },
      { params: [4000, 15], desc: "4.0s in 15X" },
      { params: [3500, 20], desc: "3.5s in 20X" },
      { params: [3000, 20], desc: "3.0s in 20X" },
      { params: [2500, 20], desc: "2.5s in 20X" },
      { params: [2000, 15], desc: "2.0s in 15X" },
      { params: [1000, 10], desc: "1.0s in 10X" }
    
    ], // 既存のwhitePatternsを使用する印
    whitePatterns35: [
      { params: [10000, 10], desc: "10.0s in 10X" },
      { params: [2500, 27], desc: "2.5s in 27X" },
      { params: [2000, 25], desc: "2.0s in 25X" },
      { params: [3000, 30], desc: "3.0s in 30X" }
    ],
    whitePatterns70: [
      { params: [1500, 30], desc: "1.5s in 30X" },
      { params: [1000, 20], desc: "1.0s in 20X" },
      { params: [800, 15], desc: "0.8s in 15X" }
    ], 
    whitePatterns105: [
      { params: [1500, 40], desc: "1.5s in 40X" },
      { params: [1000, 30], desc: "1.0s in 30X" },
      { params: [700, 20], desc: "0.7s in 20X" }
    ],
    red: [
      { params: [3000, 1000, 2.5, 20, 0], desc: "3.0s ⇒ 1.0s20X" },
      { params: [4000, 1000, 2, 25, 0], desc: "4.0s ⇒ 1.0s25X" },
      { params: [5000, 1000, 1.8, 30, 0], desc: "5.0s ⇒ 1.0s30X" },
      { params: [4000, 500, 1.3, 30, 0], desc: "4.0s ⇒ 0.5s30X" },
      { params: [500, 4000, 0.8, 35, 0], desc: "0.5s ⇒ 4.0s20X" },
      { params: [1000, 5000, 0.6, 25, 0], desc: "1.0s ⇒ 5.0s25X" },
      { params: [4000, 1500, 2, 20, 10], desc: "4.0s ⇒ 1.5s20X＋10X" } 
    ],
    redPatterns35: [
      { params: [2000, 500, 1.2, 25, 0], desc: "2.0s ⇒ 0.5s25X" },
      { params: [4000, 500, 2.2, 28, 0], desc: "4.0s ⇒ 0.5s28X" },
      { params: [4000, 1000, 1, 25, 15], desc: "4.0s ⇒ 1.0s25X＋15X" }
      ],
    redPatterns70: [
      { params: [1000, 4000, 0.3, 30, 0], desc: "1.0s ⇒ 4.0s30X" },
   { params: [4000, 700, 2.5, 25, 10], desc: "3.0s ⇒ 0.7s25X＋10X" },
    { params: [3500, 1500, 2, 25, 20], desc: "3.5s ⇒ 1.5s25X＋20X" }
   ],
    redPatterns105: [
      { params: [4000, 800, 3, 25, 10], desc: "4.0s ⇒ 0.8s25X＋10X" },
      { params: [2000, 800, 2, 20, 15], desc: "2.0s ⇒ 0.8s20X＋15X" },
    { params: [4000, 1000, 4, 30, 20], desc: "4.0s ⇒ 1.0s30X＋20X" }
    ],
    blue: [
      { params: [500, 2500, 20, 1], desc: "0.5s ～ 2.5s20X" },
      { params: [500, 3500, 25, 1], desc: "0.5s ～ 3.0s25X" },
      { params: [500, 4000, 30, 1], desc: "0.5s ～ 4.0s30X" },
      { params: [1000, 5000, 30, 2], desc: "1.0s ＞ 5.0s30X" },
      { params: [1000, 4000, 25, 2], desc: "1.0s ＞ 4.0s25X" },
      { params: [1000, 3000, 20, 2], desc: "1.0s ＞ 3.0s20X" },
    ],
    bluePatterns35: [
      { params: [500, 1000, 10, 1], desc: "0.5s ～ 1.0s10X" },
      { params: [500, 5000, 30, 2], desc: "0.5s ＞ 5.0s30X" },
      { params: [500, 4000, 27, 2], desc: "0.5s ＞ 4.0s27X" }
    ],
    bluePatterns70: [
      { params: [500, 2000, 20, 1], desc: "0.5s ～ 2.0s20X" },
      { params: [500, 3000, 20, 2], desc: "0.5s ＞ 3.0s20X" },
      { params: [500, 2000, 15, 2], desc: "0.5s ＞ 2.0s15X" }
    
    ],
    bluePatterns105: [
      { params: [500, 4000, 40, 1], desc: "0.5s ～ 3.0s40X" },
      { params: [1000, 5000, 30, 2], desc: "0.5s ＞ 3.0s30X" },
      { params: [500, 1500, 25, 1], desc: "0.5s ～ 1.5s25X" },
    ],
    green: [
      { params: [4000, 2000, 5, 10, 2], desc: "4.0s5X ⇔ 2.0s10X ×3" },
      { params: [2500, 1000, 6, 2, 4], desc: "2.5s6X ⇔ 1.0s2X ×4" },
      { params: [4000, 1000, 3, 7, 5], desc: "4.0s3X ⇔ 1.0s7X ×5" },
      { params: [5000, 2000, 2, 8, 6], desc: "5.0s2X ⇔ 2.0s8X ×6" },
      { params: [2500, 5000, 5, 1, 5], desc: "2.5s6X ⇔ 5.0sBreak ×5" },
      { params: [1000, 7000, 7, 1, 3], desc: "1.0s8X ⇔ 7.0sBreak ×3" },
      { params: [2000, 10000, 19, 1, 2], desc: "2.0s20X ⇔ 10.0sBreak ×2" }
    ],
    greenPatterns35: [
      { params: [4000, 1200, 3, 10, 6], desc: "4.0s3X ⇔ 1.2s10X ×6" },
      { params: [1000, 3000, 6, 1, 7], desc: "1.0s7X ⇔ 3.0sBreak ×7" },
      { params: [2000, 1500, 5, 5, 3], desc: "2s5X ⇔ 1.5s5X ×4" }
    ],
    greenPatterns70: [
      { params: [700, 3000, 6, 1, 10], desc: "0.7s7X ⇔ 3.0sBreak ×10" },
      { params: [2000, 1000, 6, 4, 6], desc: "2.0s6X ⇔ 1.0s4X ×6" },
      { params: [3000, 700, 2, 2, 10], desc: "3.0s2X ⇔ 0.7s2X ×10" }
    ],
    greenPatterns105: [
      { params: [3000, 700, 5, 10, 4], desc: "3.0s5X ⇔ 0.7s10X ×4" },
      { params: [1000, 15000, 34, 1, 2], desc: "1.0s35X ⇔ 15.0sBreak ×2" },
      { params: [700, 2000, 2, 1, 15], desc: "0.7s3X ⇔ 2.0sBreak ×15" }
    ],
    yellow: [
      { params: [1000, 1, 0.3, 2000, 45], desc: "30% 2.0s45X" },
      { params: [1000, 1, 0.05, 500, 50], desc: "5% 0.5s50X" },
      { params: [3000, 20, 0.05, 500, 10], desc: "3.0s20X || 5%0.5s10X" },
      { params: [3000, 20, 0.2, 1000, 5], desc: "3.0s20X || 20%1.0s5X" },
      { params: [4000, 15, 0.5, 2000, 3], desc: "4.0s15X || 50%2.0s3X" },
      { params: [4000, 20, 0.1, 1000, 5], desc: "4.0s20X || 10%1.0s5X" },
      { params: [4000, 25, 0.05, 1000, 15], desc: "4.0s25X || 5%1.0s15X" },
      { params: [1800, 40, 0.05, 7000, 1], desc: "1.8s40X || 5%7.0sBreak" },
    ],
    yellowPatterns35: [
      { params: [2000, 12, 0.1, 1000, 5], desc: "2.0s12X || 10%1.0s5X" },
      { params: [1000, 1, 0.2, 700, 30], desc: "20% 0.7s 30X" },
      { params: [700, 30, 0.05, 7000, 1], desc: "0.7s30X || 5%7.0sBreak" }
    ],
    yellowPatterns70: [
      { params: [3000, 15, 0.04, 1000, 30], desc: "3.0s15X || 4%1.0s30X" },
      { params: [1000, 1, 0.7, 1000, 40], desc: "70% 1.0s30X" },
      { params: [1200, 70, 0.05, 10000, 1], desc: "1.2s70X || 5%10.0sBreak" }
    ],
    yellowPatterns105:[
      { params: [1000, 1, 0.5, 1500, 60], desc: "50% 1.5s60X" },
      { params: [5000, 4, 0.75, 1200, 20], desc: "5.0s4X || 75%1.2s20X" },
      { params: [700, 50, 0.3, 3000, 1], desc: "0.7s50X || 30%3.0sBreak" }
    ],
    black:  [
      { params: [1200, 50], desc: "1.2s in 50X" },
      { params: [10000, 1], desc: "RELIEF" }
    ],
    blackPatterns35: [
      { params: [1000, 50], desc: "1.0s in 50X" }
    ],
    blackPatterns70: [
      { params: [750, 50], desc: "0.75s in 50X" }
    ],
    blackPatterns105: [
      { params: [500, 50], desc: "0.5s in 50X" }
    ]
  }
};

// 難易度を設定する関数
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  console.log(`難易度を${difficulty}に設定しました`);
}

// 現在の難易度を取得する関数
function getCurrentDifficulty() {
  return currentDifficulty;
}

// 難易度別の色選択関数（しきい値対応版）
function selectRandomColorByDifficulty(position = 0) {
  const weights = difficultyColorWeights[currentDifficulty];
  const thresholds = getThresholds();
  let colorWeights;
  
  if (position < thresholds.early) {
    colorWeights = weights.early;
  } else if (position < thresholds.mid) {
    colorWeights = weights.mid;
  } else if (position < thresholds.high) {
    colorWeights = weights.high;
  } else {
    colorWeights = weights.max;
  }
  
  return selectWeightedRandom(colorWeights);
}

// 難易度別のバグ取得関数
function getBugsByDifficulty() {
  return difficultyBugs[currentDifficulty];
}

// 難易度別のパターン取得関数
function getPatternsByDifficulty() {
  return difficultyPatterns[currentDifficulty];
}
