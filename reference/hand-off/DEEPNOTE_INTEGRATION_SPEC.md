# Deepnote Companion Integration

Deepnote is optional and additive. CodeDELeet remains the fast drill interface.

## Use cases

Deepnote links may be attached to:

- SQL exercises;
- Python exercises;
- Pandas exercises;
- PySpark exercises;
- DE concept/theory cases;
- architecture review;
- mock interview notebooks.

## PySpark rule

PySpark is still fully represented inside CodeDELeet with:

- prompt;
- schema;
- sample input/output;
- editable code;
- hints;
- solution;
- explanation;
- visual transformation/Spark-plan teaching aids.

Actual Spark execution is external. `Open in Deepnote` should take the learner to the matching long-form notebook when a valid URL exists.

## Metadata

Prefer an array rather than one URL:

```json
{
  "deepnoteLinks": [
    {
      "type": "exercise",
      "label": "Run full Spark exercise",
      "url": "",
      "exerciseRef": "PS-04"
    }
  ],
  "deepnoteEmbedUrl": null
}
```

Supported link types:

- exercise
- concept
- mock
- reference
- project

## URL rules

- Never invent a Deepnote URL.
- Hide link UI when URL is empty/invalid.
- Prefer exact block/exercise URL when reliable.
- Otherwise link to notebook.
- Otherwise link to project.
- Display the exercise reference so the learner can immediately locate the section.

## Embedded preview

Only display an iframe when an explicit safe public `deepnoteEmbedUrl` is configured.

The iframe is a preview/companion surface, not an editable notebook assumption.

Recommended UI:

```text
Deepnote companion

PS-04 - Windowed revenue
[Open in Deepnote]

Related:
[SPARK-JOINS]
[SPARK-WINDOWS]
```

## Mapping template

Create a v2 mapping file such as:

```json
{
  "version": 1,
  "links": {
    "pyspark.latest-record": {
      "exerciseRef": "PS-04",
      "url": ""
    },
    "sql.latest-event": {
      "exerciseRef": "SQL-07",
      "url": ""
    }
  }
}
```

This lets real URLs be filled later without changing exercise IDs.

