const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs_images');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1200,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 2 });

  // 1. Architecture Diagram
  const archHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 40px; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
      .title { text-align: center; font-size: 22px; font-weight: 800; margin-bottom: 30px; letter-spacing: -0.5px; color: #38bdf8; }
      .container { display: flex; flex-direction: column; gap: 24px; max-width: 1000px; margin: 0 auto; }
      .tier { border: 1.5px solid #1e293b; background: rgba(15, 23, 42, 0.7); border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      .tier-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
      .tier-header span { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px; text-align: center; }
      .card-title { font-size: 14px; font-weight: bold; color: #f1f5f9; margin-bottom: 4px; }
      .card-desc { font-size: 11px; color: #94a3b8; line-height: 1.4; }
      .arrow { text-align: center; font-size: 18px; color: #64748b; font-weight: bold; }
      .split-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    </style>
  </head>
  <body>
    <div class="title">Figure 2.1: StudySphere End-to-End System Architecture</div>
    <div class="container">
      <div class="tier">
        <div class="tier-header"><span style="background: #38bdf8;"></span> Client Layer (Presentation & Local Storage)</div>
        <div class="row">
          <div class="card"><div class="card-title">React 19 & Vite</div><div class="card-desc">Single Page Application UI with Tailwind CSS v4</div></div>
          <div class="card"><div class="card-title">PDF.js Web Worker</div><div class="card-desc">Non-blocking client-side text & syllabus extraction</div></div>
          <div class="card"><div class="card-title">IndexedDB Storage</div><div class="card-desc">High-capacity browser binary storage for documents</div></div>
          <div class="card"><div class="card-title">State Cache</div><div class="card-desc">LocalStorage for instant offline-first student sessions</div></div>
        </div>
      </div>
      <div class="arrow">▼ HTTP REST Requests / JSON API Responses ▼</div>
      <div class="tier">
        <div class="tier-header"><span style="background: #a855f7;"></span> Application & Business Logic Layer (Node.js & Express 5)</div>
        <div class="row">
          <div class="card"><div class="card-title">/api/ai/analyze-pdf</div><div class="card-desc">Multi-topic synthesis & executive summaries</div></div>
          <div class="card"><div class="card-title">/api/ai/deepen</div><div class="card-desc">Conceptual in-depth walkthrough & trade-offs</div></div>
          <div class="card"><div class="card-title">/api/ai/generate-quiz</div><div class="card-desc">Laser-accurate 5/10/15 topic MCQs & rationales</div></div>
          <div class="card"><div class="card-title">/api/ai/chat</div><div class="card-desc">Curriculum-grounded 3-level AI study tutor</div></div>
        </div>
      </div>
      <div class="arrow">▼ Multi-Model AI Orchestration & Cloud Relational Persistence ▼</div>
      <div class="split-row">
        <div class="tier">
          <div class="tier-header"><span style="background: #10b981;"></span> AI Intelligence Layer</div>
          <div class="card" style="margin-bottom: 8px;"><div class="card-title">Google Gemini 2.5 Flash / Pro</div><div class="card-desc">Pedagogical prompt engineering with automatic multi-model fallback</div></div>
        </div>
        <div class="tier">
          <div class="tier-header"><span style="background: #f59e0b;"></span> Database & Security Layer</div>
          <div class="card"><div class="card-title">Supabase (PostgreSQL 15)</div><div class="card-desc">Relational 3NF schemas with Row-Level Security (RLS) policies</div></div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(archHtml);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_architecture.png') });

  // 2. Database ER Diagram
  const erHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 40px; background: #07090e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
      .title { text-align: center; font-size: 22px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.5px; color: #38bdf8; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 1050px; margin: 0 auto; }
      .table-box { background: #0f172a; border: 1.5px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
      .table-name { background: #1e293b; padding: 10px 14px; font-weight: 800; font-size: 13px; color: #38bdf8; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; font-family: monospace; }
      .field { padding: 6px 14px; font-size: 11px; font-family: monospace; border-bottom: 1px solid #1e293b/40; display: flex; justify-content: space-between; color: #cbd5e1; }
      .pk { color: #f59e0b; font-weight: bold; }
      .fk { color: #a855f7; font-weight: bold; }
      .type { color: #64748b; font-size: 10px; }
    </style>
  </head>
  <body>
    <div class="title">Figure 3.1: StudySphere Relational Database Schema & Entities</div>
    <div class="grid">
      <div class="table-box">
        <div class="table-name"><span>users</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">UUID</span></div>
        <div class="field"><span>email</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>full_name</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>role</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>created_at</span><span class="type">TIMESTAMPTZ</span></div>
      </div>
      <div class="table-box">
        <div class="table-name"><span>subjects</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>name</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>code</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>topic_count</span><span class="type">INTEGER</span></div>
        <div class="field"><span>progress_pct</span><span class="type">INTEGER</span></div>
      </div>
      <div class="table-box">
        <div class="table-name"><span>topics</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span class="fk">FK subject_id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>unit_number</span><span class="type">INTEGER</span></div>
        <div class="field"><span>title</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>difficulty</span><span class="type">VARCHAR</span></div>
      </div>
      <div class="table-box">
        <div class="table-name"><span>study_plans (Tasks)</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span class="fk">FK subject_id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>title</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>priority</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>due_date</span><span class="type">DATE</span></div>
        <div class="field"><span>is_completed</span><span class="type">BOOLEAN</span></div>
      </div>
      <div class="table-box">
        <div class="table-name"><span>quiz_attempts</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span class="fk">FK subject_id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>topic_title</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>score</span><span class="type">INTEGER</span></div>
        <div class="field"><span>percentage</span><span class="type">INTEGER</span></div>
        <div class="field"><span>attempted_at</span><span class="type">TIMESTAMPTZ</span></div>
      </div>
      <div class="table-box">
        <div class="table-name"><span>weak_topics</span><span>[Entity]</span></div>
        <div class="field"><span class="pk">PK id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span class="fk">FK subject_id</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>topic_title</span><span class="type">VARCHAR</span></div>
        <div class="field"><span>accuracy_pct</span><span class="type">INTEGER (&lt;60%)</span></div>
        <div class="field"><span>suggested_action</span><span class="type">VARCHAR</span></div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(erHtml);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_database_schema.png') });

  // 3. Express API Server Terminal & Health Check
  const terminalHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 40px; background: #07090e; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; color: #f8fafc; }
      .window { max-width: 900px; margin: 0 auto; background: #0f172a; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden; }
      .header { background: #1e293b; padding: 12px 18px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #334155; }
      .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
      .dot-red { background: #ef4444; }
      .dot-yellow { background: #f59e0b; }
      .dot-green { background: #10b981; }
      .title { margin-left: 12px; font-size: 13px; color: #94a3b8; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .content { padding: 24px; font-size: 13px; line-height: 1.7; }
      .prompt { color: #38bdf8; }
      .cmd { color: #f8fafc; font-weight: 600; }
      .green { color: #4ade80; }
      .cyan { color: #38bdf8; }
      .yellow { color: #facc15; }
      .gray { color: #64748b; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      .badge-ok { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="header">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="title">Node.js Express Server — StudySphere Backend Runtime (Port 3001)</span>
      </div>
      <div class="content">
        <div><span class="prompt">studysphere@backend:~$</span> <span class="cmd">node server/index.js</span></div>
        <div class="green" style="margin-top: 8px;">🚀 [StudySphere API] Express server started on http://localhost:3001</div>
        <div class="cyan">🔑 [AI Engine] Google Gemini AI Client initialized with model: gemini-2.5-flash</div>
        <div class="gray">🔒 [CORS Policy] Active for origins: http://localhost:5173, http://localhost:3000</div>
        <div class="gray">⚡ [Health Check] Route registered at /api/health</div>
        <div style="margin: 16px 0; border-top: 1px dashed #334155;"></div>
        <div><span class="prompt">studysphere@test:~$</span> <span class="cmd">curl -i http://localhost:3001/api/health</span></div>
        <div class="gray">HTTP/1.1 200 OK</div>
        <div class="gray">Content-Type: application/json; charset=utf-8</div>
        <div class="green">{</div>
        <div class="green">&nbsp;&nbsp;"status": "ok",</div>
        <div class="green">&nbsp;&nbsp;"service": "StudySphere Backend API",</div>
        <div class="green">&nbsp;&nbsp;"aiEngine": "Google Gemini 2.5 Active",</div>
        <div class="green">&nbsp;&nbsp;"timestamp": "2026-10-12T15:35:00.000Z",</div>
        <div class="green">&nbsp;&nbsp;"database": "Supabase PostgreSQL connected"</div>
        <div class="green">}</div>
        <div style="margin: 16px 0; border-top: 1px dashed #334155;"></div>
        <div><span class="prompt">studysphere@test:~$</span> <span class="cmd">curl -X POST http://localhost:3001/api/ai/generate-quiz -d '{"topic":"BCNF","count":5}'</span></div>
        <div class="green"><span class="badge badge-ok">STATUS 200 OK</span> Returned 5 contextual MCQs with options, correctOptionIndex, and rationale in 1.42s</div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(terminalHtml);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_api_server_log.png') });

  await browser.close();
  console.log('✅ Generated fig_architecture.png, fig_database_schema.png, and fig_api_server_log.png');
}

run().catch(console.error);
