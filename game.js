class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 75;
        this.rows = 8;
        this.cols = 12;

        this.sunCount = 100;
        this.zombieCount = 0;
        this.waveCount = 1;
        this.selectedPlant = 'sunflower';

        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.suns = [];

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.zombieSpawnTimer = 0;
        this.sunSpawnTimer = 0;

        this.difficulty = 'normal';
        this.gameStarted = false;

        // 新增：游戏计时和升级相关
        this.gameStartTime = 0;
        this.gameTime = 0;
        this.zombiesPerWave = 10; // 每波僵尸数量
        this.zombiesInCurrentWave = 0;
        this.levelUpTriggered = false;

        this.plantCosts = {
            sunflower: 50,
            peashooter: 100,
            wallnut: 50
        };

        this.difficultySettings = {
            easy: {
                name: '简单',
                sunCount: 200,
                zombieSpeed: 0.35,  // 稍微加快简单等级的僵尸速度
                zombieHealth: 80,
                zombieSpawnInterval: 8000,
                sunSpawnInterval: 6000,
                sunValue: 30
            },
            normal: {
                name: '中等',
                sunCount: 100,
                zombieSpeed: 0.3,
                zombieHealth: 100,
                zombieSpawnInterval: 5000,
                sunSpawnInterval: 8000,
                sunValue: 25
            },
            hard: {
                name: '困难',
                sunCount: 50,
                zombieSpeed: 0.4,  // 稍微放缓困难等级的僵尸速度
                zombieHealth: 120,
                zombieSpawnInterval: 3000,
                sunSpawnInterval: 10000,
                sunValue: 20
            }
        };

        this.init();
    }
    
    init() {
        this.setupDifficultySelection();
        this.setupEventListeners();
        this.drawGrid();
    }

    setupDifficultySelection() {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                this.setDifficulty(difficulty);
            });
        });
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        const settings = this.difficultySettings[difficulty];

        // 显示游戏界面，隐藏难度选择界面
        document.getElementById('difficultyScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';

        // 根据难度设置初始值
        this.sunCount = settings.sunCount;
        document.getElementById('difficultyDisplay').textContent = settings.name;

        this.updateUI();
        this.gameStarted = true;
    }
    
    setupEventListeners() {
        // 植物选择按钮
        document.querySelectorAll('.plant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.plant-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedPlant = e.target.dataset.plant;
            });
        });
        
        // Canvas点击事件
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 检查是否点击了阳光
            const clickedSun = this.suns.find(sun => 
                x >= sun.x && x <= sun.x + sun.width &&
                y >= sun.y && y <= sun.y + sun.height
            );
            
            if (clickedSun) {
                this.collectSun(clickedSun);
                return;
            }
            
            const gridX = Math.floor(x / this.gridSize);
            const gridY = Math.floor(y / this.gridSize);
            
            this.plantSeed(gridX, gridY);
        });
        
        // 控制按钮
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.gameStarted) {
            alert('请先选择游戏难度！');
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.gameStartTime = Date.now(); // 记录游戏开始时间
        this.gameTime = 0;
        this.levelUpTriggered = false;
        this.gameLoop();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isRunning) {
            this.gameLoop();
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.sunCount = 100;
        this.zombieCount = 0;
        this.waveCount = 1;
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.suns = [];
        this.zombieSpawnTimer = 0;
        this.sunSpawnTimer = 0;

        // 重置升级相关变量
        this.gameStartTime = 0;
        this.gameTime = 0;
        this.zombiesInCurrentWave = 0;
        this.levelUpTriggered = false;

        // 显示难度选择界面，隐藏游戏界面
        document.getElementById('difficultyScreen').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';

        this.updateUI();
        this.drawGrid();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning || this.isPaused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const settings = this.difficultySettings[this.difficulty];

        // 更新游戏时间
        if (this.isRunning && !this.isPaused) {
            this.gameTime += deltaTime;
        }

        // 检查升级条件
        this.checkLevelUpConditions();

        // 生成僵尸
        this.zombieSpawnTimer += deltaTime;
        if (this.zombieSpawnTimer > settings.zombieSpawnInterval) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
            this.zombiesInCurrentWave++;
        }

        // 生成阳光
        this.sunSpawnTimer += deltaTime;
        if (this.sunSpawnTimer > settings.sunSpawnInterval) {
            this.spawnSun();
            this.sunSpawnTimer = 0;
        }

        // 更新植物
        this.plants.forEach(plant => plant.update(deltaTime));

        // 更新僵尸
        this.zombies.forEach(zombie => zombie.update(deltaTime));

        // 更新子弹
        this.bullets.forEach(bullet => bullet.update(deltaTime));

        // 更新阳光
        this.suns.forEach(sun => sun.update(deltaTime));

        // 碰撞检测
        this.checkCollisions();

        // 清理死亡对象
        this.cleanup();

        // 检查游戏结束
        this.checkGameOver();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        
        // 绘制植物
        this.plants.forEach(plant => plant.draw(this.ctx));
        
        // 绘制僵尸
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
        
        // 绘制子弹
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        // 绘制阳光
        this.suns.forEach(sun => sun.draw(this.ctx));
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    plantSeed(gridX, gridY) {
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) return;
        
        // 检查位置是否已有植物
        const existingPlant = this.plants.find(plant => 
            plant.gridX === gridX && plant.gridY === gridY
        );
        
        if (existingPlant) return;
        
        const cost = this.plantCosts[this.selectedPlant];
        if (this.sunCount < cost) return;
        
        let plant;
        switch (this.selectedPlant) {
            case 'sunflower':
                plant = new Sunflower(gridX, gridY, this);
                break;
            case 'peashooter':
                plant = new Peashooter(gridX, gridY, this);
                break;
            case 'wallnut':
                plant = new Wallnut(gridX, gridY, this);
                break;
        }
        
        if (plant) {
            this.plants.push(plant);
            this.sunCount -= cost;
            this.updateUI();
        }
    }
    
    spawnZombie() {
        const row = Math.floor(Math.random() * this.rows);
        const zombie = new Zombie(this.canvas.width, row, this);
        this.zombies.push(zombie);
    }
    
    spawnSun() {
        const x = Math.random() * (this.canvas.width - 40) + 20;
        const sun = new Sun(x, -20, this);
        this.suns.push(sun);
    }
    
    collectSun(sun) {
        sun.collected = true;
        const settings = this.difficultySettings[this.difficulty];
        this.sunCount += settings.sunValue;
        this.updateUI();
    }
    
    checkCollisions() {
        // 子弹与僵尸碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            this.zombies.forEach((zombie, zombieIndex) => {
                if (this.isColliding(bullet, zombie)) {
                    zombie.health -= 20;
                    this.bullets.splice(bulletIndex, 1);
                    
                    if (zombie.health <= 0) {
                        this.zombies.splice(zombieIndex, 1);
                        this.zombieCount++;
                        this.updateUI();
                    }
                }
            });
        });
        
        // 僵尸与植物碰撞
        this.zombies.forEach(zombie => {
            this.plants.forEach((plant, plantIndex) => {
                if (this.isColliding(zombie, plant)) {
                    zombie.isAttacking = true;
                    plant.health -= 0.5;
                    
                    if (plant.health <= 0) {
                        this.plants.splice(plantIndex, 1);
                        zombie.isAttacking = false;
                    }
                }
            });
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    cleanup() {
        this.bullets = this.bullets.filter(bullet => 
            bullet.x > 0 && bullet.x < this.canvas.width
        );
        
        this.suns = this.suns.filter(sun => 
            sun.y < this.canvas.height + 50 && !sun.collected
        );
        
        this.zombies = this.zombies.filter(zombie => 
            zombie.x > -50 && zombie.health > 0
        );
    }
    
    checkGameOver() {
        const zombieReachedEnd = this.zombies.some(zombie => zombie.x < 0);
        if (zombieReachedEnd) {
            this.isRunning = false;
            alert('游戏结束！僵尸吃掉了你的脑子！');
        }
    }

    checkLevelUpConditions() {
        if (this.levelUpTriggered) return;

        // 检查时间条件：5分钟（300000毫秒）
        const timeCondition = this.gameTime >= 300000;

        // 检查击败僵尸数量条件：30个僵尸
        const zombieCondition = this.zombieCount >= 30;

        if (timeCondition || zombieCondition) {
            this.triggerLevelUp();
        }
    }

    triggerLevelUp() {
        this.levelUpTriggered = true;
        this.isRunning = false;

        // 显示升级提示
        const currentDifficultyIndex = Object.keys(this.difficultySettings).indexOf(this.difficulty);
        const nextDifficultyIndex = currentDifficultyIndex + 1;

        if (nextDifficultyIndex < Object.keys(this.difficultySettings).length) {
            const nextDifficulty = Object.keys(this.difficultySettings)[nextDifficultyIndex];
            const nextDifficultyName = this.difficultySettings[nextDifficulty].name;

            if (confirm(`恭喜！你已经成功保卫家园${Math.floor(this.gameTime / 60000)}分钟，击败了${this.zombieCount}个僵尸！\n\n是否进入下一难度等级：${nextDifficultyName}？`)) {
                this.levelUp(nextDifficulty);
            } else {
                // 继续当前游戏
                this.isRunning = true;
                this.levelUpTriggered = false;
            }
        } else {
            alert(`恭喜！你已经成功通关所有难度！\n\n游戏时间：${Math.floor(this.gameTime / 60000)}分钟\n击败僵尸：${this.zombieCount}个`);
            this.reset();
        }
    }

    levelUp(newDifficulty) {
        // 保存阳光数量作为奖励
        const savedSunCount = this.sunCount;

        // 重置游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.suns = [];
        this.zombieSpawnTimer = 0;
        this.sunSpawnTimer = 0;

        // 清零游戏数据
        this.zombieCount = 0;
        this.waveCount = 1;
        this.zombiesInCurrentWave = 0;

        // 设置新难度
        this.setDifficulty(newDifficulty);

        // 恢复阳光奖励（保留80%）
        this.sunCount = Math.floor(savedSunCount * 0.8);

        // 重置升级触发器
        this.levelUpTriggered = false;
        this.gameTime = 0;
        this.gameStartTime = Date.now();

        this.updateUI();
        this.drawGrid();
    }
    
    updateUI() {
        document.getElementById('sunCount').textContent = this.sunCount;
        document.getElementById('zombieCount').textContent = this.zombieCount;
        document.getElementById('waveCount').textContent = this.waveCount;
    }
}

// 初始化游戏
let game;
window.addEventListener('load', () => {
    game = new Game();
});