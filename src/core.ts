import path from "path";
import fs from "fs";
import {
  Project,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration,
} from "ts-morph";
import ignore from "ignore";
import chalk from "chalk";

/**
 * Loads the .commentignore file and returns a matcher function.
 * @returns (filePath: string) => boolean
 */
function loadIgnorePatterns(): (relativePath: string) => boolean {
  const ignorePath = path.join(process.cwd(), ".commentignore");

  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, "utf-8");
    const ig = ignore().add(content);
    return (relativePath: string) => ig.ignores(relativePath);
  }

  return () => false;
}

/**
 * Recursively gets all files with specified extensions from a directory.
 * @param dir - Directory path to scan.
 * @param ext - File extensions to include.
 * @returns string[] - List of file paths.
 */
function getAllFiles(dir: string, ext: string[] = [".ts", ".js"]): string[] {
  let results: string[] = [];
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

/**
 * Parses and adds comments to all functions in the target files.
 * @param filePath - Path to folder (e.g., "src").
 * @returns Promise<void>
 */
export async function parseAndPrintFunctions(filePath: string) {
  const project = new Project();
  const absolutePath = path.resolve(process.cwd(), filePath);

  const shouldIgnore = loadIgnorePatterns();

  const allFiles = getAllFiles(absolutePath).filter((file) => {
    const relativeToRoot = path.relative(process.cwd(), file);
    const ignored = shouldIgnore(relativeToRoot);
    if (ignored) {
      console.log(`⛔ Skipped by .commentignore: ${relativeToRoot}\n`);
    }
    return !ignored;
  });

  const sourceFiles = project.addSourceFilesAtPaths(allFiles);

  console.log(`📄 Found ${sourceFiles.length} file(s)`);

  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.getBaseName();
    console.log(`\n🔍 File: ${fileName}`);
    let modified = false;

    const functions = sourceFile.getFunctions();
    const arrowFns = sourceFile
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .filter((d) => d.getInitializerIfKind(SyntaxKind.ArrowFunction));

    const all = [...functions, ...arrowFns];

    if (all.length === 0) {
      console.log("  ⛔ No functions found.");
      continue;
    }

    for (const fn of all) {
      let name = "(anonymous)";
      let params: string[] = [];
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
          console.log(chalk.green(`  📝 Comment added for: ${name}`));
        } else {
          console.log(chalk.yellow(`  ⚠️  Skipped (already commented): ${name}`));
        }
      } else if (fn instanceof VariableDeclaration) {
        name = fn.getName();
        const arrowFn = fn.getInitializerIfKind(SyntaxKind.ArrowFunction);

        if (arrowFn) {
          params = arrowFn.getParameters().map((p) => p.getName());
          returnType = arrowFn.getReturnType().getText();

          const varStatement = fn.getFirstAncestorByKind(
            SyntaxKind.VariableStatement
          );
          if (!varStatement) continue;

          const existing = varStatement.getLeadingCommentRanges().length > 0;


          if (!existing) {
            commentBlock = generateComment(name, params, returnType);

            // Insert comment before the original statement
            const sourceFile = varStatement.getSourceFile();
            const statements = sourceFile.getStatements();
            const index = statements.findIndex((s) => s === varStatement);

            sourceFile.insertStatements(
              index,
              `${commentBlock}\n${varStatement.getText()}`
            );
            varStatement.remove(); // Remove the original (uncommented) statement

            modified = true;
            console.log(chalk.green(`  📝 Comment added for: ${name}`));
          } else {
            console.log(chalk.yellow(`  ⚠️  Skipped (already commented): ${name}`));
          }
        }
      }
    }

    if (modified) {
      await sourceFile.save();
      console.log(`💾 Changes saved to ${fileName}`);
    }
  }
}

/**
 * Generates a JSDoc comment block for a function.
 * @param name - Function name.
 * @param params - Function parameters.
 * @param returnType - Return type.
 * @returns string
 */
function generateComment(
  name: string,
  params: string[],
  returnType: string
): string {
  let doc = `/**\n * ${generateSummary(name)}\n`;
  for (const param of params) {
    doc += ` * @param ${param} - parameter\n`;
  }
  doc += ` * @returns ${returnType}\n */`;
  return doc;
}

/**
 * Generates a random summary for a given function name.
 * @param name - Function name.
 * @returns string
 */
function generateSummary(name: string): string {
  const verbs = [
    "Handles",
    "Processes",
    "Performs",
    "Executes",
    "Calculates",
    "Runs",
  ];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  return `${verb} the function "${name}".`;
}
