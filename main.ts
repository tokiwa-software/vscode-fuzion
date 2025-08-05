import child_process from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import vscode, { ExtensionContext, OutputChannel } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

const isWindows = process.platform === "win32";
let isDebug = false;
const restartTimeoutInSec = 3;
let startCount = 0;
const maxRestartCount = 10;
const javaThreadStackSizeMB = 16;
let client: LanguageClient;
let server: child_process.ChildProcessWithoutNullStreams;
let clientChannel: vscode.OutputChannel;
let serverMessageOutputChannel: vscode.OutputChannel;
let serverOutputChannel: vscode.OutputChannel;

function checkJava() {
  try {
    child_process.execSync('java -version').toString();
  }
  catch (error) {
    vscode.window.showErrorMessage('Please install Java and make sure it\'s in PATH.');
    return false;
  }
  return true;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('listening', function () {
      const port = server.address().port;
      server.close();
      resolve(port);
    })
    server.on('error', function (err) {
      reject();
    })
    server.listen(0, '127.0.0.1');
  });
}

class OutputChannelWriter implements OutputChannel {
  constructor(private outputChannel: OutputChannel) {
    this.name = 'wrapper_' + outputChannel.name;
  }
  name: string;
  append(value: string): void {
    if (isDebug) {
      fs.appendFileSync(os.tmpdir() + `/${this.outputChannel.name}.log`, value);
    }
    this.outputChannel.append(value);
  }
  appendLine(value: string): void {
    if (isDebug) {
      fs.appendFileSync(os.tmpdir() + `/${this.outputChannel.name}.log`, value + '\n')
    }
    this.outputChannel.appendLine(value);
  }
  clear(): void {
    this.outputChannel.clear();
  }
  show(preserveFocus?: boolean): void;
  show(column?: vscode.ViewColumn, preserveFocus?: boolean): void;
  show(column?: any, preserveFocus?: any): void {
    throw new Error('Method not implemented.');
  }
  hide(): void {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    this.outputChannel.dispose();
  }
}

function start(lspServer) {
  try { client?.stop(); } catch { }

  startCount++;
  if (maxRestartCount < startCount) {
    return;
  }

  server = child_process.spawn(lspServer.command, lspServer.arguments, lspServer.options);

  server.once("exit", (code) => {
    if (code !== 0) {
      vscode.window.showErrorMessage(`Fuzion language server crashed. Exit code: ${code}`);
      vscode.window.showErrorMessage(`restarting in ${restartTimeoutInSec}sec.`);
      setTimeout(() => { start(lspServer) }, restartTimeoutInSec * 1000)
    }
  });

  server.stderr.on('data', function (data) {
    const stdErr = data.toString().split('\n');
    stdErr.forEach(line => serverOutputChannel.appendLine('stderr: ' + line));
  });

  server.stdout.on('data', function (data) {
    const stdOut = data.toString().split('\n');
    stdOut.forEach(line => serverOutputChannel.appendLine('stdout: ' + line));


    const serverOptions: ServerOptions = () => {
      const socket = net.connect(lspServer.port);
      const result = {
        writer: socket,
        reader: socket
      };
      return Promise.resolve(result);
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: 'file', language: 'Fuzion' }],
      outputChannel: new OutputChannelWriter(serverMessageOutputChannel)
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

async function activate(context: ExtensionContext) {
  const transportKind = TransportKind.socket;
  isDebug = context.extensionMode == vscode.ExtensionMode.Development;

  clientChannel = vscode.window.createOutputChannel("vscode-fuzion");
  serverMessageOutputChannel = vscode.window.createOutputChannel("vscode-fuzion_server_message");
  serverOutputChannel = vscode.window.createOutputChannel("vscode-fuzion_server");

  context.subscriptions.push(clientChannel);

  if (!checkJava()) {
    return;
  }

  if (transportKind === TransportKind.socket) {
    start(await getSpawnArgs(context));
  }
}


async function getSpawnArgs(context: ExtensionContext) {
  const port = await findFreePort();

  if (!isDebug) {
    return {
      command: 'java',
      arguments: [`-Dfuzion.home=${context.extensionPath}/fuzion/build`, `-Dfile.encoding=UTF-8`, `-Xss${javaThreadStackSizeMB}m`, `-jar`, `./build/lsp.jar`, `-socket`, `--port=` + port],
      options: {
        env: {
          ...process.env,
          "PRECONDITIONS": "false",
          "POSTCONDITIONS": "false",
          "DEBUG": "false",
        },
        cwd: `${context.extensionPath}/fuzion/`
      },
      port: port
    };
  }

  function prependEnvPath(path) {
    if (fs.existsSync(path)) {
      process.env.PATH = `${path};${process.env.PATH}`
    }
  }
  // on windows we are using msys2 for now to start debugging.
  // may consider adding support for powershell but Makefile
  // has to be "fixed" to work in powershell first
  if (isWindows) {
    prependEnvPath('C:\\tools\\msys64\\usr\\bin');
    prependEnvPath('C:\\msys64\\usr\\bin');
    const makeVersion = child_process.execSync('make -v');
    if (!makeVersion.includes('x86_64-pc-msys')) {
      throw 'make flavour not supported. use msys2 make. (pacman -S make)';
    }
  }
  return {
    command: 'make',
    arguments: [`-s`, `lsp/debug/socket`],
    options: {
      env: {
        ...process.env,
        "PRECONDITIONS": "true",
        "POSTCONDITIONS": "true",
        "DEBUG": "true",
        "LANGUAGE_SERVER_PORT": port
      },
      cwd: `${context.extensionPath}/fuzion/`
    },
    port: port
  };
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
