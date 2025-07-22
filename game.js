// ツムツムゲームクラス
class TsumTsumGame {
    constructor() {
        console.log('TsumTsumGameクラスの初期化を開始...');
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            console.error('Canvas要素が見つかりません！');
            return;
        }
        
        console.log('Canvas要素を取得しました:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 6; // 6x6のグリッド
        this.cellSize = 90; // 各セルのサイズ
        this.padding = 30; // 外側の余白
        this.score = 0;
        this.timeLeft = 60;
        this.gameRunning = true;
        this.timerInterval = null;
        
        // ドラッグ状態の管理
        this.isDragging = false;
        this.connectedTsums = []; // つながっているツムの配列
        this.currentMousePos = { x: 0, y: 0 };
        
        // アニメーション管理
        this.animatingTsums = []; // アニメーション中のツム
        this.animationDuration = 500; // アニメーション時間（ミリ秒）
        this.isShuffleButtonAnimating = false; // シャッフルボタンアニメーション状態
        
        // コンボシステム
        this.combo = 0; // 現在のコンボ数
        this.lastClearTime = 0; // 最後にツムを消した時間
        this.comboTimeLimit = 1000; // コンボ継続の制限時間（1秒）
        this.maxCombo = 0; // 最大コンボ数（ゲーム終了時の計算用）
        
        // 落下システム
        this.tsumsClearedPositions = []; // 消去されたツムの位置記録
        this.fallingProcessed = false; // 落下処理完了フラグ
        
        // ツムの色パターン（5種類）
        this.tsumColors = [
            '#ff6b6b', // 赤
            '#4ecdc4', // 青緑
            '#45b7d1', // 青
            '#f9ca24', // 黄色
            '#f0932b'  // オレンジ
        ];
        
        // ゲーム盤面を初期化
        this.grid = [];
        this.initializeGrid();
        console.log('グリッド初期化完了:', this.grid);
        
        // イベントリスナーを設定
        this.setupEventListeners();
        console.log('イベントリスナー設定完了');
        
        // ゲームを開始
        console.log('ゲームループを開始します');
        this.startTimer();
        this.gameLoop();
    }
    
    // グリッドを初期化（ランダムなツムで埋める）
    initializeGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    color: this.tsumColors[Math.floor(Math.random() * this.tsumColors.length)],
                    selected: false,
                    opacity: 1.0,
                    isAnimating: false
                };
            }
        }
    }
    
    // キャンバスに描画
    draw() {
        // 背景をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッドを描画
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.drawTsum(row, col);
            }
        }
        
        // つながったツムの線を描画
        this.drawConnectionLines();
    }
    
    // つながったツムの線を描画
    drawConnectionLines() {
        if (this.connectedTsums.length < 2) return;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        // 最初のツムから開始
        const firstTsum = this.connectedTsums[0];
        const firstX = this.padding + firstTsum.col * this.cellSize + this.cellSize / 2;
        const firstY = this.padding + firstTsum.row * this.cellSize + this.cellSize / 2;
        this.ctx.moveTo(firstX, firstY);
        
        // 各ツムを線で結ぶ
        for (let i = 1; i < this.connectedTsums.length; i++) {
            const tsum = this.connectedTsums[i];
            const x = this.padding + tsum.col * this.cellSize + this.cellSize / 2;
            const y = this.padding + tsum.row * this.cellSize + this.cellSize / 2;
            this.ctx.lineTo(x, y);
        }
        
        // ドラッグ中なら現在のマウス位置まで線を引く
        if (this.isDragging) {
            this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);
        }
        
        this.ctx.stroke();
    }
    
    // 個別のツムを描画
    drawTsum(row, col) {
        const x = this.padding + col * this.cellSize + this.cellSize / 2;
        const y = this.padding + row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.35;
        
        const tsum = this.grid[row][col];
        
        // 透明度を設定
        this.ctx.globalAlpha = tsum.opacity;
        
        // ツムの円を描画
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = tsum.color;
        this.ctx.fill();
        
        // 選択されている場合は枠を描画
        if (tsum.selected) {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }
        
        // ツムに顔を描画（かわいらしく）
        this.drawTsumFace(x, y, radius * 0.6);
        
        // 透明度をリセット
        this.ctx.globalAlpha = 1.0;
    }
    
    // ツムの顔を描画
    drawTsumFace(x, y, size) {
        this.ctx.fillStyle = '#333';
        
        // 目
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 口
        this.ctx.beginPath();
        this.ctx.arc(x, y + size * 0.1, size * 0.3, 0, Math.PI);
        this.ctx.stroke();
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // マウスダウン（ドラッグ開始）
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const col = Math.floor((mouseX - this.padding) / this.cellSize);
            const row = Math.floor((mouseY - this.padding) / this.cellSize);
            
            if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                this.startDrag(row, col);
            }
        });
        
        // マウス移動（ドラッグ中）
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.currentMousePos.x = e.clientX - rect.left;
            this.currentMousePos.y = e.clientY - rect.top;
            
            if (this.isDragging) {
                const col = Math.floor((this.currentMousePos.x - this.padding) / this.cellSize);
                const row = Math.floor((this.currentMousePos.y - this.padding) / this.cellSize);
                
                if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                    this.addToChain(row, col);
                }
            }
        });
        
        // マウスアップ（ドラッグ終了）
        this.canvas.addEventListener('mouseup', () => {
            this.endDrag();
        });
        
        // マウスがキャンバスから出た場合
        this.canvas.addEventListener('mouseleave', () => {
            this.endDrag();
        });
    }
    
    // ドラッグ開始
    startDrag(row, col) {
        // ゲームが終了している場合は何もしない
        if (!this.gameRunning) {
            return;
        }
        
        this.isDragging = true;
        this.connectedTsums = [{ row, col }];
        this.clearAllSelections();
        this.grid[row][col].selected = true;
        console.log(`ドラッグ開始: (${row}, ${col})`);
    }
    
    // チェーンにツムを追加
    addToChain(row, col) {
        // ゲームが終了している場合は何もしない
        if (!this.gameRunning) {
            return;
        }
        
        const lastTsum = this.connectedTsums[this.connectedTsums.length - 1];
        
        // 既に選択されているか確認
        const alreadySelected = this.connectedTsums.some(tsum => 
            tsum.row === row && tsum.col === col
        );
        
        if (alreadySelected) {
            // 一つ前のツムに戻る処理
            if (this.connectedTsums.length > 1) {
                const prevTsum = this.connectedTsums[this.connectedTsums.length - 2];
                if (prevTsum.row === row && prevTsum.col === col) {
                    // 最後のツムを削除
                    const removedTsum = this.connectedTsums.pop();
                    this.grid[removedTsum.row][removedTsum.col].selected = false;
                }
            }
            return;
        }
        
        // 隣接しているかチェック
        if (!this.isAdjacent(lastTsum.row, lastTsum.col, row, col)) {
            return;
        }
        
        // 同じ色かチェック
        if (this.grid[lastTsum.row][lastTsum.col].color !== this.grid[row][col].color) {
            return;
        }
        
        // チェーンに追加
        this.connectedTsums.push({ row, col });
        this.grid[row][col].selected = true;
        console.log(`ツムを追加: (${row}, ${col}), チェーン長: ${this.connectedTsums.length}`);
    }
    
    // ドラッグ終了
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // 3つ以上つながっていたら消去
        if (this.connectedTsums.length >= 3) {
            console.log(`${this.connectedTsums.length}個のツムを消去！`);
            this.removeTsums();
            this.updateScore();
            
            // 消去後、少し待ってから手詰まりチェック
            setTimeout(() => {
                this.checkDeadlockAfterMove();
            }, this.animationDuration + 100);
        }
        
        // 選択状態をクリア
        this.clearAllSelections();
        this.connectedTsums = [];
    }
    
    // 移動後の手詰まりチェック
    checkDeadlockAfterMove() {
        // アニメーション中は延期
        if (this.animatingTsums.length > 0) {
            setTimeout(() => {
                this.checkDeadlockAfterMove();
            }, 200);
            return;
        }
        
        // ゲームが終了していたら何もしない
        if (!this.gameRunning) {
            return;
        }
        
        const hasMoves = this.checkForPossibleMoves();
        if (!hasMoves) {
            console.log('手詰まり状態を検出：シャッフルボタンアニメーション開始');
            this.startShuffleButtonAnimation();
        } else {
            // 消せるツムがある場合はアニメーション停止
            this.stopShuffleButtonAnimation();
        }
    }
    
    // 隣接判定
    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    // 隣接セルの座標を取得
    getAdjacentCells(row, col) {
        const adjacent = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // 上、下、左、右
        ];
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                adjacent.push({ row: newRow, col: newCol });
            }
        });
        
        return adjacent;
    }
    
    // すべての選択状態をクリア
    clearAllSelections() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].selected = false;
            }
        }
    }
    
    // ツムを消去（アニメーション付き + 落下準備）
    removeTsums() {
        // 消去予定のツムの位置を記録
        this.tsumsClearedPositions = [...this.connectedTsums];
        this.fallingProcessed = false; // 落下処理フラグをリセット
        
        // アニメーション開始
        this.connectedTsums.forEach(({ row, col }) => {
            const tsum = this.grid[row][col];
            tsum.isAnimating = true;
            tsum.animationStartTime = Date.now();
            
            // アニメーション中のツムリストに追加
            this.animatingTsums.push({ row, col, startTime: Date.now() });
        });
        
        console.log(`${this.connectedTsums.length}個のツムのアニメーションを開始`);
    }
    
    // チェーン長に基づく得点計算
    calculateChainScore(chainLength) {
        if (chainLength < 3) return 0;
        
        // フィボナッチ的な得点テーブル（3チェーン以上）
        const scoreTable = [
            0,    // 0チェーン
            0,    // 1チェーン  
            0,    // 2チェーン
            200,  // 3チェーン: 200点
            300,  // 4チェーン: 200 + 300 = 500点
            500,  // 5チェーン: 200 + 300 + 500 = 1000点
            800,  // 6チェーン: 200 + 300 + 500 + 800 = 1800点
            1300, // 7チェーン: フィボナッチ的増加 (500 + 800)
            2100, // 8チェーン: (800 + 1300)
            3400, // 9チェーン: (1300 + 2100)
            5500, // 10チェーン: (2100 + 3400)
            8900, // 11チェーン: (3400 + 5500)
            14400 // 12チェーン: (5500 + 8900)
        ];
        
        // テーブルにない長いチェーンは最後の2つの値の和で計算
        if (chainLength >= scoreTable.length) {
            const lastIndex = scoreTable.length - 1;
            const increment = scoreTable[lastIndex] + scoreTable[lastIndex - 1];
            return this.calculateTotalChainScore(chainLength, scoreTable) + 
                   (increment * (chainLength - scoreTable.length + 1));
        }
        
        return this.calculateTotalChainScore(chainLength, scoreTable);
    }
    
    // チェーン全体の合計得点を計算
    calculateTotalChainScore(chainLength, scoreTable) {
        let totalScore = 0;
        for (let i = 3; i <= chainLength && i < scoreTable.length; i++) {
            totalScore += scoreTable[i];
        }
        return totalScore;
    }
    
    // コンボ管理
    updateCombo() {
        const currentTime = Date.now();
        
        // 1秒以内に消去した場合はコンボ継続
        if (this.lastClearTime > 0 && (currentTime - this.lastClearTime) <= this.comboTimeLimit) {
            this.combo++;
        } else {
            // 新しいコンボ開始
            this.combo = 1;
        }
        
        // 最大コンボ更新
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 最後に消した時間を更新
        this.lastClearTime = currentTime;
        
        // UI更新
        document.getElementById('combo').textContent = this.combo;
        
        // コンボ達成メッセージ
        if (this.combo >= 10) {
            console.log(`🎉 INCREDIBLE ${this.combo} COMBO!!`);
        } else if (this.combo >= 5) {
            console.log(`🔥 SUPER ${this.combo} COMBO!`);
        } else if (this.combo >= 3) {
            console.log(`⚡ ${this.combo} COMBO!`);
        }
    }
    
    // スコア更新（改善版 + コンボ対応）
    updateScore() {
        const chainLength = this.connectedTsums.length;
        let points = this.calculateChainScore(chainLength);
        
        // コンボ更新
        this.updateCombo();
        
        // コンボボーナス（2コンボ以上で1.1倍、以降0.05倍ずつ増加）
        if (this.combo >= 2) {
            const comboMultiplier = 1.0 + (this.combo - 1) * 0.05;
            const bonusPoints = Math.floor(points * (comboMultiplier - 1.0));
            points = Math.floor(points * comboMultiplier);
            
            if (bonusPoints > 0) {
                console.log(`💫 ${this.combo}コンボボーナス: +${bonusPoints}点`);
            }
        }
        
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // 詳細ログ表示
        console.log(`${chainLength}チェーン: +${points}点！ 総スコア: ${this.score}`);
        
        // チェーン長に応じた特別メッセージ
        if (chainLength >= 7) {
            console.log(`🔥 AMAZING ${chainLength}チェーン！ +${points}点の大ボーナス！`);
        } else if (chainLength >= 5) {
            console.log(`⭐ GREAT ${chainLength}チェーン！ +${points}点！`);
        } else if (chainLength >= 4) {
            console.log(`✨ GOOD ${chainLength}チェーン！ +${points}点！`);
        }
    }
    
    // タイマー開始
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time').textContent = this.timeLeft;
            console.log(`残り時間: ${this.timeLeft}秒`);
            
            // 時間切れチェック
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        console.log('タイマーを開始しました');
    }
    
    // ゲーム終了
    endGame() {
        this.gameRunning = false;
        
        // タイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 選択状態をクリア
        this.clearAllSelections();
        this.connectedTsums = [];
        this.isDragging = false;
        
        // 最大コンボボーナススコア計算
        const comboBonus = Math.floor(this.maxCombo * 50);
        const finalScore = this.score + comboBonus;
        
        // リスタートボタンを表示
        document.getElementById('restartBtn').style.display = 'block';
        
        // 終了メッセージを表示
        setTimeout(() => {
            let message = `🎮 ゲーム終了！\n\n`;
            message += `基本スコア: ${this.score}点\n`;
            message += `最大コンボ: ${this.maxCombo}\n`;
            if (comboBonus > 0) {
                message += `コンボボーナス: +${comboBonus}点\n`;
                message += `─────────────\n`;
                message += `最終スコア: ${finalScore}点`;
            } else {
                message += `最終スコア: ${finalScore}点`;
            }
            message += `\n\n「もう一度プレイ」ボタンでリスタートできます。`;
            
            alert(message);
        }, 100);
        
        console.log(`ゲーム終了 - 基本スコア: ${this.score}点, 最大コンボ: ${this.maxCombo}, 最終スコア: ${finalScore}点`);
    }
    
    // ゲームリスタート
    restart() {
        console.log('ゲームをリスタートします');
        
        // ゲーム状態をリセット
        this.score = 0;
        this.timeLeft = 60;
        this.gameRunning = true;
        this.isDragging = false;
        this.connectedTsums = [];
        
        // コンボシステムリセット
        this.combo = 0;
        this.lastClearTime = 0;
        this.maxCombo = 0;
        
        // 落下システムリセット
        this.tsumsClearedPositions = [];
        this.fallingProcessed = false;
        
        // UI更新
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.timeLeft;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('restartBtn').style.display = 'none';
        
        // アニメーション状態をリセット
        this.animatingTsums = [];
        this.stopShuffleButtonAnimation();
        
        // グリッドを再初期化
        this.initializeGrid();
        
        // タイマー再開
        this.startTimer();
        
        console.log('リスタート完了');
    }
    
    // ゲームループ
    gameLoop() {
        this.updateAnimations();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // アニメーション更新
    updateAnimations() {
        const currentTime = Date.now();
        
        // アニメーション中のツムを更新
        this.animatingTsums = this.animatingTsums.filter(({ row, col, startTime }) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / this.animationDuration;
            
            if (progress >= 1.0) {
                // アニメーション完了：落下システム開始
                const tsum = this.grid[row][col];
                tsum.opacity = 1.0;
                tsum.isAnimating = false;
                
                // 落下処理を実行（すべてのアニメーション完了時に1回だけ）
                if (this.animatingTsums.length === 1 && !this.fallingProcessed) {
                    this.fallingProcessed = true;
                    setTimeout(() => {
                        this.processFalling();
                    }, 50);
                }
                
                return false; // 配列から削除
            } else {
                // アニメーション進行中：透明度を更新
                this.grid[row][col].opacity = 1.0 - progress;
                return true; // 配列に保持
                        }
         });
     }
     
     // 手詰まり検出：消せるツムがあるかチェック
     checkForPossibleMoves() {
         console.log('手詰まり検出を開始...');
         
         for (let row = 0; row < this.gridSize; row++) {
             for (let col = 0; col < this.gridSize; col++) {
                 // アニメーション中のツムはスキップ
                 if (this.grid[row][col].isAnimating) continue;
                 
                 // このセルから開始して3つ以上のチェーンが作れるかチェック
                 if (this.canFormChain(row, col)) {
                     console.log(`消せるチェーンが見つかりました: (${row}, ${col})から開始`);
                     return true;
                 }
             }
         }
         
         console.log('手詰まり状態：消せるツムがありません');
         return false;
     }
     
     // 指定位置から3つ以上のチェーンが作れるかチェック
     canFormChain(startRow, startCol) {
         const startColor = this.grid[startRow][startCol].color;
         const visited = new Set();
         const chain = [];
         
         // 深さ優先探索で同色の隣接ツムを探す
         const dfs = (row, col) => {
             const key = `${row},${col}`;
             if (visited.has(key)) return;
             
             if (this.grid[row][col].color !== startColor) return;
             if (this.grid[row][col].isAnimating) return;
             
             visited.add(key);
             chain.push({ row, col });
             
             // 隣接セルを探索
             this.getAdjacentCells(row, col).forEach(({ row: adjRow, col: adjCol }) => {
                 dfs(adjRow, adjCol);
             });
         };
         
         dfs(startRow, startCol);
         
                   // 3つ以上つながったらtrue
          return chain.length >= 3;
      }
      
      // シャッフル機能：グリッドの色をランダムに再配置
      shuffleGrid() {
          console.log('グリッドシャッフルを開始...');
          
          // 現在の色を全て取得（アニメーション中でないもののみ）
          const colors = [];
          for (let row = 0; row < this.gridSize; row++) {
              for (let col = 0; col < this.gridSize; col++) {
                  if (!this.grid[row][col].isAnimating) {
                      colors.push(this.grid[row][col].color);
                  }
              }
          }
          
          // Fisher-Yates アルゴリズムでシャッフル
          for (let i = colors.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [colors[i], colors[j]] = [colors[j], colors[i]];
          }
          
          // シャッフルした色を再配置
          let colorIndex = 0;
          for (let row = 0; row < this.gridSize; row++) {
              for (let col = 0; col < this.gridSize; col++) {
                  if (!this.grid[row][col].isAnimating) {
                      this.grid[row][col].color = colors[colorIndex];
                      this.grid[row][col].selected = false; // 選択状態もリセット
                      colorIndex++;
                  }
              }
          }
          
          console.log(`${colorIndex}個のツムをシャッフルしました`);
          
          // シャッフル後に消せるツムがあるかチェック
          const hasMoves = this.checkForPossibleMoves();
          if (!hasMoves) {
              console.log('シャッフル後も手詰まり状態のため、再シャッフル実行');
              // 最大3回まで再試行
              this.reshuffleIfNeeded(2);
          } else {
              console.log('シャッフル完了：消せるツムが確認できました');
          }
          
          // シャッフル実行後はアニメーション停止
          this.stopShuffleButtonAnimation();
      }
      
      // シャッフルボタンアニメーション開始
      startShuffleButtonAnimation() {
          if (this.isShuffleButtonAnimating) return;
          
          this.isShuffleButtonAnimating = true;
          const shuffleBtn = document.getElementById('shuffleBtn');
          
          if (shuffleBtn) {
              shuffleBtn.classList.add('shuffle-attention');
              console.log('シャッフルボタンアニメーション開始');
          }
      }
      
      // シャッフルボタンアニメーション停止
      stopShuffleButtonAnimation() {
          if (!this.isShuffleButtonAnimating) return;
          
          this.isShuffleButtonAnimating = false;
          const shuffleBtn = document.getElementById('shuffleBtn');
          
          if (shuffleBtn) {
              shuffleBtn.classList.remove('shuffle-attention');
              console.log('シャッフルボタンアニメーション停止');
          }
      }
      
      // 必要に応じて再シャッフル（手詰まり回避）
      reshuffleIfNeeded(remainingAttempts) {
          if (remainingAttempts <= 0) {
              console.log('再シャッフル試行回数の上限に達しました');
              return;
          }
          
          this.shuffleGrid();
          
          if (!this.checkForPossibleMoves()) {
              this.reshuffleIfNeeded(remainingAttempts - 1);
          }
             }
       
       // 落下システム：段階1（基本ロジック）
       processFalling() {
           console.log('🍃 落下システム開始');
           console.log('消去された位置:', this.tsumsClearedPositions);
           
           // 消去されたツムを実際に削除してマーク
           this.tsumsClearedPositions.forEach(({ row, col }) => {
               this.grid[row][col] = { ...this.createEmptyTsum(), isEmpty: true };
           });
           
           // 各列ごとに落下処理
           for (let col = 0; col < this.gridSize; col++) {
               this.processColumnFalling(col);
           }
           
           console.log('🍃 落下システム完了');
       }
       
       // 指定列の落下処理
       processColumnFalling(col) {
           // この列に消去されたツムがあるかチェック
           const clearedInThisColumn = this.tsumsClearedPositions.filter(pos => pos.col === col);
           if (clearedInThisColumn.length === 0) {
               console.log(`列${col}: 消去されたツムなし`);
               return; // この列には消去されたツムがないのでスキップ
           }
           
           // 残存するツムを下から収集
           const remainingTsums = [];
           for (let row = this.gridSize - 1; row >= 0; row--) {
               const tsum = this.grid[row][col];
               if (!tsum.isEmpty && tsum.opacity > 0) {
                   remainingTsums.push({ ...tsum });
               }
           }
           
           // 列全体をクリア
           for (let row = 0; row < this.gridSize; row++) {
               this.grid[row][col] = this.createEmptyTsum();
           }
           
           // 残存ツムを下から配置
           let targetRow = this.gridSize - 1;
           for (let i = 0; i < remainingTsums.length; i++) {
               this.grid[targetRow][col] = remainingTsums[i];
               targetRow--;
           }
           
           // 上部に新しいツムを生成
           const newTsumsCount = this.gridSize - remainingTsums.length;
           for (let row = 0; row < newTsumsCount; row++) {
               this.grid[row][col] = this.createNewTsum();
           }
           
           console.log(`列${col}: ${remainingTsums.length}個保持, ${newTsumsCount}個新規生成`);
       }
       
       // 新しいツムを作成
       createNewTsum() {
           return {
               color: this.tsumColors[Math.floor(Math.random() * this.tsumColors.length)],
               selected: false,
               opacity: 1.0,
               isAnimating: false
           };
       }
       
       // 空のツム（一時的）を作成
       createEmptyTsum() {
           return {
               color: '#000000',
               selected: false,
               opacity: 0.0,
               isAnimating: false,
               isEmpty: true
           };
       }
 }
 
 // グローバル変数でゲームインスタンスを保持
let gameInstance = null;

// ページが読み込まれたらゲームを開始
window.addEventListener('load', () => {
    console.log('ページが読み込まれました！');
    try {
        gameInstance = new TsumTsumGame();
        console.log('ゲームが正常に開始されました！');
    } catch (error) {
        console.error('ゲーム開始でエラーが発生しました:', error);
    }
});

// グローバル関数：リスタート用
function restartGame() {
    if (gameInstance) {
        gameInstance.restart();
    }
}

// グローバル関数：シャッフル用
function shuffleGrid() {
    if (gameInstance && gameInstance.gameRunning) {
        // ドラッグ中やアニメーション中の場合は実行しない
        if (gameInstance.isDragging || gameInstance.animatingTsums.length > 0) {
            alert('⏳ アニメーション中です。\n\n少し待ってからシャッフルしてください。');
            return;
        }
        
        // 選択状態をクリア
        gameInstance.clearAllSelections();
        gameInstance.connectedTsums = [];
        
        // シャッフル実行
        gameInstance.shuffleGrid();
        
        // メッセージ表示なしでスムーズにゲーム継続
        console.log('🔀 シャッフル完了 - ゲームを継続してください');
    } else {
        alert('⚠️ ゲームが実行中ではありません。');
    }
} 