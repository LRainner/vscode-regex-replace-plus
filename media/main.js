// @ts-ignore 

// 1. 获取 vscode aip 对象，我们可以通过这个对象向插件发送消息
const vscode = acquireVsCodeApi();

// 2. 获取 HTML 元素
const regexInput = document.getElementById('regex-input');
const replaceInput = document.getElementById('replace-input');
const replaceAllButton = document.getElementById('replace-all-btn');
const errorMessage = document.getElementById('error-message');
const matchCount = document.getElementById('match-count');

// 页面加载完成后自动聚焦到查找输入框
window.addEventListener('load', () => {
    const state = typeof vscode.getState === 'function' ? vscode.getState() : {};
    if (state && typeof state === 'object') {
        if (typeof state.regex === 'string') {
            regexInput.value = state.regex;
        }
        if (typeof state.replaceValue === 'string') {
            replaceInput.value = state.replaceValue;
        }
    }
    // 首次加载主动同步到扩展端，驱动装饰刷新
    vscode.postMessage({ command: 'regexUpdate', value: regexInput.value || '' });
    vscode.postMessage({ command: 'replaceValueUpdate', value: replaceInput.value || '' });
    regexInput.focus();
});

// 3. 监听输入框的输入事件（带防抖并持久化 Webview 状态）
const debounce = (fn, delay = 120) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
};

const syncState = () => {
    if (typeof vscode.setState === 'function') {
        vscode.setState({
            regex: regexInput.value || '',
            replaceValue: replaceInput.value || ''
        });
    }
};

const sendRegexUpdate = debounce(() => {
    syncState();
    vscode.postMessage({
        command: 'regexUpdate',
        value: regexInput.value || ''
    });
}, 120);

const sendReplaceUpdate = debounce(() => {
    syncState();
    vscode.postMessage({
        command: 'replaceValueUpdate',
        value: replaceInput.value || ''
    });
}, 120);

regexInput.addEventListener('input', () => {
    sendRegexUpdate();
});

replaceInput.addEventListener('input', () => {
    sendReplaceUpdate();
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
        case 'initState':
            // 来自扩展端的初始化状态，用于 Webview 重建后的恢复
            if (typeof message.regex === 'string') {
                regexInput.value = message.regex;
            }
            if (typeof message.replaceValue === 'string') {
                replaceInput.value = message.replaceValue;
            }
            // 同步到 webview state，并触发一次更新以刷新高亮/预览
            if (typeof vscode.setState === 'function') {
                vscode.setState({
                    regex: regexInput.value || '',
                    replaceValue: replaceInput.value || ''
                });
            }
            vscode.postMessage({ command: 'regexUpdate', value: regexInput.value || '' });
            vscode.postMessage({ command: 'replaceValueUpdate', value: replaceInput.value || '' });
            break;
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