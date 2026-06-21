# 90° horizontal FOV with projection plane distance of 320

We use a 90° horizontal field of view for the seg projector, which means the projection plane distance is exactly `half_width = 320` pixels. A camera-space point `(cx, cy)` maps to screen column `cx / cy * 320 + 320`. This keeps the projection math simple and self-consistent with the 640-pixel-wide buffer.

The original DOOM engine used a narrower effective FOV (~74°) achieved by scaling a 320×200 projection plane to a wider display. We considered matching that for authenticity but chose 90° because it avoids the extra scaling constant, the difference is not noticeable without side-by-side comparison, and the FOV can be adjusted later by changing a single constant.
