const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const currentScore = document.querySelector("#currentScore");
const modal = document.querySelector("#modal");
const startBtn = modal.querySelector("#startBtn");
const finalScore = document.querySelector("#finalScore");

class Player {
  constructor(radius, color) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = radius;
    this.color = color;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class Projectile {
  constructor(radius, color, velocity, offsetX, offsetY) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = radius;
    this.color = color;

    const xFromCenter = offsetX - this.x;
    const yFromCenter = offsetY - this.y;
    this.vx =
      (velocity * xFromCenter) / Math.sqrt(xFromCenter ** 2 + yFromCenter ** 2);
    this.vy =
      (velocity * yFromCenter) / Math.sqrt(xFromCenter ** 2 + yFromCenter ** 2);
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  update(ctx) {
    this.draw(ctx);
    this.x += this.vx;
    this.y += this.vy;
  }
}

class Enemy {
  constructor(projectileRadius, velocity) {
    this.radius = (Math.ceil(4 * Math.random()) + 1) * projectileRadius * 2;

    if (Math.random() < 0.5) {
      this.x =
        Math.random() < 0.5 ? 0 - this.radius : canvas.width + this.radius;
      this.y = Math.random() * canvas.height;
    } else {
      this.x = Math.random() * canvas.width;
      this.y =
        Math.random() < 0.5 ? 0 - this.radius : canvas.height + this.radius;
    }

    const colors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];
    const colorIndex = Math.floor(Math.random() * colors.length);
    this.color = colors[colorIndex];

    this.angle = Math.atan2(
      canvas.height / 2 - this.y,
      canvas.width / 2 - this.x
    );
    this.velocity = {
      x: Math.cos(this.angle) * velocity,
      y: Math.sin(this.angle) * velocity,
    };
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  update(ctx) {
    this.draw(ctx);
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Particle {
  constructor(x, y, radius, color, velocity, friction) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;

    this.velocity = {
      x: (Math.random() - 0.5) * velocity,
      y: (Math.random() - 0.5) * velocity,
    };

    this.friction = friction;
    this.alpha = 1;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  update(ctx) {
    this.draw(ctx);
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.alpha -= 0.01;
  }
}

const PLAYER_RADIUS = 15;
const PROJECTILE_RADIUS = 3;
const PROJECTILE_VELOCITY = 7;
const ENEMY_VELOCITY = 2;

let player = new Player(PLAYER_RADIUS, "#fcc419");
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  player = new Player(PLAYER_RADIUS, "#fcc419");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  currentScore.innerHTML = score;
}

canvas.addEventListener("click", (e) => {
  projectiles.push(
    new Projectile(
      PROJECTILE_RADIUS,
      "#fcc419",
      PROJECTILE_VELOCITY,
      e.offsetX,
      e.offsetY
    )
  );
});

let spawnEnemy = setInterval(() => {
  enemies.push(new Enemy(PROJECTILE_RADIUS, ENEMY_VELOCITY));
}, 1000);

let score = 0;
function animate() {
  let animateId = requestAnimationFrame(animate);
  ctx.fillStyle = "rgb(255, 255, 255, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.draw(ctx);

  // remove projectile when it's out of screen
  projectiles.forEach((projectile, index) => {
    projectile.update(ctx);
    if (
      projectile.x - projectile.radius > canvas.width ||
      projectile.x + projectile.radius < 0 ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      });
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update(ctx);

    //touch enemy : remove projectile, reduce enemy radius, remove enemy, create particles, update score
    projectiles.forEach((projectile, projectileIndex) => {
      if (
        Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <
        enemy.radius + projectile.radius
      ) {
        setTimeout(() => {
          //remove projectile radius
          projectiles.splice(projectileIndex, 1);

          //reduce enemy radius
          enemy.radius -= projectile.radius * 2;

          //remove enemy, update score
          if (enemy.radius <= PROJECTILE_RADIUS * 2) {
            enemies.splice(index, 1);
            score += 200;
          } else {
            score += 100;
          }
          currentScore.innerHTML = score;

          //create particles
          for (let i = 0; i < enemy.radius; i++) {
            particles.push(
              new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 3,
                enemy.color,
                Math.random() * 8,
                0.99
              )
            );
          }
        }, 0);
      }
    });

    // particle fade out and update
    particles.forEach((particle, index) => {
      if (particle.alpha <= 0) {
        particles.splice(index, 1);
      } else {
        particle.update(ctx);
      }
    });

    //contact player : end game
    if (
      Math.hypot(enemy.x - canvas.width / 2, enemy.y - canvas.height / 2) <
      enemy.radius + PLAYER_RADIUS
    ) {
      setTimeout(() => {
        enemies.splice(index, 1);
        cancelAnimationFrame(animateId);
        clearInterval(spawnEnemy);
        finalScore.innerHTML = score;
        modal.classList.remove("hidden");
      });
    }
  });
}

//start button eventhandler
startBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  init();
  animate();
  spawnEnemy = setInterval(() => {
    enemies.push(new Enemy(PROJECTILE_RADIUS, ENEMY_VELOCITY));
  }, 1000);
});

animate();
