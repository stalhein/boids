export class Boid {
    constructor(ctx, x, y, angle) {
        this.ctx = ctx;

        this.speed = 60;
        this.angle = 0;
        this.x = x;
        this.y = y;
    }

    update(dt, boids, width, height) {
        for (const boid of boids) {
            if (boid === this) continue;

            const dx = boid.x - this.x;
            const dy = boid.y - this.y;


            if (dx * dx + dy * dy < 1000) {
                const boidAngle = Math.atan2(dy, dx);
                let angleDifference = boidAngle - this.angle;
                angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

                if (angleDifference > 0.05) angleDifference = 0.05;
                if (angleDifference < -0.05) angleDifference = -0.05;

                this.angle -= angleDifference;

            }
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