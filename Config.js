function selectRandomColor(position = 0) {
  // 難易度システムの色選択関数を使用
  return selectRandomColorByDifficulty(position);
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