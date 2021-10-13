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


ENV FUZION_HOME="/home/openvscode-server-v1.60.2-linux-x64/extensions/fuzion/fuzion-lsp-server/fuzion/build"
ENV PATH="${FUZION_HOME}/bin:${PATH}"
ENV FUZION_JAVA_CLASSPATH="${FUZION_HOME}/../../out.jar"

COPY entrypoint.sh /home/
COPY Hello.md /home/workspace/
COPY fuzion-lsp-server/fuzion/tests/hello/HelloWorld.fz /home/workspace/
COPY fuzion-lsp-server/fuzion/examples/complex/pythagoreanTriple.fz /home/workspace/
RUN chown -R openvscode-server:openvscode-server /home/workspace

USER openvscode-server

ENTRYPOINT /home/entrypoint.sh
