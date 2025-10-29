#!/usr/bin/env node

/**
 * Post-build script to fix ESM imports by adding .js extensions
 *
 * Node.js ESM requires explicit file extensions for relative imports.
 * TypeScript with moduleResolution: "bundler" doesn't emit these extensions,
 * so we need to add them post-compilation.
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

/**
 * Recursively get all .js files in a directory
 */
async function getAllJsFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await getAllJsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if a path is a directory with an index.js file
 */
async function isDirectoryWithIndex(basePath, importPath) {
  try {
    const fullPath = join(dirname(basePath), importPath);
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      // Check if index.js exists
      const indexPath = join(fullPath, 'index.js');
      await stat(indexPath);
      return true;
    }
  } catch {
    // Not a directory or no index.js
  }
  return false;
}

/**
 * Fix imports in a single file by adding .js extensions
 */
async function fixImportsInFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  let fixedContent = content;

  // Helper function to fix a single import path
  const fixPath = async (path) => {
    if (path.endsWith('.js') || path.endsWith('.json')) {
      return path;
    }
    // Check if it's a directory import (needs /index.js)
    if (await isDirectoryWithIndex(filePath, path)) {
      return `${path}/index.js`;
    }
    // Regular file import (add .js)
    return `${path}.js`;
  };

  // Process all relative imports
  const importRegexes = [
    /from\s+["'](\.\.[\/\\][^"']*)["']/g,
    /from\s+["'](\.\/[^"']*)["']/g,
    /import\s*\(\s*["'](\.\.[\/\\][^"']*)["']\s*\)/g,
    /import\s*\(\s*["'](\.\/[^"']*)["']\s*\)/g,
  ];

  for (const regex of importRegexes) {
    const matches = [...content.matchAll(regex)];
    for (const match of matches) {
      const originalPath = match[1];
      const fixedPath = await fixPath(originalPath);
      if (originalPath !== fixedPath) {
        const originalMatch = match[0];
        const fixedMatch = originalMatch.replace(originalPath, fixedPath);
        fixedContent = fixedContent.replace(originalMatch, fixedMatch);
      }
    }
  }

  if (content !== fixedContent) {
    await writeFile(filePath, fixedContent, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Fixing ESM imports in dist/...');

  try {
    const jsFiles = await getAllJsFiles(distDir);
    let fixedCount = 0;

    for (const file of jsFiles) {
      const wasFixed = await fixImportsInFile(file);
      if (wasFixed) {
        fixedCount++;
        console.log(`  ✓ Fixed: ${file.replace(distDir, 'dist')}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} file(s) with missing .js extensions`);
  } catch (error) {
    console.error('❌ Error fixing ESM imports:', error);
    process.exit(1);
  }
}

main();
