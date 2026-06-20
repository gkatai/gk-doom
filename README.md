# gk-doom

A browser-based DOOM clone that reads the original shareware WAD file and renders its maps with a playable character. No enemies or game logic — map rendering and player movement only.

## What it does

- Parses `doom1.wad` (shareware) in the browser
- Renders E1M1 using a BSP tree traversal and software column renderer
- Player moves with WASD + mouse (Pointer Lock), solid walls block movement

## Project docs

| Document | Purpose |
|----------|---------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary — canonical terms for this project |
| [`docs/wad-format.md`](./docs/wad-format.md) | WAD binary format reference + E1M1 known test values |
| [`docs/adr/`](./docs/adr/) | Architecture Decision Records |

## Architecture decisions

| ADR | Decision |
|-----|----------|
| [0001](./docs/adr/0001-bsp-renderer.md) | BSP renderer (not raycaster) |
| [0002](./docs/adr/0002-canvas2d-pixel-buffer.md) | Canvas 2D + `putImageData` (not WebGL) |
| [0003](./docs/adr/0003-render-resolution-640x400.md) | 640×400 internal resolution |
| [0004](./docs/adr/0004-solid-colour-rendering-first.md) | Solid colour rendering before textures |
| [0005](./docs/adr/0005-classic-doom-controls.md) | Classic DOOM controls, no pitch |

## Repo structure

```
/
├── CONTEXT.md                  ← domain glossary
├── docs/
│   ├── wad-format.md           ← WAD binary spec + E1M1 test values
│   └── adr/                    ← architecture decisions
└── src/
    └── services/
        └── web/                ← Vite app (TypeScript)
            ├── src/main.js
            └── public/
                └── doom1.wad   ← shareware WAD (served as static asset)
```

## Development

```bash
npm run dev:web     # start Vite dev server
npm run typecheck   # TypeScript check
npm run test        # Jest tests
npm run check       # lint + typecheck + test
```

## Issues / roadmap

See [GitHub Issues](https://github.com/gkatai/gk-doom/issues) for the current breakdown:

1. [Game loop scaffold](https://github.com/gkatai/gk-doom/issues/1)
2. [WAD loader](https://github.com/gkatai/gk-doom/issues/2)
3. [Map structure parser](https://github.com/gkatai/gk-doom/issues/3)
4. [BSP solid-colour renderer](https://github.com/gkatai/gk-doom/issues/4)
5. [Player movement and collision](https://github.com/gkatai/gk-doom/issues/5)
