// @ts-ignore 

// 1. 获取 vscode aip 对象，我们可以通过这个对象向插件发送消息
const vscode = acquireVsCodeApi();

// 2. 获取 HTML 元素
const regexInput = document.getElementById('regex-input');
const replaceInput = document.getElementById('replace-input');
const replaceAllButton = document.getElementById('replace-all-btn');

// 3. 监听输入框的输入事件
regexInput.addEventListener('input', () => {
    vscode.postMessage({
        command: 'regexUpdate',
        value: regexInput.value
    });
});

replaceInput.addEventListener('input', () => {
    vscode.postMessage({
        command: 'replaceValueUpdate',
        value: replaceInput.value
    });
});


// 4. 监听按钮的点击事件
replaceAllButton.addEventListener('click', () => {
    vscode.postMessage({
        command: 'replaceAll',
        regex: regexInput.value,
        replaceValue: replaceInput.value
    });
});