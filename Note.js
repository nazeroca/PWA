// ノーツを生成する関数
function spawnCircle() {
  if (circleCount >= maxCircles) return;
  

    
  const circle = document.createElement('div');
  circle.classList.add('circle');
  circle.style.backgroundColor = circlecolor;

  gameArea.appendChild(circle);
  circles.push(circle);
  

  
  const startTime = performance.now();
  let pausedTime = 0; // 停止時間を追加
  let isPaused = false;
  let totalPausedDuration = 0; // 累積停止時間

  function animate(currentTime) {
    // 停止中の場合は時間を更新しない
    if (isNotesFrozen) {
      if (!isPaused) {
        pausedTime = currentTime;
        isPaused = true;
        circle.classList.add('frozen');
      }
      requestAnimationFrame(animate);
      return;
    } else if (isPaused) {
      // 再開時に停止時間を累積
      const pauseDuration = currentTime - pausedTime;
      totalPausedDuration += pauseDuration;
      isPaused = false;
      circle.classList.remove('frozen');
    }

    // 停止時間を除いた実際の経過時間を計算
    const elapsed = currentTime - startTime - totalPausedDuration;
    const progress = elapsed / fallDuration;
    
    if (progress < 1) {
      const startX = gameArea.clientWidth;
      const endX = -window.innerWidth * 0.133; // ノーツサイズ13.3vwに合わせて調整
      const posX = startX + (endX - startX) * progress;
      circle.style.left = posX + 'px';
      
      // 判定ライン（画面の20%の位置）
      const judgeX = gameArea.clientWidth * 0.2;
      const center = posX + (window.innerWidth * 0.0665); // ノーツサイズ13.3vwの半分
      
      // 判定ラインに到達したら音を鳴らして削除
      if (!circle.played && center <= judgeX) {
        
        // 音声ファイルの準備ができている場合のみ再生
        if (hitSound.readyState >= 2) { // HAVE_CURRENT_DATA以上
          hitSound.currentTime = 0;
          hitSound.play().then(() => {
            // 音声再生成功
          }).catch(error => {
            // 再初期化を試行
            initializeAudio();
          });
        } else {
          // 準備できていなくても音再生を試行
          hitSound.currentTime = 0;
          hitSound.play().catch(error => {
            // 音声再生エラーは無視
          });
        }
        circle.played = true;
        
        // ヒット数をカウント
        hitCount++;
        totalHitCount++; // 累計ヒット数も更新
        updateHitCounter();
        
        circle.remove();
        circles = circles.filter(c => c !== circle);
        return; // アニメーション終了
      }
      requestAnimationFrame(animate);
    } else {
      // ノーツが画面外に出た場合も削除
      circle.remove();
      circles = circles.filter(c => c !== circle);
    }
  }
  requestAnimationFrame(animate);
  circleCount++;
}



// ノーツ動作停止関数
function freezeNotes() {
  if (!isGameActive || isNotesFrozen) return;
  
  // インジケーターをチェックして消費
  if (!IndicatorManager.consumeIndicator('stop')) {

    return;
  }
  
  isNotesFrozen = true;
  
  // STOP表示
  showSection4Text('stop', stopDuration);
  
  // CONTROL MATRIXボタンを無効化
  const controlMatrix = document.getElementById('control-matrix');
  if (controlMatrix) {
    controlMatrix.classList.add('disabled');
  }
  

  
  // 既存のタイムアウトをクリア
  if (stopTimeout) {
    clearTimeout(stopTimeout);
  }
  
  // セクション4にカウントダウン表示を開始
  startStopCountdown(controlMatrix);
  
  // 10秒後にノーツの動きと生成を再開
  stopTimeout = setTimeout(() => {

    isNotesFrozen = false;
    
    // STOP表示を隠す
    hideSection4Text();
    
    // CONTROL MATRIXボタンを有効化（ゲームが実行中の場合のみ）
    if (controlMatrix && isGameActive) {
      controlMatrix.classList.remove('disabled');
    }
    

  }, stopDuration);
}


// ゲーム開始関数
function startGame(speed, count) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  // ゲーム開始時にサイコロを無効化
  if (typeof disableDiceButton === 'function') {
    disableDiceButton();
  }
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新



  // サイコロセクションを無効化
  disableDiceSection();

  // 指定された間隔でノーツを生成
  intervalId = setInterval(() => {
    if (!isGameActive || isNotesFrozen) {

      return; // 停止中またはゲーム非アクティブなら生成しない
    }
    

    spawnCircle();
    if (circleCount >= maxCircles) {
      clearInterval(intervalId);

    }
  }, speed);

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection(); // サイコロセクションを有効化
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 徐々に早くなるゲーム開始関数（色付きマス用）- startGames.jsと同じ引数仕様
function startGameA(speed1, speed2, type, count1, count2) {
  circleCount = 0;
  maxCircles = count1 + count2;
  circles = [];
  isGameActive = true;
  // ゲーム開始時にサイコロを無効化
  if (typeof disableDiceButton === 'function') {
    disableDiceButton();
  }
  let noteIndex = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();



  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;
      
      let delay;
      if (noteIndex <= count1) {
        // 加速期間：count1個のノーツで徐々に加速
        let t = noteIndex / count1;
        let factor = 1 - Math.pow((1 - t), type);
        delay = speed1 - (speed1 - speed2) * factor;
      } else {
        // 最終速度期間：残りのcount2個はspeed2で一定
        delay = speed2;
      }

      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      enableDiceSection();
      showSection4Text('finish'); // FINISH表示

    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 停止時のカウントダウン表示を開始する関数（停止ボタン上に表示）
function startStopCountdown(buttonElement) {
  if (!buttonElement) return;
  
  // カウントダウン要素を作成（停止ボタンの中央に表示）
  const countdownElement = document.createElement('div');
  countdownElement.className = 'stop-countdown';
  countdownElement.id = 'stop-countdown';
  countdownElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 6.86vh;
    font-weight: bold;
    color: #00FFFF;
    text-shadow: 0 0 2.86vh rgba(0, 255, 255, 0.8);
    z-index: 1000;
    pointer-events: none;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  buttonElement.appendChild(countdownElement);
  
  let countdown = 30;
  countdownElement.textContent = countdown;
  

  
  // 1秒ごとにカウントダウンを更新
  const stopCountdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownElement.textContent = countdown;
    } else {
      // カウントダウン完了
      clearInterval(stopCountdownInterval);
      countdownElement.remove();
    }
  }, 1000);
}

// ランダム間隔ノーツ流し関数（青マス用）- startGameRとstartGameR2を統合
function startGameR(speed1, speed2, count, type) {
  circleCount = 0;
  maxCircles = count;
  circles = [];
  isGameActive = true;
  // ゲーム開始時にサイコロを無効化
  if (typeof disableDiceButton === 'function') {
    disableDiceButton();
  }
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();




  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (circleCount < maxCircles) {
      spawnCircle();
      
      let delay;
      if (type === 1) {
        // startGameR: 均等分布ランダム
        delay = speed1 + getSecureRandom() * (speed2 - speed1);
      } else {
        // startGameR2: 重み付き分布ランダム
        const u = getSecureRandom();
        const factor = 1 - Math.sqrt(1 - u * u);
        delay = speed1 + factor * (speed2 - speed1);
      }
      
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 段階的速度変化ノーツ流し関数（緑マス用）- startGameT2ベース
function startGameT2(speed1, speed2, count1, count2, sets) {
  circleCount = 0;
  maxCircles = sets * (count1 + count2);
  circles = [];
  isGameActive = true;
  let noteIndex = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();



  function spawnNext() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnNext, 100);
      return;
    }
    
    if (noteIndex < maxCircles) {
      spawnCircle();
      noteIndex++;

      // セット内でのインデックスを計算
      const indexInSet = (noteIndex - 1) % (count1 + count2);
      let delay;
      if (indexInSet < count1) {
        delay = speed1;
      } else {
        delay = speed2;
      }
      
      setTimeout(spawnNext, delay);
    }
  }
  spawnNext();

  // 全てのノーツが処理されたかチェック
  const checkEnd = () => {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone && circleCount >= maxCircles) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  };
  
  setTimeout(checkEnd, 1000);
}

// 確率的爆弾ノーツ流し関数（紫マス用）- startGamePベース
function startGameP(speed1, count1, probability, speed2, count2) {
  circleCount = 0;
  maxCircles = 1000; // 最大値を設定（実際は動的に決まる）
  circles = [];
  isGameActive = true;
  let mainSpawned = 0;
  hitCount = 0; // ヒットカウンターをリセット
  isChallengeMode = false; // 通常のゲームモード
  updateHitCounter(); // 表示を更新

  // サイコロセクションを無効化
  disableDiceSection();




  function spawnMain() {
    if (!isGameActive) return;
    
    if (isNotesFrozen) {
      // 停止中はスポーン一時停止
      setTimeout(spawnMain, 100);
      return;
    }
    
    if (mainSpawned < count1) {
      // 確率的に爆弾グループを発生させる
      if (getSecureRandom() <= probability) {
        spawnExtraGroup(() => {
          mainSpawned++;
          setTimeout(spawnMain, speed1);
        });
        return;
      }
      
      spawnCircle();
      mainSpawned++;
      setTimeout(spawnMain, speed1);
    } else {
      // メインループ完了後、終了チェック開始
      setTimeout(checkEnd, 1000);
    }
  }

  function spawnExtraGroup(callbackExtra) {
    let extraSpawned = 0;
    function spawnExtraOne() {
      if (!isGameActive) return;
      
      if (isNotesFrozen) {
        // 停止中はスポーン一時停止
        setTimeout(spawnExtraOne, 100);
        return;
      }
      
      if (extraSpawned < count2) {
        spawnCircle();
        extraSpawned++;
        setTimeout(spawnExtraOne, speed2);
      } else {
        callbackExtra();
      }
    }
    spawnExtraOne();
  }

  function checkEnd() {
    const allGone = circles.every(c => {
      const left = parseInt(c.style.left || '9999', 10);
      return left <= -(window.innerWidth * 0.133); // ノーツサイズ13.3vwに合わせて調整
    });
    
    if (allGone) {
      isGameActive = false;
      if (!isChallengeMode) {  // 試練モードでない場合のみFINISHと青ダイスを表示
        enableDiceSection();
        showSection4Text('finish'); // FINISH表示
      }
    } else {
      setTimeout(checkEnd, 200);
    }
  }

  spawnMain();
}