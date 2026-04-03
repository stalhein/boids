const SEPERATION_DISTANCE = 30;
const ALIGNMENT_DISTANCE = 80;
const COHESION_DISTANCE = 150;

const SEPERATION_MULT = 3;
const ALIGNMENT_MULT = 0.05;
const COHESION_MULT = 0.015;

const MIN_SPEED = 100;
const MAX_SPEED = 200;

const TILE_SIZE = Math.max(SEPERATION_DISTANCE, Math.max(ALIGNMENT_DISTANCE, COHESION_DISTANCE));

export class BoidManager {
  constructor(ctx, numberBoids) {
    this.ctx = ctx;
    this.number = numberBoids;

    this.posX = new Float32Array(numberBoids);
    this.posY = new Float32Array(numberBoids);
    this.velX = new Float32Array(numberBoids);
    this.velY = new Float32Array(numberBoids);

    this.tileCols = ctx.canvas.width / TILE_SIZE;
    this.tileRows = ctx.canvas.height / TILE_SIZE;
    this.firstTileBoid = new Int32Array(this.tileCols * this.tileRows);
    this.nextTileBoid = new Int32Array(numberBoids);

    for (let i = 0; i < numberBoids; ++i) {
      this.posX[i] = Math.random() * ctx.canvas.width;
      this.posY[i] = Math.random() * ctx.canvas.height;
      this.velX[i] = Math.cos(Math.random() * Math.PI * 2) * 100;
      this.velY[i] = Math.sin(Math.random() * Math.PI * 2) * 100;
    }
  }

  update(deltaTime) {
    const cw = this.ctx.canvas.width;
    const ch = this.ctx.canvas.height;

    // Create tile grid
    this.firstTileBoid.fill(-1);
    for (let i = 0; i < this.number; ++i) {
      const tileCol = Math.floor(this.posX[i] / TILE_SIZE);
      const tileRow = Math.floor(this.posY[i] / TILE_SIZE);

      const index = this.tileCols * tileRow + tileCol;

      this.nextTileBoid[i] = this.firstTileBoid[index];
      this.firstTileBoid[index] = i;
    }

    // Move boids 

    for (let i = 0; i < this.number; ++i) {
      const tileCol = Math.floor(this.posX[i] / TILE_SIZE);
      const tileRow = Math.floor(this.posY[i] / TILE_SIZE);

      let sX = 0, sY = 0;
      let aX = 0, aY = 0, aCount = 0;
      let cX = 0, cY = 0, cCount = 0;

      for (let dr = -1; dr <= 1; ++dr) {
        for (let dc = -1; dc <= 1; ++dc) {
          const row = tileRow + dr;
          const col = tileCol + dc;

          if (row < 0 || row >= this.tileRows || col < 0 || col >= this.tileCols) continue;

          const index = row * this.tileCols + col;

          let neighbour = this.firstTileBoid[index];

          while (neighbour >= 0) {
            if (neighbour != i) {
              const dx = this.posX[neighbour] - this.posX[i];
              const dy = this.posY[neighbour] - this.posY[i];

              const distanceSquared = dx*dx + dy*dy;

              if (distanceSquared <= 0) {
                neighbour = this.nextTileBoid[neighbour];
                continue;
              }

              const distance = Math.sqrt(distanceSquared);

              // Seperation
              if (distance <= SEPERATION_DISTANCE) {
                const factor = 1 - distance / SEPERATION_DISTANCE;
                sX -= (dx / distance) * factor;
                sY -= (dy / distance) * factor;
              }

              // Alignment 
              if (distance <= ALIGNMENT_DISTANCE) {
                aX += this.velX[neighbour];
                aY += this.velY[neighbour];
                aCount++;
              }

              // Cohesion 
              if (distance <= COHESION_DISTANCE) {
                cX += this.posX[neighbour];
                cY += this.posY[neighbour];
                cCount++;
              }
            }

            neighbour = this.nextTileBoid[neighbour];
          }
        }
      }

      // Apply velocity
      let accelerationX = 0;
      let accelerationY = 0;

      accelerationX += sX * SEPERATION_MULT * 0.5;
      accelerationY += sY * SEPERATION_MULT * 0.5;

      if (aCount > 0) {
        accelerationX += (aX / aCount - this.velX[i]) * ALIGNMENT_MULT;
        accelerationY += (aY / aCount - this.velY[i]) * ALIGNMENT_MULT;
      }
      
      if (cCount > 0) {
        accelerationX += ((cX / cCount) - this.posX[i]) * COHESION_MULT;
        accelerationY += ((cY / cCount) - this.posY[i]) * COHESION_MULT;
      }

      this.velX[i] += accelerationX;
      this.velY[i] += accelerationY;

      const speed = Math.hypot(this.velX[i], this.velY[i]);

      if (speed > MAX_SPEED) {
        this.velX[i] = (this.velX[i] / speed) * MAX_SPEED;
        this.velY[i] = (this.velY[i] / speed) * MAX_SPEED;
      } else if (speed < MIN_SPEED && speed > 0) {
        this.velX[i] = (this.velX[i] / speed) * MIN_SPEED;
        this.velY[i] = (this.velY[i] / speed) * MIN_SPEED;
      }

      this.posX[i] += this.velX[i] * deltaTime;
      this.posY[i] += this.velY[i] * deltaTime;


      if (this.posX[i] < 0) this.posX[i] += cw;
      if (this.posX[i] >= cw) this.posX[i] -= cw;
      if (this.posY[i] < 0) this.posY[i] += ch;
      if (this.posY[i] >= ch) this.posY[i] -= ch;
    }
  }

  render() {
    for (let i = 0; i < this.number; ++i) {
      const x = this.posX[i];
      const y = this.posY[i];
      const angle = Math.atan2(this.velY[i], this.velX[i]);

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);

      this.ctx.fillStyle = "rgb(71, 153, 235)";
      this.ctx.beginPath();
      this.ctx.moveTo(4, 0);
      this.ctx.lineTo(-3, 2);
      this.ctx.lineTo(-3, -2);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }
  }
};
