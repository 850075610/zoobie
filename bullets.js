// 子弹基类
class Bullet extends GameObject {
    constructor(x, y, game) {
        super(x, y, 10, 10);
        this.game = game;
        this.speed = 5;
    }
}

// 豌豆子弹类
class PeaBullet extends Bullet {
    constructor(x, y, game) {
        super(x, y, game);
        this.damage = 20;
    }
    
    update(deltaTime) {
        this.x += this.speed;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 画高光
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 2, this.y + this.height/2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 阳光类
class Sun extends GameObject {
    constructor(x, y, game) {
        super(x, y, 30, 30);
        this.game = game;
        this.speed = 1;
        this.collected = false;
        this.lifetime = 10000;
        this.createdTime = Date.now();
    }
    
    update(deltaTime) {
        this.y += this.speed;
        
        // 检查是否被点击
        if (Date.now() - this.createdTime > this.lifetime) {
            this.collected = true;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 画阳光光芒
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x1 = this.x + this.width/2 + Math.cos(angle) * 15;
            const y1 = this.y + this.height/2 + Math.sin(angle) * 15;
            const x2 = this.x + this.width/2 + Math.cos(angle) * 20;
            const y2 = this.y + this.height/2 + Math.sin(angle) * 20;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
}