import fs from 'fs';
import path from 'path';

function fixImports(dir, depth) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixImports(fullPath, depth + 1);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const prefix = depth === 1 ? '../src/' : '../../src/';
      
      // replace ../components, ../store, ../utils, ../supabase
      content = content.replace(/from '\.\.\/(components|store|utils|supabase)/g, `from '${prefix}$1`);
      
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed imports in ${fullPath}`);
    }
  }
}

fixImports('app', 1);
