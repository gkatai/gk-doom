# Internal render resolution of 640×400

The pixel buffer is fixed at 640×400 and CSS-scaled to fill the viewport with `image-rendering: pixelated`. 320×200 (DOOM native) was considered for authenticity and smaller fill cost, and native screen resolution for sharpness — 640×400 was chosen as a middle ground that gives a clear retro image without the chunky look of 320×200, while keeping the column-fill loop far cheaper than a full HD buffer. The resolution is an isolated constant; changing it later requires no architectural work.
