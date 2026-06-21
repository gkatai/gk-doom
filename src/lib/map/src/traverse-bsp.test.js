import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseWad } from "@gk-doom/wad";
import { parseMap } from "./parse-map.js";
import { traverseBsp } from "./traverse-bsp.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers for building synthetic BspNode arrays
// ---------------------------------------------------------------------------

/**
 * Create a BspNode object.
 * @param {number} x
 * @param {number} y
 * @param {number} dx
 * @param {number} dy
 * @param {{ isSSector: boolean, index: number }} rightChild
 * @param {{ isSSector: boolean, index: number }} leftChild
 * @returns {import('./parse-map.js').BspNode}
 */
function makeNode(x, y, dx, dy, rightChild, leftChild) {
  return {
    x,
    y,
    dx,
    dy,
    rightBounds: { yUpper: 0, yLower: 0, xLower: 0, xUpper: 0 },
    leftBounds: { yUpper: 0, yLower: 0, xLower: 0, xUpper: 0 },
    rightChild,
    leftChild,
  };
}

/** @param {number} i */
const ssLeaf = (i) => ({ isSSector: true, index: i });
/** @param {number} i */
const nodeRef = (i) => ({ isSSector: false, index: i });

/**
 * Build the 2-node synthetic BSP tree for tests.
 * nodes[0] = N1, nodes[1] = N2 (root)
 * @returns {import('./parse-map.js').BspNode[]}
 */
function buildTree3() {
  const n1 = makeNode(0, 0, 1, 0, ssLeaf(1), ssLeaf(0));
  const n2 = makeNode(0, 0, 1, 0, nodeRef(0), ssLeaf(2));
  return [n1, n2];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("traverseBsp — synthetic 3-node tree", () => {
  test("front-to-back order when player is on right side of all partitions", () => {
    const nodes = buildTree3();
    /** @type {number[]} */
    const visited = [];
    traverseBsp(nodes, 0, -1, (idx) => {
      visited.push(idx);
      return true;
    });
    // Player at y=-1 → cross = 1 > 0 → right child is near for all nodes
    expect(visited).toEqual([1, 0, 2]);
  });

  test("front-to-back order when player is on left side of all partitions", () => {
    const nodes = buildTree3();
    /** @type {number[]} */
    const visited = [];
    traverseBsp(nodes, 0, 1, (idx) => {
      visited.push(idx);
      return true;
    });
    // Player at y=1 → cross = -1 ≤ 0 → left child is near for all nodes
    expect(visited).toEqual([2, 0, 1]);
  });

  test("early exit — callback returns false after first SSector", () => {
    const nodes = buildTree3();
    /** @type {number[]} */
    const visited = [];
    const halted = traverseBsp(nodes, 0, -1, (idx) => {
      visited.push(idx);
      return false; // halt after first call
    });
    expect(visited).toEqual([1]);
    expect(halted).toBe(false);
  });

  test("single-node tree (root is an SSector leaf) fires callback once", () => {
    const singleNode = makeNode(0, 0, 1, 0, ssLeaf(1), ssLeaf(0));
    /** @type {number[]} */
    const visited = [];
    traverseBsp([singleNode], 0, -1, (idx) => {
      visited.push(idx);
      return true;
    });
    // Both leaves visited, near first
    expect(visited).toEqual([1, 0]);
  });
});

// ---------------------------------------------------------------------------
// E1M1 smoke test — real doom1.wad
// ---------------------------------------------------------------------------

const WAD_PATH = resolve(
  __dirname,
  "../../../../src/services/web/public/doom1.wad",
);
const wadBuffer = readFileSync(WAD_PATH).buffer;
const wad = parseWad(wadBuffer);
const map = parseMap(wad, "E1M1");

describe("traverseBsp — E1M1 smoke test", () => {
  test("full traversal fires callback exactly 237 times", () => {
    const visited = [];
    traverseBsp(map.nodes, 0, 0, (idx) => {
      visited.push(idx);
      return true;
    });
    expect(visited.length).toBe(237);
  });

  test("no SSector index is visited more than once", () => {
    /** @type {number[]} */
    const visited = [];
    traverseBsp(map.nodes, 0, 0, (idx) => {
      visited.push(idx);
      return true;
    });
    const unique = new Set(visited);
    expect(unique.size).toBe(visited.length);
  });
});
