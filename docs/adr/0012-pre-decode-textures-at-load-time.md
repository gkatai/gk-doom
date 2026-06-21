# Pre-decode textures into flat RGBA arrays at load time

When the WAD is loaded, all wall textures referenced by the map are decoded from the `TEXTURE1` / `PNAMES` / patch-lump pipeline and composited into flat `width × height × 4` `Uint8Array` (RGBA) pixel arrays, stored in a `Map<string, Uint8Array>` on the Model. The column sampler reads directly from these arrays during rendering — no WAD parsing happens at render time.

The alternative was lazy decoding: decode each texture column on first access and cache the result. Lazy decoding avoids upfront work but makes the sampler stateful and adds per-frame branching. Because all referenced textures for a single map are a small, bounded set, the upfront cost is negligible and the sampler stays a simple array index.
