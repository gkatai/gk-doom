import { traverseBsp } from "@gk-doom/map";
import { WIDTH, HEIGHT } from "./render-constants.js";

const PROJ_DIST = 320;
const HALF_W = WIDTH / 2; // 320
const HALF_H = HEIGHT / 2; // 200

/**
 * Set a single pixel in the RGBA buffer.
 * @param {Uint8ClampedArray} buffer
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function setPixel(buffer, x, y, r, g, b) {
  const i = (y * WIDTH + x) * 4;
  buffer[i] = r;
  buffer[i + 1] = g;
  buffer[i + 2] = b;
  buffer[i + 3] = 255;
}

/**
 * Project one-sided Segs into screen-space Columns and draw solid-colour walls.
 * Floor and ceiling regions are filled with flat colours.
 *
 * @param {Uint8ClampedArray} buffer
 * @param {import('@gk-doom/map').DoomMap} map
 * @param {{ x: number, y: number, angle: number }} player
 */
function renderWalls(buffer, map, player) {
  /** @type {Uint8Array} 0 = open, 1 = filled */
  const columnFilled = new Uint8Array(WIDTH);
  let filledCount = 0;

  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);

  /**
   * @param {*} seg
   */
  function processSeg(seg) {
    // --- Step 1c: one-sided filter ---
    const linedef = map.linedefs[seg.linedef];
    if (linedef.left !== -1) return; // two-sided Seg — skip (portal)

    // --- Step 1d: front sector lookup ---
    const sidedefIndex = seg.side === 0 ? linedef.right : linedef.left;
    const sidedef = map.sidedefs[sidedefIndex];
    const sector = map.sectors[sidedef.sector];

    // --- Step 1e: camera-space transform ---
    // Translate endpoints by player position
    const ax = map.vertices[seg.v1].x - player.x;
    const ay = map.vertices[seg.v1].y - player.y;
    const bx = map.vertices[seg.v2].x - player.x;
    const by = map.vertices[seg.v2].y - player.y;

    // Rotate into camera space (cy = forward/depth, cx = right)
    let cax = ax * sin - ay * cos;
    let cay = ax * cos + ay * sin;
    let cbx = bx * sin - by * cos;
    let cby = bx * cos + by * sin;

    // --- Step 1f: near-plane clipping at cy = 1 ---
    if (cay <= 0 && cby <= 0) return;

    if (cay <= 0) {
      // Clip endpoint A against cy = 1
      const t = (1 - cay) / (cby - cay);
      cax = cax + t * (cbx - cax);
      cay = 1;
    }

    if (cby <= 0) {
      // Clip endpoint B against cy = 1
      const t = (1 - cby) / (cay - cby);
      cbx = cbx + t * (cax - cbx);
      cby = 1;
    }

    // --- Step 1g: back-face cull ---
    // Cross product of seg direction × vector to player: if >= 0 it's back-facing
    if (cax * cby - cbx * cay >= 0) return;

    // --- Step 1h: perspective projection to screen columns ---
    const x1 = Math.floor((cax / cay) * PROJ_DIST + HALF_W);
    const x2 = Math.floor((cbx / cby) * PROJ_DIST + HALF_W);

    const colLeft = Math.max(0, Math.min(x1, x2));
    const colRight = Math.min(WIDTH - 1, Math.max(x1, x2));
    if (colLeft > colRight) return;

    // --- Step 1i: per-column wall height calculation ---
    const eyeZ = sector.floorH + 41;
    const light = sector.light;

    for (let x = colLeft; x <= colRight; x++) {
      // Skip if already filled
      if (columnFilled[x]) continue;

      // Interpolate camera depth across the seg for column x
      const t = (x - x1) / (x2 - x1);
      const depth = cay + t * (cby - cay);

      // Wall top/bottom rows
      let wallTop = Math.floor(HALF_H - ((sector.ceilH - eyeZ) / depth) * PROJ_DIST);
      let wallBottom = Math.floor(HALF_H - ((sector.floorH - eyeZ) / depth) * PROJ_DIST);

      // Clamp rows to screen bounds
      wallTop = Math.max(0, Math.min(HEIGHT - 1, wallTop));
      wallBottom = Math.max(0, Math.min(HEIGHT - 1, wallBottom));

      // --- Step 1j: fill the column ---
      // Ceiling: rows 0 .. wallTop-1
      for (let row = 0; row < wallTop; row++) {
        setPixel(buffer, x, row, 50, 50, 80);
      }
      // Wall: rows wallTop .. wallBottom
      for (let row = wallTop; row <= wallBottom; row++) {
        setPixel(buffer, x, row, light, light, light);
      }
      // Floor: rows wallBottom+1 .. HEIGHT-1
      for (let row = wallBottom + 1; row < HEIGHT; row++) {
        setPixel(buffer, x, row, 80, 80, 80);
      }

      columnFilled[x] = 1;
      filledCount++;
    }
  }

  // --- Step 1b: BSP traversal ---
  traverseBsp(map.nodes, player.x, player.y, (ssectorIndex) => {
    const ssector = map.ssectors[ssectorIndex];
    for (let i = 0; i < ssector.segCount; i++) {
      const seg = map.segs[ssector.firstSeg + i];
      processSeg(seg);
    }
    return filledCount < WIDTH; // halt when all columns filled (false stops traversal)
  });
}

export { renderWalls };
