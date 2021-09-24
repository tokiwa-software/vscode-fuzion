import net from 'net';
import vscode from 'vscode';
import child_process from 'child_process';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;
let server: child_process.ChildProcessWithoutNullStreams;
let clientChannel: vscode.OutputChannel;
let serverMessageOutputChannel: vscode.OutputChannel;
let serverOutputChannel: vscode.OutputChannel;

function checkJava() {
  try {
    child_process.execSync('java').toString();
  }
  catch (error) {
    if (error.status !== 1) {
      vscode.window.showErrorMessage('Please install Java and make sure it\'s in PATH.');
      return false;
    }
  }
  return true;
}

function activate(context) {
  const transportKind = TransportKind.socket;
  const debug = context.extensionMode == vscode.ExtensionMode.Development;

  clientChannel = vscode.window.createOutputChannel("vscode-fuzion");
  serverMessageOutputChannel = vscode.window.createOutputChannel("vscode-fuzion_server_message");
  serverOutputChannel = vscode.window.createOutputChannel("vscode-fuzion_server");

  context.subscriptions.push(clientChannel);

  if (!checkJava()) {
    return;
  }

  if (transportKind === TransportKind.socket) {
    const lspServer = debug
      ? {
        command: 'make',
        arguments: [`debug`, `-s`, `-C`, `${context.extensionPath}/fuzion-lsp-server/`, `-f`, `${context.extensionPath}/fuzion-lsp-server/Makefile`],
        options: {
          env: {
            ...process.env,
            "PRECONDITIONS": "true",
            "POSTCONDITIONS": "true",
            "DEBUG": "true",
          }
        }
      }
      // NYI loose dependency on make and javac for production
      : {
        command: 'make',
        arguments: [`-s`, `-C`, `${context.extensionPath}/fuzion-lsp-server/`, `-f`, `${context.extensionPath}/fuzion-lsp-server/Makefile`, `tcp`],
        options: {
          env: {
            ...process.env,
            "PRECONDITIONS": "false",
            "POSTCONDITIONS": "false",
            "DEBUG": "false",
          }
        }
      };

    server = child_process.spawn(lspServer.command, lspServer.arguments, lspServer.options);

    server.once("exit", (code) => {
      if (code !== 0) {
        vscode.window.showErrorMessage(`Fuzion language server crashed. Exit code: ${code}`);
      }
    });

    server.stderr.on('data', function (data) {
      const stdErr = data.toString().split('\n');
      stdErr.forEach(line => serverOutputChannel.appendLine('stderr: ' + line));
    });

    server.stdout.on('data', function (data) {
      const stdOut = data.toString().split('\n');
      stdOut.forEach(line => serverOutputChannel.appendLine('stdout: ' + line));
      const port = stdOut
        .filter(line => line.startsWith('socket opened on port:'))
        .map(line => parseInt(line.replace(/\D*/g, '')))
        .find(() => true);
      if (!port) {
        return;
      }

      const serverOptions: ServerOptions = () => {
        const socket = net.connect(port);
        const result = {
          writer: socket,
          reader: socket
        };
        return Promise.resolve(result);
      };

      const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'Fuzion' }],
        outputChannel: serverMessageOutputChannel
      };

      client = new LanguageClient(
        'Fuzion Language Server',
        serverOptions,
        clientOptions
      );

      client.start();
      clientChannel.appendLine('stdout: Fuzion Language Client started');
    });
  }

}

function deactivate() {
  // NYI dispose channels
  if (server) {
    server.kill("SIGTERM");
  }
  if (!client) {
    return undefined;
  }
  return client.stop();
}

module.exports = {
  activate,
  deactivate
};
