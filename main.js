import {Boid} from "./boid.js";

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const boids = [];

for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 10; ++y) {
        const boid = new Boid(ctx, x * 30, y*30);
        boids.push(boid);
    }
}

let lastTime = performance.now();
function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    for (const boid of boids) {
        boid.update(dt, boids, canvas.width, canvas.height);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const boid of boids) {
        boid.render();
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);