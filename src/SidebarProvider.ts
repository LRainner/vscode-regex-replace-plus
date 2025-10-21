import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _decorationType: vscode.TextEditorDecorationType;
  private _previewDecorationType: vscode.TextEditorDecorationType;
  private _regex: string = '';
  private _replaceValue: string = '';
  private readonly _extensionUri: vscode.Uri;

  public static readonly viewId = 'regexReplacePlusSidebar';

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;

    this._decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 255, 0, 0.3)',
      border: '1px solid rgba(255, 255, 0, 0.5)',
    });

    this._previewDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        color: 'rgba(153, 153, 153, 0.7)',
        fontStyle: 'italic',
        margin: '0 0 0 1em',
      },
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'regexUpdate':
          this._regex = message.value;
          this._updateDecorations();
          return;
        case 'replaceValueUpdate':
          this._replaceValue = message.value;
          this._updateDecorations();
          return;
        case 'replaceAll':
          this._replaceAll();
          return;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${stylesUri}" rel="stylesheet">
        <title>Regex Replace Plus</title>
      </head>
      <body>
        <div class="container">
            <div class="input-group">
                <label for="regex-input">查找 (正则表达式)</label>
                <input type="text" id="regex-input" placeholder="输入正则表达式">
            </div>
            <div class="input-group">
                <label for="replace-input">替换为</label>
                <textarea id="replace-input" rows="3" placeholder="输入替换内容, e.g., item_{{i:1}}"></textarea>
            </div>
            <button id="replace-all-btn">全部替换</button>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }

  private _updateDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this._regex) {
      if (editor) {
        editor.setDecorations(this._decorationType, []);
        editor.setDecorations(this._previewDecorationType, []);
      }
      return;
    }

    const text = editor.document.getText();
    const highlightDecorations: vscode.DecorationOptions[] = [];
    const previewDecorations: vscode.DecorationOptions[] = [];

    try {
      const regex = new RegExp(this._regex, 'g');
      const replacer = this._parseReplaceValue(this._replaceValue);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        
        highlightDecorations.push({ range });

        if (this._replaceValue) {
          const previewText = replacer(match);
          previewDecorations.push({
            range,
            renderOptions: {
              after: {
                contentText: ` -> ${previewText}`,
              },
            },
          });
        }
      }
      editor.setDecorations(this._decorationType, highlightDecorations);
      editor.setDecorations(this._previewDecorationType, previewDecorations);
    } catch (e) {
      editor.setDecorations(this._decorationType, []);
      editor.setDecorations(this._previewDecorationType, []);
    }
  }

  private _parseReplaceValue(replaceValue: string): (match: RegExpExecArray) => string {
    const incrementRegex = /\{\{i(?::(\d+))?\}\}/;
    const match = incrementRegex.exec(replaceValue);

    if (!match) {
      return () => replaceValue;
    }

    const start = match[1] ? parseInt(match[1], 10) : 1;
    let count = start;

    return (matchResult: RegExpExecArray) => {
      const result = replaceValue.replace(incrementRegex, String(count));
      count++;
      return result;
    };
  }

  private async _replaceAll() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this._regex) {
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];
    
    try {
      const regex = new RegExp(this._regex, 'g');
      const replacer = this._parseReplaceValue(this._replaceValue);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        const newText = replacer(match);
        edits.push(vscode.TextEdit.replace(range, newText));
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.set(document.uri, edits);
      await vscode.workspace.applyEdit(workspaceEdit);

      vscode.window.showInformationMessage(`${edits.length} 个匹配项已替换！`);

    } catch (e) {
      vscode.window.showErrorMessage(`替换失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}