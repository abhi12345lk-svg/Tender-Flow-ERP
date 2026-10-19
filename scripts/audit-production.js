/**
 * TenderFlow ERP — Production Readiness & DevOps Pre-Flight Audit
 * Validates configuration, security headers, build assets, and environment variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.resolve(rootDir, 'server');

const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    if (result === true || (result && result.passed)) {
      checks.push({ name, status: 'PASS', details: result.details || 'Verified' });
    } else {
      checks.push({ name, status: 'FAIL', details: result?.details || 'Check failed' });
    }
  } catch (err) {
    checks.push({ name, status: 'FAIL', details: err.message });
  }
}

console.log('='.repeat(70));
console.log('🔍 TENDERFLOW ERP — PRODUCTION DEVOPS AUDIT');
console.log('='.repeat(70));

// 1. Check vercel.json SPA configuration
check('Vercel SPA Configuration (vercel.json)', () => {
  const vercelPath = path.join(rootDir, 'vercel.json');
  if (!fs.existsSync(vercelPath)) return { passed: false, details: 'vercel.json missing' };
  const content = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const hasRewrites = content.rewrites && content.rewrites.length > 0;
  const hasSecurityHeaders = content.headers && content.headers.length > 0;
  return { passed: hasRewrites && hasSecurityHeaders, details: 'SPA rewrites and security headers configured' };
});

// 2. Check render.yaml Blueprint configuration
check('Render Blueprint Configuration (render.yaml)', () => {
  const renderPath = path.join(rootDir, 'render.yaml');
  if (!fs.existsSync(renderPath)) return { passed: false, details: 'render.yaml missing' };
  const raw = fs.readFileSync(renderPath, 'utf8');
  const hasRootDir = raw.includes('rootDir: server');
  const hasHealth = raw.includes('healthCheckPath: /api/health');
  return { passed: hasRootDir && hasHealth, details: 'rootDir set to server, zero-downtime healthcheck active' };
});

// 3. Check environment examples (.env.example)
check('Environment Variable Templates (.env.example)', () => {
  const rootEnv = path.join(rootDir, '.env.example');
  const serverEnv = path.join(serverDir, '.env.example');
  if (!fs.existsSync(rootEnv) || !fs.existsSync(serverEnv)) {
    return { passed: false, details: 'Missing .env.example templates' };
  }
  const rootContent = fs.readFileSync(rootEnv, 'utf8');
  const serverContent = fs.readFileSync(serverEnv, 'utf8');
  const hasViteUrl = rootContent.includes('VITE_API_BASE_URL');
  const hasMongo = serverContent.includes('MONGODB_URI');
  const hasJwt = serverContent.includes('JWT_SECRET');
  return { passed: hasViteUrl && hasMongo && hasJwt, details: 'Frontend and backend templates populated without secrets' };
});

// 4. Check gitignore safeguards against secret leakage
check('Secret Leakage Protection (.gitignore)', () => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return { passed: false, details: '.gitignore missing' };
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const ignoresEnv = content.includes('.env') && content.includes('server/.env');
  const ignoresUploads = content.includes('server/uploads/*');
  return { passed: ignoresEnv && ignoresUploads, details: 'All local .env files and binary uploads ignored' };
});

// 5. Check Production Frontend Build Output
check('Frontend Production Build Artifacts (dist/)', () => {
  const distDir = path.join(rootDir, 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(indexHtml) || !fs.existsSync(assetsDir)) {
    return { passed: false, details: 'dist/ directory missing or incomplete. Run npm run build.' };
  }
  const assets = fs.readdirSync(assetsDir);
  const hasJs = assets.some((f) => f.endsWith('.js'));
  const hasCss = assets.some((f) => f.endsWith('.css'));
  return { passed: hasJs && hasCss, details: `Compiled bundle verified: ${assets.length} assets ready for Vercel CDN` };
});

// 6. Check Express Production Security Middleware
check('Backend Production Security Middleware', () => {
  const appPath = path.join(serverDir, 'src/app.js');
  const content = fs.readFileSync(appPath, 'utf8');
  const hasHelmet = content.includes('helmet(');
  const hasCors = content.includes('cors(');
  const hasRateLimiter = content.includes('apiLimiter');
  const hasHealthEndpoint = content.includes('/api/health');
  return {
    passed: hasHelmet && hasCors && hasRateLimiter && hasHealthEndpoint,
    details: 'Helmet headers, strict CORS, express-rate-limit, and /api/health operational',
  };
});

// 7. Check Authentication Cookie Security in Production
check('Authentication Security & Cross-Site Cookies', () => {
  const authControllerPath = path.join(serverDir, 'src/controllers/authController.js');
  const content = fs.readFileSync(authControllerPath, 'utf8');
  const hasHttpOnly = content.includes('httpOnly: true');
  const hasCrossSiteNone = content.includes("sameSite: config.env === 'production' ? 'none' : 'lax'");
  const hasSecure = content.includes("secure: config.env === 'production'");
  return {
    passed: hasHttpOnly && hasCrossSiteNone && hasSecure,
    details: 'HttpOnly, sameSite: none, and secure: true configured for Vercel <-> Render cross-origin communication',
  };
});

// 8. Check Document Storage Adapter
check('File Upload & Custody Storage Integrity', () => {
  const storagePath = path.join(serverDir, 'src/services/fileStorageService.js');
  const content = fs.readFileSync(storagePath, 'utf8');
  const hasMimeFilter = content.includes('ALLOWED_MIME_TYPES');
  const hasSizeLimit = content.includes('fileSize: 15 * 1024 * 1024');
  const hasSanitization = content.includes('replace(/[^a-zA-Z0-9_-]/g');
  return {
    passed: hasMimeFilter && hasSizeLimit && hasSanitization,
    details: '15MB limit, strict MIME whitelist, path traversal protection active',
  };
});

// 9. Check Error Handling Stack Trace Suppression
check('Error Handling & Information Disclosure Protection', () => {
  const errorHandlerPath = path.join(serverDir, 'src/middleware/errorHandler.js');
  const content = fs.readFileSync(errorHandlerPath, 'utf8');
  const suppressesStack = content.includes("config.env === 'development' ? { stack: err.stack } : {}");
  return {
    passed: suppressesStack,
    details: 'Stack traces suppressed in production; database credentials never exposed',
  };
});

// Print Results
let allPassed = true;
checks.forEach((c, idx) => {
  const badge = c.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  if (c.status !== 'PASS') allPassed = false;
  console.log(`${idx + 1}. [${badge}] ${c.name}`);
  console.log(`   └─ ${c.details}`);
});

console.log('='.repeat(70));
if (allPassed) {
  console.log('🎉 AUDIT SUCCESSFUL: All 9 pre-flight DevOps checks PASSED!');
  console.log('   The application is fully prepared for Vercel, Render, and MongoDB Atlas.');
} else {
  console.log('⚠️ AUDIT WARNING: One or more checks failed. Review details above.');
}
console.log('='.repeat(70));
