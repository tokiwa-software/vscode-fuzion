const net = require('net');
var vscode = require('vscode');
const child_process = require('child_process');
const { LanguageClient } = require('vscode-languageclient/node');

let client, channel;

function activate(context)
{
    channel = vscode.window.createOutputChannel("vscode-fuzion");
    context.subscriptions.push(channel);

    //TODO get rid of absolute paths
    child_process.spawn(`make`, [`-C`, `${context.extensionPath}/../fuzion-lsp-server/`, `-f`, `${context.extensionPath}/../fuzion-lsp-server/Makefile`])
        .stdout.on('data', function (data)
        {
            const stdOut = data.toString().split('\n');
            stdOut.forEach(line => channel.appendLine('SERVER: ' + line));
            const port = stdOut
                .filter(line => line.startsWith('socket opened '))
                .map(line => parseInt(line.replace( /\D*/g, '')))
                .find(() => true);
            if(!port){
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

            channel.appendLine('EXTENSION: Fuzion Language Client started');
            client.start();
        });


}

function deactivate()
{
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
