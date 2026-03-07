#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const SKIP_EXACT = new Set([
  "css/bootstrap.min.css",
  "css/font-awesome.min.css",
  "js/bootstrap.min.js",
  "js/jquery-2.1.1.min.js",
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function walkFiles(startDir) {
  if (!fs.existsSync(startDir)) return [];
  const out = [];
  const stack = [startDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      out.push(full);
    }
  }
  return out;
}

function minifyCss(input) {
  return (
    input
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>+~])\s*/g, "$1")
      .replace(/;}/g, "}")
      .trim() + "\n"
  );
}

function minifyJs(input) {
  const withoutBlockComments = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = withoutBlockComments.split(/\r?\n/);
  const out = [];

  for (const rawLine of lines) {
    const trimmedStart = rawLine.trimStart();
    if (!trimmedStart) continue;
    if (trimmedStart.startsWith("//")) continue;
    out.push(rawLine.replace(/\s+$/, ""));
  }

  return out.join("\n").replace(/\n{2,}/g, "\n") + "\n";
}

function minifyByExt(absPath) {
  const relPath = toPosix(path.relative(ROOT, absPath));
  if (SKIP_EXACT.has(relPath)) return null;

  if (relPath.endsWith(".min.css") || relPath.endsWith(".min.js")) return null;

  const src = fs.readFileSync(absPath, "utf8");
  let out;
  let outPath;

  if (relPath.endsWith(".css")) {
    out = minifyCss(src);
    outPath = absPath.replace(/\.css$/, ".min.css");
  } else if (relPath.endsWith(".js")) {
    out = minifyJs(src);
    outPath = absPath.replace(/\.js$/, ".min.js");
  } else {
    return null;
  }

  fs.writeFileSync(outPath, out, "utf8");
  return {
    source: relPath,
    target: toPosix(path.relative(ROOT, outPath)),
    sourceSize: src.length,
    targetSize: out.length,
  };
}

function main() {
  const cssFiles = walkFiles(path.join(ROOT, "css")).filter((f) =>
    f.endsWith(".css")
  );
  const jsFiles = walkFiles(path.join(ROOT, "js")).filter((f) =>
    f.endsWith(".js")
  );

  const all = [...cssFiles, ...jsFiles];
  const changes = [];

  for (const file of all) {
    const result = minifyByExt(file);
    if (result) changes.push(result);
  }

  let totalBefore = 0;
  let totalAfter = 0;
  for (const item of changes) {
    totalBefore += item.sourceSize;
    totalAfter += item.targetSize;
    console.log(
      `${item.source} -> ${item.target} (${item.sourceSize}B -> ${item.targetSize}B)`
    );
  }

  console.log(
    `\nMinified ${changes.length} assets. Total: ${totalBefore}B -> ${totalAfter}B`
  );
}

main();
