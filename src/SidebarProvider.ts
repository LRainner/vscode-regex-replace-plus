import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  // 这个 _view 变量将保存对 WebView 的引用
  private _view?: vscode.WebviewView;
  // 插件的根目录 URI，用于后续加载 JS/CSS 文件
  private readonly _extensionUri: vscode.Uri;

  // 我们的视图的唯一 ID，必须和 package.json 中的 "views" -> "id" 匹配
  public static readonly viewId = 'regexReplacePlusSidebar';

  // 构造函数
  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
  }

  // 这是 VS Code 必须调用的核心方法
  // 当用户点击我们的图标时，这个方法会被执行
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    // 保存对 WebView 的引用
    this._view = webviewView;

    // 配置 WebView
    webviewView.webview.options = {
      // 允许 WebView 运行 JS 脚本
      enableScripts: true,
      // 限制 WebView 只能访问我们插件的 'media' 目录下的资源
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    // 设置 WebView 的 HTML 内容
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  // 这个私有方法负责生成 HTML 内容
  private _getHtmlForWebview(webview: vscode.Webview): string {
    
    // (在第3步，我们会把这个 HTML 变得复杂)
    // 现在，我们只返回一个最简单的 "Hello World"
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Regex Replace Plus</title>
      </head>
      <body>
        <h1>Regex Replace Plus</h1>
        <p>我们的UI界面将会在这里！</p>
      </body>
      </html>
    `;
  }
}