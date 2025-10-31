import fs from "fs/promises";
import path from "path";
import ts from "typescript";

// Convert all .tsx files under src/ (frontend) to .jsx
const root = path.resolve(process.cwd(), "src");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(res)));
    } else if (entry.isFile() && res.endsWith(".tsx")) {
      files.push(res);
    }
  }
  return files;
}

async function convertFile(file) {
  const src = await fs.readFile(file, "utf8");
  const out = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      esModuleInterop: true,
    },
    fileName: file,
  });

  const outPath = file.replace(/\.tsx$/, ".jsx");
  await fs.writeFile(outPath, out.outputText, "utf8");
  return outPath;
}

async function main() {
  try {
    const files = await walk(root);
    console.log(`Found ${files.length} .tsx files under ${root}`);
    const converted = [];
    for (const f of files) {
      const out = await convertFile(f);
      converted.push(out);
      console.log("Converted:", f, "->", out);
    }
    console.log(`Converted ${converted.length} files.`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();
