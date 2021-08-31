const net = require('net');
const vscode = require('vscode');
const child_process = require('child_process');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');

let client, server, channel;

function checkJava(){
  try
  {
    child_process.execSync('java').toString();
  }
  catch (error)
  {
    if (error.status !== 1)
    {
      vscode.window.showErrorMessage('Please install Java and make sure it\'s in PATH.');
      return false;
    }
  }
  return true;
}

function activate(context)
{
  const transportKind = TransportKind.socket;
  const debug = context.extensionMode == vscode.ExtensionMode.Development;
  channel = vscode.window.createOutputChannel("vscode-fuzion");
  context.subscriptions.push(channel);

  if(!checkJava()){
    return;
  }

  if (transportKind === TransportKind.socket)
  {
    lspServer = debug
      ? {
        command: 'make',
        arguments: [`debug`, `-C`, `${context.extensionPath}/fuzion-lsp-server/`, `-f`, `${context.extensionPath}/fuzion-lsp-server/Makefile`],
        options: {
          env:{
            ...process.env,
            "PRECONDITIONS": "true",
            "POSTCONDITIONS": "true",
          }
        }
      }
      : 'not implemented';

    server = child_process.spawn(lspServer.command, lspServer.arguments, lspServer.options);

    server.once("exit", (code) =>
    {
      if (code !== 0)
      {
        vscode.window.showErrorMessage(`Unable to start server. Code: ${code}`);
      }
    });

    server.stderr.on('data', function (data){
      const stdErr = data.toString().split('\n');
      stdErr.forEach(line => channel.appendLine('SERVER-ERROR: ' + line));
    });

    server.stdout.on('data', function (data)
    {
      const stdOut = data.toString().split('\n');
      stdOut.forEach(line => channel.appendLine('SERVER: ' + line));
      const port = stdOut
        .filter(line => line.startsWith('socket opened on port:'))
        .map(line => parseInt(line.replace(/\D*/g, '')))
        .find(() => true);
      if (!port)
      {
        return;
      }

      const serverOptions = () =>
      {
        const socket = net.connect(port);
        const result = {
          writer: socket,
          reader: socket
        };
        return Promise.resolve(result);
      };

      const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'Fuzion' }],

      };

      client = new LanguageClient(
        'Fuzion Language Server',
        serverOptions,
        clientOptions
      );

      channel.appendLine('CLIENT: Fuzion Language Client started');
      client.start();
    });
  }

}

function deactivate()
{
  if (channel)
  {
    channel.dispose();
  }
  if (server)
  {
    server.kill("SIGTERM");
  }
  if (!client)
  {
    return undefined;
  }
  return client.stop();
}

module.exports = {
  activate,
  deactivate
};
