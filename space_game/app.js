class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
    clear() {
        this.listeners = {};
    }
}

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
    draw(ctx) {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            // 이미지가 없을 때 대체 도형 그리기
            if (this.type === "Hero") ctx.fillStyle = "white";
            else if (this.type === "Enemy") ctx.fillStyle = "red";
            else if (this.type === "Laser") ctx.fillStyle = "yellow";
            else if (this.type === "enemyLaser") ctx.fillStyle = "#00FF00"; // 녹색 (보스 공격)
            else if (this.type === "Item") ctx.fillStyle = "cyan";
            else if (this.type === "Meteor") ctx.fillStyle = "orange";
            else ctx.fillStyle = "gray";
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = 'Hero';
        this.speed = { x: 0, y: 0 };
        this.cooldown = 0;
        this.life = 3;
        this.points = 0;
        this.kill = 0;

        this.isShielded = false;
        this.chargeStartTime = 0;
        this.isCharging = false;
        this.meteorCount = 1; 
    }

    fire() {
        if (this.canFire()) {
            gameObjects.push(new LaserRed(this.x + 45, this.y - 10));
            this.cooldown = 200; 
            let id = setInterval(() => {
                if (this.cooldown > 0) {
                    this.cooldown -= 100;
                } else {
                    clearInterval(id);
                }
            }, 100);
        }
    }

    // C키: 차지 시작
    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
    }

    // C키 뗌: 차지 발사
    fireCharged() {
        if (!this.isCharging) return;
        
        const chargeDuration = Date.now() - this.chargeStartTime;
        this.isCharging = false;

        // 0.5초 이상 모으면 차지 샷
        if (chargeDuration >= 500) {
            gameObjects.push(new LaserCharged(this.x + 25, this.y - 60));
        } 
    }

    // Z키: 메테오
    useMeteor() {
        if (this.meteorCount > 0) {
            this.meteorCount--;
            displayMessage("METEOR STORM!!", "orange");
            setTimeout(() => { 
                // 메세지가 겹치지 않게 화면 갱신 유도 (별도 처리 없어도 됨)
            }, 1000);

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    let mx = Math.random() * (canvas.width - 80);
                    gameObjects.push(new Meteor(mx, -150));
                }, i * 100);
            }
        }
    }

    activateShield() {
        this.isShielded = true;
        if (heroShieldImg) this.img = heroShieldImg;
        setTimeout(() => {
            this.isShielded = false;
            this.img = (this.life <= 1) ? heroDamagedImg : heroImg;
        }, 5000);
    }

    canFire() {
        return this.cooldown === 0;
    }

    decrementLife() {
        if (this.isShielded) return;

        this.life--;
        if (this.life === 0) {
            this.dead = true;
        }
        if (this.life <= 1) {
            this.img = heroDamagedImg;
            if(typeof heroSub1 !== 'undefined') heroSub1.img = heroDamagedImg;
            if(typeof heroSub2 !== 'undefined') heroSub2.img = heroDamagedImg;
        }
    }

    incrementPoints() {
        this.points += 100;
    }

    // 차지 중일 때 반짝임 효과
    draw(ctx) {
        if (this.isCharging) {
            ctx.globalAlpha = 0.5;
            super.draw(ctx);
            ctx.globalAlpha = 1.0;
        } else {
            super.draw(ctx);
        }
    }
}

class HeroSub extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 33;
        this.height = 25;
        this.type = 'HeroSub';
        this.cooldown = 0;
    }
    fire() {
        if (this.canFire()) {
            gameObjects.push(new LaserRed(this.x + 12, this.y - 10));
            this.cooldown = 500;
            let id = setInterval(() => {
                if (this.cooldown > 0) {
                    this.cooldown -= 100;
                } else {
                    clearInterval(id);
                }
            }, 100);
        }
    }
    canFire() {
        return this.cooldown === 0;
    }
}

class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        this.damage = 1; 
    }
}

class LaserRed extends Laser {
    constructor(x, y) {
        super(x, y);
        this.img = laserRedImg;
        this.damage = 1; 
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100)
    }
}

class LaserCharged extends Laser {
    constructor(x, y) {
        super(x, y);
        this.width = 40;
        this.height = 80;
        this.img = laserChargedImg || laserRedImg;
        this.damage = 5; 
        this.type = 'Laser'; 

        let id = setInterval(() => {
            if (this.y > -100) {
                this.y -= 25; 
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 50);
    }
}

class Meteor extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 80;
        this.height = 80;
        this.type = "Meteor";
        this.img = meteorImg || enemyUFOImg;
        this.damage = 3;

        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 15;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 50);
    }
}

class LaserGreen extends Laser {
    constructor(x, y) {
        super(x, y);
        this.img = laserGreenImg;
        this.type = "enemyLaser";
        this.width = 15; // 적 레이저 조금 더 잘 보이게
        this.height = 40;
        
        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 10; // 속도 조절
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 50)
    }
}

class LaserShot extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 98;
        this.type = 'LaserShot';
        let id = setInterval(() => {
            setTimeout(() => {
                this.dead = true;
                clearInterval(id);
            }, 100); 
        }, 100)
    }
}

class LaserRedShot extends LaserShot {
    constructor(x, y) {
        super(x, y);
        this.img = laserRedShotImg;
    }
}

class LaserGreenShot extends LaserShot {
    constructor(x, y) {
        super(x, y);
        this.img = laserGreenShotImg;
    }
}

class ShieldItem extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 40;
        this.height = 40;
        this.type = "Item";
        this.subType = "Shield";
        this.img = shieldItemImg || lifeImg;
        
        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 5;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.type = "Enemy";
        this.deadCount = 0;
        this.isShotable = false;
        this.lastFire = Date.now();
        this.speed = 15;
        this.life = 1; 

        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += this.speed;
            }
        }, 300);
    }
}

class Enemy_greenShip extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.isShotable = true;
        this.speed = 10;
        this.life = 1;
    }
    fire() {
        const now = Date.now();
        if (this.isShotable && now - this.lastFire > 3000) {
            gameObjects.push(new LaserGreen(this.x + 45, this.y + 30));
            this.lastFire = now;
        }
    }
}

class Enemy_UFO extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 91;
        this.height = 91;
        this.life = 1; 
    }
    fire() {
        const now = Date.now();
        if (this.isShotable && now - this.lastFire > 4000) {
            gameObjects.push(new LaserGreen(this.x + 50, this.y + 10));
            this.lastFire = now;
        }
    }
}

// [보스 클래스 수정]
class EnemyBoss extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.type = "EnemyBoss";
        this.deadCount = 0;
        this.isShotable = false;
        this.lastFire = Date.now();
        this.speed = 20; 
        this.life = 100;
        this.maxLife = 100; 
        this.movecicle = "Left";
        this.isHit = false; // 피격 효과용 플래그
    }

    // 보스 그리기 (체력바 포함)
    draw(ctx) {
        // 피격 시 깜빡임 효과
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "red"; // 이미지가 없을 때를 위해 색상 변경
        }
        
        super.draw(ctx); // 보스 본체 그리기
        
        ctx.globalAlpha = 1.0; // 투명도 복구

        if (!this.dead) {
            // [수정] 체력바 위치를 보스 아래쪽으로 변경 (y + height + 10)
            const barX = this.x;
            const barY = this.y + this.height + 10;
            const barWidth = this.width;
            const barHeight = 10;

            // 배경 (빨강)
            ctx.fillStyle = "red";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 현재 체력 (초록)
            const hpPercent = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            
            // 테두리
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}

class Enemy_BossTwin1 extends EnemyBoss {
    constructor(x, y) {
        super(x, y)
        this.type = "enemy_BossTwin1";
        this.width = 256;
        this.height = 256;
        this.isShotable = true;
        this.life = 30; 
        this.maxLife = 30;
        
        setInterval(() => {
            if (this.x - this.speed > 0 && this.movecicle == "Left") {
                this.x -= this.speed;
            } else if (this.x + this.width + this.speed < canvas.width / 2) {
                this.movecicle = "Right";
                this.x += this.speed;
            } else {
                this.movecicle = "Left";
            }
        }, 300);
    }
    fire() {
        const now = Date.now();
        // 0.8초마다 공격 (일반 레이저)
        if (this.isShotable && now - this.lastFire > 800) {
            gameObjects.push(new LaserGreen(this.x + 128, this.y + 236));
            this.lastFire = now;
        }
    }
}

class Enemy_BossTwin2 extends EnemyBoss {
    constructor(x, y) {
        super(x, y)
        this.type = "enemy_BossTwin2";
        this.width = 256;
        this.height = 256;
        this.isShotable = true;
        this.movecicle = "Right";
        this.life = 30; 
        this.maxLife = 30;

        setInterval(() => {
            if (this.x + this.width + this.speed < canvas.width && this.movecicle == "Right") {
                this.x += this.speed;
            } else if (this.x - this.speed > canvas.width / 2) {
                this.movecicle = "Left";
                this.x -= this.speed;
            } else {
                this.movecicle = "Right";
            }
        }, 300);
    }
    fire() {
        const now = Date.now();
        if (this.isShotable && now - this.lastFire > 800) {
            gameObjects.push(new LaserGreen(this.x + 128, this.y + 236));
            this.lastFire = now;
        }
    }
}

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    
    KEY_EVENT_C: "KEY_EVENT_C",          
    KEY_EVENT_C_UP: "KEY_EVENT_C_UP",    
    
    KEY_EVENT_Z: "KEY_EVENT_Z", 
    
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMYBOSS_LASER: "COLLISION_ENEMYBOSS_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    COLLISION_ENEMYBOSS_HERO: "COLLISION_ENEMYBOSS_HERO",
    CoLLISION_ENEMY_CANVAS: "COLLISION_ENEMY_CANVAS",
    COLLISION_HERO_LASER: "COLLISION_HERO_LASER",
    
    COLLISION_HERO_ITEM: "COLLISION_HERO_ITEM",
    COLLISION_METEOR_ENEMY: "COLLISION_METEOR_ENEMY",

    DAMAGED_HERO: "DAMAGED_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
};

let heroImg, heroLeftImg, heroRightImg, heroDamagedImg, heroShieldImg;
let enemyShipImg, enemyUFOImg, enemyBossTwinImg1, enemyBossTwinImg2;
let lifeImg, laserRedImg, laserRedShotImg, laserGreenImg, laserGreenShotImg;
let meteorImg, shieldItemImg, laserChargedImg;
let backgroundImg;

let canvas, ctx,
    gameObjects = [],
    hero,
    heroSub1, heroSub2,
    enemy,
    stageCount,
    MONSTER_TOTAL,
    MONSTER_greenShip,
    MONSTER_UFO,
    MONSTER_BOSS,
    eventEmitter = new EventEmitter();

window.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
    else if (evt.key === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    else if (evt.key === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    else if (evt.key === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE); // 기본 발사
    else if (evt.key === "c" || evt.key === "C") eventEmitter.emit(Messages.KEY_EVENT_C); // 차지 시작
    else if (evt.key === "z" || evt.key === "Z") eventEmitter.emit(Messages.KEY_EVENT_Z); // 메테오
    else if (evt.key === "Enter") eventEmitter.emit(Messages.KEY_EVENT_ENTER);
});

window.addEventListener("keyup", (evt) => {
    if (evt.key === "c" || evt.key === "C") {
        eventEmitter.emit(Messages.KEY_EVENT_C_UP); // 차지 발사
    }
});

function drawText(message, x, y) {
    ctx.fillText(message, x, y);
}

function drawLife() {
    const START_POS = canvas.width - 180;
    if (lifeImg) {
        for (let i = 0; i < hero.life; i++) {
            ctx.drawImage(lifeImg, START_POS + (45 * (i + 1)), canvas.height - 37);
        }
    } else {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Life: " + hero.life, START_POS + 50, canvas.height - 20);
    }
}

function drawPoints() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    drawText("Points: " + hero.points, 10, canvas.height - 20);
}

function drawKill() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    drawText("Kill: " + hero.kill, 10, canvas.height - 50);
}

function drawStage() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    drawText("Stage: " + stageCount, 10, 30);
}

function drawStatus() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "orange";
    ctx.textAlign = "left";
    drawText("Meteor(Z): " + hero.meteorCount + " | Charge(C)", 10, 90);
}

function drawInterface() {
    drawLife();
    drawPoints();
    drawKill();
    drawStage();
    drawStatus();
}

function isHeroDead() {
    return hero.life <= 0;
}

function isEnemiesDead() {
    return enemy.deadCount === MONSTER_TOTAL;
}

function displayMessage(message, color = "red") {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn("Failed to load image:", path);
            resolve(null); 
        }
    })
}

function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function updateGameObjects() {
    const hero_Current = gameObjects.filter((go) => go.type === "Hero");
    const enemies = gameObjects.filter((go) => go.type === "Enemy");
    const lasers = gameObjects.filter((go) => go.type === "Laser");
    const lasers_enemy = gameObjects.filter((go) => go.type === "enemyLaser");
    
    const enemies_BossTwin1 = gameObjects.filter((go) => go.type === "enemy_BossTwin1");
    const enemies_BossTwin2 = gameObjects.filter((go) => go.type === "enemy_BossTwin2");
    
    const items = gameObjects.filter((go) => go.type === "Item");
    const meteors = gameObjects.filter((go) => go.type === "Meteor");

    hero_Current.forEach((hero) => {
        if (hero.life <= 1 && !hero.isShielded) {
            eventEmitter.emit(Messages.DAMAGED_HERO, { hero });
        }
    });

    enemies.forEach((enemy) => enemy.fire());
    enemies_BossTwin1.forEach((boss) => boss.fire());
    enemies_BossTwin2.forEach((boss) => boss.fire());

    // 1. 내 레이저가 적(일반/보스)을 맞췄을 때
    lasers.forEach((l) => {
        // 1-1. 일반 적 충돌
        enemies.forEach((m) => {
            if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { first: l, second: m });
                
                let laserRedShot = new LaserRedShot(m.x, m.y);
                laserRedShot.img = laserRedShotImg;
                gameObjects.push(laserRedShot);
            }
        });

        // 1-2. 보스 1 충돌
        enemies_BossTwin1.forEach((boss) => {
            if (intersectRect(l.rectFromGameObject(), boss.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMYBOSS_LASER, { first: l, second: boss });
                
                let laserRedShot = new LaserRedShot(l.x, l.y - 50);
                laserRedShot.img = laserRedShotImg;
                gameObjects.push(laserRedShot);
            }
        });

        // 1-3. 보스 2 충돌
        enemies_BossTwin2.forEach((boss) => {
            if (intersectRect(l.rectFromGameObject(), boss.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMYBOSS_LASER, { first: l, second: boss });
                
                let laserRedShot = new LaserRedShot(l.x, l.y - 50);
                laserRedShot.img = laserRedShotImg;
                gameObjects.push(laserRedShot);
            }
        });
    });

    // 2. 적 레이저가 나를 맞췄을 때
    lasers_enemy.forEach((laser_enemy) => {
        hero_Current.forEach((hero) => {
            if (intersectRect(laser_enemy.rectFromGameObject(), hero.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_HERO_LASER, { first: laser_enemy, second: hero });
                
                let laserGreenShot = new LaserGreenShot(hero.x, hero.y);
                laserGreenShot.img = laserGreenShotImg;
                gameObjects.push(laserGreenShot);
            }
        });
    });

    // 3. 적 본체와 내가 부딪혔을 때
    enemies.forEach(enemy => {
        if (intersectRect(hero.rectFromGameObject(), enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
        if (enemy.y > canvas.height - enemy.height) {
            eventEmitter.emit(Messages.CoLLISION_ENEMY_CANVAS, { enemy });
        }
    });

    // 보스 본체 충돌
    enemies_BossTwin1.forEach(boss => {
        if (intersectRect(hero.rectFromGameObject(), boss.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMYBOSS_HERO, { enemy_Boss: boss });
        }
    });
    enemies_BossTwin2.forEach(boss => {
        if (intersectRect(hero.rectFromGameObject(), boss.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMYBOSS_HERO, { enemy_Boss: boss });
        }
    });

    // 4. 아이템 획득
    items.forEach((item) => {
        hero_Current.forEach((h) => {
            if (intersectRect(item.rectFromGameObject(), h.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_HERO_ITEM, { item });
            }
        });
    });

    // 5. 메테오와 적 충돌 (보스 포함)
    meteors.forEach((meteor) => {
        enemies.forEach((enemy) => {
            if (intersectRect(meteor.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_METEOR_ENEMY, { meteor, enemy });
            }
        });
        enemies_BossTwin1.forEach((boss) => {
            if (intersectRect(meteor.rectFromGameObject(), boss.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_METEOR_ENEMY, { meteor, enemy: boss });
            }
        });
        enemies_BossTwin2.forEach((boss) => {
            if (intersectRect(meteor.rectFromGameObject(), boss.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_METEOR_ENEMY, { meteor, enemy: boss });
            }
        });
    });

    gameObjects = gameObjects.filter((go) => !go.dead);
}

function spawnItemLoop() {
    setInterval(() => {
        if (hero && !hero.dead) {
            if (Math.random() < 0.2) {
                let x = Math.random() * (canvas.width - 50);
                gameObjects.push(new ShieldItem(x, -50));
            }
        }
    }, 8000); 
}

window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    
    heroImg = await loadTexture("assets/player.png");
    heroLeftImg = await loadTexture("assets/playerLeft.png");
    heroRightImg = await loadTexture("assets/playerRight.png");
    heroDamagedImg = await loadTexture("assets/playerDamaged.png");
    heroShieldImg = await loadTexture("assets/playerShield.png");
    
    enemyShipImg = await loadTexture("assets/enemyShip.png");
    enemyUFOImg = await loadTexture("assets/enemyUFO.png");
    enemyBossTwinImg1 = await loadTexture("assets/enemyBossTwin1.png");
    enemyBossTwinImg2 = await loadTexture("assets/enemyBossTwin2.png");
    
    laserRedImg = await loadTexture("assets/laserRed.png");
    laserRedShotImg = await loadTexture("assets/laserRedShot.png");
    laserGreenImg = await loadTexture("assets/laserGreen.png");
    laserGreenShotImg = await loadTexture("assets/laserGreenShot.png");
    laserChargedImg = await loadTexture("assets/laserCharged.png"); 
    
    lifeImg = await loadTexture("assets/life.png");
    shieldItemImg = await loadTexture("assets/shield.png");
    meteorImg = await loadTexture("assets/meteorSmall.png");
    backgroundImg = await loadTexture("assets/starBackground.png");

    let pattern;
    if (backgroundImg) {
        pattern = ctx.createPattern(backgroundImg, 'repeat');
    } else {
        pattern = "black";
    }

    stageCount = 1; 

    function initGame() {
        gameObjects = [];
        createEnemiesDraw();
        createHero();
        spawnItemLoop(); 

        let controlSpeed = 20;
        enemy.deadCount = 0;

        eventEmitter.on(Messages.KEY_EVENT_UP, () => {
            hero.y -= controlSpeed;
            if (heroSub1) heroSub1.y -= controlSpeed;
            if (heroSub2) heroSub2.y -= controlSpeed;
        });
        eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
            hero.y += controlSpeed;
            if (heroSub1) heroSub1.y += controlSpeed;
            if (heroSub2) heroSub2.y += controlSpeed;
        });
        eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
            if (hero.x - controlSpeed > 0) {
                hero.x -= controlSpeed;
                if (heroSub1) heroSub1.x -= controlSpeed;
                if (heroSub2) heroSub2.x -= controlSpeed;
            }
        });
        eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
            if (hero.x + hero.width + controlSpeed < canvas.width) {
                hero.x += controlSpeed;
                if (heroSub1) heroSub1.x += controlSpeed;
                if (heroSub2) heroSub2.x += controlSpeed;
            }
        });

        eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
             if (hero.canFire()) {
                hero.fire();
                if (heroSub1) heroSub1.fire();
                if (heroSub2) heroSub2.fire();
            }
        });

        // C키 차지
        eventEmitter.on(Messages.KEY_EVENT_C, () => {
            if (!hero.isCharging) {
                hero.startCharge();
            }
        });

        eventEmitter.on(Messages.KEY_EVENT_C_UP, () => {
            hero.fireCharged();
        });

        eventEmitter.on(Messages.KEY_EVENT_Z, () => {
            hero.useMeteor();
        });

        eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
            resetGame();
        });

        eventEmitter.on(Messages.CoLLISION_ENEMY_CANVAS, (_, { enemy: e }) => {
            e.dead = true;
            hero.decrementLife();
            enemy.deadCount += 1;
            checkGameEnd();
        });

        eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
            first.dead = true; 
            second.life -= (first.damage || 1); 

            if (second.life <= 0) {
                second.dead = true;
                enemy.deadCount += 1;
                hero.kill += 1;
                hero.incrementPoints();
                checkGameEnd();
            }
        });

        eventEmitter.on(Messages.COLLISION_ENEMYBOSS_LASER, (_, { first, second }) => {
            first.dead = true; 
            let dmg = first.damage || 1; 
            second.life -= dmg;
            second.isHit = true; // 피격 효과 켬
            setTimeout(() => { second.isHit = false; }, 100); // 0.1초 뒤 끔

            hero.incrementPoints();

            if (second.life <= 0) {
                second.dead = true;
                enemy.deadCount += 1;
                hero.kill += 1;
                hero.points += 1000;
                checkGameEnd();
            }
        });

        eventEmitter.on(Messages.COLLISION_HERO_LASER, (_, { first }) => {
            first.dead = true;
            hero.decrementLife();
            checkGameEnd();
        });

        eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy: e }) => {
            e.dead = true;
            enemy.deadCount += 1;
            hero.decrementLife();
            checkGameEnd();
        });

        eventEmitter.on(Messages.COLLISION_ENEMYBOSS_HERO, () => {
            hero.decrementLife();
            checkGameEnd();
        });

        eventEmitter.on(Messages.COLLISION_HERO_ITEM, (_, { item }) => {
            item.dead = true;
            if (item.subType === "Shield") {
                hero.activateShield();
                displayMessage("SHIELD ON!", "blue");
                setTimeout(() => { if(!isHeroDead() && !isEnemiesDead()) ctx.clearRect(0,0,0,0); }, 1000); 
            }
        });

        eventEmitter.on(Messages.COLLISION_METEOR_ENEMY, (_, { meteor, enemy: target }) => {
            let dmg = meteor.damage || 5; 
            target.life -= dmg;
            
            // 보스일 경우 피격 효과
            if(target.type.includes("Boss")) {
                target.isHit = true;
                setTimeout(() => { target.isHit = false; }, 100);
            }
            
            if (target.life <= 0) {
                target.dead = true;
                enemy.deadCount += 1;
                hero.kill += 1;
                hero.points += 500;
                checkGameEnd();
            }
        });
        
        function checkGameEnd() {
            if (isHeroDead()) {
                eventEmitter.emit(Messages.GAME_END_LOSS);
            } else if (isEnemiesDead()) {
                eventEmitter.emit(Messages.GAME_END_WIN);
            }
        }

        eventEmitter.on(Messages.GAME_END_WIN, () => endGame(true));
        eventEmitter.on(Messages.GAME_END_LOSS, () => endGame(false));
    }

    function createEnemies_greenShip(x) {
        const enemy_greenShip = new Enemy_greenShip(x, 0);
        enemy_greenShip.img = enemyShipImg;
        gameObjects.push(enemy_greenShip);
    }

    function createEnemies_UFO(x) {
        const enemy_UFO = new Enemy_UFO(x, 0);
        enemy_UFO.img = enemyUFOImg;
        gameObjects.push(enemy_UFO);
    }

    function createEnemies_BossTwin(x) {
        const y = 0;
        const enemy_BossTwin1 = new Enemy_BossTwin1(x - 256, y);
        const enemy_BossTwin2 = new Enemy_BossTwin2(x, y);
        enemy_BossTwin1.img = enemyBossTwinImg1;
        enemy_BossTwin2.img = enemyBossTwinImg2;

        gameObjects.push(enemy_BossTwin1);
        gameObjects.push(enemy_BossTwin2);
    }

    function createEnemiesDraw() {
        let delay = 0;
        enemy = new Enemy();
        enemy.deadCount = 0;
        MONSTER_greenShip = stageCount * 2; 
        MONSTER_UFO = stageCount * 2;
        MONSTER_BOSS = 0;

        // 5스테이지거나 테스트용 5 설정이면 보스 등장
        if (stageCount % 5 === 0) { 
            MONSTER_BOSS = 2;
        }

        MONSTER_TOTAL = MONSTER_UFO + MONSTER_greenShip + MONSTER_BOSS;

        if (MONSTER_BOSS > 0) {
            createEnemies_BossTwin(canvas.width / 2);
        }

        let maxMonsters = Math.max(MONSTER_greenShip, MONSTER_UFO);
        for (let x = 0; x < maxMonsters; x++) {
            let Enemy_greenShipX = Math.floor(Math.random() * (canvas.width - 98))
            let Enemy_UFOX = Math.floor(Math.random() * (canvas.width - 98))
            
            if (x < MONSTER_greenShip) {
                setTimeout(() => {
                    createEnemies_greenShip(Enemy_greenShipX);
                }, delay);
            }
            if (x < MONSTER_UFO) {
                setTimeout(() => {
                    createEnemies_UFO(Enemy_UFOX);
                }, delay);
            }
            delay += 1500; 
        }
    }

    function createHero() {
        hero = new Hero(
            canvas.width / 2 - 45,
            canvas.height - canvas.height / 4
        );

        heroSub1 = new HeroSub(
            canvas.width / 2 + 75,
            canvas.height - (canvas.height / 4) + 30
        );

        heroSub2 = new HeroSub(
            canvas.width / 2 - 100,
            canvas.height - (canvas.height / 4) + 30
        );

        hero.img = heroImg;
        heroSub1.img = heroImg;
        heroSub2.img = heroImg;

        gameObjects.push(hero);
        gameObjects.push(heroSub1);
        gameObjects.push(heroSub2);
    }

    function drawGameObjects(ctx) {
        gameObjects.forEach(go => go.draw(ctx));
    }

    function endGame(win) {
        clearInterval(gameLoopId);
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (win) {
                if (stageCount == 5) {
                    displayMessage("Victory!!! Press [Enter] to Restart", "green");
                    stageCount = 1;
                } else {
                    stageCount++;
                    displayMessage("Stage Cleared! Next Stage... Press [Enter]", "yellow");
                }
            } else {
                displayMessage("You died !!! Press [Enter] to Restart");
                stageCount = 1;
            }
        }, 200)
    }

    function resetGame() {
        if (gameLoopId) {
            clearInterval(gameLoopId);
            eventEmitter.clear();
            initGame();
            gameLoopId = setInterval(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawInterface();
                updateGameObjects();
                drawGameObjects(ctx);
            }, 100);
        }
    }

    initGame();
    let gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameObjects(ctx);
        updateGameObjects();
        drawInterface();
    }, 100);
};