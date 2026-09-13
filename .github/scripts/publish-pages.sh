#!/usr/bin/env bash
#
# 把 dist/ 发到 gh-pages 分支的某个子路径，或者删掉某个子路径。
#
# 为什么自己写而不是用现成的 action：这一步需要仓库的写权限，
# 而它要做的事只有几行 git。少引一个第三方 action，就少一处需要持续盯着的信任点。
#
# 两个工作流共用这个脚本：
#   main        TARGET=.                 发到根目录
#   其他分支     TARGET=preview/<分支>     发到子目录
#   分支删除时   TARGET=preview/<分支> REMOVE=1
#
# 关键在于**互不覆盖**：
#   - 发根目录时，保留 preview/（否则 main 一推，所有分支预览全没了）
#   - 发子目录时，只动那一个目录
set -euo pipefail

TARGET="${TARGET:?需要 TARGET}"
REMOVE="${REMOVE:-}"
BRANCH=gh-pages

# 路径里不许出现 .. ——TARGET 来自分支名，别让一个叫 `../..` 的分支写到仓库外面
case "$TARGET" in
  *..*) echo "TARGET 含有 ..，拒绝：$TARGET" >&2; exit 1 ;;
esac

work="$(mktemp -d)"
# gh-pages 可能还不存在（第一次跑）：那就开一个空的孤儿分支
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git clone --depth 1 --branch "$BRANCH" "$(git remote get-url origin)" "$work"
else
  git clone --depth 1 "$(git remote get-url origin)" "$work"
  git -C "$work" checkout --orphan "$BRANCH"
  git -C "$work" rm -rf . >/dev/null 2>&1 || true
fi

if [ -n "$REMOVE" ]; then
  if [ -d "$work/$TARGET" ]; then
    rm -rf "${work:?}/$TARGET"
    echo "已删除 $TARGET"
  else
    echo "$TARGET 不存在，无需删除"
  fi
elif [ "$TARGET" = "." ]; then
  # 根目录：清掉除 preview/ 与 .git 之外的一切，再放新产物。
  # 不能直接 rm -rf * ——那会把所有分支的预览一起删掉
  find "$work" -mindepth 1 -maxdepth 1 \
    ! -name .git ! -name preview -exec rm -rf {} +
  cp -r dist/. "$work/"
else
  rm -rf "${work:?}/$TARGET"
  mkdir -p "$work/$TARGET"
  cp -r dist/. "$work/$TARGET/"
fi

# Jekyll 会吞掉下划线开头的目录，而 vite 的产物里有 _headers 之类
touch "$work/.nojekyll"

# 身份要配在**克隆出来的那个仓库**里：提交发生在 $work，不在 checkout 目录。
# 配错地方在本机看不出来（本机多半有全局身份兜着），到了干净的 runner 上
# 直接是 `empty ident name` 然后退出 128——这里就这么红过一次。
git -C "$work" config user.name "github-actions[bot]"
git -C "$work" config user.email "41898282+github-actions[bot]@users.noreply.github.com"

cd "$work"
git add -A
if git diff --cached --quiet; then
  echo "内容没有变化，不提交"
  exit 0
fi
git commit -m "发布 $TARGET（来自 ${GITHUB_SHA:-本地}）"

# 并发保护已经交给 workflow 的 concurrency 组，这里只兜一次网络抖动
for attempt in 1 2 3; do
  if git push origin "$BRANCH"; then
    exit 0
  fi
  echo "推送失败，第 $attempt 次重试前先同步远端"
  git pull --rebase origin "$BRANCH" || true
  sleep $((attempt * 3))
done
echo "推送 $BRANCH 失败" >&2
exit 1
