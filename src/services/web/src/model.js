import { parseMap } from "@gk-doom/map";
import { buildTextureCache } from "@gk-doom/textures";

/**
 * @typedef {Object} Model
 * @property {{ x: number, y: number, angle: number }} player
 * @property {import('@gk-doom/map').DoomMap} map
 * @property {{ w: boolean, a: boolean, s: boolean, d: boolean, pointerLocked: boolean, mouseDeltaX: number }} input
 * @property {Map<string, { width: number, height: number, rgba: Uint8Array }>} textures
 */

/**
 * Create the central mutable game model.
 *
 * @param {import('@gk-doom/wad').Wad} wad
 * @param {string} mapName  e.g. 'E1M1'
 * @returns {Model}
 */
function createModel(wad, mapName) {
  const map = parseMap(wad, mapName);
  const textures = buildTextureCache(wad);

  // Find the first Thing with type === 1 (Player 1 start)
  const playerThing = map.things.find((t) => t.type === 1);
  if (!playerThing) {
    throw new Error(`No Player 1 start (type 1) found in ${mapName}`);
  }

  return {
    player: {
      x: playerThing.x,
      y: playerThing.y,
      angle: (playerThing.angle * Math.PI) / 180,
    },
    map,
    textures,
    input: {
      w: false,
      a: false,
      s: false,
      d: false,
      pointerLocked: false,
      mouseDeltaX: 0,
    },
  };
}

export { createModel };
