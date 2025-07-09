#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");
var import_chalk = __toESM(require("chalk"), 1);

// src/core.ts
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_ts_morph = require("ts-morph");
var import_ignore = __toESM(require("ignore"), 1);
function loadIgnorePatterns() {
  const ignorePath = import_path.default.join(process.cwd(), ".commentignore");
  if (import_fs.default.existsSync(ignorePath)) {
    const content = import_fs.default.readFileSync(ignorePath, "utf-8");
    const ig = (0, import_ignore.default)().add(content);
    console.log("\u{1F4C4} Loaded .commentignore");
    return (relativePath) => ig.ignores(relativePath);
  }
  return () => false;
}
function getAllFiles(dir, ext = [".ts", ".js"]) {
  let results = [];
  const list = import_fs.default.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = import_path.default.join(dir, file);
    const stat = import_fs.default.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (ext.includes(import_path.default.extname(fullPath))) {
      results.push(fullPath);
    }
  });
  return results;
}
async function parseAndPrintFunctions(filePath) {
  const project = new import_ts_morph.Project();
  const absolutePath = import_path.default.resolve(process.cwd(), filePath);
  const shouldIgnore = loadIgnorePatterns();
  const allFiles = getAllFiles(absolutePath).filter((file) => {
    const relativeToRoot = import_path.default.relative(process.cwd(), file);
    const ignored = shouldIgnore(relativeToRoot);
    if (ignored) {
      console.log(`\u26D4 Skipped by .commentignore: ${relativeToRoot}`);
    }
    return !ignored;
  });
  const sourceFiles = project.addSourceFilesAtPaths(allFiles);
  console.log(`\u{1F4C4} Found ${sourceFiles.length} file(s)`);
  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.getBaseName();
    console.log(`
\u{1F50D} File: ${fileName}`);
    let modified = false;
    const functions = sourceFile.getFunctions();
    const arrowFns = sourceFile.getDescendantsOfKind(import_ts_morph.SyntaxKind.VariableDeclaration).filter((d) => d.getInitializerIfKind(import_ts_morph.SyntaxKind.ArrowFunction));
    const all = [...functions, ...arrowFns];
    if (all.length === 0) {
      console.log("  \u26D4 No functions found.");
      continue;
    }
    for (const fn of all) {
      let name = "(anonymous)";
      let params = [];
      let returnType = "unknown";
      let commentBlock = "";
      let existing = false;
      if (fn instanceof import_ts_morph.FunctionDeclaration) {
        name = fn.getName() || "(anonymous)";
        params = fn.getParameters().map((p) => p.getName());
        returnType = fn.getReturnType().getText();
        existing = fn.getLeadingCommentRanges().length > 0;
        if (!existing) {
          commentBlock = generateComment(name, params, returnType);
          fn.replaceWithText(commentBlock + "\n" + fn.getText());
          modified = true;
          console.log(`  \u{1F4DD} Comment added for: ${name}`);
        } else {
          console.log(`  \u26A0\uFE0F  Skipped (already commented): ${name}`);
        }
      } else if (fn instanceof import_ts_morph.VariableDeclaration) {
        name = fn.getName();
        const arrowFn = fn.getInitializerIfKind(import_ts_morph.SyntaxKind.ArrowFunction);
        if (arrowFn) {
          params = arrowFn.getParameters().map((p) => p.getName());
          returnType = arrowFn.getReturnType().getText();
          existing = arrowFn.getLeadingCommentRanges().length > 0;
          if (!existing) {
            commentBlock = generateComment(name, params, returnType);
            arrowFn.replaceWithText(commentBlock + "\n" + arrowFn.getText());
            modified = true;
            console.log(`  \u{1F4DD} Comment added for: ${name}`);
          } else {
            console.log(`  \u26A0\uFE0F  Skipped (already commented): ${name}`);
          }
        }
      }
    }
    if (modified) {
      await sourceFile.save();
      console.log(`\u{1F4BE} Changes saved to ${fileName}`);
    }
  }
}
function generateComment(name, params, returnType) {
  let doc = `/**
 * ${generateSummary(name)}
`;
  for (const param of params) {
    doc += ` * @param ${param} - parameter
`;
  }
  doc += ` * @returns ${returnType}
 */`;
  return doc;
}
function generateSummary(name) {
  const verbs = [
    "Handles",
    "Processes",
    "Performs",
    "Executes",
    "Calculates",
    "Runs"
  ];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  return `${verb} the function "${name}".`;
}

// src/index.ts
var program = new import_commander.Command();
program.name("code-comment-ai").description("Generate code comments using static rules").version("1.0.0");
program.command("run").description("Run the comment generator").option("-p, --path <path>", "Path to file or folder", "./").action(async (options) => {
  console.log(import_chalk.default.cyan("\u{1F9E0} Running comment generator..."));
  await parseAndPrintFunctions(options.path);
});
program.parse();
