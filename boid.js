const SEPERATION_DISTANCE = 35;
const ALIGNMENT_DISTANCE = 70;
const COHESION_DISTANCE = 120;
const FOV = Math.PI / 2;
const MAX_ROTATION = 0.7;

const SEPERATION_MULT = 3.5;
const ALIGNMENT_MULT = 3;
const COHESION_MULT = 2;

const EDGE_BUFFER = 30;

export class Boid {
    constructor(ctx, x, y, angle) {
        this.ctx = ctx;

        this.speed = Math.random()*100 + 150;
        this.angle = angle;
        this.x = x;
        this.y = y;
    }

    update(dt, boids, width, height) {        
        const vx = Math.cos(this.angle);
        const vy = Math.sin(this.angle);

        let sAngle = 0;

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

            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;

            if (distanceSquared < SEPERATION_DISTANCE ** 2) {    // Seperation
                const boidAngle = Math.atan2(-dy, -dx);

                let angleDifference = boidAngle - this.angle;
                angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

                angleDifference = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angleDifference));

                const factor = 1 - distance / SEPERATION_DISTANCE;
                sAngle -= angleDifference * factor;
            }

            const dotProduct = vx * nx + vy * ny;
            if (dotProduct < Math.cos(FOV)) continue;

            if (distanceSquared < ALIGNMENT_DISTANCE ** 2) {    // Alignment
                ax += Math.cos(boid.angle);
                ay += Math.sin(boid.angle);
                aCount++;
            }

            if (distanceSquared < COHESION_DISTANCE ** 2) {     // Cohesion
                cX += boid.x;
                cY += boid.y;
                cCount++;
            }
        }

        // Seperation
        this.angle += sAngle * SEPERATION_MULT * dt;

        // Alignment
        if (aCount > 0) {
            ax /= aCount;
            ay /= aCount;

            const angle = Math.atan2(ay, ax);

            let angleDifference = angle - this.angle;
            angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

            angleDifference = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angleDifference));
            
            this.angle += angleDifference * ALIGNMENT_MULT * dt;
        }

        // Cohesion
        if (cCount > 0) {
            cX /= cCount;
            cY /= cCount;

            const dx = cX - this.x;
            const dy = cY - this.y;

            let toAvgAngle = Math.atan2(dy, dx);
            toAvgAngle = (toAvgAngle + Math.PI) % (2 * Math.PI) - Math.PI;

            toAvgAngle = Math.max(-MAX_ROTATION*0.5, Math.min(MAX_ROTATION*0.5, toAvgAngle));

            this.angle += toAvgAngle * COHESION_MULT * dt;
        }

        // Update
        const dx = Math.cos(this.angle) * this.speed;
        const dy = Math.sin(this.angle) * this.speed;

        this.x += dx * dt;
        this.y += dy * dt;

        if (this.angle > Math.PI * 2)    this.angle -= Math.PI * 2;
        if (this.angle < 0)    this.angle += Math.PI * 2;

        if (this.x < EDGE_BUFFER) {
            const deltaAngle = this.angle < Math.PI ? -0.5 : 0.5;
            this.angle += deltaAngle;
        } else if (this.x > width - EDGE_BUFFER) {
            const deltaAngle = this.angle < Math.PI ? 0.5 : -0.5;
            this.angle += deltaAngle;
        }

        if (this.y < EDGE_BUFFER) {
            const deltaAngle = this.angle < Math.PI/2 && this.angle > -Math.PI/2 ? -0.5 : 0.5;
            this.angle += deltaAngle;
        } else if (this.y > height - EDGE_BUFFER) {
            const deltaAngle = this.angle < Math.PI/2 && this.angle > -Math.PI/2 ? 0.5 : -0.5;
            this.angle += deltaAngle;
        }
    }

    render() {
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.x, this.y, 2, 2);
    }
}