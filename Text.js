// テキスト表示関数
function showSection4Text(type, duration = 1500) {
  if (!section4Text) return;
  
  // 試練モード中でfinishの場合は表示しない
  if (type === 'finish' && isChallengeMode) {

    return;
  }
  
  // 既存のクラスを削除
  section4Text.classList.remove('visible', 'finish', 'stop', 'skip');
  section4Text.textContent = '';
  
  // テキストとクラスを設定
  switch (type) {
    case 'finish':
      section4Text.textContent = 'FINISH';
      section4Text.classList.add('finish');
      break;
    case 'stop':
      section4Text.textContent = 'STOP';
      section4Text.classList.add('stop');
      break;
    case 'skip':
      section4Text.textContent = 'SKIP';
      section4Text.classList.add('skip');
      break;
    default:
      return;
  }
  
  // 表示
  section4Text.classList.add('visible');
  
  // 指定時間後に非表示（skipの場合はアニメーション終了後自動非表示）
  if (type !== 'skip') {
    setTimeout(() => {
      section4Text.classList.remove('visible');
    }, duration);
  } else {
    // skipアニメーションは1.5秒で終了
    setTimeout(() => {
      section4Text.classList.remove('visible');
    }, 1400);
  }
}

// テキストを隠す関数
function hideSection4Text() {
  if (section4Text) {
    section4Text.classList.remove('visible');
  }
}

// イベント発生メッセージを表示する関数
function showEventMessage() {
  // ランダムで4つのイベントから選択（停止ボタン、スキップボタン、数字予測ボタン、バグ削除）
  const eventType = Math.floor(getSecureRandom() * 4);
  
  switch(eventType) {
    case 0:
      // 停止ボタンのインジケーターを1つ増加
      addIndicator('control-matrix');

      break;
    case 1:
      // スキップボタンのインジケーターを1つ増加
      addIndicator('skip-button');

      break;
    case 2:
      // 数字予測ボタンのインジケーターを1つ増加
      addIndicator('number-predict-button');

      break;
    case 3:
      // バグ削除
      purgeBug();

      break;
  }
}


