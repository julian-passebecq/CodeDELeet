# Third-party notices and provenance

## Bundled

- **CodeMirror 5.58.3**: copied from the installed Jupyter/nbclassic licensed distribution. MIT license retained at `public/vendor/codemirror/LICENSE`. Only required core/modes/addons are bundled; `studio-modes.js` is original lightweight HCL/DAX mode code. No font files are included.
- Existing CodeDELeet concepts/contracts and starter content: user-requested continuation of `julian-passebecq/CodeDELeet` at commit `d3c7c21ba79a082da21925b5ee0dce69212577fe`; its observed root package is MIT. V2.2 continues the uploaded V2 source. The prior commit is historical provenance only; this pass performed no repository access. Domain engines are retained and presentation orchestration is extracted.

## Optional external loads / build dependency

- DuckDB-Wasm 1.29.0, MIT, via jsDelivr on explicit SQL runtime use.
- Pyodide 0.27.7, MPL-2.0 project distribution with separately licensed Python/packages, via jsDelivr on explicit Python use.
- Mermaid 11.16.1, MIT, via jsDelivr on explicit rendering.
- TypeScript 5.8.3, Apache-2.0, npm build-only dependency.

Pinned versions describe the source URLs used by this build, not a claim of current/latest versions or a completed security audit. External runtime packages are not vendored into this archive; their CDN startup is an open release gate.

## Diagrams and icons

The app uses original neutral line icons and original conceptual SVG diagrams, not copied vendor logos, Power BI screenshots or official architecture images. Official documentation is linked in each exercise's Sources. A citation/link is not a claim that an illustration is official or that documentation images are licensed for redistribution.

Private notebook and older source archives from the previous delivery are not redistributed in V2.2. Deepnote reference labels remain metadata only.

## V2.3 compact-shell pass

No new third-party runtime dependency, icon pack, font, engine or vendor asset was
added. The header uses the existing neutral icon vocabulary plus one original
Theme glyph. The supplied offline research archives and prototype are private
implementation references and are not included in this source/build release.
A historical nested trainer ZIP from the baseline reference directory is also
omitted; it is not required by the application. Existing license files remain.
