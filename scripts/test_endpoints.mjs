import http from 'http';

// Set environment for test
process.env.PORT = '3099';
process.env.ADMIN_ACCESS_KEY = 'test-secret-key-123';
process.env.NODE_ENV = 'production';

// Start server
await import('../server/index.js');

async function probe(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3099,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting StudySphere Automated Verification Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  try {
    // 1. Root route -> 200
    const root = await probe('/');
    assert('GET / returns 200 OK', root.status === 200, `Got ${root.status}`);
    assert('HSTS Header present', Boolean(root.headers['strict-transport-security']), 'Missing HSTS');
    assert('X-Content-Type-Options: nosniff', root.headers['x-content-type-options'] === 'nosniff', `Got ${root.headers['x-content-type-options']}`);
    assert('X-Frame-Options: SAMEORIGIN', root.headers['x-frame-options'] === 'SAMEORIGIN', `Got ${root.headers['x-frame-options']}`);
    assert('Permissions-Policy present', Boolean(root.headers['permissions-policy']), 'Missing Permissions-Policy');

    // 2. Legitimate SPA routes -> 200
    const login = await probe('/login');
    assert('GET /login returns 200 OK', login.status === 200, `Got ${login.status}`);

    const dashboard = await probe('/app/dashboard');
    assert('GET /app/dashboard returns 200 OK', dashboard.status === 200, `Got ${dashboard.status}`);

    // 3. Nonexistent route -> 404 (Remediates Soft 404)
    const missing = await probe('/nonexistent-random-page-12345');
    assert('GET /nonexistent-random-page-12345 returns 404', missing.status === 404, `Got ${missing.status}`);
    assert('404 HTML body contains Page Not Found', missing.body.includes('404 — Page Not Found'), 'Body does not contain 404 notice');

    // 4. Vulnerability probes -> 404
    const phpProbe = await probe('/wp-login.php');
    assert('GET /wp-login.php blocked with 404', phpProbe.status === 404, `Got ${phpProbe.status}`);

    const envProbe = await probe('/.env');
    assert('GET /.env blocked with 404', envProbe.status === 404, `Got ${envProbe.status}`);

    const gitProbe = await probe('/.git/config');
    assert('GET /.git/config blocked with 404', gitProbe.status === 404, `Got ${gitProbe.status}`);

    // 5. Undefined API endpoint -> 404 JSON
    const badApi = await probe('/api/nonexistent-endpoint');
    assert('GET /api/nonexistent-endpoint returns 404 JSON', badApi.status === 404 && badApi.headers['content-type'].includes('application/json'), `Got ${badApi.status}`);

    // 6. Valid API Health endpoint -> 200 JSON
    const health = await probe('/api/health');
    assert('GET /api/health returns 200 JSON', health.status === 200 && health.body.includes('"status":"ok"'), `Got ${health.status}: ${health.body}`);

    // 7. Security on Feedback API (Information Disclosure prevention)
    const feedbackNoAuth = await probe('/api/feedback');
    assert('GET /api/feedback without auth returns 401 Unauthorized', feedbackNoAuth.status === 401, `Got ${feedbackNoAuth.status}`);

    const feedbackAuth = await probe('/api/feedback', {
      headers: { 'X-Admin-Key': 'test-secret-key-123' }
    });
    assert('GET /api/feedback with Admin Key returns 200 OK', feedbackAuth.status === 200, `Got ${feedbackAuth.status}`);

    // 8. Missing static file -> 404
    const missingStatic = await probe('/assets/does-not-exist.js');
    assert('GET /assets/does-not-exist.js returns 404', missingStatic.status === 404, `Got ${missingStatic.status}`);

    console.log(`\n================================`);
    console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
    console.log(`================================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

// Give server 500ms to bind
setTimeout(runTests, 800);
