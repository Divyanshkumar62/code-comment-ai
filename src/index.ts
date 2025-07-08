#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { parseAndPrintFunctions } from './core';

const program = new Command();

program 
    .name("code-comment-ai")
    .description("Generate comments for your code using static rules or AI")
    .version("1.0.0");

program
    .command("run")
    .description("Run the comment generator on your codebase")
    .option("-p, --path <path>", "path to file or folder", "./")
    .option("--dry", "preview comments without writing them", false)
    .option("--use-ai", "use AI to generate comments", false)
    .action(async (options) => {
        console.log(chalk.cyan("🧠 Running comment generator..."));
        // Next steps: invoke main logic here
        await parseAndPrintFunctions(options.path)
    });

program.parse()