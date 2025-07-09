#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { parseAndPrintFunctions } from "./core.js";

const program = new Command();

program
  .name("code-comment-ai")
  .description("Generate code comments using static rules")
  .version("1.0.0");

program
  .command("run")
  .description("Run the comment generator")
  .option("-p, --path <path>", "Path to file or folder", "./")
  .action(async (options) => {
    console.log(chalk.cyan("🧠 Running comment generator..."));
    await parseAndPrintFunctions(options.path);
  });

program.parse();
