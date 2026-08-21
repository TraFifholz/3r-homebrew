# 3R Homebrew

D&D 3.5e 中文房规资料库。目前收录：

- “扩展技法”，共 278 项；
- “领域专长”，共 19 项。

## 本地预览

静态文件需要通过 HTTP 服务打开（浏览器直接打开 `index.html` 时无法读取 JSON）：

```powershell
python -m http.server 4173
```

然后访问 <http://localhost:4173>。

## 更新技法数据

原始文本采用如下格式：

```text
技法名称[类型技法]

前提：……
效果：……
特殊：……
```

运行数据构建脚本：

```powershell
node tools/build-data.mjs path/to/source.txt data/techniques.json
```

## 发布

推送到 `main` 分支后，GitHub Actions 会自动部署 GitHub Pages。
