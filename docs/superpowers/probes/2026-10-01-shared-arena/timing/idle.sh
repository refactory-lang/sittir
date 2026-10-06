#!/usr/bin/env bash
# Waits until the machine is idle enough to time: at least MIN % idle in a `top` sample, and no
# live infigraph process watching or indexing a path under the measured copies' directory.
# Gate every timed run on it.
#
#   idle.sh <copies-dir> [min-idle-percent=75]
DIR=${1:?copies dir}; MIN=${2:-75}
while true; do
	idle=$(top -l 2 -s 1 -n 0 | awk '/CPU usage/{v=$7} END{sub("%","",v); print int(v)}')
	busy=$(infigraph ps 2>/dev/null | awk -v d="$DIR" '$2 == "live" && index($0, d) {n++} END{print n+0}')
	[ "$idle" -ge "$MIN" ] && [ "$busy" -eq 0 ] && { echo "idle ${idle}%"; exit 0; }
	sleep 5
done
