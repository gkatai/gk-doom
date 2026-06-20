# Canvas 2D with putImageData over WebGL

We render by writing pixels into a `Uint8ClampedArray` buffer on the CPU and flushing it to a `<canvas>` element each frame via `putImageData`. WebGL was considered but rejected: the BSP column-drawing model is CPU-native (one vertical strip at a time), doesn't map naturally to a GPU pipeline, and would add GLSL shader complexity with no benefit at our target resolution. Canvas 2D gives full per-pixel control with zero extra setup.
