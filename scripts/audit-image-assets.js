#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
const TEXT_RE = /\.(html|css|js|json|webmanifest|md|ps1)$/i;
const REPORT = path.join(ROOT, "ASSET_USAGE_AUDIT.generated.md");

const ENTRY_FILES = [
  "index.html",
  "v2-map-practice.html",
  "v2-auto-battle-practice.html",
  "service-worker.js",
  "manifest.webmanifest"
];

const SOURCE_OR_BACKUP_PREFIXES = [
  "art/v2-style/references/",
  "art/v2-style/map-test/tiles-source/",
  "art/v2-style/map-test/hero-source/",
  "art/v2-style/processed/512/",
  "art/v2-style/animation-sheets/replacements-2026-09-07/",
  "art/v2-style/dice-test/source/"
];

const ALWAYS_REVIEW_PREFIXES = [
  "art/v2-style/ui/",
  "art/v2-style/animation-sheets/green-raw/",
  "art/v2-style/map-test/events/",
  "art/v2-style/event-portraits/",
  "art/v2-style/protagonist/"
];

function posix(p) {
  return p.split(path.sep).join("/");
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(posix(path.relative(ROOT, full)));
  }
  return out;
}

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
  catch (_) { return ""; }
}

function stripQuery(value) {
  return value.replace(/[?#].*$/, "");
}

function localTextDeps(rel, source) {
  const found = new Set();
  const attr = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = attr.exec(source))) {
    const target = stripQuery(m[1]).replace(/^\.\//, "");
    if (TEXT_RE.test(target) && fs.existsSync(path.join(ROOT, target))) found.add(target);
  }
  return found;
}

function collectRuntimeFiles() {
  const seen = new Set();
  const queue = [...ENTRY_FILES];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel) || !fs.existsSync(path.join(ROOT, rel))) continue;
    seen.add(rel);
    const source = read(rel);
    for (const dep of localTextDeps(rel, source)) queue.push(dep);
  }
  return seen;
}

function extractAssetSignals(source) {
  const exact = new Set();
  const prefixes = new Set();

  // Literal complete image paths.
  const complete = /(?:["'`(=:\s])((?:\.\/)?(?:art|assets)\/[^"'\`)\s?]+?\.(?:png|jpe?g|webp|gif))(?:[?#][^"'\`)\s]*)?/gi;
  let m;
  while ((m = complete.exec(source))) exact.add(stripQuery(m[1].replace(/^\.\//, "")));

  // Directory roots and template-string prefixes such as FRAME_ROOT or unit-card-${slug}.
  const partial = /["'`]((?:\.\/)?(?:art|assets)\/[^"'\`$]*\/|(?:\.\/)?(?:art|assets)\/[^"'\`$]*-)(?=\$\{|["'`])/gi;
  while ((m = partial.exec(source))) {
    const p = m[1].replace(/^\.\//, "");
    if (p.length >= 8) prefixes.add(p);
  }

  return { exact, prefixes };
}

const allFiles = walk(ROOT);
const images = allFiles.filter(p => IMAGE_RE.test(p));
const textFiles = allFiles.filter(p => TEXT_RE.test(p));
const runtimeFiles = collectRuntimeFiles();

const runtimeExact = new Set();
const runtimePrefixes = new Set();
for (const rel of runtimeFiles) {
  const sig = extractAssetSignals(read(rel));
  sig.exact.forEach(x => runtimeExact.add(x));
  sig.prefixes.forEach(x => runtimePrefixes.add(x));
}

// Scan every other text file only to distinguish "dev/source referenced" from totally unreferenced.
const nonRuntimeExact = new Set();
const nonRuntimePrefixes = new Set();
for (const rel of textFiles) {
  if (runtimeFiles.has(rel) || rel === "ASSET_USAGE_AUDIT.generated.md") continue;
  const sig = extractAssetSignals(read(rel));
  sig.exact.forEach(x => nonRuntimeExact.add(x));
  sig.prefixes.forEach(x => nonRuntimePrefixes.add(x));
}

function matches(pathname, exact, prefixes) {
  if (exact.has(pathname)) return true;
  for (const prefix of prefixes) if (pathname.startsWith(prefix)) return true;
  return false;
}

const rows = images.map(file => {
  const runtime = matches(file, runtimeExact, runtimePrefixes);
  const other = matches(file, nonRuntimeExact, nonRuntimePrefixes);
  const sourceBackup = SOURCE_OR_BACKUP_PREFIXES.some(p => file.startsWith(p));
  const riskyFamily = ALWAYS_REVIEW_PREFIXES.some(p => file.startsWith(p));

  let status;
  let reason;
  if (runtime) {
    status = "KEEP";
    reason = "현재 런타임에서 직접 또는 동적 경로로 참조";
  } else if (sourceBackup) {
    status = "BACKUP_CANDIDATE";
    reason = other ? "제작/테스트 코드 참조가 있어 백업 후 이동만 검토" : "런타임 참조 미검출, 원본/참고 폴더";
  } else if (other) {
    status = "REVIEW";
    reason = "테스트·제작 스크립트 또는 비런타임 파일에서 참조";
  } else if (riskyFamily) {
    status = "REVIEW";
    reason = "동적 경로/향후 기능 가능성이 큰 혼합 폴더라 자동 삭제 금지";
  } else {
    status = "REVIEW";
    reason = "참조 미검출이지만 자동 삭제 안전 판정은 하지 않음";
  }
  return { file, status, reason };
});

const counts = rows.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
const byStatus = status => rows.filter(r => r.status === status);

let out = "# 이미지 자산 자동 감사 결과\n\n";
out += "> 이 파일은 `npm run audit:assets`로 생성합니다. 참조 미검출은 삭제 허가가 아닙니다.\n\n";
out += `- 전체 이미지: **${images.length}**\n`;
out += `- KEEP: **${counts.KEEP || 0}**\n`;
out += `- BACKUP_CANDIDATE: **${counts.BACKUP_CANDIDATE || 0}**\n`;
out += `- REVIEW: **${counts.REVIEW || 0}**\n\n`;
out += "## 검수 규칙\n\n";
out += "1. 현재 실행 엔트리(index/map/auto-battle)에서 직접 또는 동적으로 참조되면 KEEP.\n";
out += "2. 원본·참고 폴더면서 런타임 참조가 없으면 BACKUP_CANDIDATE.\n";
out += "3. 나머지는 REVIEW. 스크립트는 어떤 파일도 자동으로 SAFE_DELETE 처리하지 않는다.\n";
out += "4. 실제 삭제 전에는 service-worker, 동적 slug 경로, 제작 스크립트, 테스트를 다시 확인한다.\n\n";

for (const status of ["BACKUP_CANDIDATE", "REVIEW"]) {
  out += `## ${status}\n\n`;
  for (const row of byStatus(status)) out += `- \`${row.file}\` — ${row.reason}\n`;
  out += "\n";
}

fs.writeFileSync(REPORT, out, "utf8");
console.log(JSON.stringify({ images: images.length, ...counts, report: posix(path.relative(ROOT, REPORT)) }, null, 2));
