import * as Input from "./input.js";
import * as Renderer from "./renderer.js";

/**
 * @param {number} _deltaTime
 */
function update(_deltaTime) {
  // Read input state — stub for future issues
  Input.consumeMouseDeltaX();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import("@gk-doom/wad").Wad} _wad
 */
function start(canvas, _wad) {
  let lastTimestamp = 0;

  /**
   * @param {number} timestamp
   */
  function frame(timestamp) {
    const deltaTime = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    update(deltaTime);
    Renderer.render(canvas, Input.isPointerLocked());

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

export { start };
