// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "regex-replace-plus" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('regex-replace-plus.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from regex-replace-plus!');
// 	});

// 	context.subscriptions.push(disposable);
// }

import { SidebarProvider } from './SidebarProvider';

// 激活函数：当 activationEvents 被触发时（即用户点击图标时）执行
export function activate(context: vscode.ExtensionContext) {

  // 1. 创建一个新的 SidebarProvider 实例
  const provider = new SidebarProvider(context);

  // 2. 注册这个 Provider
  //    SidebarProvider.viewId 就是 "regexReplacePlusSidebar"
  //    这行代码告诉 VS Code: "嘿，当 ID 为 'regexReplacePlusSidebar' 的视图
  //    需要被渲染时，请去调用 'provider' 实例的 resolveWebviewView 方法"
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, provider)
  );
}

// This method is called when your extension is deactivated
export function deactivate() { }
