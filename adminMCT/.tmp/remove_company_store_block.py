from pathlib import Path

p = Path('/opt/admin-mct-api/server.js')
s = p.read_text()
marker_start = '\ndb.exec(\n  "CREATE TABLE IF NOT EXISTS company_info_store (" +'
start = s.find(marker_start)
if start == -1:
    print('already-removed')
    raise SystemExit(0)
end = s.find('\nfunction addColumnIfMissing', start)
if end == -1:
    print('end-marker-missing')
    raise SystemExit(1)
s = s[:start] + '\n\n' + s[end:]
p.write_text(s)
print('removed-ok')
