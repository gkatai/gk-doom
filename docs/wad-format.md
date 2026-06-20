# WAD Binary Format Reference

All integers are **little-endian signed** unless noted. Strings are null-padded ASCII, 8 bytes wide.

## File Header (12 bytes)

| Offset | Size | Type   | Field       | Description                        |
|--------|------|--------|-------------|------------------------------------|
| 0      | 4    | string | magic       | `IWAD` for main WAD, `PWAD` for patch |
| 4      | 4    | int32  | numLumps    | Total number of lumps              |
| 8      | 4    | int32  | dirOffset   | Byte offset to the lump directory  |

## Lump Directory Entry (16 bytes, repeated `numLumps` times)

| Offset | Size | Type   | Field  | Description                  |
|--------|------|--------|--------|------------------------------|
| 0      | 4    | int32  | offset | Byte offset of lump data     |
| 4      | 4    | int32  | size   | Size of lump data in bytes   |
| 8      | 8    | string | name   | Lump name, null-padded       |

## Map Marker

A zero-length lump named `ExMy` (e.g. `E1M1`) marks the start of a map. The ten lumps that follow it in directory order belong to that map, always in this sequence:

`THINGS` · `LINEDEFS` · `SIDEDEFS` · `VERTEXES` · `SEGS` · `SSECTORS` · `NODES` · `SECTORS` · `REJECT` · `BLOCKMAP`

---

## Map Lumps

### VERTEXES — 4 bytes per record

| Offset | Size | Type  | Field | Description  |
|--------|------|-------|-------|--------------|
| 0      | 2    | int16 | x     | X coordinate |
| 2      | 2    | int16 | y     | Y coordinate |

### LINEDEFS — 14 bytes per record

| Offset | Size | Type  | Field    | Description                                   |
|--------|------|-------|----------|-----------------------------------------------|
| 0      | 2    | int16 | v1       | Start vertex index                            |
| 2      | 2    | int16 | v2       | End vertex index                              |
| 4      | 2    | int16 | flags    | Bit field (see below)                         |
| 6      | 2    | int16 | special  | Line action type                              |
| 8      | 2    | int16 | tag      | Sector tag for the action                     |
| 10     | 2    | int16 | right    | Right sidedef index (always present)          |
| 12     | 2    | int16 | left     | Left sidedef index (-1 / 0xFFFF if one-sided) |

**Linedef flags (field `flags`):**
- bit 0 — Impassable (solid wall, blocks player)
- bit 1 — Blocks monsters
- bit 2 — Two-sided (has a back sector)
- bit 3 — Upper texture unpegged
- bit 4 — Lower texture unpegged
- bit 5 — Secret (drawn as solid on automap)
- bit 6 — Blocks sound
- bit 7 — Not on automap
- bit 8 — Already on automap

A linedef is **solid** (blocks movement) when `left == -1` (no back sidedef). Bit 0 alone is not sufficient — treat any linedef with `left == -1` as impassable regardless of flags.

### SIDEDEFS — 30 bytes per record

| Offset | Size | Type   | Field     | Description                         |
|--------|------|--------|-----------|-------------------------------------|
| 0      | 2    | int16  | xOffset   | Texture X offset                    |
| 2      | 2    | int16  | yOffset   | Texture Y offset                    |
| 4      | 8    | string | upperTex  | Upper texture name (`-` = none)     |
| 12     | 8    | string | lowerTex  | Lower texture name (`-` = none)     |
| 20     | 8    | string | middleTex | Middle (full) texture name          |
| 28     | 2    | int16  | sector    | Sector index this sidedef faces     |

### SECTORS — 26 bytes per record

| Offset | Size | Type   | Field    | Description                     |
|--------|------|--------|----------|---------------------------------|
| 0      | 2    | int16  | floorH   | Floor height                    |
| 2      | 2    | int16  | ceilH    | Ceiling height                  |
| 4      | 8    | string | floorTex | Floor flat texture name         |
| 12     | 8    | string | ceilTex  | Ceiling flat texture name       |
| 20     | 2    | int16  | light    | Light level (0–255)             |
| 22     | 2    | int16  | special  | Sector type (damage, secret...) |
| 24     | 2    | int16  | tag      | Sector tag                      |

### SEGS — 12 bytes per record

| Offset | Size | Type  | Field   | Description                                              |
|--------|------|-------|---------|----------------------------------------------------------|
| 0      | 2    | int16 | v1      | Start vertex index                                       |
| 2      | 2    | int16 | v2      | End vertex index                                         |
| 4      | 2    | int16 | angle   | Direction in BAMS (0=east, 16384=north, -32768=west)    |
| 6      | 2    | int16 | linedef | Linedef index this seg is part of                        |
| 8      | 2    | int16 | side    | 0 = right sidedef of linedef, 1 = left sidedef          |
| 10     | 2    | int16 | offset  | Distance along linedef to start of this seg              |

### SSECTORS — 4 bytes per record

| Offset | Size | Type  | Field    | Description                          |
|--------|------|-------|----------|--------------------------------------|
| 0      | 2    | int16 | segCount | Number of segs in this sub-sector    |
| 2      | 2    | int16 | firstSeg | Index of the first seg               |

### NODES — 28 bytes per record

| Offset | Size | Type  | Field        | Description                                                    |
|--------|------|-------|--------------|----------------------------------------------------------------|
| 0      | 2    | int16 | x            | Partition line start X                                         |
| 2      | 2    | int16 | y            | Partition line start Y                                         |
| 4      | 2    | int16 | dx           | Partition line delta X                                         |
| 6      | 2    | int16 | dy           | Partition line delta Y                                         |
| 8      | 2    | int16 | rightYUpper  | Right bounding box — Y upper                                   |
| 10     | 2    | int16 | rightYLower  | Right bounding box — Y lower                                   |
| 12     | 2    | int16 | rightXLower  | Right bounding box — X lower                                   |
| 14     | 2    | int16 | rightXUpper  | Right bounding box — X upper                                   |
| 16     | 2    | int16 | leftYUpper   | Left bounding box — Y upper                                    |
| 18     | 2    | int16 | leftYLower   | Left bounding box — Y lower                                    |
| 20     | 2    | int16 | leftXLower   | Left bounding box — X lower                                    |
| 22     | 2    | int16 | leftXUpper   | Left bounding box — X upper                                    |
| 24     | 2    | int16 | rightChild   | Right child: if bit 15 set → SSector index; else → Node index |
| 26     | 2    | int16 | leftChild    | Left child: if bit 15 set → SSector index; else → Node index  |

**Child index decoding:**
```
const SSECTOR_BIT = 0x8000;
const isSSector = (child) => (child & SSECTOR_BIT) !== 0;
const childIndex = (child) => child & ~SSECTOR_BIT;
```

The root node is the **last entry** in the NODES array.

---

## E1M1 Known Values (doom1.wad)

These are ground-truth values extracted directly from the shipped WAD for use in unit tests.

| Lump     | Record size | Record count |
|----------|-------------|--------------|
| VERTEXES | 4 bytes     | 467          |
| LINEDEFS | 14 bytes    | 475          |
| SIDEDEFS | 30 bytes    | 648          |
| SEGS     | 12 bytes    | 732          |
| SSECTORS | 4 bytes     | 237          |
| NODES    | 28 bytes    | 236          |
| SECTORS  | 26 bytes    | 85           |

**Total lumps in doom1.wad:** 1264

**Spot-check values:**

| Item               | Field   | Expected value |
|--------------------|---------|----------------|
| VERTEX[0]          | x       | 1088           |
| VERTEX[0]          | y       | -3680          |
| VERTEX[1]          | x       | 1024           |
| VERTEX[1]          | y       | -3680          |
| VERTEX[2]          | x       | 1024           |
| VERTEX[2]          | y       | -3648          |
| LINEDEF[0]         | v1      | 0              |
| LINEDEF[0]         | v2      | 1              |
| LINEDEF[0]         | flags   | 1 (impassable) |
| LINEDEF[0]         | right   | 0              |
| LINEDEF[0]         | left    | -1 (one-sided) |
| SECTOR[0]          | floorH  | 0              |
| SECTOR[0]          | ceilH   | 72             |
| SECTOR[0]          | floorTex| `FLOOR4_8`     |
| SECTOR[0]          | ceilTex | `CEIL3_5`      |
| SECTOR[0]          | light   | 160            |
