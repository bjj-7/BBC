import fs from 'fs';
import path from 'path';

const files = [
  'src/components/ProductCard.tsx',
  'src/components/Navbar.tsx',
  'src/components/Footer.tsx',
  'src/components/CartPanel.tsx',
  'app/shop/page.tsx',
  'app/checkout/page.tsx',
  'app/admin/page.tsx',
  'app/account/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes("'use client'")) {
    content = "'use client';\n" + content;
  }
  
  // Replace react-router-dom imports
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];/g, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim());
    let nextNavigation = [];
    let nextLink = [];
    
    for (let imp of imports) {
      if (imp === 'useNavigate') {
        nextNavigation.push('useRouter');
      } else if (imp === 'useLocation') {
        nextNavigation.push('usePathname');
      } else if (imp === 'useSearchParams') {
        nextNavigation.push('useSearchParams');
      } else if (imp === 'Link') {
        nextLink.push('Link');
      } else if (imp === 'Navigate') {
        nextNavigation.push('redirect');
      }
    }
    
    let result = '';
    if (nextNavigation.length > 0) result += `import { ${nextNavigation.join(', ')} } from 'next/navigation';\n`;
    if (nextLink.length > 0) result += `import Link from 'next/link';\n`;
    
    return result.trim();
  });

  // Replace hooks
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  content = content.replace(/useLocation\(\)/g, 'usePathname()');
  content = content.replace(/\bNavigate\s+to=/g, 'redirect('); // Needs manual fix, but we can try
  
  // Navigate component to Next.js redirect logic
  content = content.replace(/<Navigate to=\{([^}]+)\} \/>/g, (match, path) => {
    return `{(() => { redirect(${path}); return null; })()}`;
  });
  content = content.replace(/<Navigate to="([^"]+)" \/>/g, (match, path) => {
    return `{(() => { redirect("${path}"); return null; })()}`;
  });
  
  // Link to attributes
  content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
  
  fs.writeFileSync(file, content);
  console.log(`Migrated ${file}`);
}
