// しきい値管理ファイル

// グローバルしきい値設定
let thresholdSettings = {
  early: 35,
  mid: 70,
  high: 105
};

// しきい値を取得する関数
function getThresholds() {
  return { ...thresholdSettings };
}

// しきい値を設定する関数
function setThresholds(early, mid, high) {
  thresholdSettings.early = early;
  thresholdSettings.mid = mid;
  thresholdSettings.high = high;
  
  // 光る線を更新
  updateGlowingLines();
}

// 光る線を動的に生成・更新する関数
function updateGlowingLines() {
  const container = document.getElementById('sugoroku-container');
  if (!container) return;
  
  // 既存の光る線を削除
  const existingLines = container.querySelectorAll('.glowing-line');
  existingLines.forEach(line => line.remove());
  
  // 新しい光る線を生成
  const thresholds = getThresholds();
  const positions = [thresholds.early, thresholds.mid, thresholds.high];
  
  positions.forEach(pos => {
    const glowingLine = document.createElement('div');
    glowingLine.className = 'glowing-line';
    glowingLine.id = `glowing-line-${pos}`;
    container.appendChild(glowingLine);
  });
}

// しきい値設定画面の表示/非表示
function showThresholdSettings() {
  const thresholdSettings = document.getElementById('threshold-settings');
  const gameContainer = document.getElementById('game-container');
  
  if (thresholdSettings) {
    thresholdSettings.style.display = 'flex';
  }
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }
}

function hideThresholdSettings() {
  const thresholdSettings = document.getElementById('threshold-settings');
  const gameContainer = document.getElementById('game-container');
  
  if (thresholdSettings && gameContainer) {
    thresholdSettings.style.display = 'none';
    gameContainer.style.display = 'block';
  }
}

// バリデーション関数
function validateThresholds(early, mid, high) {
  return early < mid && mid < high;
}

// エラー表示/非表示
function showThresholdError() {
  const errorElement = document.getElementById('threshold-error');
  if (errorElement) {
    errorElement.style.display = 'block';
  }
}

function hideThresholdError() {
  const errorElement = document.getElementById('threshold-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// スライダー値の更新
function updateSliderValues() {
  const earlySlider = document.getElementById('early-slider');
  const midSlider = document.getElementById('mid-slider');
  const highSlider = document.getElementById('high-slider');
  
  const earlyValue = document.getElementById('early-value');
  const midValue = document.getElementById('mid-value');
  const highValue = document.getElementById('high-value');
  
  if (earlySlider && earlyValue) {
    earlyValue.textContent = earlySlider.value;
  }
  if (midSlider && midValue) {
    midValue.textContent = midSlider.value;
  }
  if (highSlider && highValue) {
    highValue.textContent = highSlider.value;
  }
  
  // リアルタイムバリデーション
  const early = parseInt(earlySlider?.value || 35);
  const mid = parseInt(midSlider?.value || 70);
  const high = parseInt(highSlider?.value || 105);
  
  if (validateThresholds(early, mid, high)) {
    hideThresholdError();
    enableOkButton();
  } else {
    showThresholdError();
    disableOkButton();
  }
}

// OKボタンの有効/無効
function enableOkButton() {
  const okButton = document.getElementById('threshold-ok');
  if (okButton) {
    okButton.disabled = false;
  }
}

function disableOkButton() {
  const okButton = document.getElementById('threshold-ok');
  if (okButton) {
    okButton.disabled = true;
  }
}


// 設定確定処理
function confirmThresholds() {
  const earlySlider = document.getElementById('early-slider');
  const midSlider = document.getElementById('mid-slider');
  const highSlider = document.getElementById('high-slider');
  
  const early = parseInt(earlySlider?.value || 35);
  const mid = parseInt(midSlider?.value || 70);
  const high = parseInt(highSlider?.value || 105);
  
  if (validateThresholds(early, mid, high)) {
    setThresholds(early, mid, high);
    hideThresholdSettings();
    
    // ゲーム初期化を実行
    if (typeof initializeGameAfterDifficulty === 'function') {
      initializeGameAfterDifficulty();
    }
  }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
  // スライダーイベント
  const earlySlider = document.getElementById('early-slider');
  const midSlider = document.getElementById('mid-slider');
  const highSlider = document.getElementById('high-slider');
  
  if (earlySlider) {
    earlySlider.addEventListener('input', updateSliderValues);
  }
  if (midSlider) {
    midSlider.addEventListener('input', updateSliderValues);
  }
  if (highSlider) {
    highSlider.addEventListener('input', updateSliderValues);
  }
  
  // ボタンイベント
  const okButton = document.getElementById('threshold-ok');
  
  if (okButton) {
    okButton.addEventListener('click', confirmThresholds);
  }
  
  // 初期値設定
  updateSliderValues();
  
  // 初期光る線を生成
  setTimeout(() => {
    updateGlowingLines();
  }, 100);
});
