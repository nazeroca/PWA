function selectRandomColor() {
  // 色の重みを設定（任意の数字に対応可能）
  const colorWeights = {
    white: 10,
    black: 2,
    red: 5,
    blue: 5,
    green: 5,
    purple: 4,
    yellow: 5
  };
  
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
