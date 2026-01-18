import {Boid} from "./boid.js";

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

let boids = [];

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

document.getElementById("slider").addEventListener("input", () => {
    const number = document.getElementById("slider").value;
    document.getElementById("numberBoids").innerText = number;
    const newNumber = number - boids.length;
    if (newNumber > 0) {
        for (let i = 0; i < newNumber; ++i) {
            const boid = new Boid(ctx, Math.random()*canvas.width, Math.random()*canvas.height, (Math.random()-0.5) * Math.PI);
            boids.push(boid);
        }
    } else if (newNumber < 0) {
        for (let i = 0; i < -newNumber; ++i) {
            boids.pop();
        }
    }
});

for (let i = 0; i < 100; ++i) {
    const boid = new Boid(ctx, Math.random()*canvas.width, Math.random()*canvas.height, (Math.random()-0.5) * Math.PI);
    boids.push(boid);
}
let lastTime = performance.now();
function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    for (const boid of boids) {
        boid.update(dt, boids, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgb(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const boid of boids) {
        boid.render();
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);