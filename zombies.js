// 僵尸基类
class Zombie extends GameObject {
    constructor(x, row, game) {
        super(x, row * game.gridSize + 10, 50, 60);
        this.game = game;
        this.gridY = row;

        // 根据难度设置僵尸属性
        const settings = game.difficultySettings[game.difficulty];
        this.speed = settings.zombieSpeed;
        this.health = settings.zombieHealth;
        this.maxHealth = settings.zombieHealth;

        this.isAttacking = false;
        this.attackDamage = 1;
        this.attackTimer = 0;
        this.attackInterval = 1000;
    }
    
    update(deltaTime) {
        if (!this.isAttacking) {
            this.x -= this.speed;
        } else {
            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackInterval) {
                this.attack();
                this.attackTimer = 0;
            }
        }
    }
    
    attack() {
        // 攻击逻辑在碰撞检测中处理
    }
    
    draw(ctx) {
        // 画身体
        ctx.fillStyle = '#708090';
        ctx.fillRect(this.x + 10, this.y + 20, 30, 40);
        
        // 画头
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 画眼睛
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 画嘴
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 18, 4, 0, Math.PI);
        ctx.fill();
        
        // 画手臂
        ctx.fillStyle = '#708090';
        ctx.fillRect(this.x + 5, this.y + 25, 8, 20);
        ctx.fillRect(this.x + 37, this.y + 25, 8, 20);
        
        // 画腿
        ctx.fillRect(this.x + 15, this.y + 55, 8, 15);
        ctx.fillRect(this.x + 27, this.y + 55, 8, 15);
        
        // 画血条
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y - 8, 50, 4);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y - 8, 50 * (this.health / this.maxHealth), 4);
        }
    }
}