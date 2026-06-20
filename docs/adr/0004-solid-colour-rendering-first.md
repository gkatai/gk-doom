# Solid colour rendering before texture rendering

For the initial rendering milestone, walls are drawn as solid colours (derived from sector light level) and floors/ceilings as flat fills. Full texture rendering — which requires parsing `PNAMES`, `TEXTURE1/2`, and flat lumps, then doing per-pixel texture column sampling — is deferred to a follow-on epic. This is a deliberate scope boundary, not an oversight. Floor/ceiling texture rendering (visplane algorithm) is the most complex part of the original engine and warrants its own epic regardless.
