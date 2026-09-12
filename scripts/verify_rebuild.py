"""Delete generated outputs, rebuild from source, and prove byte-for-byte parity."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/v24';OUT.mkdir(exist_ok=True,parents=True)
def fingerprint():
    return {str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for folder in ['public/app','dist'] for f in (ROOT/folder).rglob('*') if f.is_file()}
before=fingerprint();start=time.monotonic()
for directory in ['public/app','dist']:shutil.rmtree(ROOT/directory)
result=subprocess.run(['npm','run','build'],cwd=ROOT,capture_output=True,text=True)
(OUT/'logs/clean-rebuild.log').write_text(result.stdout+result.stderr)
after=fingerprint();changed=[p for p in sorted(set(before)|set(after)) if before.get(p)!=after.get(p)]
report={'command':'delete public/app and dist; npm run build','exitCode':result.returncode,'beforeFiles':len(before),'afterFiles':len(after),'changedFiles':changed,'status':'PASS' if not changed and result.returncode==0 else 'FAIL','durationSeconds':round(time.monotonic()-start,3),'sha256':after}
(OUT/'CLEAN_REBUILD_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','exitCode','beforeFiles','afterFiles','changedFiles','durationSeconds']},indent=2));sys.exit(report['status']!='PASS')
