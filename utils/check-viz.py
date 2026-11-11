import sys, pathlib
for f in ['qa/spawn-kitchen-b.png','qa/spawn-living-b.png','qa/spawn-bed-b.png','qa/spawn-kitchen-c.png']:
  p=pathlib.Path(f)
  if not p.exists(): print('MISSING',f); continue
  if p.suffix.lower()=='.png':
    with open(p,'rb') as fh: sig=fh.read(8)
    print(f'PNG {f}: {sig.hex()} len={p.stat().st_size}')
  else:
    print(f'OTHER {f}: {p.suffix}')
