# 3R Homebrew

D&D 3.5e 中文房规资料库。目前收录：

- “扩展技法”，共 278 项；
- “领域专长”，共 19 项；
- “牧师职业替换能力”，共 2 项；
- “斥候重做”，包含20级职业进展、奇术、陷阱、专长与职业替换能力；
- “巡林客更新”，包含专长、职业替换能力与26种动物之力面相。
- “游荡者更新”，包含3项专长与5项职业替换能力。
- “诗人乐章”，包含基础、次级、高级与史诗乐章，共58首。
- “专长与进阶职业”，包含7项专长与7个完整进阶职业。

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
