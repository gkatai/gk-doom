import * as Renderer from "./renderer.js";
import { applyMovement } from "./movement.js";

/**
 * @param {import('./model.js').Model} model
 * @param {number} deltaTime
 */
function update(model, deltaTime) {
  applyMovement(model, deltaTime);
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
