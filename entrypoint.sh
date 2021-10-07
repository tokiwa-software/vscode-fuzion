#!/bin/bash

#
# entrypoint script for docker container
# - starts vscode server
# - checks every 60s if container is still in use
# - shuts down if container is not in use anymore
#

${OPENVSCODE_SERVER_ROOT}/server.sh -g Hello.md /home/workspace &

while true
do
  sleep 60;
  # if less than two sockets are in use, container is not used anymore
  if [ "$(cat /proc/net/sockstat |grep TCP:|cut -d ' ' -f 3)" -lt 3 ]
  then
    kill -s 15 -1 && (sleep 10; kill -s 9 -1)
  fi
done
