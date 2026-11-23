# PWA 安装与部署说明

## 已经做了什么

应用现在是**可安装的 PWA**（渐进式网页应用），孩子可以把它「添加到主屏幕」，像 App 一样全屏打开，断网也能进入。

新增文件（都在 `english-writing-ladder/`）：

| 文件 | 作用 |
| --- | --- |
| `manifest.webmanifest` | 应用名称、图标、`standalone` 全屏模式、主题色 |
| `sw.js` | Service Worker：缓存应用外壳，实现离线打开与秒开 |
| `icon-192.png` / `icon-512.png` | 普通图标（圆角橙底 + 打开的书 + 金星） |
| `icon-maskable-512.png` | 安卓自适应图标（内容收在安全区内） |
| `tools/make-icons.cjs` | 图标生成脚本（纯 Node，无依赖，可重新生成） |

`index.html` 里加了：manifest / 图标 / 主题色 meta，SW 注册，以及工具箱中动态出现的「📲 安装到桌面」按钮（浏览器判定可安装时才显示）。

## 本地测试安装

PWA 只在 **HTTPS 或 localhost** 下生效（普通 `http://` 局域网地址不行）。本地：

```bash
cd D:\project\opencode\english-writing-ladder
npx serve .          # 或任意静态服务器，需带正确 MIME
# 打开 http://localhost:3000
```

Chrome 地址栏会出现安装图标；或打开工具箱点「安装到桌面」。

> 注意：直接用 `file://` 打开 index.html 无法注册 Service Worker，必须用本地服务器。

## 部署上线

推荐 **Netlify Drop**（把整个 `english-writing-ladder` 文件夹拖进去）或 **GitHub Pages**，两者都自带 HTTPS，部署完即是可安装 PWA。

部署后必须确认：
1. `manifest.webmanifest` 返回 `Content-Type: application/manifest+json`
2. `sw.js` 返回 `Content-Type: application/javascript`（Netlify/GitHub Pages 默认正确）
3. Service Worker 作用域是应用所在路径

公网 HTTPS 地址上，Supabase 账户同步和 DeepSeek AI 批改才能正常使用（前提是已在 Supabase 后台把该域名加入允许列表）。

## 更新缓存

Service Worker 会缓存外壳文件。改了 `index.html` 后，把 `sw.js` 第一行的版本号改一下，例如：

```js
const VERSION = 'ewl-v2';
```

下次打开时会自动换新缓存、清理旧缓存。

## 重新生成图标

```bash
node tools/make-icons.cjs
```

会覆盖三个 PNG。想改配色/图案，编辑脚本顶部的 `bgTop` / `bgBot` 和绘图部分即可。
