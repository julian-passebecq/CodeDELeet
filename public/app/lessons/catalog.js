import { validateCatalog } from './validate.js';
export async function loadLessons(questions) {
    const index = await (await fetch('./lessons/index.json')).json();
    if (index.schemaVersion !== 1 || !Array.isArray(index.files) || index.files.length !== 4 || !index.files.every((f) => typeof f === 'string' && /^(code|model|pipeline|architecture)\.json$/.test(f)))
        throw Error('Invalid lesson index');
    const groups = await Promise.all(index.files.map(async (file) => await (await fetch('./lessons/' + file)).json()));
    return validateCatalog(groups.flat(), questions);
}
