# Contributing

Keep the platform small and honest. Start with `docs/ARCHITECTURE.md` and `docs/CONTENT_PACKS.md`.

Preserve question IDs once published. Add or change content in versioned packs instead of inserting product-specific rules into UI rendering. A simulated result must always say it is simulated. A self-review is not an automatic pass. Do not add keyword-based pseudo-judging or present unsupported dialect syntax as an incorrect answer.

Rebuild `public/app/` and `OPEN_STUDIO.html` after TypeScript changes. Run the Node tests, Python server tests and optional UI harness. Report skipped/runtime-unverified tests rather than substituting another engine and calling it the same result. Keep native-browser verification separate from the embedded test harness.

Do not copy exercise banks, code or assets from reviewed repositories without checking and preserving the appropriate licenses. Original content and small hand-reviewed fixtures are preferable. Never add real credentials or company data to public fixtures.
