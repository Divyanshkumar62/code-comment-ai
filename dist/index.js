#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import chalk from "chalk";

// src/core.ts
import path from "path";
import fs from "fs";
import {
  Project,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration
} from "ts-morph";
import ignore from "ignore";
function loadIgnorePatterns(projectPath) {
  const ignorePath = path.join(projectPath, ".commentignore");
  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, "utf-8");
    const ig = ignore().add(content);
    return (relativePath) => ig.ignores(relativePath);
  }
  return () => false;
}
function getAllFiles(dir, ext = [".ts", ".js"]) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (ext.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  });
  return results;
}
async function parseAndPrintFunctions(filePath) {
  const project = new Project();
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const shouldIgnore = loadIgnorePatterns(resolvedPath);
  const allFiles = getAllFiles(resolvedPath).filter((file) => {
    const relative = path.relative(resolvedPath, file);
    return !shouldIgnore(relative);
  });
  const sourceFiles = project.addSourceFilesAtPaths(allFiles);
  console.log(`\u{1F4C4} Found ${sourceFiles.length} file(s)`);
  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.getBaseName();
    console.log(`
\u{1F50D} File: ${fileName}`);
    let modified = false;
    const functions = sourceFile.getFunctions();
    const arrowFns = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((d) => d.getInitializerIfKind(SyntaxKind.ArrowFunction));
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
      if (fn instanceof FunctionDeclaration) {
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
      } else if (fn instanceof VariableDeclaration) {
        name = fn.getName();
        const arrowFn = fn.getInitializerIfKind(SyntaxKind.ArrowFunction);
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
var program = new Command();
program.name("code-comment-ai").description("Generate code comments using static rules").version("1.0.0");
program.command("run").description("Run the comment generator").option("-p, --path <path>", "Path to file or folder", "./").action(async (options) => {
  console.log(chalk.cyan("\u{1F9E0} Running comment generator..."));
  await parseAndPrintFunctions(options.path);
});
program.parse();
