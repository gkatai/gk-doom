import * as Renderer from "./renderer.js";

/**
 * @param {import('./model.js').Model} model
 * @param {number} _deltaTime
 */
function update(model, _deltaTime) {
  // Read input state — stub for future issues
  model.input.mouseDeltaX = 0;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('./model.js').Model} model
 */
function start(canvas, model) {
  let lastTimestamp = 0;

  /**
   * @param {number} timestamp
   */
  function frame(timestamp) {
    const deltaTime = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    update(model, deltaTime);
    Renderer.render(canvas, model);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

export { start };
