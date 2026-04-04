import { BoidManager } from "./boidmanager.js";

// Setup WebGPU
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("WebGPU not supported.");
}
const device = await adapter.requestDevice();

const context = canvas.getContext("webgpu");
const format = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format,
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const boidManager = new BoidManager(context, device, format, 10000);

let lastTime = performance.now();
function loop(time) {
  // Update
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  boidManager.update(deltaTime);


  // Render

  boidManager.render();


  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
