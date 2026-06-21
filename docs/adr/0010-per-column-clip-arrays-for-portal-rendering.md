# Per-column clip arrays for portal rendering

The solid-wall renderer used a flat `columnFilled[x]` boolean: once a column was fully painted it was skipped. Portals (two-sided Segs) cannot use this model because they only partially occlude a column — they draw an Upper Wall and Lower Wall but leave the middle open for walls further back. Without vertical clip tracking, those back walls would bleed outside the portal opening.

We replaced `columnFilled` with two `Int16Array`s: `topClip[x]` (topmost still-open row, init `0`) and `bottomClip[x]` (bottommost still-open row, init `HEIGHT - 1`). A column is done when `topClip[x] > bottomClip[x]`. Solid walls close a column in one step; portals narrow the range. The `filledCount` early-exit is unchanged — it still increments when a column transitions to done.

The alternative — keeping the boolean and skipping portals — was rejected because it leaves height differences between adjacent Sectors invisible entirely.
