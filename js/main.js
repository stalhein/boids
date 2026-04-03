import { BoidManager } from "./boidmanager.js";

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const boidManager = new BoidManager(ctx, 3000);

let lastTime = performance.now();
function loop(time) {
  // Update
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  boidManager.update(deltaTime);


  // Render
  ctx.fillStyle = "rgb(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  boidManager.render();


  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
