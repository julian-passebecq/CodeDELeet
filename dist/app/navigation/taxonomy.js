const families = {
    code: [
        ['sql-patterns', 'SQL Query Patterns', 'Joins, windows and queries at the right grain.', 'code'],
        ['python-dataframes', 'Python and Dataframes', 'Collections, batches and tabular transformations.', 'code'],
        ['spark-distributed', 'PySpark and Distributed Data', 'Lazy plans, joins and data movement.', 'pipeline'],
        ['developer-workflow', 'Git, Shell and Developer Workflow', 'Safe changes and repeatable investigation.', 'git'],
        ['interview-patterns', 'Interview Problem-Solving Patterns', 'Recognize keys, invariants and edge cases.', 'book']
    ],
    model: [
        ['dimensional-grain', 'Dimensional Modeling and Grain', 'Facts, dimensions and historical meaning.', 'model'],
        ['relationships-context', 'Relationships and Filter Context', 'Trace which rows a filter can reach.', 'model'],
        ['measures-dax', 'Measures and DAX Reasoning', 'Measures that respond correctly to context.', 'code'],
        ['model-performance', 'Semantic Model Performance and Quality', 'Cardinality, maintainability and measurement.', 'settings'],
        ['bi-serving', 'Fabric / BI Serving Patterns', 'From a trusted table to a useful report.', 'architecture']
    ],
    pipeline: [
        ['dag-orchestration', 'DAGs and Orchestration', 'Dependencies, branches and publication gates.', 'pipeline'],
        ['incremental-cdc', 'Incremental Loads, CDC and Idempotency', 'Replay safely without losing late changes.', 'pipeline'],
        ['quality-contracts', 'Data Quality, Contracts and Schema Drift', 'Make assumptions testable at boundaries.', 'check'],
        ['retries-observability', 'Retries, Observability and Troubleshooting', 'Find the first failure and recover safely.', 'clock'],
        ['elt-deployment', 'ELT, dbt and Deployment Patterns', 'Version, test and promote transformations.', 'git']
    ],
    architecture: [
        ['lakehouse-serving', 'Lakehouse, Warehouse and Serving Architecture', 'Separate storage, compute and consumption.', 'architecture'],
        ['platform-tradeoffs', 'Platform Trade-offs', 'Compare Fabric, Databricks, Snowflake and BigQuery.', 'model'],
        ['spark-compute', 'Spark and Distributed Compute', 'Partitions, skew and scaling decisions.', 'pipeline'],
        ['security-governance', 'Security, Governance and Access Boundaries', 'Identity, least privilege and safe state.', 'settings'],
        ['cost-operations', 'Cost, Reliability, Performance and Operations', 'Diagnose systems and operate changes safely.', 'clock']
    ]
};
export const CATEGORIES = Object.entries(families).flatMap(([workspace, rows]) => rows.map(([id, title, description, icon], order) => ({ id, title, description, icon, order, workspace: workspace })));
export const categoriesFor = (workspace) => CATEGORIES.filter(c => c.workspace === workspace);
export const categoryFor = (workspace, id) => CATEGORIES.find(c => c.workspace === workspace && c.id === id);
/** Explicit, reviewed association, not title guessing. Unmapped imports remain discoverable. */
const groups = [
    ['sql-patterns', 'Joins and aggregation', ['sql-paid-revenue', 'v2-sql-cte']],
    ['sql-patterns', 'Windows and latest rows', ['sql-latest-order', 'tsql-running-total', 'bigquery-qualify']],
    ['python-dataframes', 'Collections and batches', ['python-aggregate', 'v2-python-batches']],
    ['python-dataframes', 'Dataframe grain', ['pandas-grain']],
    ['spark-distributed', 'Deterministic transforms', ['spark-dedup', 'v2-spark-aggregate']],
    ['spark-distributed', 'Joins and shuffles', ['v2-spark-join', 'v2-concept-shuffle']],
    ['developer-workflow', 'Safe changes and log triage', ['git-safe-undo', 'linux-log-triage']],
    ['interview-patterns', 'Keys, lookup and revision rules', ['python-two-sum', 'v2-python-latest', 'v2-sql-quality']],
    ['dimensional-grain', 'Facts and historical dimensions', ['bi-star-schema', 'bi-scd']],
    ['relationships-context', 'Filter propagation', ['bi-filter-context']],
    ['measures-dax', 'Measures and safe ratios', ['bi-revenue', 'bi-margin']],
    ['model-performance', 'Model maintenance', ['bi-csharp']],
    ['dag-orchestration', 'Dependencies and branches', ['v2-airflow-branch']],
    ['incremental-cdc', 'Watermarks and replay', ['adf-watermark', 'dag-idempotency', 'v2-concept-watermark']],
    ['quality-contracts', 'Publication gates', ['dag-data-quality']],
    ['retries-observability', 'Failure evidence', ['v2-dbt-failure']],
    ['elt-deployment', 'Tested lineage', ['dbt-lineage']],
    ['lakehouse-serving', 'Storage and serving paths', ['arch-fabric', 'arch-databricks', 'arch-table-formats']],
    ['platform-tradeoffs', 'Constraint-led comparison', ['v2-cloud-compare']],
    ['spark-compute', 'Skew and file layout', ['arch-spark-skew', 'v2-spark-files']],
    ['security-governance', 'Infrastructure boundaries', ['arch-tofu', 'v2-tofu-replacement']],
    ['cost-operations', 'Compute and query diagnosis', ['arch-bigquery', 'arch-kubernetes', 'v2-k8-selector', 'v2-docker-cache']],
    ['cost-operations', 'Shell investigation', ['v2-bash-csv', 'v2-powershell-csv', 'v2-powershell-json']],
    ['cost-operations', 'Version control operations', ['v2-git-stage', 'v2-git-merge', 'v2-git-rebase', 'v2-git-fetch', 'v2-git-conflict', 'v2-git-detached']]
];
export const EXERCISE_CATEGORIES = Object.fromEntries(groups.flatMap(([categoryId, subcategory, ids]) => ids.map(id => [id, { categoryId, subcategory }])));
export function association(q) {
    const mapped = EXERCISE_CATEGORIES[q.id];
    if (mapped && categoryFor(q.workspace, mapped.categoryId))
        return { ...mapped, imported: false };
    if (typeof q.categoryId === 'string' && categoryFor(q.workspace, q.categoryId))
        return { categoryId: q.categoryId, subcategory: typeof q.subcategoryId === 'string' ? q.subcategoryId.slice(0, 80) : 'Imported / Other', imported: true };
    return { categoryId: categoriesFor(q.workspace)[4].id, subcategory: 'Imported / Other', imported: true };
}
export function validateTaxonomy(questions) {
    for (const lab of Object.keys(families))
        if (categoriesFor(lab).length !== 5)
            throw Error('Exactly five primary categories required: ' + lab);
    if (new Set(CATEGORIES.map(c => c.id)).size !== 20)
        throw Error('Duplicate category ID');
    for (const [id, map] of Object.entries(EXERCISE_CATEGORIES)) {
        const q = questions.find(q => q.id === id);
        if (!q || !categoryFor(q.workspace, map.categoryId))
            throw Error('Invalid exercise/category association: ' + id);
    }
}
