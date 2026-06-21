/**
 * Player movement and solid-wall collision.
 *
 * Collision model: point — segment intersection (no player radius).
 * Sliding: axis decomposition — X and Y steps tested independently.
 *
 * @param {import('./model.js').Model} model
 * @param {number} deltaTime  milliseconds since last frame
 */

const MOVE_SPEED = 400; // map units / second
const ROT_SPEED = 0.0015; // radians / pixel

/**
 * Cross product of 2D vectors (B−A) × (C−A).
 */
function cross(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/**
 * Returns true if segment AB properly crosses segment CD
 * (exclusive endpoint touches do not count as a crossing).
 *
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @param {number} cx
 * @param {number} cy
 * @param {number} dx
 * @param {number} dy
 * @returns {boolean}
 */
function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = cross(cx, cy, dx, dy, ax, ay); // CD × CA
  const d2 = cross(cx, cy, dx, dy, bx, by); // CD × CB
  const d3 = cross(ax, ay, bx, by, cx, cy); // AB × AC
  const d4 = cross(ax, ay, bx, by, dx, dy); // AB × AD

  // If both endpoints of AB are on the same side of CD, no crossing
  if ((d1 > 0 && d2 > 0) || (d1 < 0 && d2 < 0)) return false;
  // If both endpoints of CD are on the same side of AB, no crossing
  if ((d3 > 0 && d4 > 0) || (d3 < 0 && d4 < 0)) return false;

  // Collinear or touching — treat as no-cross (player can graze walls)
  if (d1 === 0 || d2 === 0 || d3 === 0 || d4 === 0) {
    return false;
  }

  return true;
}

/**
 * Returns true if the movement segment (x1,y1)→(x2,y2) crosses
 * any 1-sided Linedef (solid wall). Two-sided Linedefs are always passable.
 *
 * @param {import('@gk-doom/map').DoomMap} map
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
function crosses1SidedLinedef(map, x1, y1, x2, y2) {
  for (const linedef of map.linedefs) {
    if (linedef.left !== -1) continue; // two-sided → passable

    const v1 = map.vertices[linedef.v1];
    const v2 = map.vertices[linedef.v2];

    if (segmentsIntersect(x1, y1, x2, y2, v1.x, v1.y, v2.x, v2.y)) {
      return true;
    }
  }
  return false;
}

/**
 * Apply one frame of player movement and rotation to the model.
 *
 * @param {import('./model.js').Model} model
 * @param {number} deltaTime  milliseconds since last frame
 */
function applyMovement(model, deltaTime) {
  const { player, input, map } = model;
  const dt = deltaTime / 1000; // convert ms → seconds

  // 1. Rotation — consume mouse delta
  player.angle -= input.mouseDeltaX * ROT_SPEED;
  input.mouseDeltaX = 0;

  // 2. Compute intended movement from WASD
  const forward = (input.w ? 1 : 0) - (input.s ? 1 : 0);
  const strafe = (input.d ? 1 : 0) - (input.a ? 1 : 0);

  const halfPi = Math.PI / 2;
  const dx =
    (Math.cos(player.angle) * forward +
      Math.cos(player.angle - halfPi) * strafe) *
    MOVE_SPEED *
    dt;
  const dy =
    (Math.sin(player.angle) * forward +
      Math.sin(player.angle - halfPi) * strafe) *
    MOVE_SPEED *
    dt;

  // 3. Axis decomposition — try X step, then Y step independently
  const { x: px, y: py } = player;

  if (!crosses1SidedLinedef(map, px, py, px + dx, py)) {
    player.x += dx;
  }
  if (!crosses1SidedLinedef(map, player.x, py, player.x, py + dy)) {
    player.y += dy;
  }
}

export { segmentsIntersect, crosses1SidedLinedef, applyMovement };
