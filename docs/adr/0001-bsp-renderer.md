# BSP renderer over raycaster

We use the BSP tree already embedded in the WAD (`NODES`, `SEGS`, `SSECTORS` lumps) to drive rendering, drawing wall columns front-to-back as the original DOOM engine does. A raycaster (Wolfenstein-style) was the obvious alternative for a simpler first implementation, but it would have required ignoring the WAD's actual rendering data, couldn't represent non-orthogonal walls or sector height differences correctly, and would have been harder to evolve toward faithful DOOM rendering later.
