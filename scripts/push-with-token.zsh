#!/bin/zsh
set -euo pipefail

cd "${0:A:h}/.."
expected='https://github.com/sulalight235-star/oms-mpm-directional-material-prototype.git'
if [[ "$(git remote get-url origin)" != "$expected" ]]; then
  print -u2 'origin 与 MPM 原型固定 GitHub 仓库不一致，已停止。'
  exit 1
fi

print '请输入 GitHub 用户名 sulalight235-star；密码处输入具有该仓库写入权限的令牌。'
print '本次推送不会将令牌保存到 Git 凭据管理器或脚本中。'
git -c http.proxy= -c https.proxy= -c credential.helper= push origin HEAD:main
