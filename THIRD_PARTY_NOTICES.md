# Third-party notices and provenance

## Bundled

- **CodeMirror 5.58.3**: copied from the installed Jupyter/nbclassic licensed distribution. MIT license retained at `public/vendor/codemirror/LICENSE`. Only required core/modes/addons are bundled; `studio-modes.js` is original lightweight HCL/DAX mode code. No font files are included.
- Existing CodeDELeet concepts/contracts and starter content: user-requested continuation of `julian-passebecq/CodeDELeet` at commit `d3c7c21ba79a082da21925b5ee0dce69212577fe`; its observed root package is MIT. Core/graph/DAX contracts were refactored and the shared V2 shell implemented for this delivery.
- `reference/legacy-trainer/leetcodedataeng-main.zip`: user-supplied reference retained unchanged. It is not loaded into the application or re-licensed by this release; preserve any notices inside it.
- `public/companion/Deepnote_Interview_Suite_v1_4.zip`: user-supplied interview material retained unchanged. Its embedded notices and provenance remain applicable. Do not assume every external source linked by a notebook is licensed for republication.

## Optional external loads / build dependency

- DuckDB-Wasm 1.29.0, MIT, via jsDelivr on explicit SQL runtime use.
- Pyodide 0.27.7, MPL-2.0 project distribution with separately licensed Python/packages, via jsDelivr on explicit Python use.
- Mermaid 11.4.1, MIT, via jsDelivr on explicit rendering.
- TypeScript 5.8.3, Apache-2.0, npm build-only dependency.

Pinned versions describe the source URLs used by this build, not a claim of current/latest versions or a completed security audit. External runtime packages are not vendored into this archive; their CDN startup is an open release gate.

## Diagrams and icons

The app uses original neutral line icons and original conceptual SVG diagrams, not copied vendor logos, Power BI screenshots or official architecture images. Official documentation is linked in each exercise's Sources. A citation/link is not a claim that an illustration is official or that documentation images are licensed for redistribution.
