import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _matchDecorationType: vscode.TextEditorDecorationType;
  private _matchWithReplaceDecorationType: vscode.TextEditorDecorationType;
  private _previewDecorationType: vscode.TextEditorDecorationType;
  private _regex: string = '';
  private _replaceValue: string = '';
  private _matchCount: number = 0;
  private readonly _extensionUri: vscode.Uri;

  public static readonly viewId = 'regexReplacePlusSidebar';

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;

    // 仅查找：匹配项背景高亮（无删除线）
    this._matchDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    });

    // 预览替换：匹配项背景高亮 + 删除线（仅在有替换值时使用）
    this._matchWithReplaceDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
      textDecoration: 'line-through',
    });

    // 新值预览：紧挨着原文本显示，使用插入色背景区分
    this._previewDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        color: new vscode.ThemeColor('editor.foreground'),
        margin: '0',
        textDecoration: "none; background-color: var(--vscode-diffEditor-insertedTextBackground); border-radius: 2px; padding: 0 2px;",
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
            <div class="info-group">
                <div id="match-count">匹配项: 0</div>
                <div id="error-message" class="error-message hidden"></div>
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
        editor.setDecorations(this._matchDecorationType, []);
        editor.setDecorations(this._matchWithReplaceDecorationType, []);
        editor.setDecorations(this._previewDecorationType, []);
      }
      this._matchCount = 0;
      this._updateWebviewInfo();
      return;
    }

    const text = editor.document.getText();
    const highlightDecorations: vscode.DecorationOptions[] = [];
    const previewDecorations: vscode.DecorationOptions[] = [];
    let matchCount = 0;

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
                contentText: `${previewText.length > 60 ? previewText.slice(0, 57) + '…' : previewText}`,
              },
            },
          });
        }
        matchCount++;
      }
      // 先清空，避免状态切换时残留样式
      editor.setDecorations(this._matchDecorationType, []);
      editor.setDecorations(this._matchWithReplaceDecorationType, []);
      if (this._replaceValue) {
        editor.setDecorations(this._matchWithReplaceDecorationType, highlightDecorations);
      } else {
        editor.setDecorations(this._matchDecorationType, highlightDecorations);
      }
      editor.setDecorations(this._previewDecorationType, previewDecorations);
      
      this._matchCount = matchCount;
      this._updateWebviewInfo();
    } catch (e) {
      editor.setDecorations(this._matchDecorationType, []);
      editor.setDecorations(this._matchWithReplaceDecorationType, []);
      editor.setDecorations(this._previewDecorationType, []);
      
      this._matchCount = 0;
      this._updateWebviewInfo(e instanceof Error ? e.message : String(e));
    }
  }

  private _updateWebviewInfo(errorMessage?: string) {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'setMatchCount',
        value: this._matchCount
      });
      
      this._view.webview.postMessage({
        command: 'setError',
        value: errorMessage || ''
      });
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

      // 如果没有匹配项，显示提示信息
      if (edits.length === 0) {
        vscode.window.showInformationMessage('没有找到匹配项');
        return;
      }

      // 添加确认对话框
      const confirm = await vscode.window.showWarningMessage(
        `确定要替换 ${edits.length} 个匹配项吗?`, 
        { modal: true }, 
        '确定', 
        '取消'
      );
      
      if (confirm !== '确定') {
        return;
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