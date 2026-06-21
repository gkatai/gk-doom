/**
 * @typedef {{ x: number, y: number }} Vertex
 */

/**
 * @typedef {{ v1: number, v2: number, flags: number, special: number, tag: number, right: number, left: number }} Linedef
 */

/**
 * @typedef {{ xOffset: number, yOffset: number, upperTex: string, lowerTex: string, middleTex: string, sector: number }} Sidedef
 */

/**
 * @typedef {{ floorH: number, ceilH: number, floorTex: string, ceilTex: string, light: number, special: number, tag: number }} Sector
 */

/**
 * @typedef {{ v1: number, v2: number, angle: number, linedef: number, side: number, offset: number }} Seg
 */

/**
 * @typedef {{ segCount: number, firstSeg: number }} SSector
 */

/**
 * @typedef {{ isSSector: boolean, index: number }} BspChild
 */

/**
 * @typedef {{ x: number, y: number, dx: number, dy: number, rightBounds: {yUpper:number, yLower:number, xLower:number, xUpper:number}, leftBounds: {yUpper:number, yLower:number, xLower:number, xUpper:number}, rightChild: BspChild, leftChild: BspChild }} BspNode
 */

/**
 * @typedef {{ x: number, y: number, angle: number, type: number, flags: number }} Thing
 */

/**
 * @typedef {Object} DoomMap
 * @property {Thing[]}   things
 * @property {Vertex[]}  vertices
 * @property {Linedef[]} linedefs
 * @property {Sidedef[]} sidedefs
 * @property {Sector[]}  sectors
 * @property {Seg[]}     segs
 * @property {SSector[]} ssectors
 * @property {BspNode[]} nodes
 */

const LUMP_OFFSETS = {
  THINGS: 1,
  LINEDEFS: 2,
  SIDEDEFS: 3,
  VERTEXES: 4,
  SEGS: 5,
  SSECTORS: 6,
  NODES: 7,
  SECTORS: 8,
};

const SSECTOR_BIT = 0x8000;

/**
 * Read a null-padded ASCII string from a Uint8Array.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} length
 * @returns {string}
 */
function readString(bytes, offset, length) {
  let s = "";
  for (let i = 0; i < length; i++) {
    const b = bytes[offset + i];
    if (b === 0) break;
    s += String.fromCharCode(b);
  }
  return s;
}

/**
 * Decode a BSP child index (unsigned 16-bit value).
 * If bit 15 is set, the child is a sub-sector index; otherwise a node index.
 * @param {number} raw — value read as unsigned 16-bit
 * @returns {BspChild}
 */
function decodeBspChild(raw) {
  return {
    isSSector: (raw & SSECTOR_BIT) !== 0,
    index: raw & ~SSECTOR_BIT,
  };
}

/**
 * Parse a map from a WAD object into a DoomMap structure.
 *
 * @param {import('@gk-doom/wad').Wad} wad
 * @param {string} mapName  e.g. 'E1M1'
 * @returns {DoomMap}
 */
function parseMap(wad, mapName) {
  const markerIndex = wad.getLumpIndex(mapName);

  // Fetch raw lump bytes for each of the map lumps
  const lumps = {
    THINGS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.THINGS),
    VERTEXES: wad.getLumpAt(markerIndex + LUMP_OFFSETS.VERTEXES),
    LINEDEFS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.LINEDEFS),
    SIDEDEFS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.SIDEDEFS),
    SECTORS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.SECTORS),
    SEGS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.SEGS),
    SSECTORS: wad.getLumpAt(markerIndex + LUMP_OFFSETS.SSECTORS),
    NODES: wad.getLumpAt(markerIndex + LUMP_OFFSETS.NODES),
  };

  // --- THINGS (10 bytes/record) ---
  const tBytes = lumps.THINGS;
  const tView = new DataView(
    tBytes.buffer,
    tBytes.byteOffset,
    tBytes.byteLength,
  );
  const tCount = tBytes.byteLength / 10;
  /** @type {Thing[]} */
  const things = [];
  for (let i = 0; i < tCount; i++) {
    const o = i * 10;
    things.push({
      x: tView.getInt16(o, true),
      y: tView.getInt16(o + 2, true),
      angle: tView.getUint16(o + 4, true),
      type: tView.getUint16(o + 6, true),
      flags: tView.getUint16(o + 8, true),
    });
  }

  // --- VERTEXES (4 bytes/record) ---
  const vBytes = lumps.VERTEXES;
  const vView = new DataView(
    vBytes.buffer,
    vBytes.byteOffset,
    vBytes.byteLength,
  );
  const vCount = vBytes.byteLength / 4;
  /** @type {Vertex[]} */
  const vertices = [];
  for (let i = 0; i < vCount; i++) {
    const o = i * 4;
    vertices.push({
      x: vView.getInt16(o, true),
      y: vView.getInt16(o + 2, true),
    });
  }

  // --- LINEDEFS (14 bytes/record) ---
  const lBytes = lumps.LINEDEFS;
  const lView = new DataView(
    lBytes.buffer,
    lBytes.byteOffset,
    lBytes.byteLength,
  );
  const lCount = lBytes.byteLength / 14;
  /** @type {Linedef[]} */
  const linedefs = [];
  for (let i = 0; i < lCount; i++) {
    const o = i * 14;
    linedefs.push({
      v1: lView.getInt16(o, true),
      v2: lView.getInt16(o + 2, true),
      flags: lView.getInt16(o + 4, true),
      special: lView.getInt16(o + 6, true),
      tag: lView.getInt16(o + 8, true),
      right: lView.getInt16(o + 10, true),
      left: lView.getInt16(o + 12, true),
    });
  }

  // --- SIDEDEFS (30 bytes/record) ---
  const sBytes = lumps.SIDEDEFS;
  const sView = new DataView(
    sBytes.buffer,
    sBytes.byteOffset,
    sBytes.byteLength,
  );
  const sCount = sBytes.byteLength / 30;
  /** @type {Sidedef[]} */
  const sidedefs = [];
  for (let i = 0; i < sCount; i++) {
    const o = i * 30;
    sidedefs.push({
      xOffset: sView.getInt16(o, true),
      yOffset: sView.getInt16(o + 2, true),
      upperTex: readString(sBytes, o + 4, 8),
      lowerTex: readString(sBytes, o + 12, 8),
      middleTex: readString(sBytes, o + 20, 8),
      sector: sView.getInt16(o + 28, true),
    });
  }

  // --- SECTORS (26 bytes/record) ---
  const secBytes = lumps.SECTORS;
  const secView = new DataView(
    secBytes.buffer,
    secBytes.byteOffset,
    secBytes.byteLength,
  );
  const secCount = secBytes.byteLength / 26;
  /** @type {Sector[]} */
  const sectors = [];
  for (let i = 0; i < secCount; i++) {
    const o = i * 26;
    sectors.push({
      floorH: secView.getInt16(o, true),
      ceilH: secView.getInt16(o + 2, true),
      floorTex: readString(secBytes, o + 4, 8),
      ceilTex: readString(secBytes, o + 12, 8),
      light: secView.getInt16(o + 20, true),
      special: secView.getInt16(o + 22, true),
      tag: secView.getInt16(o + 24, true),
    });
  }

  // --- SEGS (12 bytes/record) ---
  const segBytes = lumps.SEGS;
  const segView = new DataView(
    segBytes.buffer,
    segBytes.byteOffset,
    segBytes.byteLength,
  );
  const segCount = segBytes.byteLength / 12;
  /** @type {Seg[]} */
  const segs = [];
  for (let i = 0; i < segCount; i++) {
    const o = i * 12;
    segs.push({
      v1: segView.getInt16(o, true),
      v2: segView.getInt16(o + 2, true),
      angle: segView.getInt16(o + 4, true),
      linedef: segView.getInt16(o + 6, true),
      side: segView.getInt16(o + 8, true),
      offset: segView.getInt16(o + 10, true),
    });
  }

  // --- SSECTORS (4 bytes/record) ---
  const ssBytes = lumps.SSECTORS;
  const ssView = new DataView(
    ssBytes.buffer,
    ssBytes.byteOffset,
    ssBytes.byteLength,
  );
  const ssCount = ssBytes.byteLength / 4;
  /** @type {SSector[]} */
  const ssectors = [];
  for (let i = 0; i < ssCount; i++) {
    const o = i * 4;
    ssectors.push({
      segCount: ssView.getInt16(o, true),
      firstSeg: ssView.getInt16(o + 2, true),
    });
  }

  // --- NODES (28 bytes/record) ---
  const nBytes = lumps.NODES;
  const nView = new DataView(
    nBytes.buffer,
    nBytes.byteOffset,
    nBytes.byteLength,
  );
  const nCount = nBytes.byteLength / 28;
  /** @type {BspNode[]} */
  const nodes = [];
  for (let i = 0; i < nCount; i++) {
    const o = i * 28;
    nodes.push({
      x: nView.getInt16(o, true),
      y: nView.getInt16(o + 2, true),
      dx: nView.getInt16(o + 4, true),
      dy: nView.getInt16(o + 6, true),
      rightBounds: {
        yUpper: nView.getInt16(o + 8, true),
        yLower: nView.getInt16(o + 10, true),
        xLower: nView.getInt16(o + 12, true),
        xUpper: nView.getInt16(o + 14, true),
      },
      leftBounds: {
        yUpper: nView.getInt16(o + 16, true),
        yLower: nView.getInt16(o + 18, true),
        xLower: nView.getInt16(o + 20, true),
        xUpper: nView.getInt16(o + 22, true),
      },
      rightChild: decodeBspChild(nView.getUint16(o + 24, true)),
      leftChild: decodeBspChild(nView.getUint16(o + 26, true)),
    });
  }

  return {
    things,
    vertices,
    linedefs,
    sidedefs,
    sectors,
    segs,
    ssectors,
    nodes,
  };
}

export { parseMap };
