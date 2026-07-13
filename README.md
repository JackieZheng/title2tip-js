# @jackiezhengchina/title2tip

一个将网页标题实时同步到浏览器页面提示（Tooltip）的轻量工具。用于页面提示、阅读辅助、无障碍访问等场景。

## 📦 CDN（全球加速）

jsDelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/@jackiezhengchina/title2tip@1.0.2/dist/title2tip.min.js"></script>
```

unpkg:
```html
<script src="https://unpkg.com/@jackiezhengchina/title2tip@1.0.2/dist/title2tip.min.js"></script>
```

## Install

npm:
```bash
npm install @jackiezhengchina/title2tip
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>这是页面标题</title>
</head>
<body>
  <script src="node_modules/@jackiezhengchina/title2tip/dist/title2tip.min.js"></script>
  <script>
    Title2Tip.init();
  </script>
</body>
</html>
```

## Features

- 🔄 实时同步 document.title 到 tooltip
- ⌨️ 无障碍访问支持（ARIA）
- 🎨 自定义样式
- 📦 UMD 格式，兼容所有前端框架
- 🔧 丰富的配置选项

## API

```js
// 初始化
Title2Tip.init(options);

// 更新标题
Title2Tip.setTitle('新标题');

// 启用/禁用
Title2Tip.enable();
Title2Tip.disable();

// 销毁
Title2Tip.destroy();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `attribute` | string | 'data-title' | 读取哪个属性的值 |
| `throttle` | number | 100 | 节流毫秒数 |
| `tooltipClass` | string | '' | 自定义类名 |

## License

MIT
