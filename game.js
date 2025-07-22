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
        }
        
        // 選択状態をクリア
        this.clearAllSelections();
        this.connectedTsums = [];
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
    
    // ツムを消去（アニメーション付き）
    removeTsums() {
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
    
    // スコア更新
    updateScore() {
        const points = this.connectedTsums.length * 100;
        this.score += points;
        document.getElementById('score').textContent = this.score;
        console.log(`+${points}点！ 総スコア: ${this.score}`);
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
        
        // リスタートボタンを表示
        document.getElementById('restartBtn').style.display = 'block';
        
        // 終了メッセージを表示
        setTimeout(() => {
            alert(`ゲーム終了！\n最終スコア: ${this.score}点\n\n「もう一度プレイ」ボタンでリスタートできます。`);
        }, 100);
        
        console.log(`ゲーム終了 - 最終スコア: ${this.score}点`);
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
        
        // UI更新
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.timeLeft;
        document.getElementById('restartBtn').style.display = 'none';
        
        // アニメーション状態をリセット
        this.animatingTsums = [];
        
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
                // アニメーション完了：新しい色に変更
                const tsum = this.grid[row][col];
                tsum.color = this.tsumColors[Math.floor(Math.random() * this.tsumColors.length)];
                tsum.opacity = 1.0;
                tsum.isAnimating = false;
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

// グローバル関数：手詰まり検出テスト用
function testDeadlockDetection() {
    if (gameInstance) {
        const hasMoves = gameInstance.checkForPossibleMoves();
        
        if (hasMoves) {
            alert('✅ 消せるツムがあります！\n\n詳細はブラウザのConsole（F12）で確認できます。');
        } else {
            alert('❌ 手詰まり状態です！\n\n消せるツムがありません。\nシャッフルが必要です。');
        }
    }
} 