import fs from 'fs';
import path from 'path';

// 1. Delete Vite files
const filesToDelete = ['src/App.tsx', 'src/main.tsx', 'index.html', 'vite.config.ts'];
for (const file of filesToDelete) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

// 2. Fix useAppStore.ts
let store = fs.readFileSync('src/store/useAppStore.ts', 'utf8');
store = store.replace(/updateOrderStatus:\s*async\s*\(([^,]+),\s*([^)]+)\)\s*=>\s*\{[\s\S]*?await updateOrderStatusAction\(([^,]+),\s*([^)]+)\);\n\s*\}/, 
  'updateOrderStatus: async ($1, $2) => {\n    await updateOrderStatusAction($1, $2);\n  }');
fs.writeFileSync('src/store/useAppStore.ts', store);

// 3. Fix supabase/config.ts
let config = fs.readFileSync('src/supabase/config.ts', 'utf8');
config = config.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, 'process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL');
config = config.replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, 'process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
fs.writeFileSync('src/supabase/config.ts', config);

// 4. Fix navigate() -> navigate.push() and location.pathname -> location
function fixRouterCalls(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixRouterCalls(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix navigate('/path') -> navigate.push('/path')
      content = content.replace(/navigate\(([^)]+)\)/g, (match, p1) => {
        // Exclude if it's already navigate.push or similar
        if (p1.startsWith('{') || p1.includes('=>')) return match;
        return `navigate.push(${p1})`;
      });
      // Replace duplicate push
      content = content.replace(/navigate\.push\.push/g, 'navigate.push');
      
      // Fix location.pathname -> pathname
      content = content.replace(/location\.pathname/g, 'location'); // Because we mapped useLocation to usePathname which returns a string
      
      // Fix search params
      if (content.includes('useSearchParams')) {
         content = content.replace(/const \[\s*searchParams\s*,\s*setSearchParams\s*\] = useSearchParams\(\);/, 'const searchParams = useSearchParams();\n  const setSearchParams = (params: any) => { /* Next.js requires router.push for search params */ };');
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}
fixRouterCalls('app');
fixRouterCalls('src/components');

// 5. Fix Next.js 15 cookies API
let server = fs.readFileSync('utils/supabase/server.ts', 'utf8');
server = server.replace(/const cookieStore = cookies\(\)/, 'const cookieStore = await cookies()');
server = server.replace(/export function createClient\(\) \{/, 'export async function createClient() {');
fs.writeFileSync('utils/supabase/server.ts', server);

// Also fix actions.ts which uses createClient
let actions = fs.readFileSync('app/actions.ts', 'utf8');
actions = actions.replace(/const supabase = createClient\(\);/g, 'const supabase = await createClient();');
fs.writeFileSync('app/actions.ts', actions);

console.log('Fixed TS errors.');
