# Deepnote integration - links only

V2.2 removes the old public companion archive. The build rejects all `.zip` and `.ipynb` assets under `public/`; the release validator independently checks `public/` and `dist/`. No notebook content is fetched or copied by the application.

## Configure

Download the blank mapping from Settings, fill the `url` fields for stable exercise IDs and import it through Settings > Import URL mapping. The envelope is `schemaVersion: 1` with a `links` object. Link entries have `type`, `label`, `url` and optional reference metadata. An empty URL never renders an external action.

Question metadata can alternatively provide `deepnoteUrl`, `deepnoteLabel`, `deepnoteMode` and optional `deepnoteEmbedUrl`. Accepted destinations use HTTPS on the exact `deepnote.com` or `www.deepnote.com` host, accepted workspace/project/app/embed paths, no user credentials, and no custom port. Lookalike domains are rejected. Public embed paths have a narrower allowlist. Embeds require an explicit preview action and may be blocked by permissions or provider policy. Deepnote Data Apps are labelled as read-only previews, not notebook editors.

The mapping record in `DEEPNOTE_REFERENCE_MAP.json` retains historical title/section labels from the previous source, not live URLs or proof of current notebook access. V2.2 checks that shipped link metadata is consistent and URLs are blank; it does not require the private original notebook archive or verify an external workspace.

No token, workspace discovery, notebook creation, Git synchronization, or Deepnote API integration is needed. A PySpark companion runs externally; CodeDELeet itself never claims to execute Spark.
