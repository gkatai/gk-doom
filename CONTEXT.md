# gk-doom

A browser-based DOOM clone that reads the original shareware WAD file and renders its maps with a player character. No enemies or game logic — only map rendering and player movement.

## Language

**WAD** (Where's All the Data):
The binary file format used by DOOM to store all game assets; the shareware `doom1.wad` is the single data source for this project.

**Lump Directory**:
The parsed, indexed table of all lumps in a WAD, built from the binary directory section at parse time; the in-memory structure that backs all lump lookups.

**Map Marker**:
A zero-byte lump (e.g. `E1M1`) that signals the start of a map's lump group in the Lump Directory; the lumps immediately following a Map Marker (up to the next marker) belong to that map.

**Lump**:
A named, contiguous block of data inside a WAD file; all map geometry, textures, and metadata are stored as lumps.

**Map** (`DoomMap` in code):
A single playable level defined by a group of lumps (`VERTEXES`, `LINEDEFS`, `SIDEDEFS`, `SECTORS`, `SEGS`, `SSECTORS`, `NODES`, etc.).
_Avoid_: `Map` (conflicts with JS built-in)

**Sector**:
A convex region of the map floor/ceiling plane with a single floor height, ceiling height, and light level.

**Linedef**:
A directed line segment connecting two **Vertices** that forms a wall boundary between **Sectors** or a solid wall.

**Sidedef**:
The texture and offset data attached to one side of a **Linedef**; a two-sided **Linedef** has a front and back **Sidedef**.

**Vertex**:
A 2D point (x, y) in map space; the primitive building block of all geometry.
_Avoid_: point, coordinate, vert

**Thing**:
A point entity placed in a map with a position, angle, type code, and flags; used to define player starts, enemies, and items. Player 1 start is type `1`.
_Avoid_: entity, object, actor

**Seg**:
A subsection of a **Linedef** used by the BSP renderer; the unit of wall rendering.

**SSector** (Sub-sector):
A convex polygon made up of one or more **Segs**; the leaf node of the BSP tree.

**BSP Node** (`BspNode` in code):
An internal node of the BSP tree that partitions space with a splitter line into a front child and a back child.

**BSP Tree**:
The precomputed Binary Space Partitioning tree stored in the `NODES` lump; used to traverse **SSectors** in front-to-back order for rendering.

**Player**:
The single controllable entity in the world; has a position, angle, and height within the map.

## Relationships

- A **WAD** contains one or more **Maps**
- A **Map** contains zero or more **Things**
- A **Map** contains a **BSP Tree** whose leaves are **SSectors**
- An **SSector** is composed of one or more **Segs**
- A **Seg** is a portion of a **Linedef**
- A **Linedef** references one or two **Sidedefs** and connects two **Vertices**
- A **Sidedef** belongs to exactly one **Sector**
- The **Player** exists within exactly one **SSector** at any given time

## Example dialogue

> **Dev:** "When the player moves, do we update the Sector?"
> **Domain expert:** "Strictly speaking, we update the Player's position and then determine which SSector contains them by traversing the BSP Tree from root to leaf."

**Input Module**:
The single object that tracks real-time control state; boolean flags for WASD keys and an accumulated mouse X-delta that resets each frame.
_Avoid_: event listeners, keyboard handler, raw event stream

**Game Loop**:
The `requestAnimationFrame`-driven loop that calls `update(deltaTime)` and then `render()` each frame, where `deltaTime` is milliseconds elapsed since the previous frame.
_Avoid_: tick handler, animation callback, frame callback

## Flagged ambiguities

_(none yet)_
