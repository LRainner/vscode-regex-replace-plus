// @ts-ignore 

// 1. 获取 vscode aip 对象，我们可以通过这个对象向插件发送消息
const vscode = acquireVsCodeApi();

// 2. 获取 HTML 元素
const regexInput = document.getElementById('regex-input');
const replaceInput = document.getElementById('replace-input');
const replaceAllButton = document.getElementById('replace-all-btn');
const errorMessage = document.getElementById('error-message');
const matchCount = document.getElementById('match-count');

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
    // 添加焦点效果
    replaceAllButton.focus();
    
    vscode.postMessage({
        command: 'replaceAll',
        regex: regexInput.value,
        replaceValue: replaceInput.value
    });
});

// 监听插件发来的消息
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setError':
            if (message.value) {
                errorMessage.textContent = message.value;
                errorMessage.classList.remove('hidden');
            } else {
                errorMessage.classList.add('hidden');
            }
            break;
        case 'setMatchCount':
            matchCount.textContent = `匹配项: ${message.value}`;
            break;
    }
});