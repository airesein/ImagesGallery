# Images Gallery

这是一个基于 React 和 HeroUI 风格构建的图片与视频展示网站。支持瀑布流布局、侧边栏分类导航、以及快捷键操作。

## 📦 如何打包成纯静态页面

本项目使用 **Vite** 进行构建，打包后会生成纯 HTML/CSS/JS 文件，不依赖后端服务器（除获取 JSON 数据的 HTTP 请求外）。

### 1. 环境准备
确保你的电脑上安装了 [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)。

### 2. 安装依赖
在项目根目录下打开终端（命令行），运行以下命令安装项目所需的依赖包：

```bash
npm install
```

### 3. 开发环境运行 (可选)
如果你想在本地开发或预览修改效果：（有些毛病）

```bash
npm run dev
```

### 4. 执行打包 (Build)
运行以下命令进行构建：

```bash
npm run build
```

**构建完成后：**
- 项目根目录下会生成一个 `dist` 文件夹。
- `dist` 文件夹包含了 `index.html` 以及 `assets` 目录（存放压缩后的 JS 和 CSS）。
- `config.json` 和 `date.json` 会自动复制到 `dist` 目录中。

### 5. 部署或预览

由于浏览器安全策略（CORS 和 模块加载限制），**不能直接双击 `dist/index.html` 打开**（除非你禁用了相关安全设置）。你需要将其放置在任何静态 Web 服务器中。

#### 方法 A：本地预览 (推荐)
打包后，运行以下命令可以在本地启动一个静态服务器预览 `dist` 目录：

```bash
npm run preview
```

#### 方法 B：部署到服务器 (Nginx / Apache / Vercel / GitHub Pages)
只需将 `dist` 文件夹内的**所有内容**上传到你的网站根目录即可。

- **Nginx**: 将 `dist` 内容放入 `/usr/share/nginx/html`。
- **GitHub Pages**: 将 `dist` 内容推送到仓库分支。
- **Vercel/Netlify**: 直接连接 GitHub 仓库，Build Command 填 `npm run build`，Output Directory 填 `dist`。

---

## 🛠️ 项目结构

- `src/`: 源代码目录 (App.tsx, components/, etc.)
- `public/`: 静态资源目录 (config.json, date.json 会被直接复制到 dist)
- `dist/`: **打包输出目录** (最终发布的版本)

## ⚙️ 配置文件说明

- **vite.config.ts**: 
  - 设置了 `base: './'`，这使得生成的 HTML 使用相对路径引入资源，确保项目可以部署在子目录下。
- **package.json**: 
  - 定义了依赖和脚本命令。
