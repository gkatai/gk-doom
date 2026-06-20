# WAD loader accepts an ArrayBuffer, not a URL

`@gk-doom/wad` exposes `parseWad(buffer: ArrayBuffer)` and does not call `fetch` internally. The web service is responsible for fetching `doom1.wad` and passing the resulting buffer in. The issue framed this as "fetch over HTTP", which might suggest the loader should own the network call, but coupling `fetch` into the library would make unit tests require network mocking and would prevent the package from being used in non-browser environments. Keeping I/O out of the parser costs nothing and makes the boundary clean.
