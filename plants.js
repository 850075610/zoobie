// 基础游戏对象类
class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.health = 100;
    }
}

// 植物基类
class Plant extends GameObject {
    constructor(gridX, gridY, game) {
        const x = gridX * game.gridSize + 10;
        const y = gridY * game.gridSize + 10;
        super(x, y, 55, 55);
        this.gridX = gridX;
        this.gridY = gridY;
        this.game = game;
        this.lastAction = 0;
    }
}

// 向日葵类
class Sunflower extends Plant {
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 100;
        this.sunProductionTimer = 0;
        this.sunProductionInterval = 5000;
    }
    
    update(deltaTime) {
        this.sunProductionTimer += deltaTime;
        if (this.sunProductionTimer >= this.sunProductionInterval) {
            this.produceSun();
            this.sunProductionTimer = 0;
        }
    }
    
    produceSun() {
        const sun = new Sun(this.x + 12, this.y + 12, this.game);
        sun.y = this.y + 12;
        sun.speed = 0;
        sun.lifetime = 8000;
        sun.createdTime = Date.now();
        this.game.suns.push(sun);
    }
    
    draw(ctx) {
        // 画茎
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x + 22, this.y + 30, 10, 25);
        
        // 画花瓣
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x = this.x + 27 + Math.cos(angle) * 15;
            const y = this.y + 20 + Math.sin(angle) * 15;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 画花心
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x + 27, this.y + 20, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 豌豆射手类
class Peashooter extends Plant {
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 100;
        this.shootTimer = 0;
        this.shootInterval = 2000;
        this.range = 800;
    }
    
    update(deltaTime) {
        this.shootTimer += deltaTime;
        
        // 检查同一行是否有僵尸
        const zombieInRow = this.game.zombies.find(zombie => 
            zombie.gridY === this.gridY && 
            zombie.x > this.x && 
            zombie.x - this.x < this.range
        );
        
        if (zombieInRow && this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }
    
    shoot() {
        const bullet = new PeaBullet(this.x + 50, this.y + 20, this.game);
        this.game.bullets.push(bullet);
    }
    
    draw(ctx) {
        // 画茎
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x + 22, this.y + 25, 10, 30);
        
        // 画头部
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(this.x + 27, this.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 画嘴
        ctx.fillStyle = '#006400';
        ctx.fillRect(this.x + 35, this.y + 17, 8, 6);
        
        // 画眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 坚果墙类
class Wallnut extends Plant {
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 300;
        this.maxHealth = 300;
    }
    
    update(deltaTime) {
        // 坚果墙不需要特殊更新逻辑
    }
    
    draw(ctx) {
        // 根据生命值改变颜色
        const healthRatio = this.health / this.maxHealth;
        const red = Math.floor(139 + (255 - 139) * (1 - healthRatio));
        const green = Math.floor(69 + (165 - 69) * healthRatio);
        const brown = `rgb(${red}, ${green}, 19)`;
        
        ctx.fillStyle = brown;
        ctx.fillRect(this.x + 5, this.y + 10, 45, 45);
        
        // 画纹理
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + 15);
        ctx.lineTo(this.x + 35, this.y + 50);
        ctx.moveTo(this.x + 35, this.y + 15);
        ctx.lineTo(this.x + 15, this.y + 50);
        ctx.stroke();
        
        // 画裂纹（如果生命值低）
        if (healthRatio < 0.5) {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y + 20);
            ctx.lineTo(this.x + 25, this.y + 35);
            ctx.lineTo(this.x + 35, this.y + 45);
            ctx.stroke();
        }
    }
}