import path from "path";
import fs from "fs";
import {
  Project,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration,
} from "ts-morph";
import ignore from "ignore";

/**
 * Calculates the function "loadIgnorePatterns".
 * @param projectPath - parameter
 * @returns (filePath: string) => boolean
 */
function loadIgnorePatterns(
  projectPath: string
): (relativePath: string) => boolean {
  const ignorePath = path.join(projectPath, ".commentignore");

  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, "utf-8");
    const ig = ignore().add(content);
    return (relativePath: string) => ig.ignores(relativePath);
  }

  return () => false;
}


/**
 * Calculates the function "getAllFiles".
 * @param dir - parameter
 * @param ext - parameter
 * @returns string[]
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
 * Handles the function "parseAndPrintFunctions".
 * @param filePath - parameter
 * @returns Promise<void>
 */
export async function parseAndPrintFunctions(filePath: string) {
  const project = new Project();
  const resolvedPath = path.resolve(process.cwd(), filePath);

  const shouldIgnore = loadIgnorePatterns(resolvedPath);

  const allFiles = getAllFiles(resolvedPath).filter((file) => {
    const relative = path.relative(resolvedPath, file);
    return !shouldIgnore(relative);
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
          console.log(`  📝 Comment added for: ${name}`);
        } else {
          console.log(`  ⚠️  Skipped (already commented): ${name}`);
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
            console.log(`  📝 Comment added for: ${name}`);
          } else {
            console.log(`  ⚠️  Skipped (already commented): ${name}`);
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
 * Handles the function "generateComment".
 * @param name - parameter
 * @param params - parameter
 * @param returnType - parameter
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
 * Calculates the function "generateSummary".
 * @param name - parameter
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
