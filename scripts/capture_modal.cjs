const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs_images');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  await page.goto('http://localhost:5173/app/pdf-analyzer', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Find and click the Quiz Gen button on the topic card
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const quizBtn = btns.find(b => b.textContent && b.textContent.includes('Quiz Gen'));
    if (quizBtn) quizBtn.click();
  });

  // Wait for AI quiz generation or modal load
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig4_topic_quiz_modal.png') });

  await browser.close();
  console.log('✅ Captured fig4_topic_quiz_modal.png');
}

run().catch(console.error);
