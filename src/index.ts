#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { parseAndPrintFunctions } from "./core.js";

const program = new Command();

program
  .name("codecommentor")
  .description("Auto-generate JS/TS function comments with static rules")
  .version("1.0.0")
  .option("-p, --path <path>", "Path to file or folder", "./src")
  .action(async (options) => {
    console.log(chalk.cyan("🧠 Running comment generator..."));
    await parseAndPrintFunctions(options.path);
  });

program.parse();
