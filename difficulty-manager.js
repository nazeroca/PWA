// 難易度選択管理ファイル

// 難易度選択画面の表示/非表示を管理
function showDifficultySelection() {
  const difficultySelection = document.getElementById('difficulty-selection');
  const gameContainer = document.getElementById('game-container');
  
  if (difficultySelection && gameContainer) {
    difficultySelection.style.display = 'flex';
    gameContainer.style.display = 'none';
  }
}

function hideDifficultySelection() {
  const difficultySelection = document.getElementById('difficulty-selection');
  const gameContainer = document.getElementById('game-container');
  
  if (difficultySelection && gameContainer) {
    difficultySelection.style.display = 'none';
    gameContainer.style.display = 'block';
  }
}

// 難易度選択の処理
function selectDifficulty(difficulty) {
  console.log(`難易度 ${difficulty} が選択されました`);
  
  // 難易度を設定
  setDifficulty(difficulty);
  
  // 難易度に応じた設定を適用
  applyDifficultySettings(difficulty);
  
  // 難易度選択画面を非表示にして、しきい値設定画面を表示
  showThresholdSettings();
}

// 難易度に応じた設定を適用
function applyDifficultySettings(difficulty) {
  // 現在のパターン配列を難易度別のものに置き換え
  const patterns = getPatternsByDifficulty();
  
  // 既存のパターン配列を難易度別のものに置き換え
  if (typeof window !== 'undefined') {
    // グローバルなパターン配列を難易度別のものに設定
    // 実際の実装では、各色のパターン配列を適切に設定する
  }
}

// ゲームの初期化処理
function initializeGame() {
  // 既存の初期化処理を実行
  if (typeof initializeGameAfterDifficulty === 'function') {
    initializeGameAfterDifficulty();
  }
}

// 初期化時の設定
document.addEventListener('DOMContentLoaded', function() {
  // デフォルトでNORMAL難易度を設定してしきい値設定画面を表示
  setDifficulty('NORMAL');
  applyDifficultySettings('NORMAL');
  showThresholdSettings();
});
