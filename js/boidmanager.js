const SEPERATION_DISTANCE = 25;
const ALIGNMENT_DISTANCE = 60;
const COHESION_DISTANCE = 110;

const COHESION_DISTANCE_SQUARED = COHESION_DISTANCE ** 2;

const SEPERATION_MULT = 3.5;
const ALIGNMENT_MULT = 0.043;
const COHESION_MULT = 0.018;
const WANDER_MULT = 6;

const MIN_SPEED = 120;
const MAX_SPEED = 200;

const BORDER = 100;
const ICE = 6; // Border force lol

const FOV = (3 / 4) * Math.PI;
const FOV_COS = Math.cos(FOV);

const TILE_SIZE = Math.max(
  SEPERATION_DISTANCE,
  Math.max(ALIGNMENT_DISTANCE, COHESION_DISTANCE),
);

const COLOUR_CACHE = [];
for (let i = 0; i < 20; ++i) {
  const s = i / 20;
  const r = Math.floor(20 + 200 * s);
  const g = Math.floor(150 + 10 * s);
  const b = Math.floor(10 + 10 * s);
  COLOUR_CACHE.push(`rgb(${r}, ${g}, ${b})`);
}

export class BoidManager {
  constructor(ctx, numberBoids) {
    this.ctx = ctx;
    this.number = numberBoids;

    this.posX = new Float32Array(numberBoids);
    this.posY = new Float32Array(numberBoids);
    this.velX = new Float32Array(numberBoids);
    this.velY = new Float32Array(numberBoids);

    this.tileCols = Math.ceil(ctx.canvas.width / TILE_SIZE);
    this.tileRows = Math.ceil(ctx.canvas.height / TILE_SIZE);
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
      const tileCol = Math.max(
        0,
        Math.min(Math.floor(this.posX[i] / TILE_SIZE), this.tileCols - 1),
      );
      const tileRow = Math.max(
        0,
        Math.min(Math.floor(this.posY[i] / TILE_SIZE), this.tileRows - 1),
      );

      const index = this.tileCols * tileRow + tileCol;

      this.nextTileBoid[i] = this.firstTileBoid[index];
      this.firstTileBoid[index] = i;
    }

    // Move boids

    for (let i = 0; i < this.number; ++i) {
      const tileCol = Math.max(
        0,
        Math.min(Math.floor(this.posX[i] / TILE_SIZE), this.tileCols - 1),
      );
      const tileRow = Math.max(
        0,
        Math.min(Math.floor(this.posY[i] / TILE_SIZE), this.tileRows - 1),
      );

      let sX = 0,
        sY = 0;
      let aX = 0,
        aY = 0,
        aCount = 0;
      let cX = 0,
        cY = 0,
        cCount = 0;

      const s = Math.hypot(this.velX[i], this.velY[i]);
      let fX = 0,
        fY = 0;
      if (s > 0) {
        fX = this.velX[i] / s;
        fY = this.velY[i] / s;
      }

      for (let dr = -1; dr <= 1; ++dr) {
        for (let dc = -1; dc <= 1; ++dc) {
          const row = tileRow + dr;
          const col = tileCol + dc;

          if (
            row < 0 ||
            row >= this.tileRows ||
            col < 0 ||
            col >= this.tileCols
          )
            continue;

          const index = row * this.tileCols + col;

          let neighbour = this.firstTileBoid[index];

          while (neighbour >= 0) {
            if (neighbour != i) {
              const dx = this.posX[neighbour] - this.posX[i];
              const dy = this.posY[neighbour] - this.posY[i];

              const distanceSquared = dx * dx + dy * dy;

              if (
                distanceSquared <= 0 ||
                distanceSquared > COHESION_DISTANCE_SQUARED
              ) {
                neighbour = this.nextTileBoid[neighbour];
                continue;
              }

              const distance = Math.sqrt(distanceSquared);

              const directionX = dx / distance;
              const directionY = dy / distance;

              if (fX * directionX + fY * directionY < FOV_COS) {
                neighbour = this.nextTileBoid[neighbour];
                continue;
              }

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
        accelerationX += (cX / cCount - this.posX[i]) * COHESION_MULT;
        accelerationY += (cY / cCount - this.posY[i]) * COHESION_MULT;
      }

      accelerationX += (Math.random() - 0.5) * WANDER_MULT;
      accelerationY += (Math.random() - 0.5) * WANDER_MULT;

      if (this.posX[i] < BORDER) accelerationX += ICE;
      else if (this.posX[i] > cw - BORDER) accelerationX -= ICE;

      if (this.posY[i] < BORDER) accelerationY += ICE;
      else if (this.posY[i] > ch - BORDER) accelerationY -= ICE;

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
    }
  }

  render() {
    for (let i = 0; i < this.number; ++i) {
      const x = this.posX[i];
      const y = this.posY[i];

      const speedSquared = this.velX[i] ** 2 + this.velY[i] ** 2;

      const colourIndex = Math.min(Math.floor((speedSquared / MAX_SPEED**2)*20), 19);

      const speed = Math.sqrt(speedSquared);
      const cos = this.velX[i] / speed;
      const sin = this.velY[i] / speed;

      this.ctx.fillStyle = COLOUR_CACHE[colourIndex];
      this.ctx.beginPath();

      this.ctx.moveTo(x+2*cos, y+2*sin);
      this.ctx.lineTo(x-1.5*cos-sin, y-1.5*sin+cos);
      this.ctx.lineTo(x-1.5*cos+sin, y-1.5*sin-cos);

      this.ctx.closePath();
      this.ctx.fill();
    }
  }
}
