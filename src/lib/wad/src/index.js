/**
 * @typedef {Object} Wad
 * @property {(name: string) => Uint8Array} getLump
 * @property {(index: number) => Uint8Array} getLumpAt
 * @property {(name: string) => number} getLumpIndex
 */

/**
 * Parse a WAD file buffer into a Wad object.
 * @param {ArrayBuffer} buffer
 * @returns {Wad}
 */
function parseWad(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Pass 1 — header (12 bytes)
  const magic = String.fromCharCode(
    bytes[0],
    bytes[1],
    bytes[2],
    bytes[3]
  );
  if (magic !== "IWAD" && magic !== "PWAD") {
    throw new Error("Not a WAD file");
  }

  const lumpCount = view.getUint32(4, true);
  const directoryOffset = view.getUint32(8, true);

  // Pass 2 — lump directory (16 bytes per entry)
  /** @type {Array<{offset: number, size: number, name: string}>} */
  const lumps = [];
  /** @type {Map<string, number>} */
  const nameIndex = new Map();

  for (let i = 0; i < lumpCount; i++) {
    const entryOffset = directoryOffset + i * 16;
    const lumpOffset = view.getUint32(entryOffset, true);
    const lumpSize = view.getUint32(entryOffset + 4, true);

    // Read 8-byte name, strip nulls
    let name = "";
    for (let j = 0; j < 8; j++) {
      const b = bytes[entryOffset + 8 + j];
      if (b === 0) break;
      name += String.fromCharCode(b);
    }
    const normalizedName = name.toUpperCase();

    lumps.push({ offset: lumpOffset, size: lumpSize, name: normalizedName });

    // First occurrence wins (handles duplicate names across maps)
    if (!nameIndex.has(normalizedName)) {
      nameIndex.set(normalizedName, i);
    }
  }

  /**
   * @param {string} name
   * @returns {Uint8Array}
   */
  function getLump(name) {
    const idx = getLumpIndex(name);
    const entry = lumps[idx];
    return bytes.subarray(entry.offset, entry.offset + entry.size);
  }

  /**
   * @param {number} index
   * @returns {Uint8Array}
   */
  function getLumpAt(index) {
    if (index < 0 || index >= lumps.length) {
      throw new Error(
        `Lump index ${index} out of bounds (0..${lumps.length - 1})`
      );
    }
    const entry = lumps[index];
    return bytes.subarray(entry.offset, entry.offset + entry.size);
  }

  /**
   * @param {string} name
   * @returns {number}
   */
  function getLumpIndex(name) {
    const idx = nameIndex.get(name.toUpperCase());
    if (idx === undefined) {
      throw new Error(`Lump not found: ${name}`);
    }
    return idx;
  }

  return { getLump, getLumpAt, getLumpIndex };
}

export { parseWad };
