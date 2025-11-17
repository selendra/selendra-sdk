#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix patterns
const fixes = [
  // Remove async from methods with no await
  {
    pattern: /(^\s*)(async\s+)(\w+\s*\([^)]*\)\s*:\s*[^{]+\{)/gm,
    check: (match, indent, asyncKeyword, rest, fullContent, startIndex) => {
      // Find the end of the function
      let braceCount = 1;
      let i = startIndex + match.length;
      while (i < fullContent.length && braceCount > 0) {
        if (fullContent[i] === '{') braceCount++;
        if (fullContent[i] === '}') braceCount--;
        i++;
      }
      const functionBody = fullContent.substring(startIndex, i);
      
      // Check if body contains await
      if (!/\bawait\b/.test(functionBody)) {
        return indent + rest; // Remove async keyword
      }
      return match; // Keep as is
    }
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix async methods without await
  const asyncMethodRegex = /(^\s*)(async\s+)(\w+\s*\([^)]*\)\s*:\s*[^{]+\{)/gm;
  let match;
  const replacements = [];
  
  while ((match = asyncMethodRegex.exec(content)) !== null) {
    const [fullMatch, indent, asyncKeyword, rest] = match;
    const startIndex = match.index;
    
    // Find the end of the function
    let braceCount = 1;
    let i = startIndex + fullMatch.length;
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    const functionBody = content.substring(startIndex, i);
    
    // Check if body contains await
    if (!/\bawait\b/.test(functionBody)) {
      replacements.push({
        start: startIndex,
        end: startIndex + fullMatch.length,
        replacement: indent + rest
      });
      modified = true;
    }
  }
  
  // Apply replacements in reverse order
  replacements.reverse().forEach(({ start, end, replacement }) => {
    content = content.substring(0, start) + replacement + content.substring(end);
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixFile(filePath);
    }
  });
}

const srcDir = path.join(__dirname, 'src');
walkDir(srcDir);
console.log('Done!');
