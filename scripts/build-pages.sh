#!/bin/sh
set -eu

output_dir=${1:-public}
pages_url=${2:-http://127.0.0.1:8000}
routes_file=${ROUTES_FILE:-pages/routes.tsv}

case "$output_dir" in
  ""|/|.)
    echo "拒绝使用不安全的输出目录：$output_dir" >&2
    exit 1
    ;;
esac

if [ ! -f "$routes_file" ]; then
  echo "路由清单不存在：$routes_file" >&2
  exit 1
fi

rm -rf "$output_dir"
mkdir -p "$output_dir"
output_abs=$(cd "$output_dir" && pwd)
export output_abs

# 仅复制网页发布所需的文件类型，避免把 .git、本地日志或浏览器配置带入产物。
find . -type f \
  \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.md' -o -name '*.json' \
     -o -name '*.svg' -o -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \
     -o -name '*.webp' -o -name '*.gif' -o -name '*.ico' -o -name '*.LICENSE' \) \
  -not -path './.git/*' \
  -not -path './public/*' \
  -not -path './_edge_cdp_profile/*' \
  -exec sh -c '
    for source_file do
      relative_file=${source_file#./}
      destination="$output_abs/$relative_file"
      mkdir -p "$(dirname "$destination")"
      cp "$source_file" "$destination"
    done
  ' sh {} +

all_html=$(mktemp)
mapped_html=$(mktemp)
routes=$(mktemp)
trap 'rm -f "$all_html" "$mapped_html" "$routes"' EXIT HUP INT TERM

find . -type f -name '*.html' \
  -not -path './.git/*' \
  -not -path './public/*' \
  -not -path './_edge_cdp_profile/*' \
  -print | sed 's#^./##' | grep -v '^index\.html$' | sort > "$all_html"

awk -F '\t' 'NF && $1 !~ /^#/ { print $2 }' "$routes_file" | sort > "$mapped_html"
awk -F '\t' 'NF && $1 !~ /^#/ { print $1 }' "$routes_file" | sort > "$routes"

if [ "$(uniq -d "$routes" | wc -l | tr -d ' ')" -ne 0 ]; then
  echo "路由清单存在重复稳定路径：" >&2
  uniq -d "$routes" >&2
  exit 1
fi

if [ "$(uniq -d "$mapped_html" | wc -l | tr -d ' ')" -ne 0 ]; then
  echo "路由清单存在重复目标文件：" >&2
  uniq -d "$mapped_html" >&2
  exit 1
fi

if ! diff -u "$all_html" "$mapped_html"; then
  echo "每个 HTML（根 index.html 除外）必须且只能配置一个稳定路由。" >&2
  exit 1
fi

base_url=${pages_url%/}
catalog="$output_dir/prototypes/index.html"
mkdir -p "$(dirname "$catalog")"
{
  printf '%s\n' '<!doctype html>' '<html lang="zh-CN">' '<head>'
  printf '%s\n' '  <meta charset="UTF-8">' '  <meta name="viewport" content="width=device-width,initial-scale=1">'
  printf '%s\n' '  <title>原型稳定地址清单</title>'
  printf '%s\n' '  <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#1f2937}h1{margin-bottom:8px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:10px 8px}a{color:#1677ff;text-decoration:none}code{font-size:12px;color:#475569}</style>'
  printf '%s\n' '</head>' '<body>' '<h1>原型稳定地址清单</h1>' '<p>文档请引用“稳定地址”；实际文件改名时只需更新路由清单。</p>' '<table><thead><tr><th>稳定地址</th><th>当前源文件</th></tr></thead><tbody>'
} > "$catalog"

tab=$(printf '\t')
while IFS="$tab" read -r route source_file extra; do
  case "$route" in
    ''|'#'*) continue ;;
  esac
  if [ -n "${extra:-}" ] || [ -z "$source_file" ]; then
    echo "路由格式错误：$route" >&2
    exit 1
  fi
  if [ ! -f "$source_file" ]; then
    echo "路由目标不存在：$source_file" >&2
    exit 1
  fi

  source_dir=$(dirname "$source_file")
  source_base="$base_url/"
  if [ "$source_dir" != "." ]; then
    source_base="$base_url/$source_dir/"
  fi

  alias_dir="$output_dir/prototypes/$route"
  mkdir -p "$alias_dir"
  awk -v base="$source_base" '
    BEGIN { inserted = 0 }
    {
      print
      lowered = tolower($0)
      if (!inserted && lowered ~ /<head[^>]*>/) {
        print "  <base href=\"" base "\">"
        inserted = 1
      }
    }
    END { if (!inserted) exit 2 }
  ' "$source_file" > "$alias_dir/index.html"

  printf '<tr><td><a href="%s/prototypes/%s/">%s/prototypes/%s/</a></td><td><code>%s</code></td></tr>\n' \
    "$base_url" "$route" "$base_url" "$route" "$source_file" >> "$catalog"
done < "$routes_file"

printf '%s\n' '</tbody></table></body></html>' >> "$catalog"
echo "Pages 产物已生成：$output_dir"
