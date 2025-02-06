import * as vscode from 'vscode';
import { Ollama } from 'ollama';
export function activate(context: vscode.ExtensionContext) {
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const disposable = vscode.commands.registerCommand("kapitala-ext.aichat", () => {
        const panel = vscode.window.createWebviewPanel(
            'deepChat',
            'DeepSeek Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';

                try {
                    const streamResponse = await ollama.chat({ 
                        model: 'deepseek-r1:latest',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });

                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }

                } catch (err) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${err}` });
                    console.error("Error during chat:", err);
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <style>
            body { font-family: sans-serif; margin: 1rem; } 
            #prompt { width: 100%; box-sizing: border-box; }
            #response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; }
        </style>
    </head>
    <body>
        <h3>DeepSeek Extension</h3>
        <textarea id="prompt" rows="3" placeholder="Ask me something..."></textarea><br/>
        <button id="askBtn">Send</button>
        <div id="response"></div>

        <script>
            const vscode = acquireVsCodeAPI();

            document.getElementById('askBtn')?.addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text }); 
            });

            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    document.getElementById('response').innerText = text;
                }
            });
        </script>
    </body>
    </html>`; 
}

export function deactivate() {}