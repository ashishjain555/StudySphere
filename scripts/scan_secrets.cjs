const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'docs_images'];
const SUSPICIOUS_PATTERNS = [
  { name: 'Google API Key (AIza...)', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Generic Secret Assignment', regex: /(?:api[_-]?key|secret|password|auth_token)\s*[:=]\s*['"`][0-9a-zA-Z\-_]{16,}['"`]/i },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  { name: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/i },
  { name: 'OpenAI Secret Key', regex: /sk-[a-zA-Z0-9]{20,}/ }
];

function scanDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          for (const item of SUSPICIOUS_PATTERNS) {
            if (item.regex.test(line)) {
              console.log(`[ALERT: ${item.name}] in ${fullPath} at line ${index + 1}:`);
              console.log(`   ${line.trim().substring(0, 120)}`);
            }
          }
        });
      }
    } catch (e) {
      // Binary or permission error
    }
  }
}

console.log('--- Scanning repository for exposed secrets ---');
scanDir(path.resolve('.'));
console.log('--- Scan completed ---');
