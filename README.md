# codecommentor

> 🚀 Auto-generate clean function comments for your TypeScript/JavaScript files.

**codecommentor** is a lightweight CLI tool that analyzes your `.ts` / `.js` files and inserts structured `/** */` comments above functions using static code parsing — no AI, no dependencies, no fluff.

---

## 📦 Installation

```bash
npm install -g codecommentor
```

```bash
# Basic usage in current directory
codecommentor

# Or specify a custom path
codecommentor --path my-folder
```

### `.commentignore`
Like .gitignore — skip files or folders from being commented:
```bash
# Ignore these files
src/temp.ts
src/legacy/*
```
---

## Features
🧠 Static analysis — no runtime needed

⚡ Blazing fast and works offline

💾 Edits functions in place

🎯 Supports arrow + named functions


---

## Example
Before:

```bash
function add(a: number, b: number): number {
  return a + b;
}
```
After:

```bash
/**
 * Calculates the function "add".
 * @param a - parameter
 * @param b - parameter
 * @returns number
 */
function add(a: number, b: number): number {
  return a + b;
}
```
--- 

## 📄 License
MIT © Divyansh Kumar