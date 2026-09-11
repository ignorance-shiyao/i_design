#!/bin/bash
pkill -f "[v]ite preview" >/dev/null 2>&1
sleep 1
setsid nohup npx vite preview --port 4280 >/tmp/preview.log 2>&1 < /dev/null &
for i in $(seq 1 25); do
  sleep 1
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4280/ 2>/dev/null)" = "200" ] && echo up && exit 0
done
echo failed; tail -5 /tmp/preview.log
