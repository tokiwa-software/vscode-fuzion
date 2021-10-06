#!/bin/bash

${OPENVSCODE_SERVER_ROOT}/server.sh &

while true
do
  sleep 60;
  # if only one socket is in use, container is not used anymore
  if [ "$(cat /proc/net/sockstat |grep TCP:|cut -d ' ' -f 2,3)" == "inuse 1" ]
  then
    kill -s 15 -1 && (sleep 10; kill -s 9 -1)
    exit 1
  fi
done
