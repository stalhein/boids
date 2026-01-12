const SEPERATION_DISTANCE = 35;
const ALIGNMENT_DISTANCE = 70;
const COHESION_DISTANCE = 120;
const FOV = Math.PI / 2;

const SEPERATION_MULT = 5;
const ALIGNMENT_MULT = 3;
const COHESION_MULT = 2;

const EDGE_BUFFER = 30;

export class Boid {
    constructor(ctx, x, y, angle) {
        this.ctx = ctx;

        this.speed = Math.random()*50 + 300;
        
        this.x = x;
        this.y = y;

        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);

        this.randomAngle = Math.random() * 2 * Math.PI;
    }

    update(dt, boids, width, height) {
        const vx = this.vx;
        const vy = this.vy;

        let sX = 0;
        let sY = 0;

        let ax = 0;
        let ay = 0;
        let aCount = 0;

        let cX = 0;
        let cY = 0;
        let cCount = 0;

        for (const boid of boids) {
            if (boid === this) continue;

            const dx = boid.x - this.x;
            const dy = boid.y - this.y;

            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared == 0)   continue;

            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;

            if (distanceSquared < SEPERATION_DISTANCE ** 2) {    // Seperation
                const factor = 1 - distance / SEPERATION_DISTANCE;
                sX -= nx * factor;
                sY -= ny * factor;
            }

            const dotProduct = vx * nx + vy * ny;
            if (dotProduct < Math.cos(FOV)) continue;

            if (distanceSquared < ALIGNMENT_DISTANCE ** 2) {    // Alignment
                ax += boid.vx;
                ay += boid.vy;
                aCount++;
            }

            if (distanceSquared < COHESION_DISTANCE ** 2) {     // Cohesion
                cX += boid.x;
                cY += boid.y;
                cCount++;
            }
        }

        // Seperation
        this.vx += sX * SEPERATION_MULT;
        this.vy += sY * SEPERATION_MULT;

        // Alignment
        if (aCount > 0) {
            ax /= aCount;
            ay /= aCount;

            this.vx += ax * ALIGNMENT_MULT;
            this.vy += ay * ALIGNMENT_MULT;
        }

        // Cohesion
        if (cCount > 0) {
            cX /= cCount;
            cY /= cCount;

            this.vx += (cX - this.x) * COHESION_MULT * 0.001;
            this.vy += (cY - this.y) * COHESION_MULT * 0.001;
        }

        // Update
        // Normalize
        let factor = Math.hypot(this.vx, this.vy);
        this.vx /= factor;
        this.vy /= factor;

        this.randomAngle += (Math.sin(performance.now() * 0.001 * this.x)) * 0.002;
        this.vx += Math.cos(this.randomAngle) * 0.1;
        this.vy += Math.sin(this.randomAngle) * 0.1;

        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;

        if (this.x < EDGE_BUFFER) this.vx += 0.5;
        if (this.x > width - EDGE_BUFFER) this.vx -= 0.5;
        if (this.y < EDGE_BUFFER) this.vy += 0.5;
        if (this.y > height - EDGE_BUFFER) this.vy -= 0.5;
    }

    render() {
        const angle = Math.atan2(this.vy, this.vx);

        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = "rgb(71, 153, 235)";
        this.ctx.beginPath();
        this.ctx.moveTo(8, 0);
        this.ctx.lineTo(-6, 4);
        this.ctx.lineTo(-6, -4);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
}