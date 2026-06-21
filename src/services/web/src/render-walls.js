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
 * Render walls via BSP front-to-back traversal. Handles both one-sided Segs
 * (solid walls) and two-sided Segs (portals with upper/lower wall bands).
 * Uses per-column topClip/bottomClip arrays (ADR-0010) to track open regions.
 *
 * @param {Uint8ClampedArray} buffer
 * @param {import('@gk-doom/map').DoomMap} map
 * @param {{ x: number, y: number, angle: number }} player
 */
function renderWalls(buffer, map, player) {
  const topClip    = new Int16Array(WIDTH);   // topmost still-open row; init 0
  const bottomClip = new Int16Array(WIDTH);   // bottommost still-open row; init HEIGHT-1
  bottomClip.fill(HEIGHT - 1);
  let filledCount = 0;

  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);

  // Compute eye height once from the player's actual sector (first SSector visited
  // by the BSP traversal is always the player's current SSector).
  let eyeZ = 41; // fallback if map has no segs
  traverseBsp(map.nodes, player.x, player.y, (ssectorIndex) => {
    const firstSeg = map.segs[map.ssectors[ssectorIndex].firstSeg];
    const ld = map.linedefs[firstSeg.linedef];
    const sd = map.sidedefs[firstSeg.side === 0 ? ld.right : ld.left];
    eyeZ = map.sectors[sd.sector].floorH + 41;
    return false; // stop immediately — we only need the player's SSector
  });

  /**
   * Transform and project a Seg, then branch to solid or portal rendering.
   * @param {*} seg
   */
  function processSeg(seg) {
    const linedef = map.linedefs[seg.linedef];

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

    if (linedef.left === -1) {
      processSolidSeg(x1, x2, colLeft, colRight, cay, cby, sector, eyeZ);
    } else {
      processPortalSeg(x1, x2, colLeft, colRight, cay, cby, sector, linedef, eyeZ);
    }
  }

  /**
   * Draw a one-sided (solid) Seg: ceiling flat, wall, floor flat per column.
   */
  function processSolidSeg(x1, x2, colLeft, colRight, cay, cby, sector, eyeZ) {
    const light = sector.light;

    // Perspective-correct depth interpolation: 1/depth is linear in screen space
    const invCay = 1 / cay;
    const invCby = 1 / cby;
    const dx = x2 - x1 || 1; // avoid /0 when seg projects to a single column

    for (let x = colLeft; x <= colRight; x++) {
      if (topClip[x] > bottomClip[x]) continue; // column already fully closed

      // Interpolate 1/depth linearly, then reciprocate for true perspective depth
      const t = (x - x1) / dx;
      const depth = 1 / (invCay + t * (invCby - invCay));

      // Wall top/bottom rows
      let wallTop = Math.floor(HALF_H - ((sector.ceilH - eyeZ) / depth) * PROJ_DIST);
      let wallBottom = Math.floor(HALF_H - ((sector.floorH - eyeZ) / depth) * PROJ_DIST);

      // Clamp rows to screen bounds
      wallTop = Math.max(0, Math.min(HEIGHT - 1, wallTop));
      wallBottom = Math.max(0, Math.min(HEIGHT - 1, wallBottom));

      // Clamp wall band to the current open clip range
      const clampedWallTop    = Math.max(wallTop,    topClip[x]);
      const clampedWallBottom = Math.min(wallBottom, bottomClip[x]);

      // Ceiling: topClip[x] .. clampedWallTop-1
      for (let row = topClip[x]; row < clampedWallTop; row++) {
        setPixel(buffer, x, row, 50, 50, 80);
      }
      // Wall: clampedWallTop .. clampedWallBottom
      for (let row = clampedWallTop; row <= clampedWallBottom; row++) {
        setPixel(buffer, x, row, light, light, light);
      }
      // Floor: clampedWallBottom+1 .. bottomClip[x]
      for (let row = clampedWallBottom + 1; row <= bottomClip[x]; row++) {
        setPixel(buffer, x, row, 80, 80, 80);
      }

      topClip[x] = HEIGHT; // close column
      filledCount++;
    }
  }

  /**
   * Draw a two-sided (portal) Seg: upper/lower wall bands, ceiling/floor flat
   * fills, then narrow the clip range for Segs further back.
   */
  function processPortalSeg(x1, x2, colLeft, colRight, cay, cby, sector, linedef, eyeZ) {
    const backSidedef = map.sidedefs[linedef.left];
    const backSector  = map.sectors[backSidedef.sector];
    const light = sector.light;

    // Perspective-correct depth interpolation: 1/depth is linear in screen space
    const invCay = 1 / cay;
    const invCby = 1 / cby;
    const dx = x2 - x1 || 1; // avoid /0 when seg projects to a single column

    for (let x = colLeft; x <= colRight; x++) {
      if (topClip[x] > bottomClip[x]) continue; // column already fully closed

      // Interpolate 1/depth linearly, then reciprocate for true perspective depth
      const t = (x - x1) / dx;
      const depth = 1 / (invCay + t * (invCby - invCay));

      // Project all four heights into screen rows
      let frontCeilRow  = Math.floor(HALF_H - (sector.ceilH  - eyeZ) / depth * PROJ_DIST);
      let frontFloorRow = Math.floor(HALF_H - (sector.floorH - eyeZ) / depth * PROJ_DIST);
      let backCeilRow   = Math.floor(HALF_H - (backSector.ceilH  - eyeZ) / depth * PROJ_DIST);
      let backFloorRow  = Math.floor(HALF_H - (backSector.floorH - eyeZ) / depth * PROJ_DIST);

      // Clamp all four to [0, HEIGHT - 1]
      frontCeilRow  = Math.max(0, Math.min(HEIGHT - 1, frontCeilRow));
      frontFloorRow = Math.max(0, Math.min(HEIGHT - 1, frontFloorRow));
      backCeilRow   = Math.max(0, Math.min(HEIGHT - 1, backCeilRow));
      backFloorRow  = Math.max(0, Math.min(HEIGHT - 1, backFloorRow));

      // 4c — Ceiling flat fill (above front ceiling)
      const ceilDrawTop    = topClip[x];
      const ceilDrawBottom = Math.min(frontCeilRow - 1, bottomClip[x]);
      for (let row = ceilDrawTop; row <= ceilDrawBottom; row++) {
        setPixel(buffer, x, row, 50, 50, 80);
      }

      // 4d — Upper Wall band (front ceiling → back ceiling)
      const upperTop    = Math.max(frontCeilRow, topClip[x]);
      const upperBottom = Math.min(backCeilRow - 1, bottomClip[x]);
      if (upperTop <= upperBottom) {
        for (let row = upperTop; row <= upperBottom; row++) {
          setPixel(buffer, x, row, light, light, light);
        }
      }

      // 4e — Lower Wall band (back floor → front floor)
      const lowerTop    = Math.max(backFloorRow + 1, topClip[x]);
      const lowerBottom = Math.min(frontFloorRow, bottomClip[x]);
      if (lowerTop <= lowerBottom) {
        for (let row = lowerTop; row <= lowerBottom; row++) {
          setPixel(buffer, x, row, light, light, light);
        }
      }

      // 4f — Floor flat fill (below front floor)
      const floorDrawTop    = Math.max(frontFloorRow + 1, topClip[x]);
      const floorDrawBottom = bottomClip[x];
      for (let row = floorDrawTop; row <= floorDrawBottom; row++) {
        setPixel(buffer, x, row, 80, 80, 80);
      }

      // 4g — Narrow the clip range
      const newTop    = Math.max(topClip[x],    backCeilRow);
      const newBottom = Math.min(bottomClip[x], backFloorRow);

      topClip[x]    = newTop;
      bottomClip[x] = newBottom;

      if (newTop > newBottom) filledCount++;
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
