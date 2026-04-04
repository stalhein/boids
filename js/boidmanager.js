export class BoidManager {
  constructor(context, device, format, numberBoids) {
    this.context = context;
    this.device = device;
    this.format = format;
    this.number = numberBoids;

    this.boidData = new Float32Array(this.number * 4);

    for (let i = 0; i < this.number; ++i) {
      this.boidData[i * 4 + 0] = Math.random() * context.canvas.width;
      this.boidData[i * 4 + 1] = Math.random() * context.canvas.height;
      this.boidData[i * 4 + 2] = (Math.random() - 0.5) * 100;
      this.boidData[i * 4 + 3] = (Math.random() - 0.5) * 100;
    }

    this.boidBuffer = device.createBuffer({
      size: this.boidData.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.boidBuffer.getMappedRange()).set(this.boidData);
    this.boidBuffer.unmap();

    this.shader = device.createShaderModule({
      code: `
      struct Boid {
        position: vec2<f32>,
        velocity: vec2<f32>,
      };

      @group(0) @binding(0)
      var<storage, read> boids: array<Boid>;

      @group(0) @binding(1)
      var<uniform> screen: vec2<f32>;

      struct VSOut {
        @builtin(position) position: vec4<f32>,
        @location(0) speed: f32,
      };

      @vertex 
      fn vs_main(
        @builtin(instance_index) i: u32,
        @builtin(vertex_index) v: u32 
      ) -> VSOut {
        let b = boids[i];

        let speed = length(b.velocity);
        let direction = normalize(b.velocity);
        let perpendicular = vec2<f32>(-direction.y, direction.x);

        var offset = vec2<f32>(0.0);

        if (v == 0u) {
          offset = direction * 6.0;
        } else if (v == 1u) {
          offset = -direction * 3.0 + perpendicular * 2.0;
        } else {
          offset = -direction * 3.0 - perpendicular * 2.0;
        }

        let position = b.position + offset;

        let clip = vec2<f32>(
          (position.x / screen.x) * 2.0 - 1.0,
          1.0 - (position.y / screen.y) * 2.0
        );

        var out: VSOut;
        out.position = vec4<f32>(clip, 0.0, 1.0);
        out.speed = speed;
        return out;
      }

      @fragment
      fn fs_main(@location(0) speed: f32) -> @location(0) vec4<f32> {
        let t = clamp(speed / 200.0, 0.0, 1.0);
        return vec4<f32>(0.2+t, 0.7, 0.2, 1.0);
      }
      `,
    });

    this.screenBuffer = device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      this.screenBuffer,
      0,
      new Float32Array([context.canvas.width, context.canvas.height]),
    );

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.boidBuffer } },
        { binding: 1, resource: { buffer: this.screenBuffer } },
      ],
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      vertex: {
        module: this.shader,
        entryPoint: "vs_main",
      },
      fragment: {
        module: this.shader,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  update(deltaTime) {}

  render() {
    const encoder = this.device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(3, this.number);

    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
