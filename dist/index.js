#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import chalk from "chalk";

// src/core.ts
import path from "path";
import {
  Project,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration
} from "ts-morph";
async function parseAndPrintFunctions(filePath) {
  const project = new Project();
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const sourceFiles = project.addSourceFilesAtPaths([
    `${resolvedPath}/**/*.ts`,
    `${resolvedPath}/**/*.js`
  ]);
  console.log(`\u{1F4C4} Found ${sourceFiles.length} file(s)`);
  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.getBaseName();
    console.log(`
\u{1F50D} File: ${fileName}`);
    const functions = sourceFile.getFunctions();
    const arrowFns = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((d) => {
      const init = d.getInitializer();
      return init?.getKind() === SyntaxKind.ArrowFunction;
    });
    const all = [...functions, ...arrowFns];
    if (all.length === 0) {
      console.log("  \u26D4 No functions found.");
      continue;
    }
    for (const fn of all) {
      let name = "(anonymous)";
      let params = [];
      let returnType = "unknown";
      let pos = 0;
      if (fn instanceof FunctionDeclaration) {
        name = fn.getName() || "(anonymous)";
        params = fn.getParameters().map((p) => p.getName());
        returnType = fn.getReturnType().getText();
        pos = fn.getStartLineNumber();
      } else if (fn instanceof VariableDeclaration) {
        name = fn.getName();
        const arrowFn = fn.getInitializerIfKind(SyntaxKind.ArrowFunction);
        if (arrowFn) {
          params = arrowFn.getParameters().map((p) => p.getName());
          returnType = arrowFn.getReturnType().getText();
          pos = arrowFn.getStartLineNumber();
        }
      }
      console.log(`  \u2705 Function: ${name}`);
      console.log(`     Params: ${params.join(", ")}`);
      console.log(`     Returns: ${returnType}`);
      console.log(`     Line: ${pos}`);
    }
  }
}

// src/index.ts
var program = new Command();
program.name("code-comment-ai").description("Generate comments for your code using static rules or AI").version("1.0.0");
program.command("run").description("Run the comment generator on your codebase").option("-p, --path <path>", "path to file or folder", "./").option("--dry", "preview comments without writing them", false).option("--use-ai", "use AI to generate comments", false).action(async (options) => {
  console.log(chalk.cyan("\u{1F9E0} Running comment generator..."));
  await parseAndPrintFunctions(options.path);
});
program.parse();
