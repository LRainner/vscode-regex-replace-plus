# Regex Replace Plus

[![Version](https://img.shields.io/visual-studio-marketplace/v/LRainner.regex-replace-plus.svg)](https://marketplace.visualstudio.com/items?itemName=LRainner.regex-replace-plus)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/LRainner.regex-replace-plus.svg)](https://marketplace.visualstudio.com/items?itemName=LRainner.regex-replace-plus)

**Regex Replace Plus** 是一款为 VS Code 设计的增强型替换工具，它允许你使用正则表达式匹配文本，并将其替换为包含自增序列的内容。

![插件截图预览](https://raw.githubusercontent.com/LRainner/Pic/main/img/ec715deae71b65c960cb4c3988b9802a.png)

## ✨ 核心功能

- **实时正则高亮**: 在你输入正则表达式时，立即在当前文件中高亮所有匹配项。
- **实时替换预览**: 在你输入替换内容时，实时在匹配项旁边显示替换后的预览效果。
- **自增序列**: 支持 `{{i}}` 或 `{{i:start}}` 格式的占位符，实现数字的自动递增。
- **侧边栏界面**: 所有操作都在一个方便的侧边栏视图中完成，无需离开你的代码。
- **命令面板支持**: 可以通过命令面板 (`Ctrl+P` / `Cmd+P`) 快速启动。

## 🚀 如何使用

1.  **打开侧边栏**:
    - 点击 VS Code 左侧活动栏中的 **Regex Replace Plus** 图标 (图标样式为 `.* -> i++`)。
    - 或者，按下 `Ctrl+P` / `Cmd+P`，输入 `>Start Regex Replace Plus` 并回车。

2.  **输入正则表达式**:
    - 在 "查找 (正则表达式)" 输入框中，输入你想要匹配的正则表达式。
    - 你会看到当前文件中所有匹配的文本都被高亮显示。

3.  **输入替换内容**:
    - 在 "替换为" 输入框中，输入你希望替换成的内容。
    - 如果你想使用自增序列，请使用 `{{i}}` 或 `{{i:100}}` 这样的语法。
    - 你会看到每个高亮区域旁边都出现了替换后的预览文本。

4.  **执行替换**:
    - 点击 "全部替换" 按钮。
    - 插件会将当前文件中所有匹配的文本替换为最终内容。

## 🔢 自增序列语法

插件支持强大的自增序列占位符，格式如下：

- `{{i}}`: 从 1 开始的自增序列 (1, 2, 3, ...)。
- `{{i:start}}`: 从指定的 `start` 数字开始的自增序列。

**示例:**

-   **查找**: `item`
-   **替换为**: `product_{{i:101}}`

如果文件中有三个 "item"，它们将被替换为：
- `product_101`
- `product_102`
- `product_103`

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

[MIT](LICENSE)
