import * as Renderer from "./renderer.js";
import * as Input from "./input.js";
import { start } from "./game-loop.js";
import { parseWad } from "@gk-doom/wad";

async function init() {
  /** @type {HTMLElement | null} */
  const canvas = document.getElementById("game");
  /** @type {HTMLElement | null} */
  const overlay = document.getElementById("overlay");

  if (!canvas) throw new Error("Canvas element #game not found");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("#game is not a <canvas>");
  if (!overlay) throw new Error("Overlay element #overlay not found");

  // Fetch and parse the WAD file before starting
  const response = await fetch("/doom1.wad");
  const buffer = await response.arrayBuffer();
  const wad = parseWad(buffer);

  // Initialize renderer and input
  Renderer.init(canvas);
  Input.init();

  // Wire Pointer Lock: on canvas click, request lock
  canvas.addEventListener("click", () => {
    if (!Input.isPointerLocked()) {
      canvas.requestPointerLock();
    }
  });

  // On pointerlockchange, toggle overlay visibility
  document.addEventListener("pointerlockchange", () => {
    if (Input.isPointerLocked()) {
      overlay.classList.add("hidden");
    } else {
      overlay.classList.remove("hidden");
    }
  });

  // Start the game loop
  start(canvas, wad);
}

document.addEventListener("DOMContentLoaded", init);
