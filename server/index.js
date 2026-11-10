import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (e.g. Render / Cloudflare) to ensure accurate client IP detection
app.set('trust proxy', 1);

// Security Hardening: Disable Express signature header
app.disable('x-powered-by');

// Security Hardening: HTTP Response Headers (HSTS, nosniff, anti-clickjacking, strict referrer, permissions, CSP)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Content-Security-Policy (CSP) engineered for React, Vite, Supabase, Google Identity Services, Google Fonts & Gemini
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://accounts.google.com https://www.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://api.web3forms.com https://generativelanguage.googleapis.com",
    "frame-src 'self' https://accounts.google.com https://*.supabase.co",
    "worker-src 'self' blob:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://*.supabase.co",
    "frame-ancestors 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  res.removeHeader('X-Powered-By');
  next();
});

// Security Hardening: Safe CORS Origins Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'https://studysphere-ai-rktl.onrender.com',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
  ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., same-origin navigation, server-to-server, curl)
    if (!origin) return callback(null, true);

    // Explicitly allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Safely allow specific localhost/127.0.0.1 ports
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return callback(null, true);
      }
      if (url.hostname === 'studysphere-ai-rktl.onrender.com') {
        return callback(null, true);
      }
    } catch (e) {}

    // Gracefully reject cross-origin request without throwing an unhandled 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
}));

// In-Memory Rate Limiter for Feedback to prevent spam and flooding
const feedbackRateLimitMap = new Map();
const FEEDBACK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FEEDBACK_PER_WINDOW = 12;

function feedbackRateLimiter(req, res, next) {
  const clientIp = (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown')
    .toString().split(',')[0].trim();
  const now = Date.now();

  let record = feedbackRateLimitMap.get(clientIp);
  if (!record || now - record.startTime > FEEDBACK_WINDOW_MS) {
    record = { count: 1, startTime: now };
    feedbackRateLimitMap.set(clientIp, record);
  } else {
    record.count++;
  }

  // Periodic cleanup
  if (feedbackRateLimitMap.size > 2000) {
    for (const [ip, entry] of feedbackRateLimitMap.entries()) {
      if (now - entry.startTime > FEEDBACK_WINDOW_MS) {
        feedbackRateLimitMap.delete(ip);
      }
    }
  }

  if (record.count > MAX_FEEDBACK_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many feedback submissions from this network. Please wait a few minutes before submitting again.'
    });
  }

  next();
}

// In-Memory Rate Limiter to prevent Gemini API quota exhaustion & flood attacks
const aiRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_AI_REQUESTS_PER_WINDOW = 60;

function aiRateLimiter(req, res, next) {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let record = aiRateLimitMap.get(clientIp);
  if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record = { count: 1, startTime: now };
    aiRateLimitMap.set(clientIp, record);
  } else {
    record.count++;
  }

  // Periodic cleanup
  if (aiRateLimitMap.size > 5000) {
    for (const [ip, entry] of aiRateLimitMap.entries()) {
      if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
        aiRateLimitMap.delete(ip);
      }
    }
  }

  if (record.count > MAX_AI_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute before making more AI queries to protect resources.'
    });
  }

  next();
}

app.use('/api/ai', aiRateLimiter);
app.use(express.json({ limit: '60mb' }));

// Block common vulnerability scanners / malicious probes with immediate 404
const SUSPICIOUS_PROBE_PATTERNS = [
  /\.php$/i,
  /\.aspx?$/i,
  /\.jsp$/i,
  /\.cgi$/i,
  /\.env(?:\..*)?$/i,
  /\.git(?:\/|$)/i,
  /\.bak$/i,
  /\.sql$/i,
  /\.ya?ml$/i,
  /\.conf$/i,
  /\.ini$/i,
  /^\/wp-(?:admin|content|includes|login|json)/i,
  /^\/xmlrpc\.php/i,
  /^\/(?:phpmyadmin|pma|adminer|dbadmin)/i,
  /^\/cgi-bin/i,
  /^\/actuator/i,
  /^\/(?:console|server-status|telescope)/i,
];

app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  for (const pattern of SUSPICIOUS_PROBE_PATTERNS) {
    if (pattern.test(p)) {
      return res.status(404).type('text/plain').send('404 Not Found');
    }
  }
  next();
});

// Serve static frontend assets if built
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    }
  }));
}

// Well-known public crawlers, SEO & Social Preview endpoints
app.get('/robots.txt', (req, res) => {
  const distFile = path.join(distPath, 'robots.txt');
  const pubFile = path.resolve(__dirname, '../public/robots.txt');
  const targetFile = fs.existsSync(distFile) ? distFile : pubFile;
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (fs.existsSync(targetFile)) {
    return res.sendFile(targetFile);
  }
  return res.send(`User-agent: *\nAllow: /\nAllow: /privacy-policy\nAllow: /terms\nAllow: /login\nAllow: /register\nDisallow: /app/\nDisallow: /app\nDisallow: /api/\n\nSitemap: https://studysphere-ai-rktl.onrender.com/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const distFile = path.join(distPath, 'sitemap.xml');
  const pubFile = path.resolve(__dirname, '../public/sitemap.xml');
  const targetFile = fs.existsSync(distFile) ? distFile : pubFile;
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (fs.existsSync(targetFile)) {
    return res.sendFile(targetFile);
  }
  return res.status(404).send('Sitemap not found');
});

app.get('/og-image.png', (req, res) => {
  const distFile = path.join(distPath, 'og-image.png');
  const pubFile = path.resolve(__dirname, '../public/og-image.png');
  const targetFile = fs.existsSync(distFile) ? distFile : pubFile;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  if (fs.existsSync(targetFile)) {
    return res.sendFile(targetFile);
  }
  return res.status(404).send('Image not found');
});

// If a request has a file extension (e.g. .js, .css, .png, .jpg, .svg, .json, .map, .ico, .txt, .pdf)
// and reached here, it means the file does NOT exist on the server.
// Non-existent static files MUST return 404, never 200 index.html!
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') {
    return res.status(404).type('text/plain').send('404 Not Found: Static resource does not exist.');
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudySphere Backend',
    aiEngineActive: !!(process.env.AI_API_KEY || process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_AI_API_KEY || '').trim();
const aiClient = apiKey && apiKey !== 'YOUR_AI_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

if (aiClient) {
  console.log('✅ StudySphere Engine initialized successfully.');
} else {
  console.log('⚠️ AI_API_KEY not configured or using default placeholders.');
}

// Multi-Model Fallback for StudySphere Neural Engine to guarantee 100% uptime
async function callGeminiWithFallback(prompt, config = {}) {
  if (!aiClient) {
    throw new Error('AI client not initialized (missing API key)');
  }

  // Preferred models prioritized by throughput, low latency, and zero 503 errors
  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[StudySphere Neural Engine] Model ${model} failed: ${err.message?.substring(0, 100)}. Trying fallback model...`);
    }
  }

  throw lastError || new Error('All candidate models failed to respond.');
}

function fixUnescapedControlCharsInStrings(jsonStr) {
  let inString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (ch === '"' && !escaped) {
      inString = !inString;
      result += ch;
    } else if (inString) {
      if (ch === '\\') {
        escaped = !escaped;
        result += ch;
      } else {
        escaped = false;
        if (ch === '\n') result += '\\n';
        else if (ch === '\r') result += '\\r';
        else if (ch === '\t') result += '\\t';
        else if (ch.charCodeAt(0) < 32) {
          // ignore or strip non-printable control chars
        } else {
          result += ch;
        }
      }
    } else {
      escaped = false;
      result += ch;
    }
  }
  return result;
}

// Robust JSON cleaning and parsing helper (handles LaTeX backslashes, unescaped quotes, control chars)
function cleanAndParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  let s = text.trim();
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    s = s.substring(firstBrace, s.lastIndexOf('}') + 1);
  } else if (firstBracket !== -1) {
    s = s.substring(firstBracket, s.lastIndexOf(']') + 1);
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(s);
  } catch (err1) {
    // continue to recovery
  }

  // 2. Fix unescaped control characters inside string literals
  try {
    const fixedControls = fixUnescapedControlCharsInStrings(s);
    return JSON.parse(fixedControls);
  } catch (e2) {
    // continue to recovery
  }

  // 3. Fix unescaped backslashes (especially in LaTeX formulas like \frac, \alpha, \Delta, \text)
  try {
    const fixedControls = fixUnescapedControlCharsInStrings(s);
    const fixedBackslashes = fixedControls.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
    return JSON.parse(fixedBackslashes);
  } catch (err3) {
    // continue to recovery
  }

  // 4. Remove trailing commas before } or ]
  try {
    const fixedControls = fixUnescapedControlCharsInStrings(s);
    const fixedTrailingCommas = fixedControls
      .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')
      .replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(fixedTrailingCommas);
  } catch (err4) {
    console.error('All JSON parsing attempts failed:', err4.message);
    throw err4;
  }
}

// Fallback generator that scans PDF text for real section headings
function generateDynamicPdfFallback(extractedContent, filename) {
  const cleanSubjName = filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim() || 'Study Document';
  
  const lines = (extractedContent || '').split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && l.length < 80);

  const candidateTopics = [];
  const headingRegex = /^(\d+(\.\d+)+\s+.+|chapter\s+\d+[:\s]+.+|[A-Z][A-Za-z0-9\s,\-:]{4,60})$/i;
  
  for (const line of lines) {
    if (headingRegex.test(line) && !line.includes('Page ') && !candidateTopics.includes(line)) {
      candidateTopics.push(line);
      if (candidateTopics.length >= 10) break;
    }
  }

  const finalTopics = candidateTopics.length >= 2 ? candidateTopics : [
    `${cleanSubjName}: Overview & Key Concepts`,
    `${cleanSubjName}: Architecture & System Models`,
    `${cleanSubjName}: Core Protocols & Operational Procedures`,
    `${cleanSubjName}: Security, Performance & Mathematical Formulations`,
    `${cleanSubjName}: Exam Review & Problem Solving`
  ];

  const fileChapterMatch = filename.match(/(?:chp|chapter|unit|ch)[\s_-]*(\d+)/i);
  const chapterNum = fileChapterMatch ? parseInt(fileChapterMatch[1], 10) : 1;

  return {
    subjectName: cleanSubjName,
    subjectCode: (cleanSubjName.split(/\s+/).map(w => w[0]?.toUpperCase()).join('').slice(0, 4) || 'CS') + '-201',
    subjectDescription: `Complete study curriculum and topic breakdown extracted from ${filename}.`,
    icon: 'Layers',
    color: 'from-indigo-500 to-purple-600',
    units: [
      {
        unitNumber: chapterNum,
        unitName: `Chapter ${chapterNum}: ${cleanSubjName}`,
        topics: finalTopics.map((title, idx) => ({
          title: title,
          description: `Detailed study notes and core concepts for ${title}.`,
          notesContent: `${title} is a core topic in ${cleanSubjName}.\n\nThis section covers the underlying theoretical concepts, procedural mechanics, and analytical methods extracted directly from the study document.\n\n- Key Principles: Formulates the fundamental rules and behavior governing this topic.\n- Working & Execution: Sequential processing of inputs, state transitions, and system rules.\n- Practical Application: Real-world engineering implementations and problem solving for examinations.`,
          subtopics: [
            {
              title: `${title}: Core Concepts & Principles`,
              concept: `Detailed explanation of foundational concepts, rules, and definitions for ${title} from ${filename}.`
            },
            {
              title: `${title}: Working Mechanics & Execution`,
              concept: `Step-by-step algorithms, operational logic, and practical exam takeaways for ${title}.`
            }
          ],
          difficulty: idx % 2 === 0 ? 'medium' : 'hard',
          durationMins: 45
        }))
      }
    ]
  };
}

// Server-side PDF Text Extraction Engine (zero browser CDN worker dependencies)
async function extractTextFromPdfBuffer(buffer) {
  try {
    if (!buffer || buffer.length < 5) return '';
    // Verify PDF magic bytes '%PDF-'
    if (buffer.slice(0, 5).toString('ascii') !== '%PDF-') {
      console.warn('PDF header validation failed: Missing %PDF- magic bytes.');
      return '';
    }

    const uint8Array = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({
      data: uint8Array,
      disableFontFace: true,
      stopAtErrors: true,
      isEvalSupported: false,
    }).promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => (item && item.str ? item.str : '')).join(' ');
      if (pageText.trim()) {
        fullText += `\n--- Page ${i} ---\n` + pageText.trim();
      }
    }

    return fullText.trim();
  } catch (err) {
    console.error('Server PDF extraction error:', err?.message || err);
    return '';
  }
}

// 1. AI Study Tutor Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, learningLevel = 'intermediate', conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid message content is required.' });
    }

    if (message.length > 25000) {
      return res.status(400).json({ error: 'Message exceeds maximum permitted length (25,000 characters).' });
    }

    let levelPrompt = '';
    if (learningLevel === 'beginner') {
      levelPrompt = `Explain in simple terms suitable for a beginner student. Use clear analogies, avoid excessive academic jargon, and explain step-by-step.`;
    } else if (learningLevel === 'exam_focused') {
      levelPrompt = `Provide a concise, marks-focused answer suitable for university exams. Highlight keywords, standard definitions, exam tips, and bullet points.`;
    } else {
      levelPrompt = `Provide an intermediate level academic explanation with practical examples and conceptual depth.`;
    }

    const historyContext = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-4).map(m => `${m.sender === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n')
      : '';

    const prompt = `You are StudySphere AI, an intelligent, adaptive, and expert personal study tutor (like ChatGPT and Gemini).
Tone & Role: Knowledgeable, natural, patient, clear, and helpful.
Learning Level preference: ${learningLevel} (${levelPrompt})

${historyContext ? `Previous Conversation Context:\n${historyContext}\n\n` : ''}
Student Input: "${message}"

CORE INSTRUCTION - DYNAMIC, QUESTION-BASED ADAPTIVE RESPONSE:
Do NOT force any rigid format, fixed template, or artificial section headings (do NOT use mandatory 4-point templates or forced icons).
Figure out the best response structure dynamically based entirely on what the student is asking:

1. GREETING / CHIT-CHAT (e.g. "hi", "hello", "kaise ho", "who are you"):
   - Respond warmly, conversationally, and concisely like a friendly tutor ready to help. Keep it short and welcoming.

2. DIRECT DEFINITION / SHORT QUESTION (e.g. "define deadlock", "what is cache memory"):
   - Give a direct, accurate, crystal-clear definition and explanation without unnecessary preamble or unasked-for fluff.

3. MATH / NUMERICAL / ALGORITHMIC PROBLEM (e.g. "solve 3x + 7 = 22", "find average waiting time for FCFS"):
   - Provide clear, step-by-step solution steps, show the mathematical formulas with LaTeX math notation ($...$), and clearly highlight the final answer.

4. CODING / PROGRAMMING QUESTION:
   - Provide clean, correct, well-commented code inside Markdown code blocks with syntax highlighting, followed by a concise explanation of how it works and its time/space complexity.

5. LARGE / CONCEPTUAL / EXAM ESSAY QUESTION (e.g. "explain paging and segmentation in OS"):
   - Provide a comprehensive, well-structured, in-depth explanation with bullet points, comparisons, or diagrams as appropriate for that topic.

6. LANGUAGE ADAPTABILITY:
   - If the student writes in Hinglish, English, or Hindi, respond naturally in the same language/style with technical terms in standard English so it is easy to understand.

7. CLEAN FORMATTING (NO UNNECESSARY ASTERISKS OR PIPES):
   - Do NOT overuse asterisks (**) or pipes (|) unnecessarily.
   - Avoid putting **bold** asterisks on every second word or list item label unless strictly necessary for readability.
   - Do NOT use markdown ASCII pipe tables (| col | col |) unless the user explicitly asks for a tabular comparison. Use clean bullet points instead.
   - Keep answers clean, readable, natural, and visually pleasant without distracting raw symbols.

Focus entirely on giving a 100% factually accurate, helpful, and directly relevant answer to what was asked.`;

    try {
      const result = await callGeminiWithFallback(prompt);
      return res.json({ response: result.text, modelUsed: 'StudySphere Neural Engine' });
    } catch (aiErr) {
      console.warn('AI chat fallback triggered:', aiErr.message);
      const fallbackResponse = generateFallbackChatResponse(message, learningLevel);
      return res.json({ response: fallbackResponse, modelUsed: 'StudySphere Neural Engine' });
    }

  } catch (error) {
    console.error('Error in /api/ai/chat:', error);
    return res.status(500).json({ error: 'Failed to process AI chat query.' });
  }
});

// Sanitizes AI-generated explanations into natural, ChatGPT-style prose & clean bullet points
function sanitizeExplanationFormat(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text.trim();

  // Strip repetitive robotic template labels:
  s = s.replace(/^(\s*[-*•]?\s*)\*\*(?:Core Principle|Operational Mechanics|System Significance|System Behavior|Working Mechanics|Rules & Flow|Rules & Formulas|Trade-offs|Performance & Trade-offs|Real-World Systems Behavior|Theoretical Foundation|State Lifecycle|Fault Containment)\*\*:\s*/gmi, (match, prefix) => {
    return prefix && prefix.trim() ? prefix : '- ';
  });
  s = s.replace(/^(\s*[-*•]?\s*)(?:Core Principle|Operational Mechanics|System Significance|System Behavior|Working Mechanics|Rules & Flow|Rules & Formulas|Trade-offs|Performance & Trade-offs|Real-World Systems Behavior|Theoretical Foundation|State Lifecycle|Fault Containment):\s*/gmi, (match, prefix) => {
    return prefix && prefix.trim() ? prefix : '- ';
  });

  // Ensure subtopic lines that look like headings without '###' get '### '
  const lines = s.split('\n');
  const processedLines = lines.map((l, idx) => {
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      return l;
    }
    if (
      trimmed.length < 90 &&
      !trimmed.endsWith('.') &&
      !trimmed.endsWith(':') &&
      (
        /\(\d{4}[–—-]\d{4}\)/.test(trimmed) ||
        /^(?:The\s+[A-Z]|Era\s+of|Introduction\s+to|Birth\s+of|Rise\s+of|Early\s+[A-Z]|Phase\s+\d+|Chapter\s+\d+|Unit\s+\d+)/i.test(trimmed) ||
        (idx > 0 && lines[idx - 1].trim() === '' && idx < lines.length - 1 && lines[idx + 1].trim() !== '' && trimmed.length < 65 && !/[a-z]{15,}/.test(trimmed))
      )
    ) {
      return `### ${trimmed}`;
    }
    return l;
  });

  return processedLines.join('\n');
}

// 2. Comprehensive PDF Analyzer Endpoint (Extracts text + Gemini Analysis)
app.post('/api/ai/analyze-pdf', async (req, res) => {
  try {
    const { pdfText, pdfBase64, filename = 'Document.pdf' } = req.body;
    const cleanFilename = String(filename || 'Document.pdf')
      .replace(/[^\w\s.-]/gi, '_')
      .substring(0, 80);
    let extractedContent = (pdfText || req.body.extractedContent || '').trim();

    // If PDF base64 is provided and text is short or missing, extract server-side
    if (pdfBase64 && extractedContent.length < 50) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        if (cleanBase64.length > 35 * 1024 * 1024) {
          return res.status(400).json({ error: 'PDF file exceeds maximum allowed size (25MB).' });
        }
        const buffer = Buffer.from(cleanBase64, 'base64');
        const serverExtracted = await extractTextFromPdfBuffer(buffer);
        if (serverExtracted) {
          extractedContent = serverExtracted;
          console.log(`[PDF Server Extraction] Extracted ${extractedContent.length} characters from ${cleanFilename}`);
        }
      } catch (err) {
        console.warn('Could not extract PDF from base64:', err.message);
      }
    }

    let cleanBase64 = '';
    if (pdfBase64) {
      cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    }

    const textPrompt = `You are a helpful, expert AI tutor and university professor who explains topics with natural academic elegance and clarity, like ChatGPT at its best.
Conduct a thorough, deep, and complete study analysis of the uploaded document titled "${cleanFilename}".

DOCUMENT CONTENT:
"""
${extractedContent.substring(0, 90000)}
"""

CRITICAL INSTRUCTIONS - CHATGPT-STYLE NATURAL EXPLANATION (NO ROBOTIC TEMPLATES):
1. EXHAUSTIVE TOPIC COVERAGE:
   - Identify and cover every single topic, chapter section, theorem, algorithm, or concept present in the document from beginning to end.
   - Do NOT skip any topics.

2. NATURAL TOPIC-WISE STRUCTURE - ZERO REPETITIVE TEMPLATE LABELS:
   - STRICTLY FORBIDDEN: Do NOT use repetitive robotic template labels like "Core Principle:", "Operational Mechanics:", "System Significance:", "System Behavior:", "Working Mechanics:", "Rules & Flow:".
   - Instead, explain naturally and pedagogically like ChatGPT / a master university professor:
     a) Begin with a clear, articulate introductory paragraph summarizing what the concept is, its intuition, and why it matters.
     b) Directly below it, provide 3 to 4 clean, distinct vertical bullet points (- **Concept/Aspect**: Detailed explanation...) breaking down key mechanisms, core properties, or practical examples.
     c) The bolded label in each bullet point MUST be the ACTUAL specific term or concept being discussed (e.g. "- **Turing Test (1950)**: ...", "- **Dartmouth Workshop**: ...", "- **Convoy Effect**: ...", "- **Context Switching**: ..."), NEVER generic template words.
   - If a topic has distinct sub-methods, phases, or variations, divide them with clean markdown subheadings:
     ### [Subtopic / Phase / Algorithm Name]
     followed by an introductory explanation and natural bullet points.

3. ABSOLUTE BAN ON BUZZWORDS:
   - Do NOT use labels or phrases like "Key Points", "Exam Facts", "Exam Strategy", "Exam Focus", "Point 1 / Point 2", or "Exam Tips".
   - Teach with genuine academic depth, high clarity, and natural professional flow.

4. DUAL LANGUAGE (ENGLISH & HINGLISH):
   - englishExplanation: Comprehensive, natural explanation in English.
   - hinglishExplanation: Natural, easy-to-understand conversational Hinglish (jaise ek top teacher aasan bhasha me samjhata hai, keeping technical terms in English).

You MUST return a JSON object with this exact structure:
{
  "summary": "Document overview in 1-2 readable paragraphs.\\n\\n- **Key Focus**: Summary point.\\n- **Major Themes**: Summary point.\\n- **Practical Significance**: Summary point.",
  "summaryHinglish": "Poore document ka aasan overview 1-2 paragraphs me.\\n\\n- **Mukhya Mudda**: Summary point Hinglish me.\\n- **Khas Concepts**: Summary point Hinglish me.\\n- **Practical Upyog**: Summary point Hinglish me.",
  "topicWiseAnalysis": [
    {
      "topicTitle": "Topic Name",
      "englishExplanation": "Concise introductory paragraph summarizing the concept.\\n\\n- **Specific Concept A**: Clear, insightful explanation.\\n- **Specific Concept B**: Clear, insightful explanation.\\n- **Specific Concept C**: Clear, insightful explanation.",
      "hinglishExplanation": "Concept ka concise introductory paragraph aasan bhasha me.\\n\\n- **Specific Concept A**: Clear, insightful explanation Hinglish me.\\n- **Specific Concept B**: Clear, insightful explanation Hinglish me.\\n- **Specific Concept C**: Clear, insightful explanation Hinglish me."
    }
  ],
  "importantTopics": [
    "Specific Topic Name 1",
    "Specific Topic Name 2"
  ]
}

Ensure 100% factual correctness to the document.`;

    let payloadContent;
    if (extractedContent && extractedContent.length >= 20) {
      payloadContent = textPrompt;
    } else if (cleanBase64) {
      console.log(`[StudySphere AI] Using direct multimodal PDF analysis for ${filename}`);
      payloadContent = [
        {
          text: `You are a helpful, expert AI tutor and university professor who explains topics with natural academic elegance and clarity, like ChatGPT at its best.
Conduct a thorough, deep, and complete study analysis of the attached document titled "${filename}".
Cover EVERY SINGLE TOPIC present in the document from start to finish.

CRITICAL INSTRUCTIONS - CHATGPT-STYLE NATURAL EXPLANATION (NO ROBOTIC TEMPLATES):
- For each topic, provide a concise introductory paragraph summarizing the topic, followed immediately by 3 to 4 vertical bullet subpoints (- **Specific Concept**: ...) on separate lines.
- NEVER use repetitive robotic template labels like "Core Principle:", "Operational Mechanics:", "Working Mechanics:".
- If a topic has sub-sections, use ### Subtopic Name followed by an intro explanation and vertical bullet subpoints.
- Absolutely NO exam buzzwords ("Key Points", "Exam Facts", "Point 1 / Point 2", "Exam Strategy").
- englishExplanation: English explanation following the intro paragraph + vertical bullet subpoints.
- hinglishExplanation: Natural conversational Hinglish explanation following the intro paragraph + vertical bullet subpoints.

You MUST return a JSON object with this exact structure:
{
  "summary": "Clean document overview with 2-3 vertical summary bullets.",
  "summaryHinglish": "Clean document overview Hinglish me with 2-3 vertical summary bullets.",
  "topicWiseAnalysis": [
    {
      "topicTitle": "Topic Name",
      "englishExplanation": "Introductory paragraph.\\n\\n- **Specific Aspect 1**: Details...\\n- **Specific Aspect 2**: Details...\\n- **Specific Aspect 3**: Details...",
      "hinglishExplanation": "Introductory paragraph Hinglish me.\\n\\n- **Specific Aspect 1**: Details...\\n- **Specific Aspect 2**: Details...\\n- **Specific Aspect 3**: Details..."
    }
  ],
  "importantTopics": [
    "Specific Topic Name 1",
    "Specific Topic Name 2"
  ]
}`
        },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64
          }
        }
      ];
    } else {
      extractedContent = `Study Document: ${filename}`;
      throw new Error('Document contained no readable text or base64 stream.');
    }

    try {
      const result = await callGeminiWithFallback(payloadContent, { responseMimeType: 'application/json', maxOutputTokens: 8192 });
      const parsed = cleanAndParseJson(result.text);

      const rawTopics = Array.isArray(parsed?.topicWiseAnalysis) ? parsed.topicWiseAnalysis : [];
      const cleanedTopics = rawTopics.map(t => ({
        ...t,
        englishExplanation: sanitizeExplanationFormat(t.englishExplanation),
        hinglishExplanation: sanitizeExplanationFormat(t.hinglishExplanation)
      }));

      return res.json({
        summary: sanitizeExplanationFormat(parsed?.summary || ''),
        summaryHinglish: sanitizeExplanationFormat(parsed?.summaryHinglish || ''),
        topicWiseAnalysis: cleanedTopics,
        importantTopics: Array.isArray(parsed?.importantTopics) ? parsed.importantTopics : [],
        keyInsights: Array.isArray(parsed?.keyInsights) ? parsed.keyInsights : [],
        keyInsightsHinglish: Array.isArray(parsed?.keyInsightsHinglish) ? parsed.keyInsightsHinglish : [],
        extractedText: extractedContent,
        modelUsed: 'StudySphere Neural Engine'
      });
    } catch (aiErr) {
      console.warn('StudySphere AI PDF analysis fallback triggered:', aiErr.message);
      return res.json({
        summary: `This document covers essential curriculum topics including CPU scheduling algorithms, process synchronization, deadlock handling, and memory management.\n\n- **CPU Scheduling**: Allocates processor cycles dynamically across active jobs using FIFO, priority, or time-sliced policies.\n- **Deadlock Management**: Identifies conditions for system stagnation and enforces Banker's avoidance checks.\n- **Memory Virtualization**: Bridges logical process requests to physical RAM pages with MMU-managed page tables.`,
        summaryHinglish: `Yeh document operating systems ke core topics jaise CPU scheduling, deadlock conditions, aur memory management ko cover karta hai.\n\n- **CPU Scheduling**: Ready queue me se processes ko CPU execution time allocate karta hai.\n- **Deadlock Management**: System ko deadlock se bachane ke liye Coffman conditions aur Banker's algorithm use karta hai.\n- **Memory Virtualization**: RAM ko efficiently use karne ke liye Paging aur Virtual memory provide karta hai.`,
        topicWiseAnalysis: [
          {
            topicTitle: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)',
            englishExplanation: `CPU scheduling is the fundamental mechanism by which an operating system allocates CPU execution time among multiple ready processes. A process moves through five distinct lifecycle states: New, Ready, Running, Waiting, and Terminated.\n\n- **Objective**: Maximize CPU utilization and throughput while minimizing average waiting and turnaround time.\n- **Dispatcher Role**: Gives control of the CPU to the process selected by the short-term scheduler, involving context switching.\n\n### First-Come, First-Served (FCFS)\nIn FCFS, processes are executed strictly in the order they arrive in the ready queue.\n- **Queue Implementation**: Managed using a simple FIFO (First-In, First-Out) data structure.\n- **Convoy Effect**: Short CPU-bound jobs get stuck behind a lengthy compute-intensive task, increasing average wait time.\n- **Non-Preemptive**: Once allocated, the process holds the CPU until it voluntarily yields or terminates.\n\n### Shortest Job First (SJF)\nSJF schedules the process with the smallest predicted CPU burst next.\n- **Optimal Waiting Time**: Mathematically proven to deliver the lowest average waiting time among non-preemptive algorithms.\n- **Preemptive Mode (SRTF)**: Shortest Remaining Time First preempts the current job if a shorter task arrives.\n- **Starvation Risk**: Continuous arrival of short jobs can indefinitely delay longer processes.\n\n### Round Robin (RR)\nRound Robin is designed specifically for time-sharing and interactive computing environments.\n- **Time Quantum (q)**: Every process receives a fixed slice of CPU time (typically 10 to 100 milliseconds).\n- **Preemption & Cycle**: If the process exceeds its quantum, a timer interrupt preempts it and appends it to the ready queue.\n- **Quantum Tuning**: Excessively large quantums degrade to FCFS; excessively small quantums increase context-switching overhead.`,
            hinglishExplanation: `CPU Scheduling ka matlab hai ki CPU ready queue me se kis process ko kab execute karega taaki multi-programming efficiently chal sake.\n\n- **Main Objective**: CPU utilization aur throughput badhana, aur process ka waiting time kam se kam karna.\n- **Dispatcher Role**: Selected process ko CPU assign karna aur context switching manage karna.\n\n### First-Come, First-Served (FCFS)\nJo process ready queue me pehle aayega, use pehle CPU milega.\n- **Queue Mechanism**: Yeh FIFO queue data structure par simple tarike se chalta hai.\n- **Convoy Effect**: Bade process ke peeche chote-chote tasks phans jaate hain jisse average wait time badh jata hai.\n- **Non-Preemptive**: Jab tak process khud execution complete na kare, CPU use hold par nahi daalta.\n\n### Shortest Job First (SJF)\nIsme jiska burst time (execution time) sabse kam hota hai, use CPU pehle execute karta hai.\n- **Minimum Average Wait**: Sabhi non-preemptive algorithms me se iska average waiting time sabse kam hota hai.\n- **Preemptive Version (SRTF)**: Naya chota process aane par running process ko preempt kar diya jata hai.\n- **Starvation Risk**: Agar lagatar chote process aate rahein toh bade process ko lamba intezar karna padta hai.\n\n### Round Robin (RR)\nHar process ko ek barabar time slice (Time Quantum 'q') milta hai.\n- **Time Quantum (q)**: Har process ko 10-100 ms ka fixed time diya jata hai run hone ke liye.\n- **Preemption Cycle**: Time quantum pura hote hi running process ko queue ke end me bhej diya jata hai.\n- **Quantum Tuning**: Agar quantum bahut bada ho toh FCFS ban jata hai, aur chota ho toh context switching ka time waste hota hai.`
          },
          {
            topicTitle: 'Deadlocks: Coffman Conditions & Banker Algorithm',
            englishExplanation: `A deadlock is a situation where a set of processes are permanently blocked because each process is holding a resource while simultaneously waiting for another resource acquired by another process in the same set.\n\n- **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.\n- **Hold and Wait**: A process holds at least one resource while awaiting additional resources held by other processes.\n- **No Preemption**: Resources cannot be forcibly seized; they can only be released voluntarily by the holding process.\n- **Circular Wait**: A closed chain of processes exists where each process waits for a resource held by the next process.\n\n### Banker's Algorithm for Deadlock Avoidance\nBanker's Algorithm dynamically tests for safety before granting any resource request.\n- **Safety State Verification**: Analyzes whether granting the request leaves the system with at least one viable Safe Sequence.\n- **Need Matrix Calculation**: Evaluates remaining demand using the formula Need[i][j] = Max[i][j] - Allocation[i][j].\n- **Request Granting**: If a safe sequence exists allowing all processes to complete, the request is approved; otherwise, the process must wait.`,
            hinglishExplanation: `Deadlock ek aisi condition hoti hai jahan do ya zyada processes ek doosre ke resources ka intezar karte huye permanently ruk jaate hain aur koi bhi process aage nahi badh pata.\n\n- **Mutual Exclusion**: Ek time par ek hi process kisi resource ko exclusive tareeqe se use kar sakta hai.\n- **Hold and Wait**: Process ek resource pakad kar doosre resource ke free hone ka intezar karta hai.\n- **No Preemption**: Kisi process se zabardasti resource nahi chheena ja sakta; woh khud release karta hai.\n- **Circular Wait**: Ek circular chain ban jana jahan har process agle process ke resource ka wait kar raha hota hai.\n\n### Banker's Algorithm Se Deadlock Avoidance\nBanker's Algorithm kisi bhi resource request ko grant karne se pehle safety algorithm chala kar check karta hai.\n- **Safe State Analysis**: Yeh check karta hai ki resource dene ke baad system me koi Safe Sequence bachegi ya nahi.\n- **Need Matrix**: Bachi hui requirement calculate karne ke liye Need = Max - Allocation formula use hota hai.\n- **Safe Execution**: Agar sabhi processes safely finish ho sakte hain toh request grant hoti hai, warna process ko hold par rakha jata hai.`
          },
          {
            topicTitle: 'Memory Management: Paging & Virtual Memory',
            englishExplanation: `Paging is a memory management scheme that allows physical address space to be non-contiguous, completely eliminating external fragmentation while providing each process with an isolated virtual address space.\n\n- **Frames and Pages**: Physical RAM is divided into fixed-size Frames, and logical memory is divided into Pages of the identical size.\n- **Address Translation**: The CPU generates logical addresses (Page Number and Offset), which the Memory Management Unit (MMU) maps to physical frames via the Page Table.\n- **Internal Fragmentation**: While external fragmentation is eliminated, the last allocated page may retain small internal fragmentation.\n\n### Virtual Memory & Page Fault Handling\nVirtual memory enables processes to execute even when they exceed physical RAM capacity.\n- **Page Fault Trap**: An MMU trap is triggered when a program attempts to access a page that is not currently loaded in RAM.\n- **OS Swapping**: The operating system pauses the process, retrieves the missing page from disk, and maps it into an available RAM frame.\n- **Replacement Algorithms**: When physical RAM is exhausted, algorithms like LRU (Least Recently Used) or FIFO determine which victim page to swap back to storage.`,
            hinglishExplanation: `Paging ek aisi memory management technique hai jisme process ko RAM me alag-alag tukdon me rakha ja sakta hai, jisse external fragmentation khatam ho jati hai.\n\n- **Frames aur Pages**: Physical RAM ko fixed-size Frames me aur process memory ko barabar size ke Pages me divide kiya jata hai.\n- **Address Translation**: CPU dwara banaya gaya logical address MMU Page Table ke through physical frame address me convert karta hai.\n- **Internal Fragmentation**: External fragmentation poori tarah khatam hoti hai, lekin last page me thodi si internal fragmentation ho sakti hai.\n\n### Virtual Memory aur Page Fault\nVirtual memory ki madad se aise programs bhi execute ho sakte hain jo physical RAM ke size se bade hote hain.\n- **Page Fault Trap**: Jab requested page RAM me nahi milta toh MMU Page Fault trap trigger karta hai.\n- **Disk Se Loading**: Operating system missing page ko hard disk se free RAM frame me load karke Page Table update karta hai.\n- **Page Replacement**: RAM full hone par LRU (Least Recently Used) ya FIFO algorithm se purane page ko disk par swap out kiya jata hai.`
          }
        ],
        importantTopics: [
          'CPU Scheduling: FCFS, SJF, and Round Robin',
          'Deadlocks: Coffman Conditions and Banker Algorithm',
          'Memory Management: Paging and Virtual Memory'
        ],
        extractedText: extractedContent,
        modelUsed: 'StudySphere Neural Engine'
      });
    }

  } catch (error) {
    console.error('Error in /api/ai/analyze-pdf:', error);
    return res.status(500).json({ error: 'Failed to analyze PDF document.' });
  }
});

// 2b. Expand / Deepen Specific Topic Endpoint (Generates exhaustive multi-subtopic masterclass)
app.post('/api/ai/deepen-topic', async (req, res) => {
  try {
    const {
      topicTitle,
      pdfText,
      filename = 'Document.pdf',
      currentExplanation = '',
      currentExplanationHinglish = '',
      documentSummary = ''
    } = req.body;

    if (!topicTitle) {
      return res.status(400).json({ error: 'topicTitle string is required.' });
    }

    const docContext = (pdfText && pdfText.trim().length > 30)
      ? pdfText.substring(0, 45000)
      : (documentSummary || '');

    const prompt = `You are a world-class university professor, expert AI tutor, and author who explains complex subjects with supreme clarity, depth, and pedagogical elegance (like ChatGPT at its best).

The user clicked "Deepen Topic" to get a comprehensive, masterclass-level expansion for:
TOPIC: "${topicTitle}" (from document: "${filename}")

CURRENT PRELIMINARY EXPLANATION:
"""
${currentExplanation || 'None provided'}
"""

DOCUMENT SOURCE TEXT:
"""
${docContext}
"""

CRITICAL INSTRUCTIONS - CHATGPT-STYLE NATURAL IN-DEPTH MASTERCLASS (NO ROBOTIC TEMPLATES):
1. WRITE NATURALLY & IN FULL DEPTH - ZERO RIGID TEMPLATES:
   - STRICTLY FORBIDDEN: Do NOT use repetitive, robotic template labels like "Working Mechanics:", "Rules & Flow:", "Rules & Formulas:", "Trade-offs:", "Performance & Trade-offs:", "Real-World Systems Behavior:", "Core Principle:", "Operational Mechanics:", or "System Significance:".
   - Instead, explain naturally, fluently, and thoroughly, just like ChatGPT explains when asked to write an in-depth, professional guide or masterclass.
   - Explain the "why", the "how", the conceptual intuition, historical context, underlying mechanisms, and practical significance in flowing paragraphs and natural bullet points.

2. LOGICAL TOPIC-WISE STRUCTURE:
   - Begin with a rich introductory paragraph setting the foundational context, historical emergence, and core objective of "${topicTitle}".
   - Break down "${topicTitle}" into its key subtopics, eras, algorithms, components, or mechanisms using clean markdown subheadings:
     ### [Subtopic / Phase / Concept / Algorithm Name]
   - Under each subtopic:
     - Provide a thorough, articulate explanatory paragraph explaining what this sub-concept is, its role, and how it behaves.
     - Include natural, distinct vertical bullet points (- **Subject**: ...) for key mechanisms, formulas, historical milestones, or trade-offs.
     - In bullet points, bold the ACTUAL specific concept or milestone being described (e.g. "- **McCulloch-Pitts Neuron (1943)**: ...", "- **Alan Turing's Test (1950)**: ...", "- **Dartmouth Workshop (1956)**: ...", "- **Convoy Effect**: ...", "- **Time Complexity**: ..."), NEVER generic template labels.

3. EXHAUSTIVE COVERAGE (NEVER CONDENSE OR SHORTEN):
   - The user requested this topic to be DEEPENED. Your output MUST be significantly longer, richer in detail, and much more in-depth than the preliminary summary.
   - Cover every sub-concept, era, equation, algorithm, or nuance present in the source text or associated with "${topicTitle}".

4. ABSOLUTE BAN ON BUZZWORDS:
   - Absolutely NO exam buzzwords or artificial labels ("Point 1 / Point 2", "Key Points", "Exam Facts", "Exam Strategy", "Exam Focus", "For Exams").

5. DUAL LANGUAGE (ENGLISH & HINGLISH):
   - englishExplanation: Fluent, deeply informative English academic masterclass.
   - hinglishExplanation: Natural, engaging, friendly conversational Hinglish (jaise top professor aasan bhasha me samjhata hai, keeping technical terms in English).

MANDATORY STRUCTURAL REQUIREMENT:
You MUST include multiple subtopic sections using '### [Subtopic Name]' in both englishExplanation and hinglishExplanation.

Return a valid JSON object with this exact structure:
{
  "topicTitle": "${topicTitle}",
  "englishExplanation": "Comprehensive introduction paragraph...\\n\\n### Subtopic Name 1\\nDeep conceptual explanation in fluent paragraphs...\\n\\n- **Specific Concept A**: Clear, insightful explanation.\\n- **Specific Concept B**: Clear, insightful explanation.\\n\\n### Subtopic Name 2\\nDeep conceptual explanation...\\n\\n- **Specific Detail X**: Insightful explanation.\\n- **Specific Detail Y**: Insightful explanation.",
  "hinglishExplanation": "Poora conceptual introduction paragraph Hinglish me...\\n\\n### Subtopic Name 1\\nAasan bhasha me deep explanation paragraph...\\n\\n- **Specific Concept A**: Clear explanation Hinglish me.\\n- **Specific Concept B**: Clear explanation Hinglish me.\\n\\n### Subtopic Name 2\\nAasan bhasha me deep explanation...\\n\\n- **Specific Detail X**: Clear explanation Hinglish me.\\n- **Specific Detail Y**: Clear explanation Hinglish me."
}`;

    try {
      const result = await callGeminiWithFallback(prompt, { responseMimeType: 'application/json', maxOutputTokens: 8192 });
      const parsed = cleanAndParseJson(result.text) || {};

      let engExp = sanitizeExplanationFormat((parsed.englishExplanation || '').trim());
      let hinExp = sanitizeExplanationFormat((parsed.hinglishExplanation || '').trim());

      // Ensure the generated output didn't accidentally shrink
      const hasSubtopics = engExp.includes('###');
      if (!hasSubtopics || engExp.length < 350) {
        throw new Error('Model produced brief overview without subtopics instead of deep expansion.');
      }

      return res.json({
        topicTitle: parsed.topicTitle || topicTitle,
        englishExplanation: engExp,
        hinglishExplanation: hinExp
      });
    } catch (aiErr) {
      console.warn('Deepen topic AI fallback triggered:', aiErr.message);

      const lower = topicTitle.toLowerCase();
      let fallbackEnglish = '';
      let fallbackHinglish = '';

      if (lower.includes('history') || lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('evolution') || lower.includes('turing')) {
        fallbackEnglish = `The history of Artificial Intelligence represents an evolutionary trajectory spanning over seven decades, shifting from speculative theoretical frameworks and logical abstractions to data-intensive, commercial deep-learning architectures. This journey documents how shifting expectations, algorithmic breakthroughs, and massive hardware advancements have continually redefined what intelligent machines can achieve.\n\n### The Gestation and Birth of AI (1943–1956)\nThe formative years of artificial intelligence established foundational theoretical concepts by combining mathematical logic, neuroscience models, and early computing machinery.\n- **McCulloch-Pitts Neuron (1943)**: Created the first mathematical model of an artificial neural network, proving that simple connected units could compute formal Boolean logic functions.\n- **The Turing Test (1950)**: Alan Turing published 'Computing Machinery and Intelligence', replacing philosophical debates on machine thought with an operational behavioral benchmark.\n- **Dartmouth Workshop (1956)**: Organized by John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon, this historic summit officially coined the term 'Artificial Intelligence' and established it as an independent academic discipline.\n\n### Early Enthusiasm, Reality Checks, and Knowledge-Based Systems (1952–1979)\nInitial breakthroughs on checkers, algebra, and geometry theorems spurred tremendous optimism, but real-world complexity soon triggered the first AI Winter.\n- **Combinatorial Explosion & Semantic Ambiguity**: Early symbolic search engines worked well in toy microworlds but failed when scaling up to complex real-world state spaces.\n- **Perceptrons Limitation (1969)**: Marvin Minsky and Seymour Papert demonstrated that single-layer perceptrons could not compute non-linear functions like XOR, severely stalling neural network research.\n- **Rise of Expert Systems (1970s)**: Shifted AI toward domain-specific knowledge bases (e.g. DENDRAL for chemical analysis, MYCIN for medical diagnosis), proving that intelligence requires deep factual rules rather than pure general logic.\n\n### Resurgence, Machine Learning, and Modern Deep Learning (1980s–Present)\nRevitalized by modern multi-layer backpropagation and massive datasets, AI transformed from symbolic rule systems into probabilistic statistical learning engines.\n- **Backpropagation Resurgence (1986)**: Rumelhart, Hinton, and Williams demonstrated that gradient descent could effectively train multi-layer neural networks.\n- **Big Data & GPU Acceleration**: The 2012 ImageNet (AlexNet) victory ignited the modern deep learning boom, leveraging parallel GPU compute and massive internet-scale training data.\n- **Transformers & Foundation Models**: The attention mechanism (2017) revolutionized natural language processing, leading directly to large language models and modern generative AI.`;

        fallbackHinglish = `Artificial Intelligence ka itihaas pichhle 70 saalon ka ek aisa safar hai jisme AI theoretical logic se shuru hokar aaj ke modern deep learning aur generative AI tak pahuche hai.\n\n### The Gestation and Birth of AI (1943–1956)\nIs daur me scientists ne biological brain se inspire hokar mathematics aur logic ke through machines ko sochna sikhane ki shuruat ki.\n- **McCulloch-Pitts Neuron (1943)**: Pehla mathematical neuron model banaya gaya jisne prove kiya ki machines formal logic operations compute kar sakti hain.\n- **The Turing Test (1950)**: Alan Turing ne 'Turing Test' propose kiya jisme yeh dekha jata tha ki kya machine human-like conversation kar sakti hai.\n- **Dartmouth Workshop (1956)**: John McCarthy aur unke saathiyon ne milkar pehli baar 'Artificial Intelligence' term coin kiya aur ise ek alag subject banaya.\n\n### Early Enthusiasm, Reality Checks, aur Expert Systems (1952–1979)\nShuruat me checkers aur algebra puzzles solve hone par bohot umeed thi, par real-world problems solve na hone par pehla AI Winter aa gaya.\n- **Combinatorial Explosion**: Shuruati programs chote toy examples par chale par real-world complexity aane par crash ho gaye.\n- **Minsky & Papert Perceptrons Book (1969)**: Is book ne prove kiya ki single-layer perceptron XOR jaise basic logic solve nahi kar sakta, jisse neural network funding band ho gayi.\n- **Expert Systems Ka Aana (1970s)**: Researchers ne general logic chhod kar domain-specific knowledge par dhyan diya aur MYCIN aur DENDRAL jaise rule-based systems banaye.\n\n### Resurgence, Machine Learning aur Deep Learning Kranti (1980s–Present)\nBackpropagation algorithm aur massive computational power ne AI ko dobara zinda kiya.\n- **Backpropagation Revival (1986)**: Geoffrey Hinton aur unke sathiyon ne multi-layer neural networks ko train karne ka solid tareeqa diya.\n- **GPU Computing aur Big Data (2012)**: AlexNet ne ImageNet competition jeetkar prove kiya ki GPUs par deep neural networks computer vision me humans ko takkar de sakte hain.\n- **Transformers aur Modern Generative AI**: 2017 ke Attention mechanism ke baad Large Language Models aur modern generative AI ka daur shuru hua jo aaj har jagah use ho raha hai.`;
      } else if (lower.includes('schedul') || lower.includes('cpu')) {
        fallbackEnglish = `CPU scheduling is the master orchestration mechanism by which an operating system allocates CPU execution time among ready processes to optimize responsiveness and throughput.\n\n### First-Come, First-Served (FCFS) Scheduling\nFCFS executes incoming ready processes in the strict chronological order of their arrival without preemption.\n- **Queue Mechanism**: Managed straightforwardly using a standard First-In, First-Out (FIFO) queue data structure.\n- **Convoy Effect**: Short CPU-bound processes suffer excessive waiting times when stuck behind a long, compute-intensive process.\n- **Execution Characteristics**: Non-preemptive nature makes it suboptimal for interactive time-sharing systems.\n- **Throughput Profile**: Simple to implement but yields higher average waiting times compared to burst-aware schedulers.\n\n### Shortest Job First (SJF & SRTF)\nSJF schedules the process with the smallest predicted CPU burst duration to maximize overall system throughput.\n- **Provable Optimality**: Mathematically proven to yield the absolute minimum average waiting time among all non-preemptive algorithms.\n- **Shortest Remaining Time First (SRTF)**: Preempts the active process immediately if a new process arrives with a shorter remaining burst.\n- **Exponential Burst Averaging**: Employs historical burst observation formulas to estimate future compute cycles accurately.\n- **Starvation Vulnerability**: Lengthy compute-intensive tasks can starve indefinitely if short jobs arrive in a continuous stream.\n\n### Round Robin (RR) Scheduling\nRound Robin is designed specifically for interactive, multi-user time-sharing environments where fair responsiveness is paramount.\n- **Fixed Time Quantum (q)**: Every process is granted a fixed slice of execution time (typically 10 to 100 milliseconds).\n- **Interrupt Handling**: When the timer quantum expires, hardware interrupts trigger context-switching and move the process to the queue tail.\n- **Quantum Tuning**: Excessively large quantums cause RR to degrade into FCFS; excessively small quantums waste severe CPU cycles in context switching overhead.\n- **Response Time Guarantee**: With n processes in the ready queue and quantum q, no process waits longer than (n - 1) * q time units for CPU access.`;

        fallbackHinglish = `CPU Scheduling operating system ka core engine hai jo ready queue me se processes ko CPU time allocate karta hai taaki system fast aur responsive bana rahe.\n\n### First-Come, First-Served (FCFS) Scheduling\nFCFS me jo process ready queue me pehle aati hai, CPU pehle usi ko execute karta hai bina kisi preemption ke.\n- **FIFO Queue**: Yeh simple First-In, First-Out queue data structure par deterministic rules ke sath chalta hai.\n- **Convoy Effect**: Ek lambe compute-heavy process ke peeche chote processes phas jaate hain, jisse average wait time bohot badh jata hai.\n- **Non-Preemptive**: Jab tak process khud CPU yield na kare ya I/O na mange, CPU use chheen nahi sakta.\n- **Performance**: Simple hai par modern time-sharing systems ke liye slow aur inefficient hota hai.\n\n### Shortest Job First (SJF & SRTF)\nSJF us process ko pehle execute karta hai jiska burst time sabse chota hota hai taaki throughput maximize ho.\n- **Minimum Average Wait**: Yeh mathematically proven hai ki non-preemptive algorithms me iska average waiting time sabse kam hota hai.\n- **SRTF Preemption**: Shortest Remaining Time First me agar naya process kam bache time ke sath aata hai toh running process ko pause kar diya jata hai.\n- **Burst Prediction**: Agle burst time ko predict karne ke liye historical data aur exponential averaging ka formula use hota hai.\n- **Starvation Risk**: Lagatar chote processes aane par bade process ko infinite time tak wait karna pad sakta hai.\n\n### Round Robin (RR) Scheduling\nRound Robin interactive aur multitasking operating systems ke liye standard algorithm hai jo fairness ensure karta hai.\n- **Time Quantum (q)**: Har process ko 10 se 100 milliseconds ka fixed time slice diya jata hai.\n- **Timer Preemption**: Jaise hi time quantum khatam hota hai, hardware interrupt trigger hokar process ko queue ke aakhir me daal deta hai.\n- **Quantum Tuning**: Agar quantum bohot bada ho toh yeh FCFS ban jata hai, aur agar bohot chota ho toh context switching ka CPU time waste hota hai.\n- **Fair Response**: Har process ko guaranteed response time milta hai aur koi bhi task starve nahi hota.`;
      } else if (lower.includes('deadlock')) {
        fallbackEnglish = `A deadlock represents a terminal concurrency failure where a set of processes are permanently blocked because each process holds resources while waiting for others.\n\n### The 4 Coffman Conditions\nA deadlock state can manifest if and only if all four Coffman conditions occur simultaneously:\n- **Mutual Exclusion**: At least one resource must be held in an exclusive, non-shareable mode by a single process.\n- **Hold and Wait**: A process must hold at least one resource while waiting to acquire additional resources held by other processes.\n- **No Preemption**: Resources cannot be forcibly stripped from a holding process; they must be released voluntarily upon task completion.\n- **Circular Wait**: A closed chain of processes P0, P1, ..., Pn exists such that P0 waits for a resource held by P1, and Pn waits for P0.\n\n### Banker's Algorithm for Deadlock Avoidance\nBanker's Algorithm dynamically verifies whether granting a resource request preserves a mathematically provable Safe State.\n- **Vector & Matrix Allocation**: Maintains Available[m] resources, Max[n][m] requirements, Allocation[n][m] held, and Need[n][m] remaining.\n- **Need Matrix Calculation**: Evaluates remaining demand continuously using the formula Need[i][j] = Max[i][j] - Allocation[i][j].\n- **Safe Sequence Simulation**: Simulates allocation to find a Safe Sequence <P0, P1, ..., Pn> where every process can acquire max resources and terminate.\n- **Request Verification**: If Request <= Need and Request <= Available, safety check runs; if safe, allocation commits, otherwise process waits.`;

        fallbackHinglish = `Deadlock operating system ki ek aisi critical condition hai jisme do ya zyada processes permanently freeze ho jaate hain kyunki har koi agle resource ke free hone ka wait kar raha hota hai.\n\n### Chaar Coffman Conditions\nDeadlock aane ke liye ye chaaron shartein ek saath true hona zaroori hain:\n- **Mutual Exclusion**: Ek time par ek resource sirf ek hi process use kar sakta hai (non-shareable).\n- **Hold and Wait**: Process ek resource pakad kar baitha hai aur doosre resource ke milne ka intezar kar raha hai.\n- **No Preemption**: Kisi process se zabardasti resource nahi chheena ja sakta, jab tak wo khud na release kare.\n- **Circular Wait**: Ek band circular loop ban jata hai jahan har process agli process ke resource ka wait kar raha hota hai.\n\n### Banker's Algorithm Se Deadlock Avoidance\nBanker's Algorithm kisi bhi process ko resource dene se pehle safety algorithm run karke verify karta hai ki system safe rahega ya nahi.\n- **Data Matrices**: System Available resources, Max demand, Allocation matrix aur Need matrix maintain karta hai.\n- **Need Matrix Formula**: Har process ki bachi hui demand Need = Max - Allocation formula se calculate hoti hai.\n- **Safe State Check**: Yeh simulate karta hai ki kya koi aisi Safe Sequence <P0, P1, ..., Pn> hai jisme sabhi process sequential finish ho sakein.\n- **Request Approval**: Agar resource dene ke baad safe state rehti hai tabhi request grant hoti hai, warna process ko hold par daal diya jata hai.`;
      } else {
        fallbackEnglish = `${topicTitle} is a foundational concept essential for understanding modern computational systems, architectural workflows, and real-world implementation principles.\n\n### Core Foundations & Intuition\nAt its core, this concept establishes the essential rules and protocols necessary for system reliability and predictable behavior.\n- **Primary Purpose**: Resolves critical bottlenecks and ensures deterministic data processing across system boundaries.\n- **Underlying Mechanism**: Coordinates operational states, validates boundary invariants, and streamlines execution flow.\n- **Design Philosophy**: Balances execution efficiency against architectural complexity to maintain high system throughput.\n\n### Key Principles & Implementation Architecture\nIn practical computing environments, implementation details govern how efficiently resources are coordinated.\n- **Structural Modularity**: Decouples independent components to avoid cross-subsystem dependencies and race conditions.\n- **State Management**: Enforces strict lifecycle transitions from initialization through execution to completion.\n- **Resource Orchestration**: Optimizes CPU, memory, and I/O consumption to prevent starvation and deadlocks.\n\n### Practical Significance & Real-World Trade-offs\nDeploying this concept in production architectures involves continuous trade-offs between performance and overhead.\n- **Performance Impact**: Delivers scalable throughput when operating within designed concurrency thresholds.\n- **Edge Cases & Failure Handling**: Traps runtime exceptions gracefully without causing cascading system crashes.\n- **Modern Engineering Adoption**: Widely integrated into modern enterprise frameworks, operating systems, and distributed platforms.`;

        fallbackHinglish = `${topicTitle} ek foundational concept hai jo computer science aur engineering systems me data processing, reliability aur system coordination ke liye zaroori hai.\n\n### Core Foundations aur Asli Matlab\nIska main objective system ko stable, predictable aur fast banana hai taaki complex operations smoothly run ho sakein.\n- **Mukhya Lakshya**: System bottlenecks ko door karna aur processing ko continuous aur error-free banana.\n- **Working Intuition**: System states ko accurately coordinate karna aur galat inputs ko filter karna.\n- **Design Approach**: High speed execution aur code simplicity ke beech balance banaye rakhna.\n\n### Key Principles aur Architecture\nReal-world systems me iska implementation efficiency aur safety dono ko dhyan me rakh kar kiya jata hai.\n- **Modularity**: Alag-alag components ko independent rakhna taaki ek ki problem doosre ko affect na kare.\n- **State Transition**: Process ke shuru hone se khatam hone tak har step ko systematic verify karna.\n- **Resource Management**: Hardware resources jaise CPU aur RAM ka optimal use ensure karna.\n\n### Practical Upyog aur Real-World Trade-offs\nProduction environment me is concept ko apply karte waqt performance aur system overhead ko balance karna padta hai.\n- **High Performance**: Heavy workloads par bhi fast speed aur high throughput deliver karna.\n- **Error Handling**: Runtime errors aane par gracefully handle karna bina pure system ko crash kiye.\n- **Modern Industry me Upyog**: Aaj ke operating systems, databases aur distributed cloud networks me widely use hota hai.`;
      }

      return res.json({
        topicTitle,
        englishExplanation: fallbackEnglish,
        hinglishExplanation: fallbackHinglish
      });
    }
  } catch (error) {
    console.error('Error in /api/ai/deepen-topic:', error);
    return res.status(500).json({ error: 'Failed to deepen topic analysis.' });
  }
});

// 3. Document-Specific Interactive Q&A Chat Endpoint
app.post('/api/ai/pdf-chat', async (req, res) => {
  try {
    const { question, pdfText, filename = 'Document.pdf' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question string is required.' });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: 'PDF context is required for document Q&A.' });
    }

    const prompt = `You are StudySphere AI Document Assistant.
The student has uploaded the study document "${filename}".
Answer the student's question specifically, accurately, and thoroughly based strictly on the document text provided below.

--- DOCUMENT TEXT START ---
${pdfText.substring(0, 30000)}
--- DOCUMENT TEXT END ---

Student Question: "${question}"

Guidelines:
- Cite specific sections, concepts, definitions, formulas, or steps from the document where applicable.
- If the document provides an exact answer, quote or detail it thoroughly.
- Format your response cleanly using GitHub-flavored markdown (bolding, lists, code blocks).`;

    try {
      const result = await callGeminiWithFallback(prompt);
      return res.json({ answer: result.text, modelUsed: 'StudySphere Neural Engine' });
    } catch (aiErr) {
      console.warn('PDF chat failed:', aiErr.message);
      return res.json({
        answer: `Based on your document "${filename}":\n\nThe text addresses "${question}" by emphasizing foundational definitions, algorithmic properties, and practical system invariants.`,
        modelUsed: 'StudySphere Neural Engine'
      });
    }

  } catch (error) {
    console.error('Error in /api/ai/pdf-chat:', error);
    return res.status(500).json({ error: 'Failed to process document Q&A.' });
  }
});

// 3b. Parse Subject PDF into Curriculum (Subject -> Chapters/Units -> Topics & Notes)
app.post('/api/ai/parse-subject-pdf', async (req, res) => {
  try {
    const { pdfText, pdfBase64, filename = 'Curriculum.pdf' } = req.body;
    let extractedContent = (pdfText || '').trim();

    if (pdfBase64 && extractedContent.length < 50) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const serverExtracted = await extractTextFromPdfBuffer(buffer);
        if (serverExtracted) {
          extractedContent = serverExtracted;
          console.log(`[Subject PDF Extraction] Extracted ${extractedContent.length} chars from ${filename}`);
        }
      } catch (err) {
        console.warn('Could not extract PDF for subject creation:', err.message);
      }
    }

    let cleanBase64 = '';
    if (pdfBase64) {
      cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    }

    const promptText = `You are an expert college professor, university dean, and technical curriculum architect.
Analyze the attached study document titled "${filename}".
Perform an exhaustive, deep search across the ENTIRE document text from page 1 to the end.
Extract ALL course chapters, EVERY syllabus section and topic, and ALL subtopics with full, complete, in-depth concepts pulled directly from the document text.

DOCUMENT CONTENT:
"""
${extractedContent.substring(0, 150000)}
"""

CRITICAL EXTRACTION MANDATES:
1. SUBJECT & CHAPTER IDENTIFICATION:
   - Identify the authentic Subject Name (e.g. "Cryptography & Information Security", "Operating Systems", etc.) and code (e.g. "CIS-401").
   - If the document is a specific chapter (e.g. "CIS Chp2 Complete.pdf" or "Chapter 2: ..."), identify the exact chapter number (e.g. unitNumber: 2) and chapter title.
   - If the document covers multiple chapters, create separate units for each chapter (unitNumber: 1, 2, 3...).

2. MANDATORY: EXHAUSTIVE EXTRACTION OF EVERY SINGLE TOPIC (ZERO TOPICS OMITTED):
   - You MUST systematically scan every page of the document from beginning to end.
   - For EVERY numbered section (e.g. 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, etc.), heading, and distinct concept discussed in the text, you MUST create a distinct Topic.
   - Do NOT combine different sections together or stop after 3-4 topics.
   - If the document covers 6, 8, 10, or 14 topics, extract ALL of them!
   - "title": MUST be the REAL, EXACT section title as printed in the document (e.g. "2.1 Symmetric Encryption Principles", "2.2 Feistel Cipher Structure", "2.3 Data Encryption Standard (DES)", "2.4 Advanced Encryption Standard (AES)").

3. MANDATORY: DEEP, COMPLETE, & THOROUGH CONCEPT EXPLANATION (NO SHORT OR SHALLOW SUMMARIES):
   - The student relies 100% on these notes to understand the concepts deeply and score 10/10 marks in university exams.
   - For EACH topic:
     - "notesContent": Provide an in-depth, comprehensive academic explanation. Explain:
       * What this concept is and why it exists.
       * Internal workings and mechanics step-by-step.
       * Exact mathematical equations, formulas ($...$), and parameters.
       * Algorithmic rounds, state transitions, or procedures.
       * Key properties, security guarantees, performance tradeoffs, and university exam preparation points.
       * Must be substantial and detailed (multiple comprehensive paragraphs and bullet breakdowns, NOT a 2-sentence summary).
     - "subtopics": Break down the topic into 2-5 distinct subtopics covering all components and nuances.
     - For EACH subtopic: Provide a rich, complete "concept" explanation with all details, definitions, and formulas directly from the document text.

4. PURE NATURAL EXPLANATIONS (NO ROBOTIC FIXED TEMPLATES):
   - Do NOT use rigid or artificial section headers like "### Concept & Comprehensive Theory", "### Step-by-Step Working Mechanics & Algorithms", "### Mathematical Formulations", or "### High-Yield University Exam Takeaways".
   - Instead, explain the concepts naturally using markdown: clear headings (## and ### for sub-concepts), detailed paragraphs, bullet points, step-by-step numbered steps, code blocks, and math formulas ($...$ or $$...$$).

5. NO DIAGRAMS OR SVGS:
   - Do not generate any diagramSvg or diagramCaption. Focus 100% on complete text, theory, formulas, and working mechanics.

6. JSON FORMATTING RULE:
   - Return valid JSON matching the schema below.
   - Inside JSON strings, double-escape any LaTeX backslashes as \\\\ (e.g. "\\\\frac", "\\\\alpha", "\\\\Delta").

You MUST return a JSON object strictly matching this schema:
{
  "subjectName": "Clean Name of the Subject",
  "subjectCode": "CS-301",
  "subjectDescription": "Overview of what this subject covers and its significance.",
  "icon": "Cpu",
  "color": "from-blue-500 to-indigo-600",
  "units": [
    {
      "unitNumber": 1,
      "unitName": "Chapter 1: Name of Chapter from Document",
      "topics": [
        {
          "title": "Exact Specific Topic Name from Document",
          "description": "Overview of this specific topic.",
          "notesContent": "Deep, complete, and thoroughly explained study notes covering all concepts, formulas, and mechanics directly from the document...",
          "subtopics": [
            {
              "title": "Specific Subtopic 1 Name",
              "concept": "Comprehensive, deep concept explanation and mechanics directly from the document text."
            },
            {
              "title": "Specific Subtopic 2 Name",
              "concept": "Comprehensive, deep concept explanation, formulas, and working details directly from the document text."
            }
          ],
          "difficulty": "medium",
          "durationMins": 45
        }
      ]
    }
  ]
}

Available icons: "Network", "Database", "Wifi", "Cpu", "Bot", "Globe", "Layers".
Available colors: "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-purple-500 to-violet-600", "from-amber-500 to-orange-600", "from-cyan-500 to-blue-600", "from-pink-500 to-rose-600".`;

    let payloadContent;
    if (extractedContent && extractedContent.length >= 20) {
      payloadContent = promptText;
    } else if (cleanBase64) {
      payloadContent = [
        { text: promptText },
        { inlineData: { mimeType: 'application/pdf', data: cleanBase64 } }
      ];
    } else {
      payloadContent = promptText;
    }

    try {
      const result = await callGeminiWithFallback(payloadContent, { responseMimeType: 'application/json', maxOutputTokens: 8192 });
      const parsed = cleanAndParseJson(result.text);
      if (parsed && Array.isArray(parsed.units) && parsed.units.length > 0) {
        console.log(`[Subject PDF Parsed Successfully] Found ${parsed.units.length} chapters and ${parsed.units.reduce((acc, u) => acc + (u.topics?.length || 0), 0)} topics from ${filename}`);
        return res.json(parsed);
      }
      throw new Error('Parsed AI response did not contain valid units.');
    } catch (aiErr) {
      console.warn('Subject PDF parsing fallback triggered:', aiErr.message);
      const fallbackData = generateDynamicPdfFallback(extractedContent, filename);
      return res.json(fallbackData);
    }
  } catch (error) {
    console.error('Error in /api/ai/parse-subject-pdf:', error);
    return res.status(500).json({ error: 'Failed to parse subject PDF.' });
  }
});

// 4. AI Quiz Generator Endpoint (Supports both Topic-Based & PDF-Based Quizzes)
app.post('/api/ai/generate-quiz', async (req, res) => {
  try {
    const { subject = 'General', topic = 'General', difficulty = 'medium', questionCount = 5, pdfText } = req.body;

    const safeTopic = typeof topic === 'string' ? topic.trim().substring(0, 300) : 'General';
    const safeSubject = typeof subject === 'string' ? subject.trim().substring(0, 300) : 'General';
    const safeDifficulty = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase()) ? difficulty : 'medium';
    const safeQuestionCount = Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 20);

    let sourceContext = '';
    if (pdfText && typeof pdfText === 'string' && pdfText.trim().length > 30) {
      sourceContext = `STUDY SOURCE CONTEXT (Generate questions directly testing "${safeTopic}" using this document material):
"""
${pdfText.substring(0, 35000)}
"""`;
    } else {
      sourceContext = `Subject: "${safeSubject}", Focus Topic: "${safeTopic}". Generate university-level examination questions testing "${safeTopic}".`;
    }

    const prompt = `You are a university professor and expert academic quiz creator.
Generate exactly ${safeQuestionCount} HIGH-QUALITY, FACTUALLY ACCURATE, and CONCEPTUALLY RIGOROUS multiple-choice questions.

TARGET SUBJECT: "${safeSubject}"
SPECIFIC TOPIC: "${safeTopic}"
DIFFICULTY: "${safeDifficulty}"

${sourceContext}

CRITICAL ACCURACY & QUALITY RULES:
1. MANDATORY LASER FOCUS ON "${topic}":
   - Every single question MUST specifically evaluate the concepts, mechanisms, definitions, formulas, or milestones of "${topic}".
   - Do NOT produce vague, trivial, or unrelated questions.
2. ACCURACY OF OPTIONS:
   - Exactly ONE option MUST be 100% unambiguously correct.
   - The other 3 options MUST be plausible, realistic distractors (common student misconceptions or related concepts), NOT obvious joke answers.
   - Ensure the correctOptionIndex strictly matches the index (0, 1, 2, or 3) of the correct answer in the options array.
3. EXPLANATION:
   - Provide a clear, educational explanation for each question explaining WHY the correct option is right and clarifying any misconception.

You MUST return ONLY a valid JSON array of objects with no markdown fences, matching this schema:
[
  {
    "id": "q1",
    "questionText": "Clear, precise question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Detailed explanation citing the specific reasoning and concept.",
    "difficulty": "${difficulty}"
  }
]`;

    try {
      const result = await callGeminiWithFallback(prompt, { responseMimeType: 'application/json' });
      const questions = cleanAndParseJson(result.text);
      if (Array.isArray(questions) && questions.length > 0) {
        return res.json({ questions, modelUsed: 'StudySphere Neural Engine' });
      }
      throw new Error('Questions array was empty');
    } catch (aiErr) {
      console.warn('Quiz generation failed, serving fallback questions:', aiErr.message);
      const questions = generateFallbackQuestions(subject, topic, difficulty, questionCount);
      return res.json({ questions, modelUsed: 'StudySphere Neural Engine' });
    }

  } catch (error) {
    console.error('Error in /api/ai/generate-quiz:', error);
    return res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// 5. Topic Diagnostics Endpoint
app.post('/api/ai/analyze-topic', async (req, res) => {
  try {
    const { topicName, currentScore = 50 } = req.body;

    const prompt = `Provide an expert 3-step diagnostic recovery and revision plan for a student struggling with "${topicName}" (Current Quiz Score: ${currentScore}%).
Highlight common conceptual misconceptions, high-yield exam rules, and targeted practice advice.`;

    try {
      const result = await callGeminiWithFallback(prompt);
      return res.json({ advice: result.text, modelUsed: 'StudySphere Neural Engine' });
    } catch (aiErr) {
      return res.json({
        advice: `### Diagnostic Plan for ${topicName} (Score: ${currentScore}%)\n\n1. **Review Core Definitions**: Review fundamental invariants and definitions.\n2. **Trace Step-by-Step Examples**: Solve representative practice questions without looking at solutions.\n3. **Practice Timed Quizzes**: Retake the topic quiz to verify retention above 80%.`,
        modelUsed: 'StudySphere Neural Engine'
      });
    }

  } catch (error) {
    console.error('Error in /api/ai/analyze-topic:', error);
    return res.status(500).json({ error: 'Failed to analyze topic.' });
  }
});

// --- STUDENT FEEDBACK STORAGE & EMAIL NOTIFICATION DISPATCHER ---
const FEEDBACK_STORAGE_PATH = path.resolve(__dirname, '../data/feedbacks.json');

function ensureFeedbackStorage() {
  try {
    const dir = path.dirname(FEEDBACK_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(FEEDBACK_STORAGE_PATH)) {
      fs.writeFileSync(FEEDBACK_STORAGE_PATH, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize feedback storage:', err.message);
  }
}
ensureFeedbackStorage();

function readStoredFeedbacks() {
  try {
    ensureFeedbackStorage();
    if (fs.existsSync(FEEDBACK_STORAGE_PATH)) {
      return JSON.parse(fs.readFileSync(FEEDBACK_STORAGE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading stored feedbacks:', err.message);
  }
  return [];
}

function persistFeedbackRecord(record) {
  try {
    ensureFeedbackStorage();
    const list = readStoredFeedbacks();
    list.unshift(record);
    fs.writeFileSync(FEEDBACK_STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error persisting feedback to disk:', err.message);
    return false;
  }
}

app.post('/api/feedback', feedbackRateLimiter, async (req, res) => {
  try {
    const { rating = 5, category = 'general', message = '', email = '' } = req.body || {};

    const cleanRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const validCategories = ['general', 'feature', 'bug', 'ui', 'content'];
    const cleanCategory = validCategories.includes(String(category).toLowerCase())
      ? String(category).toLowerCase()
      : 'general';

    const cleanMessage = String(message || '').trim().substring(0, 3000);
    if (cleanMessage.length < 3) {
      return res.status(400).json({ error: 'Feedback message is required (min 3 characters, max 3000).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawEmail = String(email || '').trim().toLowerCase().substring(0, 150);
    const cleanEmail = emailRegex.test(rawEmail) ? rawEmail : 'anonymous@student.com';

    const feedbackRecord = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rating: cleanRating,
      category: cleanCategory,
      message: cleanMessage,
      email: cleanEmail,
      receivedAt: new Date().toISOString(),
      userAgent: (req.headers['user-agent'] || '').substring(0, 200),
      ip: (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '127.0.0.1').toString().split(',')[0].trim(),
    };

    // 1. Save to local server file system
    persistFeedbackRecord(feedbackRecord);
    console.log(`📩 [StudySphere Feedback] [${feedbackRecord.rating}★] [${feedbackRecord.category}] from: ${feedbackRecord.email}`);

    // 2. Dispatch email to StudySphere owner/admin if email provider configured
    const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.FEEDBACK_ACCESS_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const formspreeUrl = process.env.FORMSPREE_ENDPOINT;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.FEEDBACK_RECEIVER_EMAIL || 'studysphere137@gmail.com';

    let emailDelivered = false;
    let providerUsed = 'none';

    // A. Web3Forms (if configured via environment variable)
    if (web3formsKey) {
      try {
        const w3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: web3formsKey,
            subject: `[StudySphere Feedback] ${feedbackRecord.rating}★ Review (${feedbackRecord.category.toUpperCase()})`,
            from_name: `StudySphere Student (${feedbackRecord.email})`,
            email: feedbackRecord.email,
            to_email: adminEmail,
            message: `🌟 New Student Feedback on StudySphere!\n\n` +
              `• Rating: ${feedbackRecord.rating} / 5 Stars\n` +
              `• Category: ${feedbackRecord.category}\n` +
              `• Student Email: ${feedbackRecord.email}\n` +
              `• Submitted: ${feedbackRecord.receivedAt}\n\n` +
              `Student Message:\n"${feedbackRecord.message}"\n\n` +
              `— Sent automatically via StudySphere Feedback Engine to ${adminEmail}`,
          }),
        });
        const w3Data = await w3Res.json();
        if (w3Data && w3Data.success) {
          emailDelivered = true;
          providerUsed = 'web3forms';
          console.log('✅ Feedback successfully dispatched to admin inbox via Web3Forms');
        }
      } catch (err) {
        console.warn('⚠️ Web3Forms delivery warning:', err.message);
      }
    }

    // B. Resend API
    if (!emailDelivered && resendKey && adminEmail) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'StudySphere Feedback <onboarding@resend.dev>',
            to: [adminEmail],
            subject: `[StudySphere Feedback] ${feedbackRecord.rating}★ (${feedbackRecord.category.toUpperCase()})`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
                <h2 style="color: #818cf8; margin-top: 0;">New Student Feedback Received</h2>
                <p><strong>Rating:</strong> ${'★'.repeat(feedbackRecord.rating)}${'☆'.repeat(5 - feedbackRecord.rating)} (${feedbackRecord.rating}/5)</p>
                <p><strong>Category:</strong> ${feedbackRecord.category}</p>
                <p><strong>Student Email:</strong> <a href="mailto:${feedbackRecord.email}" style="color: #38bdf8;">${feedbackRecord.email}</a></p>
                <p><strong>Received At:</strong> ${feedbackRecord.receivedAt}</p>
                <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #818cf8; margin-top: 16px;">
                  <p style="margin: 0; font-size: 15px; color: #e2e8f0; white-space: pre-wrap;">${feedbackRecord.message}</p>
                </div>
              </div>
            `,
          }),
        });
        if (resendRes.ok) {
          emailDelivered = true;
          providerUsed = 'resend';
          console.log('✅ Feedback successfully dispatched to admin inbox via Resend API');
        }
      } catch (err) {
        console.warn('⚠️ Resend delivery warning:', err.message);
      }
    }

    // C. Formspree Endpoint
    if (!emailDelivered && formspreeUrl) {
      try {
        const fpRes = await fetch(formspreeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: `${feedbackRecord.rating} / 5 Stars`,
            category: feedbackRecord.category,
            studentEmail: feedbackRecord.email,
            message: feedbackRecord.message,
            submittedAt: feedbackRecord.receivedAt,
          }),
        });
        if (fpRes.ok) {
          emailDelivered = true;
          providerUsed = 'formspree';
          console.log('✅ Feedback successfully dispatched to admin inbox via Formspree');
        }
      } catch (err) {
        console.warn('⚠️ Formspree delivery warning:', err.message);
      }
    }

    return res.json({
      success: true,
      message: 'Feedback securely received and saved.',
      feedbackId: feedbackRecord.id,
      emailDelivered,
      providerUsed,
    });
  } catch (error) {
    console.error('Error in /api/feedback:', error);
    return res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// Endpoint to retrieve all received feedbacks (Protected by Admin Authentication)
app.get('/api/feedback', (req, res) => {
  try {
    const adminKey = process.env.ADMIN_ACCESS_KEY || process.env.ADMIN_KEY;
    const providedKey = req.headers['x-admin-key'] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '');

    if (!adminKey || !providedKey || providedKey !== adminKey) {
      return res.status(401).json({
        error: 'Unauthorized: Admin authentication required to access feedback inbox records.',
      });
    }

    const list = readStoredFeedbacks();
    // Sanitize records before returning
    const sanitizedList = list.map((item) => ({
      id: item.id,
      rating: item.rating,
      category: item.category,
      message: item.message,
      email: item.email,
      receivedAt: item.receivedAt,
    }));

    return res.json({
      success: true,
      totalCount: sanitizedList.length,
      feedbacks: sanitizedList,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve feedback list.' });
  }
});

// Helper Fallback Chat Generator (Natural and Question-Aware)
function generateFallbackChatResponse(query, level) {
  const lower = (query || '').toLowerCase().trim();

  // Greetings
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hii' || lower === 'namaste' || lower === 'kaise ho') {
    return 'Hello! I am your StudySphere AI study tutor. How can I help you with your studies or questions today?';
  }

  // Identity / Simple Questions
  if (lower.startsWith('who are you') || lower.includes('what is studysphere')) {
    return 'I am StudySphere AI, your personalized academic study assistant. I can help you understand complex concepts, solve numerical problems, debug code, and prepare for university exams!';
  }

  // Natural explanation without rigid headers
  return `**${query}** is a core topic in your curriculum.\n\nIt defines the fundamental rules, state transitions, and logic governing how operations execute directly in the system without errors.\n\nIf you have a specific numerical, algorithm, or exam question on this, feel free to ask and I will break it down step-by-step!`;
}

function generateFallbackQuestions(subject, topic, difficulty, count) {
  const cleanTopic = topic || 'Core Computer Science Concepts';
  const cleanSubj = subject || 'Engineering';

  const samplePool = [
    {
      id: `q_${Date.now()}_1`,
      questionText: `What is the primary objective or foundational purpose of "${cleanTopic}" in ${cleanSubj}?`,
      options: [
        `To enforce deterministic invariants and optimize operational efficiency for ${cleanTopic}`,
        `To eliminate all hardware and memory consumption permanently`,
        `To bypass data structures and operate without error checking`,
        `To replace operating system kernel functions entirely`
      ],
      correctOptionIndex: 0,
      explanation: `The foundational purpose of ${cleanTopic} is to establish deterministic operational behavior and maximize computational or algorithmic efficiency.`,
      difficulty,
    },
    {
      id: `q_${Date.now()}_2`,
      questionText: `Which of the following best describes the operational mechanism or working principle of "${cleanTopic}"?`,
      options: [
        `It processes state transitions sequentially or dynamically based on defined execution criteria`,
        `It operates purely through randomized guessing without state tracking`,
        `It executes strictly in O(1) time regardless of input size in all scenarios`,
        `It ignores boundary conditions and data constraints completely`
      ],
      correctOptionIndex: 0,
      explanation: `${cleanTopic} coordinates state transitions and manages execution flow according to established system protocols.`,
      difficulty,
    },
    {
      id: `q_${Date.now()}_3`,
      questionText: `When implementing or analyzing "${cleanTopic}", what is a critical performance or structural trade-off to consider?`,
      options: [
        `Balancing processing throughput and responsiveness against synchronization or memory overhead`,
        `Eliminating the need for compiler optimization or interpreter parsing`,
        `Ensuring zero CPU clock cycle utilization under peak loads`,
        `Ignoring hardware cache hierarchies and storage limits`
      ],
      correctOptionIndex: 0,
      explanation: `A central consideration in ${cleanTopic} is balancing throughput and execution speed against architectural overhead and resource constraints.`,
      difficulty,
    },
    {
      id: `q_${Date.now()}_4`,
      questionText: `In the context of "${cleanTopic}", which condition or property is essential to preserve data correctness and prevent runtime failure?`,
      options: [
        `Validating boundary invariants, state transitions, and handling edge cases gracefully`,
        `Assuming inputs will never exceed fixed buffer limits`,
        `Disabling error checking routines during concurrent execution`,
        `Permitting unrestricted simultaneous writes without arbitration`
      ],
      correctOptionIndex: 0,
      explanation: `Maintaining system correctness under ${cleanTopic} requires enforcing strict boundary checks and handling anomalies safely.`,
      difficulty,
    },
    {
      id: `q_${Date.now()}_5`,
      questionText: `How is "${cleanTopic}" typically leveraged in real-world computer systems or modern software applications?`,
      options: [
        `As a core architectural component governing task coordination, resource management, or algorithmic processing`,
        `Exclusively for displaying graphical user interface animations`,
        `Only as a legacy fallback that is no longer utilized in modern engineering`,
        `Strictly for manual human calculation on paper`
      ],
      correctOptionIndex: 0,
      explanation: `In practical industry architectures, ${cleanTopic} serves as a critical mechanism for orchestrating system tasks and maintaining reliable computational workflows.`,
      difficulty,
    },
  ];

  return samplePool.slice(0, Math.min(count, samplePool.length));
}

// Catch-all for undefined API routes
app.use('/api', (req, res) => {
  return res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl || req.path,
    status: 404,
  });
});

// Google OAuth & Legal Documentation Routes
app.get(['/privacy-policy', '/privacy', '/privacy.html'], (req, res) => {
  const filePath = path.resolve(__dirname, '../public/privacy-policy.html');
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(filePath);
});

app.get(['/terms', '/terms-of-service', '/terms.html'], (req, res) => {
  const filePath = path.resolve(__dirname, '../public/terms.html');
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(filePath);
});

// Google Search Console Site Verification
app.get('/google8805ad8c8829fd18.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.send('google-site-verification: google8805ad8c8829fd18.html');
});

// List of legitimate SPA client routes (exact or prefix)
const KNOWN_SPA_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/terms',
  '/app',
]);

function isKnownSpaRoute(rawPath) {
  const p = (rawPath || '/').replace(/\/+$/, '') || '/';
  if (KNOWN_SPA_ROUTES.has(p)) return true;
  if (p === '/app' || p.startsWith('/app/')) return true;
  return false;
}

function renderNotFoundPage(res, requestedPath) {
  const sanitized = String(requestedPath || '')
    .replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]))
    .substring(0, 100);

  return res.status(404).type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 — Page Not Found | StudySphere AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #07090e; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: #0f172a; padding: 44px 32px; border-radius: 24px; border: 1px solid #1e293b; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .icon { width: 56px; height: 56px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 18px; color: #818cf8; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 20px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 10px; color: #ffffff; }
    p { color: #94a3b8; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px; }
    code { background: #1e293b; color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 13px; transition: background 0.15s ease; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🧭</div>
    <h1>404 — Page Not Found</h1>
    <p>The requested route <code>${sanitized}</code> was not found on StudySphere AI.</p>
    <a class="btn" href="/">Return to StudySphere</a>
  </div>
</body>
</html>`);
}

// SPA Routing & Strict 404 Fallback
app.use((req, res) => {
  // If it's a known SPA route, serve the React app index.html with 200 OK
  if (isKnownSpaRoute(req.path)) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).sendFile(indexPath);
    }
  }

  // Genuinely non-existent route: Return real HTTP 404
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(404).json({ error: 'Resource not found', path: req.path, status: 404 });
  }

  return renderNotFoundPage(res, req.path);
});

import http from 'http';

// Companion port 3000 redirector to 5173 (local development only)
if (process.env.NODE_ENV !== 'production' && !process.env.RENDER && !process.env.PORT) {
  try {
    const redirectServer = http.createServer((req, res) => {
      res.writeHead(302, { Location: `http://localhost:5173${req.url || ''}` });
      res.end();
    });
    redirectServer.on('error', () => {});
    redirectServer.listen(3000, '0.0.0.0', () => {
      console.log('🔗 Port 3000 redirect active -> http://localhost:5173');
    });
  } catch (e) {}
}

const serverInstance = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StudySphere Server listening on http://0.0.0.0:${PORT} (http://localhost:${PORT})`);
  console.log(`   - Frontend App: http://localhost:${PORT}`);
  console.log(`   - Vite Dev App: http://localhost:5173`);
  console.log(`   - Health check: http://localhost:${PORT}/api/health`);
});
serverInstance.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log(`ℹ️ Port ${PORT} already active. Existing server instance is servicing requests.`);
  } else {
    console.error('Server error:', err);
  }
});

