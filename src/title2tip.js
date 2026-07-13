/*
 * @Title: Title2Tip — 自定义 title 浮动提示插件
 * @Author: JackieZheng
 * @Date: 2026-07-05
 * @Description: 替换原生 title 提示，支持位置、样式自定义
 */

/* =============================================================
 *  Title2Tip — 自定义 title 浮动提示插件
 *  功能：将 HTML 元素的 title 属性替换为自定义样式浮动提示
 *        支持 data-title-tip 属性、位置指定、全局禁用、位置自适应
 *  用法：
 *    <div data-title-tip="提示内容" data-title-tip-pos="top">hover 我</div>
 *    // 或自动转换已有 title 属性（默认开启）
 *    Title2Tip.config.autoConvert = true;
 *    Title2Tip.refresh();
 * ============================================================= */
;(function (win, doc) {
  'use strict';

  // 保存原生 getBoundingClientRect（必须在 ZoomPopperFix 全局劫持之前）
  var _origGetRect = HTMLElement.prototype.getBoundingClientRect;

  // ===================== 配置 =====================
  var cfg = {
    disabled:      false,           // 全局禁用
    defaultPos:    'top',          // 默认位置：top / bottom / left / right
    offset:        16,             // 提示框与元素间距（px）- 加大避免遮挡 target
    maxWidth:      300,            // 最大宽度（px）- 稍微窄一点
    fontSize:      12,
    bgColor:       'rgba(0,0,0,.85)',
    textColor:     '#fff',
    borderRadius:   '6px',
    padding:        '5px 9px',
    zIndex:        2147483640,     // 低于 ImageViewer（2147483647）
    autoConvert:   true,           // 自动将 title 属性转为 data-title-tip
    edgeThreshold:  16,            // 视口边缘最小距离（px），触发位置翻转
    arrowSize:      5,              // 小箭头尺寸（px）
    arrowColor:     'rgba(0,0,0,.85)',
    largeImageMinSize: [80, 80], // 大图阈值 [minWidth, minHeight]（px），>= 该值 tooltip 在图片内部居中
  };

  // ===================== 内部状态 =====================
  var tipEl    = null;   // 提示框 DOM
  var arrowEl  = null;   // 小箭头 DOM
  var targetEl = null;   // 当前目标元素
  var _inited  = false;
  var _observer = null;
  var _active  = false;

  // ===================== 工具函数 =====================
  function getPos(el) {
    var r = _origGetRect.call(el);
    return { top: r.top + win.pageYOffset, left: r.left + win.pageXOffset, w: r.width, h: r.height };
  }

  function viewPort() {
    return { w: win.innerWidth, h: win.innerHeight };
  }

  /** 计算最佳位置（自适应翻转）
   *  混合策略：垂直避开 target，水平跟随鼠标
   *  - top/bottom：水平以鼠标为中心，垂直贴在 target 上下边缘（不遮挡）
   *  - left/right：垂直居中于 target，水平贴在 target 左右两侧
   *  - 小箭头：跟随鼠标位置
   */
  // 判断元素是否为"图片类"（IMG 标签 / id或class含image / 有背景图 / 内含img）
  function isImageLike(el) {
    if (!el) return false;
    if (el.tagName === 'IMG') return true;
    var id = (el.id || '').toLowerCase();
    var cls = (el.className || '').toString().toLowerCase();
    if (id.indexOf('image') >= 0 || cls.indexOf('image') >= 0) return true;
    try {
      var bg = win.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') return true;
    } catch (e) {}
    if (el.querySelector && el.querySelector('img')) return true;
    return false;
  }

  function calcPos(el, mx, my) {
    var pos = (el.dataset && el.dataset.titleTipPos) || cfg.defaultPos;
    var vp = viewPort();
    var off = cfg.offset;
    var r = _origGetRect.call(el);
    var tipW = tipEl ? (tipEl.offsetWidth || 200) : 200;
    var tipH = tipEl ? (tipEl.offsetHeight || 36)  : 36;

    // 上下方向：以 target 边缘为锚点的可用空间
    // 左右方向：以鼠标为锚点的可用空间
    var space = {
      top:    r.top,                // target 顶部到视口顶（原生坐标，不受 ZoomPopperFix 影响）
      bottom: vp.h - r.bottom,      // target 底部到视口底
      left:   mx,                   // 鼠标到视口左
      right:  vp.w - mx,            // 鼠标到视口右
    };

    // 自适应翻转（如果指定方向空间不足）
    if (pos === 'top'    && space.top    < tipH + off + cfg.edgeThreshold) pos = 'bottom';
    if (pos === 'bottom' && space.bottom < tipH + off + cfg.edgeThreshold) pos = 'top';
    if (pos === 'left'   && space.left   < tipW + off + cfg.edgeThreshold) pos = 'right';
    if (pos === 'right'  && space.right  < tipW + off + cfg.edgeThreshold) pos = 'left';

    var x = 0, y = 0, arrow = '';
    switch (pos) {
      case 'top':
        // tooltip 在 target 上方：水平以鼠标为中心，垂直贴在 target 顶 - offset
        x = mx - tipW / 2;
        y = r.top - tipH - off;
        arrow = 'top';
        break;
      case 'bottom':
        // tooltip 在 target 下方：水平以鼠标为中心，垂直贴在 target 底 + offset
        x = mx - tipW / 2;
        y = r.bottom + off;
        arrow = 'bottom';
        break;
      case 'left':
        // tooltip 在 target 左侧：垂直居中于 target
        x = r.left - tipW - off;
        y = r.top + r.height / 2 - tipH / 2;
        arrow = 'right';  // 箭头指向右侧（指向元素）
        break;
      case 'right':
        // tooltip 在 target 右侧：垂直居中于 target
        x = r.right + off;
        y = r.top + r.height / 2 - tipH / 2;
        arrow = 'left';   // 箭头指向左侧（指向元素）
        break;
    }
    // 图片类元素（≥80×80）→ 在图片内部居中，箭头贴边缘指向鼠标
    var isLargeImage = isImageLike(el) && r.width >= cfg.largeImageMinSize[0] && r.height >= cfg.largeImageMinSize[1];
    if (isLargeImage) {
      var x = r.left + r.width / 2 - tipW / 2;
      var y = r.top + r.height / 2 - tipH / 2;
      if (x < 4) x = 4;
      if (x + tipW > vp.w - 4) x = vp.w - tipW - 4;
      if (y < 4) y = 4;
      if (y + tipH > vp.h - 4) y = vp.h - tipH - 4;
      return { x: x, y: y, pos: pos, arrow: 'inside' };
    }

    return { x: x, y: y, pos: pos, arrow: arrow };
  }

  // ===================== 创建提示框 DOM =====================
  function ensureTip() {
    if (tipEl) return;
    tipEl = doc.createElement('div');
    tipEl.className = 't2t-tip';
    tipEl.style.cssText =
      'position:fixed;pointer-events:none;opacity:0;' +
      'transition:opacity .18s ease;' +
      'max-width:' + cfg.maxWidth + 'px;' +
      'font-size:' + cfg.fontSize + 'px;' +
      'background:' + cfg.bgColor + ';' +
      'color:' + cfg.textColor + ';' +
      'border-radius:' + cfg.borderRadius + ';' +
      'padding:' + cfg.padding + ';' +
      'z-index:' + cfg.zIndex + ';' +
      'box-shadow:0 4px 12px rgba(0,0,0,.15);' +
      'line-height:1.5;word-break:break-all;';
    arrowEl = doc.createElement('div');
    arrowEl.className = 't2t-arrow';
    arrowEl.style.cssText = 'position:absolute;width:0;height:0;';
    tipEl.appendChild(arrowEl);

    // 关键修复：position:fixed 会被祖先的 transform/perspective/filter/zoom 破坏
    // 必须挂到没有这些属性的祖先上，否则 tooltip 会跟着祖先走
    var safeParent = doc.documentElement;
    var foundBad = [];
    var check = doc.body;
    while (check && check !== doc.documentElement) {
      var cs = window.getComputedStyle(check);
      var tform = cs.transform;
      var persp = cs.perspective;
      var filt = cs.filter;
      var bfilt = cs.backdropFilter || cs.webkitBackdropFilter;
      var zm = cs.zoom;
      if ((tform && tform !== 'none') ||
          (persp && persp !== 'none') ||
          (filt && filt !== 'none') ||
          (bfilt && bfilt !== 'none') ||
          (zm && zm !== 'normal' && zm !== '1' && zm !== '100%')) {
        foundBad.push(check.tagName + (check.id ? '#' + check.id : '') + ' transform=' + tform);
        safeParent = check.parentElement || doc.documentElement;
      }
      check = check.parentElement;
    }
    safeParent.appendChild(tipEl);
    // 调试：记录实际父节点
    tipEl.dataset.parentTag = safeParent.tagName + (safeParent.id ? '#' + safeParent.id : '') + (foundBad.length ? ' (skipped: ' + foundBad.join(', ') + ')' : '');
  }

  function setArrow(pos, offX, offY) {
    if (!arrowEl) return;
    var s = cfg.arrowSize;
    var c = cfg.arrowColor;
    // offX/offY 是箭头在 tooltip 内的偏移（px），由 showTip 计算
    switch (pos) {
      case 'top':
        // 箭头在 tooltip 下方，水平位置 offX
        arrowEl.style.cssText =
          'position:absolute;left:' + offX + 'px;bottom:-' + s + 'px;' +
          'transform:translateX(-50%);' +
          'width:0;height:0;' +
          'border-left:' + s + 'px solid transparent;' +
          'border-right:' + s + 'px solid transparent;' +
          'border-top:' + s + 'px solid ' + c + ';';
        break;
      case 'bottom':
        // 箭头在 tooltip 上方，水平位置 offX
        arrowEl.style.cssText =
          'position:absolute;left:' + offX + 'px;top:-' + s + 'px;' +
          'transform:translateX(-50%);' +
          'width:0;height:0;' +
          'border-left:' + s + 'px solid transparent;' +
          'border-right:' + s + 'px solid transparent;' +
          'border-bottom:' + s + 'px solid ' + c + ';';
        break;
      case 'left':
        // 箭头在 tooltip 右侧，垂直位置 offY
        arrowEl.style.cssText =
          'position:absolute;top:' + offY + 'px;right:-' + s + 'px;' +
          'transform:translateY(-50%);' +
          'width:0;height:0;' +
          'border-top:' + s + 'px solid transparent;' +
          'border-bottom:' + s + 'px solid transparent;' +
          'border-left:' + s + 'px solid ' + c + ';';
        break;
      case 'right':
        // 箭头在 tooltip 左侧，垂直位置 offY
        arrowEl.style.cssText =
          'position:absolute;top:' + offY + 'px;left:-' + s + 'px;' +
          'transform:translateY(-50%);' +
          'width:0;height:0;' +
          'border-top:' + s + 'px solid transparent;' +
          'border-bottom:' + s + 'px solid transparent;' +
          'border-right:' + s + 'px solid ' + c + ';';
        break;
      case 'inside':
        // 图片内部 tooltip 不显示箭头
        arrowEl.style.cssText = 'display:none;';
        break;
    }
  }

  // ===================== 显示 / 隐藏 =====================
  function showTip(el, e) {
    if (cfg.disabled) return;
    var content = el.dataset.titleTip || el.getAttribute('data-title-tip');
    if (!content) return;
    if (content.trim() === '') return;

    targetEl = el;
    ensureTip();

    // 清除上次内容，避免叠加
    tipEl.innerHTML = '';
    tipEl.appendChild(arrowEl);

    // 移除原生 title 防止重复提示
    if (el.title) {
      el.dataset.titleTipOrig = el.title;
      el.removeAttribute('title');
    }

    // 先显示以获取尺寸
    tipEl.style.opacity = '0';
    tipEl.style.visibility = 'hidden';
    tipEl.style.display = 'block';

    // 设置内容（用 textContent 避免 XSS，同时清掉上次的 text 和 arrowEl）
    tipEl.textContent = content;
    tipEl.appendChild(arrowEl);

    // 捕获鼠标坐标（用于 top/bottom 水平定位 + 箭头偏移）
    var mx = (e && typeof e.clientX === 'number') ? e.clientX : 0;
    var my = (e && typeof e.clientY === 'number') ? e.clientY : 0;

    var tipW = tipEl.offsetWidth;
    var tipH = tipEl.offsetHeight;
    var info = calcPos(el, mx, my);
    var left = info.x;
    var top  = info.y;

    // 防止超出视口
    var vp = viewPort();
    if (left < 4) left = 4;
    if (left + tipW > vp.w - 4) left = vp.w - tipW - 4;
    if (top < 4) top = 4;
    if (top + tipH > vp.h - 4) top = vp.h - tipH - 4;

    tipEl.style.left = left + 'px';
    tipEl.style.top  = top  + 'px';
    // 箭头偏移：跟随鼠标位置
    var arrowMargin = Math.max(8, cfg.arrowSize + 4);
    var offX, offY;
    if (info.arrow === 'top' || info.arrow === 'bottom') {
      // 水平方向：箭头指向鼠标 X
      offX = mx - left;
      offX = Math.max(arrowMargin, Math.min(offX, tipW - arrowMargin));
      offY = 0;
    } else if (info.arrow === 'left' || info.arrow === 'right') {
      // 垂直方向：箭头指向鼠标 Y
      offY = my - top;
      offY = Math.max(arrowMargin, Math.min(offY, tipH - arrowMargin));
      offX = 0;
    } else {
      // inside：鼠标相对 tooltip 中心的向量 → 决定箭头贴哪条边
      offX = mx - (left + tipW / 2);
      offY = my - (top + tipH / 2);
    }
    setArrow(info.arrow, offX, offY);
    tipEl.style.visibility = 'visible';
    requestAnimationFrame(function () {
      tipEl.style.opacity = '1';
    });
    _active = true;
  }

  function hideTip() {
    if (!tipEl || !_active) return;
    tipEl.style.opacity = '0';
    var el = tipEl;
    setTimeout(function () {
      if (el && el.style.opacity === '0') {
        el.style.display = 'none';
      }
    }, 220);
    _active = false;
    targetEl = null;
  }

  // ===================== 事件绑定 =====================
  function bindEl(el) {
    if (el._t2t_bound) return;
    el._t2t_bound = true;

    // 用 mouseover 拿 e.clientX/Y 做定位（不依赖子元素位置）
    el.addEventListener('mouseover', function (e) {
      if (cfg.disabled) return;
      // 避免对同一 el 重复触发（mouseover 在子元素间移动时会冒泡多次）
      if (targetEl === el && _active) return;
      showTip(el, e);
    });

    // 鼠标在元素内移动时，更新 tooltip 位置（让箭头和小 tip 跟随鼠标）
    el.addEventListener('mousemove', function (e) {
      if (targetEl !== el || !_active) return;
      showTip(el, e);
    });

    el.addEventListener('mouseout', function (e) {
      // 只有鼠标真的离开 el（到非 el 子元素）才隐藏
      if (!e.relatedTarget || !el.contains(e.relatedTarget)) {
        hideTip();
      }
    });

    // 点击时立即隐藏
    el.addEventListener('click', hideTip);
  }

  // ===================== 扫描并绑定 =====================
  function scan() {
    // 1. data-title-tip 属性的元素
    var list = doc.querySelectorAll ? doc.querySelectorAll('[data-title-tip]') : [];
    for (var i = 0; i < list.length; i++) bindEl(list[i]);

    // 2. 自动转换 title 属性（如果开启）
    if (cfg.autoConvert) {
      var all = doc.querySelectorAll ? doc.querySelectorAll('[title]') : [];
      for (var j = 0; j < all.length; j++) {
        var el = all[j];
        if (el.dataset && el.dataset.titleTip) continue;    // 已处理过
        if (el._t2t_bound) continue;
        // 把 title 内容搬到 data-title-tip，移除原生 title
        var t = el.title || el.getAttribute('title');
        if (t && t.trim()) {
          el.setAttribute('data-title-tip', t);
          el.removeAttribute('title');
          bindEl(el);
        }
      }
    }
  }

  // ===================== MutationObserver =====================
  function initObserver() {
    if (_observer) return;
    if (!win.MutationObserver) { scan(); return; }
    _observer = new MutationObserver(function () {
      scan();
    });
    _observer.observe(doc.body, { childList: true, subtree: true });
  }

  // ===================== 公开 API =====================
  win.Title2Tip = {
    /** 初始化（自动调用，也可手动调用）*/
    init: function () {
      if (_inited) return;
      _inited = true;
      if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', function () {
          scan();
          initObserver();
        });
      } else {
        scan();
        initObserver();
      }
    },

    /** 显示指定元素的提示*/
    show: function (el) { showTip(el); },

    /** 隐藏当前提示*/
    hide: function () { hideTip(); },

    /** 重新扫描整个文档（SPA 路由切换后调用）*/
    refresh: function () {
      scan();
      if (!_observer) initObserver();
    },

    /** 配置对象（可直接修改）*/
    config: cfg,

    /** 启用*/
    enable: function () { cfg.disabled = false; },

    /** 禁用（隐藏所有提示）*/
    disable: function () { cfg.disabled = true; hideTip(); },
  };

  // ===================== 自动初始化 =====================
  if (!win._t2t_inited) {
    win._t2t_inited = true;
    win.Title2Tip.init();
  }

})(window, document);
