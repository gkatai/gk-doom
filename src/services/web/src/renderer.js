/** @type {number} Internal rendering width in pixels */
export const WIDTH = 640;

/** @type {number} Internal rendering height in pixels */
export const HEIGHT = 400;

const buffer = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {ImageData} */
let imageData;
/** @type {HTMLElement | null} */
let overlay = null;

/**
 * Stores the canvas element and its 2D context, creates an ImageData from the buffer.
 * @param {HTMLCanvasElement} canvas
 */
function init(canvas) {
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Can't get 2d context");
  ctx = context;

  imageData = ctx.createImageData(WIDTH, HEIGHT);
  overlay = document.getElementById("overlay");
}

/**
 * Clears the pixel buffer to black, flushes to the canvas via `putImageData`,
 * and toggles the overlay visibility based on pointer lock state.
 * @param {HTMLCanvasElement} _canvas
 * @param {import('./model.js').Model} model
 */
function render(_canvas, model) {
  // Clear buffer to black (RGBA 0,0,0,255)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 0; // R
    buffer[i + 1] = 0; // G
    buffer[i + 2] = 0; // B
    buffer[i + 3] = 255; // A
  }

  // Copy buffer into ImageData
  imageData.data.set(buffer);

  // Flush to canvas
  ctx.putImageData(imageData, 0, 0);

  // Toggle overlay visibility
  if (overlay) {
    if (model.input.pointerLocked) {
      overlay.classList.add("hidden");
    } else {
      overlay.classList.remove("hidden");
    }
  }
}

/**
 * Returns the raw RGBA pixel buffer for writing pixels into.
 * @returns {Uint8ClampedArray}
 */
function getBuffer() {
  return buffer;
}

export { init, render, getBuffer };
