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
  if (client) {
    client.stop();
  }

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

function activate(context: ExtensionContext) {
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
    start(getSpawnArgs(context));
  }
}

function getSpawnArgs(context: ExtensionContext) {
  if (!isDebug) {
    return {
      command: 'java',
      arguments: [`-Dfuzion.home=${context.extensionPath}/fuzion-lsp-server/fuzion/build`, `-Dfile.encoding=UTF-8`, `-Xss${javaThreadStackSizeMB}m`, `-jar`, `./out.jar`, `-tcp`],
      options: {
        env: {
          ...process.env,
          "PRECONDITIONS": "false",
          "POSTCONDITIONS": "false",
          "DEBUG": "false",
        },
        cwd: `${context.extensionPath}/fuzion-lsp-server/`
      }
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
    arguments: [`-s`, `debug`],
    options: {
      env: {
        ...process.env,
        "PRECONDITIONS": "true",
        "POSTCONDITIONS": "true",
        "DEBUG": "true",
      },
      cwd: `${context.extensionPath}/fuzion-lsp-server/`
    }
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
