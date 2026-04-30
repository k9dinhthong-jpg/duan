from pathlib import Path

p = Path('/etc/systemd/system/admin-mct-api.service')
s = p.read_text()

lines = [
  "Environment=MARIA_HOST=127.0.0.1",
  "Environment=MARIA_PORT=3306",
  "Environment=MARIA_USER=adminmct_api",
  "Environment=MARIA_PASSWORD=MctApi@2026!DB",
  "Environment=MARIA_DB=maycongtrinh_db",
]

for ln in lines:
  if ln not in s:
    s = s.replace("ExecStart=/usr/bin/node /opt/admin-mct-api/server.js\n", ln + "\n" + "ExecStart=/usr/bin/node /opt/admin-mct-api/server.js\n")

p.write_text(s)
print('patched-service-env-ok')
