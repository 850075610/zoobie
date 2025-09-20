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
        
        this.plantCosts = {
            sunflower: 50,
            peashooter: 100,
            wallnut: 50
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.drawGrid();
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
        this.isRunning = true;
        this.isPaused = false;
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
        this.sunCount = 100;
        this.zombieCount = 0;
        this.waveCount = 1;
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.suns = [];
        this.zombieSpawnTimer = 0;
        this.sunSpawnTimer = 0;
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
        // 生成僵尸
        this.zombieSpawnTimer += deltaTime;
        if (this.zombieSpawnTimer > 5000) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
        }
        
        // 生成阳光
        this.sunSpawnTimer += deltaTime;
        if (this.sunSpawnTimer > 8000) {
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
        this.sunCount += 25;
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