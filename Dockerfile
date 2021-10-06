# Docker build script that bundles this extension
# with openvscode-server. openvscode-server is basically visual studio code
# running in the browser.

FROM gitpod/openvscode-server:1.60.2
USER root

# NYI make version independent

RUN apt-get update && apt-get -y install zip openjdk-17-jre-headless

COPY fuzion-lang-0.1.0.vsix /home/
RUN mkdir /home/openvscode-server-v1.60.2-linux-x64/extensions/fuzion/
RUN mkdir /tmp/dir
RUN unzip /home/fuzion-lang-0.1.0.vsix -d /tmp/dir
RUN mv /tmp/dir/extension/* /home/openvscode-server-v1.60.2-linux-x64/extensions/fuzion/
RUN find /home/openvscode-server-v1.60.2-linux-x64/extensions/fuzion/

COPY docker_on_unused_kill.sh /home/
CMD nohup bash -c "while true; do sleep 60; /home/docker_on_unused_kill.sh; done" &

USER openvscode-server
