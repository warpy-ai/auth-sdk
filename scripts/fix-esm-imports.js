#!/usr/bin/env node

/**
 * Post-build script to fix ESM imports by adding .js extensions
 *
 * Node.js ESM requires explicit file extensions for relative imports.
 * TypeScript with moduleResolution: "bundler" doesn't emit these extensions,
 * so we need to add them post-compilation.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
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
 * Fix imports in a single file by adding .js extensions
 */
async function fixImportsInFile(filePath) {
  const content = await readFile(filePath, 'utf-8');

  // Match import/export statements with relative paths (./... or ../...)
  // and add .js extension if not already present
  const fixedContent = content
    // Fix: from "./path" or from '../path'
    .replace(/from\s+["'](\.\.[\/\\].*?)["']/g, (match, path) => {
      if (path.endsWith('.js') || path.endsWith('.json')) {
        return match;
      }
      return `from "${path}.js"`;
    })
    .replace(/from\s+["'](\.\/.*?)["']/g, (match, path) => {
      if (path.endsWith('.js') || path.endsWith('.json')) {
        return match;
      }
      return `from "${path}.js"`;
    })
    // Fix: import("./path") dynamic imports
    .replace(/import\s*\(\s*["'](\.\.[\/\\].*?)["']\s*\)/g, (match, path) => {
      if (path.endsWith('.js') || path.endsWith('.json')) {
        return match;
      }
      return `import("${path}.js")`;
    })
    .replace(/import\s*\(\s*["'](\.\/.*?)["']\s*\)/g, (match, path) => {
      if (path.endsWith('.js') || path.endsWith('.json')) {
        return match;
      }
      return `import("${path}.js")`;
    });

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
