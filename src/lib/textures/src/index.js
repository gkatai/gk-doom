/**
 * Read a null-padded fixed-length ASCII string from a Uint8Array.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} maxLen
 * @returns {string}
 */
function readString(bytes, offset, maxLen) {
  let s = '';
  for (let i = 0; i < maxLen; i++) {
    const b = bytes[offset + i];
    if (b === 0) break;
    s += String.fromCharCode(b);
  }
  return s.toUpperCase();
}

// ---------------------------------------------------------------------------
// Step 1 — Parse PLAYPAL
// ---------------------------------------------------------------------------

/**
 * Extract the first palette (256 RGB triples) from the PLAYPAL lump.
 * @param {import('@gk-doom/wad').Wad} wad
 * @returns {Uint8Array} 768 bytes: palette[i*3..i*3+2] = R,G,B
 */
function parsePalette(wad) {
  const bytes = wad.getLump('PLAYPAL');
  return bytes.slice(0, 768);
}

// ---------------------------------------------------------------------------
// Step 2 — Parse PNAMES
// ---------------------------------------------------------------------------

/**
 * Parse the PNAMES lump into an array of patch-name strings.
 * @param {import('@gk-doom/wad').Wad} wad
 * @returns {string[]}
 */
function parsePnames(wad) {
  const bytes = wad.getLump('PNAMES');
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const count = view.getUint32(0, true);
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(readString(bytes, 4 + i * 8, 8));
  }
  return names;
}

// ---------------------------------------------------------------------------
// Step 3 — Parse TEXTURE1
// ---------------------------------------------------------------------------

/**
 * @typedef {{ name: string, width: number, height: number, patches: Array<{ originX: number, originY: number, patchIndex: number }> }} TexDef
 */

/**
 * Parse the TEXTURE1 lump into texture definitions.
 * @param {import('@gk-doom/wad').Wad} wad
 * @returns {TexDef[]}
 */
function parseTexture1(wad) {
  const bytes = wad.getLump('TEXTURE1');
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const count = view.getInt32(0, true);
  const textures = [];
  for (let i = 0; i < count; i++) {
    const offset = view.getInt32(4 + i * 4, true);
    const name = readString(bytes, offset, 8);
    const width = view.getInt16(offset + 12, true);
    const height = view.getInt16(offset + 14, true);
    const patchCount = view.getInt16(offset + 20, true);
    const patches = [];
    for (let p = 0; p < patchCount; p++) {
      const po = offset + 22 + p * 10;
      patches.push({
        originX: view.getInt16(po, true),
        originY: view.getInt16(po + 2, true),
        patchIndex: view.getInt16(po + 4, true),
      });
    }
    textures.push({ name, width, height, patches });
  }
  return textures;
}

// ---------------------------------------------------------------------------
// Step 4 — Decode a single Patch lump
// ---------------------------------------------------------------------------

/**
 * @typedef {{ width: number, height: number, columns: Array<Array<{ topdelta: number, pixels: Uint8Array }>> }} Patch
 */

/**
 * Decode a DOOM picture-format patch from raw bytes.
 * @param {Uint8Array} bytes
 * @returns {Patch}
 */
function decodePatch(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const width = view.getUint16(0, true);
  const height = view.getUint16(2, true);
  const columns = [];
  for (let x = 0; x < width; x++) {
    const colOffset = view.getUint32(8 + x * 4, true);
    const posts = [];
    let pos = colOffset;
    while (true) {
      const topdelta = bytes[pos++];
      if (topdelta === 0xFF) break;
      const length = bytes[pos++];
      pos++; // unused padding
      posts.push({ topdelta, pixels: bytes.slice(pos, pos + length) });
      pos += length;
      pos++; // unused padding
    }
    columns.push(posts);
  }
  return { width, height, columns };
}

// ---------------------------------------------------------------------------
// Step 5 — Composite patches into a flat RGBA array
// ---------------------------------------------------------------------------

/**
 * Composite all patches of a texture definition into a flat RGBA Uint8Array.
 * @param {TexDef} texDef
 * @param {import('@gk-doom/wad').Wad} wad
 * @param {string[]} pnames
 * @param {Uint8Array} palette
 * @returns {Uint8Array}
 */
function compositeTexture(texDef, wad, pnames, palette) {
  const rgba = new Uint8Array(texDef.width * texDef.height * 4);
  for (const placement of texDef.patches) {
    const patchName = pnames[placement.patchIndex];
    const patchBytes = wad.getLump(patchName);
    const patch = decodePatch(patchBytes);
    for (let px = 0; px < patch.width; px++) {
      const destX = placement.originX + px;
      if (destX < 0 || destX >= texDef.width) continue;
      for (const post of patch.columns[px]) {
        for (let row = 0; row < post.pixels.length; row++) {
          const destY = placement.originY + post.topdelta + row;
          if (destY < 0 || destY >= texDef.height) continue;
          const palIdx = post.pixels[row];
          const i = (destY * texDef.width + destX) * 4;
          rgba[i]     = palette[palIdx * 3];
          rgba[i + 1] = palette[palIdx * 3 + 1];
          rgba[i + 2] = palette[palIdx * 3 + 2];
          rgba[i + 3] = 255;
        }
      }
    }
  }
  return rgba;
}

// ---------------------------------------------------------------------------
// Step 6 — Export buildTextureCache
// ---------------------------------------------------------------------------

/**
 * Decode all wall textures from the WAD into flat RGBA pixel arrays.
 * @param {import('@gk-doom/wad').Wad} wad
 * @returns {Map<string, { width: number, height: number, rgba: Uint8Array }>}
 */
function buildTextureCache(wad) {
  const palette  = parsePalette(wad);
  const pnames   = parsePnames(wad);
  const textures = parseTexture1(wad);
  const cache    = new Map();
  for (const texDef of textures) {
    cache.set(texDef.name, {
      width:  texDef.width,
      height: texDef.height,
      rgba:   compositeTexture(texDef, wad, pnames, palette),
    });
  }
  return cache;
}

export { buildTextureCache };
