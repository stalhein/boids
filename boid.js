const VIEW_DISTANCE = 100;
const VIEW_DISTANCE_SQUARED = VIEW_DISTANCE ** 2;
const FOV = Math.PI / 2;
const MAX_ROTATION = 0.7;

export class Boid {
    constructor(ctx, x, y, angle) {
        this.ctx = ctx;

        this.speed = 200;
        this.angle = angle;
        this.x = x;
        this.y = y;
    }

    update(dt, boids, width, height) {        
        const vx = Math.cos(this.angle);
        const vy = Math.sin(this.angle);

        let ax = 0;
        let ay = 0;
        let aCount = 0;

        for (const boid of boids) {
            if (boid === this) continue;

            const dx = boid.x - this.x;
            const dy = boid.y - this.y;

            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > VIEW_DISTANCE_SQUARED)  continue;

            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;

            const dotProduct = vx * nx + vy * ny;
            if (dotProduct < Math.cos(FOV)) continue;


            // Seperation
            const boidAngle = Math.atan2(-dy, -dx);

            let angleDifference = boidAngle - this.angle;
            angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

            angleDifference = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angleDifference));

            const factor = 1 - distance / VIEW_DISTANCE;
            this.angle -= angleDifference * factor * dt;

            // Alignment
            ax += Math.cos(boid.angle);
            ay += Math.sin(boid.angle);
            aCount++;
        }

        if (aCount > 0) {
            ax /= aCount;
            ay /= aCount;

            const angle = Math.atan2(ay, ax);

            let angleDifference = angle - this.angle;
            angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

            angleDifference = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angleDifference));
            
            this.angle += angleDifference * 2 * dt;
        }

        const dx = Math.cos(this.angle) * this.speed;
        const dy = Math.sin(this.angle) * this.speed;

        this.x += dx * dt;
        this.y += dy * dt;

        if (this.x < 0) this.x = width-5;
        if (this.x > width) this.x = 5;
        if (this.y < 0) this.y = height-5;
        if (this.y > height) this.y = 5;
    }

    render() {
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.x, this.y, 10, 10);
    }
}