import * as Renderer from "./renderer.js";
import * as Input from "./input.js";
import { start } from "./game-loop.js";
import { parseWad } from "@gk-doom/wad";
import { createModel } from "./model.js";

async function init() {
  /** @type {HTMLElement | null} */
  const canvas = document.getElementById("game");
  /** @type {HTMLElement | null} */
  const overlay = document.getElementById("overlay");

  if (!canvas) throw new Error("Canvas element #game not found");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("#game is not a <canvas>");
  if (!overlay) throw new Error("Overlay element #overlay not found");

  // Fetch and parse the WAD file
  const response = await fetch("/doom1.wad");
  const buffer = await response.arrayBuffer();
  const wad = parseWad(buffer);

  // Create the central game model
  const model = createModel(wad, "E1M1");

  // Initialize renderer and input
  Renderer.init(canvas);
  Input.init(model);

  // Wire Pointer Lock: on canvas click, request lock
  canvas.addEventListener("click", () => {
    if (!model.input.pointerLocked) {
      canvas.requestPointerLock();
    }
  });

  // Start the game loop
  start(canvas, model);
}

document.addEventListener("DOMContentLoaded", init);
