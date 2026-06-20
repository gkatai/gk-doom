import { parseWad } from "./index.js";

/**
 * Build a synthetic WAD ArrayBuffer from a list of lump definitions.
 * @param {Array<{name: string, data: number[]}>} lumpDefs
 * @returns {ArrayBuffer}
 */
function buildWad(lumpDefs) {
  const headerSize = 12;
  const dirEntrySize = 16;

  // Lump data starts right after the header
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

  // Header
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "W".charCodeAt(0);
  bytes[2] = "A".charCodeAt(0);
  bytes[3] = "D".charCodeAt(0);
  view.setUint32(4, lumpDefs.length, true);
  view.setUint32(8, directoryOffset, true);

  // Write lump data (starts right after the header)
  let pos = headerSize;
  for (let i = 0; i < lumpDataBuffers.length; i++) {
    bytes.set(lumpDataBuffers[i], pos);
    pos += lumpDataBuffers[i].length;
  }

  // Write directory entries
  for (let i = 0; i < lumpEntries.length; i++) {
    const entry = lumpEntries[i];
    const off = directoryOffset + i * dirEntrySize;
    view.setUint32(off, entry.offset, true);
    view.setUint32(off + 4, entry.size, true);

    // Write 8-byte null-padded name
    const nameBytes = entry.name.toUpperCase();
    for (let j = 0; j < 8; j++) {
      bytes[off + 8 + j] = j < nameBytes.length ? nameBytes.charCodeAt(j) : 0;
    }
  }

  return buffer;
}

describe("parseWad", () => {
  const vertexData = [0x44, 0x03, 0xf6, 0x18]; // x=836, y=6390 (example)
  const wad = buildWad([
    { name: "E1M1", data: [] },
    { name: "VERTEXES", data: vertexData },
  ]);
  const parsed = parseWad(wad);

  test("valid WAD — getLump returns correct bytes", () => {
    const lump = parsed.getLump("VERTEXES");
    expect(lump).toBeInstanceOf(Uint8Array);
    expect(lump.length).toBe(4);
    expect(lump[0]).toBe(0x44);
    expect(lump[1]).toBe(0x03);
  });

  test("zero-length lump returns empty Uint8Array", () => {
    const lump = parsed.getLump("E1M1");
    expect(lump).toBeInstanceOf(Uint8Array);
    expect(lump.length).toBe(0);
  });

  test("getLumpAt returns bytes at directory index", () => {
    const lump = parsed.getLumpAt(1);
    expect(lump.length).toBe(4);
    expect(Array.from(lump)).toEqual(vertexData);
  });

  test("getLumpIndex does not throw for known lump", () => {
    const idx = parsed.getLumpIndex("E1M1");
    expect(idx).toBe(0);
  });

  test("unknown lump throws with clear message", () => {
    expect(() => parsed.getLump("NOSUCHLUMP")).toThrow("Lump not found");
  });

  test("out-of-bounds index throws", () => {
    expect(() => parsed.getLumpAt(99)).toThrow("out of bounds");
  });

  test("case insensitivity", () => {
    const upper = parsed.getLump("VERTEXES");
    const lower = parsed.getLump("vertexes");
    expect(Array.from(upper)).toEqual(Array.from(lower));
  });

  test("bad magic throws 'Not a WAD file'", () => {
    const bad = new ArrayBuffer(12);
    const b = new Uint8Array(bad);
    b[0] = "B".charCodeAt(0);
    b[1] = "A".charCodeAt(0);
    b[2] = "D".charCodeAt(0);
    b[3] = "!".charCodeAt(0);
    expect(() => parseWad(bad)).toThrow("Not a WAD file");
  });

  test("handles duplicate lump names — first match wins", () => {
    const dupWad = buildWad([
      { name: "E1M1", data: [] },
      { name: "VERTEXES", data: [1, 2] },
      { name: "E2M1", data: [] },
      { name: "VERTEXES", data: [3, 4, 5] },
    ]);
    const dupParsed = parseWad(dupWad);
    const lump = dupParsed.getLump("VERTEXES");
    expect(lump.length).toBe(2);
    expect(lump[0]).toBe(1);
  });
});
