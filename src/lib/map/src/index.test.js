import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseWad } from "@gk-doom/wad";
import { parseMap } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the real doom1.wad once for all tests
const WAD_PATH = resolve(__dirname, "../../../../src/services/web/public/doom1.wad");
const wadBuffer = readFileSync(WAD_PATH).buffer;
const wad = parseWad(wadBuffer);
const map = parseMap(wad, "E1M1");

describe("parseMap — record counts (E1M1)", () => {
  test("VERTEXES count is 467", () => {
    expect(map.vertices.length).toBe(467);
  });

  test("LINEDEFS count is 475", () => {
    expect(map.linedefs.length).toBe(475);
  });

  test("SIDEDEFS count is 648", () => {
    expect(map.sidedefs.length).toBe(648);
  });

  test("SEGS count is 732", () => {
    expect(map.segs.length).toBe(732);
  });

  test("SSECTORS count is 237", () => {
    expect(map.ssectors.length).toBe(237);
  });

  test("NODES count is 236", () => {
    expect(map.nodes.length).toBe(236);
  });

  test("SECTORS count is 85", () => {
    expect(map.sectors.length).toBe(85);
  });
});

describe("parseMap — spot-check values (E1M1)", () => {
  test("vertices[0] is { x: 1088, y: -3680 }", () => {
    expect(map.vertices[0]).toEqual({ x: 1088, y: -3680 });
  });

  test("vertices[1] is { x: 1024, y: -3680 }", () => {
    expect(map.vertices[1]).toEqual({ x: 1024, y: -3680 });
  });

  test("linedefs[0] has expected fields", () => {
    const ld = map.linedefs[0];
    expect(ld.v1).toBe(0);
    expect(ld.v2).toBe(1);
    expect(ld.flags).toBe(1);
    expect(ld.right).toBe(0);
    expect(ld.left).toBe(-1);
  });

  test("sectors[0] has expected fields", () => {
    const sec = map.sectors[0];
    expect(sec.floorH).toBe(0);
    expect(sec.ceilH).toBe(72);
    expect(sec.floorTex).toBe("FLOOR4_8");
    expect(sec.ceilTex).toBe("CEIL3_5");
    expect(sec.light).toBe(160);
  });
});

describe("decodeBspChild — bit 15 decoding", () => {
  test("node with bit 15 set in right child produces isSSector: true", () => {
    // Build a minimal synthetic WAD with a NODES lump containing one node
    // where rightChild = 0x8003 (bit 15 set → SSector index 3)
    // and leftChild = 0x0005 (bit 15 clear → Node index 5)
    const lumpDefs = [
      { name: "E1M1", data: [] },
      { name: "THINGS", data: [] },
      { name: "LINEDEFS", data: [] },
      { name: "SIDEDEFS", data: [] },
      { name: "VERTEXES", data: [] },
      { name: "SEGS", data: [] },
      { name: "SSECTORS", data: [] },
      { name: "NODES", data: makeNodeBytes(0, 0, 1, 0, 0x8003, 0x0005) },
      { name: "SECTORS", data: [] },
    ];

    const synthWad = parseWad(buildSyntheticWad(lumpDefs));
    const synthMap = parseMap(synthWad, "E1M1");

    expect(synthMap.nodes[0].rightChild).toEqual({
      isSSector: true,
      index: 3,
    });
    expect(synthMap.nodes[0].leftChild).toEqual({
      isSSector: false,
      index: 5,
    });
  });
});

/**
 * Build 28 bytes for a NODES record with the given partition line and child values.
 * Bounding boxes are zeroed for simplicity.
 */
/**
 * @param {number} x
 * @param {number} y
 * @param {number} dx
 * @param {number} dy
 * @param {number} rightChild
 * @param {number} leftChild
 * @returns {number[]}
 */
function makeNodeBytes(x, y, dx, dy, rightChild, leftChild) {
  const buf = new ArrayBuffer(28);
  const view = new DataView(buf);
  view.setInt16(0, x, true);
  view.setInt16(2, y, true);
  view.setInt16(4, dx, true);
  view.setInt16(6, dy, true);
  // Bounding boxes all zero (offsets 8-23)
  view.setUint16(24, rightChild, true);
  view.setUint16(26, leftChild, true);
  return Array.from(new Uint8Array(buf));
}

/**
 * Build a synthetic WAD ArrayBuffer from lump definitions.
 * @param {Array<{name: string, data: number[]}>} lumpDefs
 * @returns {ArrayBuffer}
 */
function buildSyntheticWad(lumpDefs) {
  const headerSize = 12;
  const dirEntrySize = 16;

  let dataOffset = headerSize;
  const lumpDataBuffers = [];
  const lumpEntries = [];

  for (const def of lumpDefs) {
    const data = new Uint8Array(def.data);
    lumpEntries.push({ offset: dataOffset, size: data.length, name: def.name });
    lumpDataBuffers.push(data);
    dataOffset += data.length;
  }

  const directoryOffset = dataOffset;
  const totalSize = directoryOffset + lumpDefs.length * dirEntrySize;
  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "W".charCodeAt(0);
  bytes[2] = "A".charCodeAt(0);
  bytes[3] = "D".charCodeAt(0);
  view.setUint32(4, lumpDefs.length, true);
  view.setUint32(8, directoryOffset, true);

  let pos = headerSize;
  for (let i = 0; i < lumpDataBuffers.length; i++) {
    bytes.set(lumpDataBuffers[i], pos);
    pos += lumpDataBuffers[i].length;
  }

  for (let i = 0; i < lumpEntries.length; i++) {
    const entry = lumpEntries[i];
    const off = directoryOffset + i * dirEntrySize;
    view.setUint32(off, entry.offset, true);
    view.setUint32(off + 4, entry.size, true);

    const nameBytes = entry.name.toUpperCase();
    for (let j = 0; j < 8; j++) {
      bytes[off + 8 + j] = j < nameBytes.length ? nameBytes.charCodeAt(j) : 0;
    }
  }

  return buffer;
}
