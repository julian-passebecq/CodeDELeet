export async function serverHealth() {
    try {
        const r = await fetch('./api/health', { signal: AbortSignal.timeout(1500) });
        if (!r.ok)
            return { engine: 'No local SQL adapter', available: false };
        const d = await r.json();
        return { engine: d.engine, available: true };
    }
    catch {
        return { engine: 'Static mode', available: false };
    }
}
export async function runSQL(code, q, tests) {
    const response = await fetch('./api/sql', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Studio-Request': '1' }, body: JSON.stringify({ code, questionId: q.id, tests }), signal: AbortSignal.timeout(18000) });
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error ?? 'The local SQL adapter returned an error.');
    return result;
}
let activeWorker = null;
let activeCancel = null;
export function cancelPython() { activeCancel?.(); activeCancel = null; activeWorker?.terminate(); activeWorker = null; }
export function runPython(q, code, onStatus) {
    cancelPython();
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/python.js', import.meta.url));
        activeWorker = worker;
        let timer;
        const finish = () => { clearTimeout(timer); worker.terminate(); if (activeWorker === worker) {
            activeWorker = null;
            activeCancel = null;
        } };
        const timeout = (ms) => { clearTimeout(timer); timer = setTimeout(() => { finish(); reject(new Error('Browser Python timed out. The worker was terminated. Check runtime download access or an infinite loop.')); }, ms); };
        activeCancel = () => { finish(); reject(new Error('Python run cancelled by a newer run.')); };
        timeout(90000);
        worker.onmessage = ({ data }) => { if (data.status) {
            onStatus(data.status);
            if (data.ready)
                timeout(5000);
            return;
        } finish(); if (data.error)
            reject(new Error(data.error));
        else
            resolve(data.result); };
        worker.onerror = () => { finish(); reject(new Error('Python runtime could not load. It requires access to the pinned Pyodide CDN. You can still export and review the exercise.')); };
        worker.postMessage({ code, tests: q.pythonTests ?? [], entrypoint: q.entrypoint ?? 'solve' });
    });
}
