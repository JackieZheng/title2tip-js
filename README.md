# @jackiezhengchina/title2tip

A lightweight, zero-dependency JavaScript tooltip plugin that replaces native HTML `title` attributes with customizable floating tooltips.

## Features

- 🎯 **Auto-positioning** - Automatically flips position when hitting viewport edges
- 🖼️ **Large Image Support** - Special inside-center positioning for images ≥ 80×80
- 🎨 **Fully Customizable** - Colors, fonts, sizes, animations
- 📍 **Position Options** - top, bottom, left, right with auto-flip
- 🔺 **Smart Arrow** - Arrow follows mouse position
- 🔄 **Auto-convert** - Automatically converts existing `title` attributes
- 🚫 **Global Disable** - Temporarily disable all tooltips

## Installation

```bash
npm install @jackiezhengchina/title2tip
```

Or include directly:

```html
<script src="dist/title2tip.min.js"></script>
```

## Usage

### Basic

```html
<div data-title-tip="Tooltip content here">Hover me</div>
```

### Auto-convert Existing Titles

```javascript
// Enable auto-conversion of title attributes
Title2Tip.config.autoConvert = true;
Title2Tip.refresh();
```

### Position

```html
<div data-title-tip="Tooltip content" data-title-tip-pos="top">Top</div>
<div data-title-tip="Tooltip content" data-title-tip-pos="bottom">Bottom</div>
<div data-title-tip="Tooltip content" data-title-tip-pos="left">Left</div>
<div data-title-tip="Tooltip content" data-title-tip-pos="right">Right</div>
```

### Configuration

```javascript
Title2Tip.config = {
  disabled:        false,            // Global disable
  defaultPos:      'top',            // Default position
  offset:          16,               // Gap between tooltip and element (px)
  maxWidth:        300,              // Max width (px)
  fontSize:        12,               // Font size (px)
  bgColor:         'rgba(0,0,0,.85)', // Background color
  textColor:       '#fff',           // Text color
  borderRadius:    '6px',            // Border radius
  padding:         '5px 9px',        // Padding
  zIndex:          2147483640,       // z-index (below ImageViewer)
  autoConvert:     true,             // Auto-convert title attributes
  edgeThreshold:   16,               // Viewport edge threshold (px)
  arrowSize:       5,                // Arrow size (px)
  arrowColor:      'rgba(0,0,0,.85)', // Arrow color
  largeImageMinSize: [80, 80],       // Large image threshold [w, h]
};
```

## API

| Method | Description |
|--------|-------------|
| `Title2Tip.init()` | Initialize plugin (auto-called) |
| `Title2Tip.show(el)` | Show tooltip for element |
| `Title2Tip.hide()` | Hide current tooltip |
| `Title2Tip.refresh()` | Re-scan document (call after SPA route change) |
| `Title2Tip.enable()` | Enable tooltips |
| `Title2Tip.disable()` | Disable all tooltips |
| `Title2Tip.config` | Configuration object |

## Large Image Behavior

When hovering over large images (≥ 80×80 by default), the tooltip appears centered inside the image instead of outside. This avoids obscuring the image content and provides a cleaner experience.

Adjust the threshold:

```javascript
Title2Tip.config.largeImageMinSize = [150, 100]; // Width ≥ 150 AND height ≥ 100
```

## Browser Support

- Chrome, Firefox, Safari, Edge (modern versions)
- IE11 not supported

## License

MIT © JackieZheng
