# 交接给云端会话：顺路侠最后 3 个小修（分支 polish-final）

已经做了：引导只在看不见时平滑滚动、切身份不回顶；气泡避开按钮和旁边说明；演示面板「重置演示数据」贴底。最后一个提交是 WIP，可能没写完。

还要做：
1. 读 POLISH_BRIEF.md（本地文件，不在仓库里，没有就按这里做）。检查 WIP 改动能否构建：npm ci && npm run build。
2. 用 Playwright 无头浏览器（npx playwright install chromium）在 375、1440、1440×900、720×450 下按新手指引「带我走一遍」走完一单，每步截图：不跳、气泡不挡按钮和说明、「重置演示数据」不用滚就看得到、控制台 0 报错、无横向溢出、无破折号。
3. 全过：合进 main 推送（会自动部署到 https://ekko237.github.io/campus-errand/），提交作者必须是 Ekko237 <Ekko237@users.noreply.github.com>，push 前跑 git log --format='%an %ae' 检查。推完在线上带随机参数复查一遍。
4. 任何一项不过：不要合并 main，线上保持现在这版（3f230f2）。
5. 不加外部服务、埋点、广告；页面不能出现真名。完成后用中文大白话汇报。
