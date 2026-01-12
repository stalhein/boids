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

document.addEventListener("click", (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    if (e.clientX < canvasRect.left || e.clientY < canvasRect.top)  return;
    const boid = new Boid(ctx, e.clientX-canvasRect.left, e.clientY-canvasRect.top, (Math.random()-0.5) * Math.PI);
    boids.push(boid);
});

document.getElementById("clearButton").addEventListener("click", () => {
    boids = [];
});

document.getElementById("addButton").addEventListener("click", () => {
    const number = document.getElementById("number").value;
    if (!number || number <= 0 || number >= 200) {
        alert("Please enter a valid number of boids!");
        return;
    }
    for (let i = 0; i < number; ++i) {
        const boid = new Boid(ctx, Math.random()*canvas.width, Math.random()*canvas.height, (Math.random()-0.5) * Math.PI);
        boids.push(boid);
    }
});

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