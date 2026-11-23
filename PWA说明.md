# PWA 安装与部署说明

## 已上线地址

**https://rickyone.github.io/english-writing-ladder/**

- 仓库：https://github.com/rickyone/english-writing-ladder（公开）
- 部署方式：GitHub Pages，main 分支根目录，已强制 HTTPS
- Supabase 已配置：Site URL = 上述地址，Redirect URL = https://rickyone.github.io/english-writing-ladder/**
- 已实测：公网注册、登录、云端进度同步、离线打开、PWA 安装全部通过

更新代码后只需 git push，GitHub Pages 会自动重新部署（约 1–2 分钟）。若改了 index.html 记得同步升 sw.js 的 VERSION 以刷新缓存。

## 已经做了什么

应用现在是可安装的 PWA，孩子可以把它「添加到主屏幕」，像 App 一样全屏打开，断网也能进入。

新增文件（都在 english-writing-ladder/）：

| 文件 | 作用 |
| --- | --- |
| manifest.webmanifest | 应用名称、图标、standalone 全屏模式、主题色 |
| sw.js | Service Worker：缓存应用外壳，实现离线打开与秒开 |
| icon-192.png / icon-512.png | 普通图标（圆角橙底 + 打开的书 + 金星） |
| icon-maskable-512.png | 安卓自适应图标（内容收在安全区内） |
| tools/make-icons.cjs | 图标生成脚本（纯 Node，无依赖，可重新生成） |

index.html 里加了：manifest / 图标 / 主题色 meta，SW 注册，以及工具箱中动态出现的「安装到桌面」按钮（浏览器判定可安装时才显示）。

## 本地测试安装

PWA 只在 HTTPS 或 localhost 下生效（普通 http:// 局域网地址不行）。本地用任意静态服务器打开即可，Chrome 地址栏会出现安装图标。

注意：直接用 file:// 打开 index.html 无法注册 Service Worker，必须用本地服务器。

## 部署上线

已部署在 GitHub Pages：https://rickyone.github.io/english-writing-ladder/ ，强制 HTTPS。也可选 Netlify Drop。

部署后确认 manifest.webmanifest 返回 application/manifest+json，sw.js 返回 application/javascript。

公网 HTTPS 地址上，Supabase 账户同步和 DeepSeek AI 批改才能正常使用。

## 更新缓存

改了 index.html 后，把 sw.js 第一行的 VERSION 改一下（如 ewl-v2），下次打开自动换新缓存。

## 重新生成图标

运行 node tools/make-icons.cjs 会覆盖三个 PNG。
