const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs_images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching headless Edge to capture academic screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. Landing Page
  console.log('📸 1/9 Capturing Landing Page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig1_landing_page.png'), fullPage: false });

  // Seed rich academic data into localStorage
  await page.evaluate(() => {
    // 1. Active Student User
    localStorage.setItem('studysphere_user', JSON.stringify({
      id: 'usr_new',
      email: 'alex.dev@studysphere.ai',
      fullName: 'Alex Morgan',
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    }));

    // 2. Analyzed PDF Document
    const samplePDF = {
      id: 'pdf_sample_os',
      filename: 'Operating_Systems_Process_Management.pdf',
      fileSize: 2450000,
      summary: 'This chapter examines the architecture of process management in modern operating systems. It covers the 5-state process lifecycle (New, Ready, Running, Waiting, Terminated), CPU scheduling algorithms including Round Robin and SJF, and concurrency control using semaphores.',
      summaryHinglish: 'Yeh chapter operating systems ke process management concepts ko explain karta hai: process lifecycle, CPU scheduling algorithms jaise Round Robin, aur deadlocks.',
      importantTopics: [
        'Process Lifecycle & State Transitions',
        'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)',
        'Deadlock Prevention & Bankers Algorithm'
      ],
      topicWiseAnalysis: [
        {
          topicTitle: 'Process Lifecycle & State Transitions',
          englishExplanation: 'A process is an instance of a computer program in execution. It transitions through New, Ready, Running, Waiting, and Terminated states managed by the kernel scheduler.',
          hinglishExplanation: 'Process ek program in execution hota hai jo OS kernel scheduler ke through New, Ready, Running, Waiting aur Terminated states ke beech transition karta hai.',
          keyPoints: [
            'Context Switch: Saving and restoring CPU registers between processes',
            'Ready Queue: FIFO queue holding runnable processes waiting for CPU time'
          ]
        },
        {
          topicTitle: 'CPU Scheduling Algorithms & Time Quantum',
          englishExplanation: 'Round Robin CPU scheduling allocates a fixed time quantum per process to guarantee fairness and eliminate process starvation in interactive multitasking systems.',
          hinglishExplanation: 'Round Robin scheduling har process ko ek fixed time quantum deta hai jisse process starvation eliminate ho jata hai aur system fair rehta hai.',
          keyPoints: [
            'Turnaround Time = Completion Time - Arrival Time',
            'Waiting Time = Turnaround Time - Burst Time'
          ]
        }
      ],
      keyInsights: [
        'Time quantum selection directly affects system throughput and context switch overhead.',
        'Preemptive scheduling provides superior responsiveness for interactive user tasks.'
      ],
      extractedText: 'Process management lecture notes...',
      chatHistory: [],
      analyzedAt: new Date().toISOString()
    };
    localStorage.setItem('studysphere_analyzed_pdfs', JSON.stringify([samplePDF]));

    // 3. Study Planner Tasks for October 12, 2026
    localStorage.setItem('studysphere_study_plans', JSON.stringify([
      {
        id: 'task_1',
        userId: 'usr_new',
        subjectId: 'subj_os',
        subjectName: 'Operating Systems',
        title: 'Review CPU Scheduling & Gantt Charts',
        priority: 'high',
        durationMins: 45,
        dueDate: '2026-10-12',
        isCompleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_2',
        userId: 'usr_new',
        subjectId: 'subj_dbms',
        subjectName: 'Database Management',
        title: 'Practice BCNF Normalization Exercises',
        priority: 'medium',
        durationMins: 60,
        dueDate: '2026-10-12',
        isCompleted: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_3',
        userId: 'usr_new',
        subjectId: 'subj_ds',
        subjectName: 'Data Structures',
        title: 'Solve AVL Tree Height Balancing Problems',
        priority: 'high',
        durationMins: 50,
        dueDate: '2026-10-15',
        isCompleted: false,
        createdAt: new Date().toISOString()
      }
    ]));

    // 4. Weak Topics Diagnostic Entries (<60%)
    localStorage.setItem('studysphere_weak_topics', JSON.stringify([
      {
        id: 'weak_1',
        userId: 'usr_new',
        subjectId: 'subj_dbms',
        subjectName: 'Database Management',
        topicId: 'top_bcnf',
        topicTitle: 'Boyce-Codd Normal Form (BCNF) Decomposition',
        accuracyPercentage: 40,
        suggestedAction: 'Review Functional Dependency Super Keys',
        lastTestedAt: new Date().toISOString()
      },
      {
        id: 'weak_2',
        userId: 'usr_new',
        subjectId: 'subj_os',
        subjectName: 'Operating Systems',
        topicId: 'top_bankers',
        topicTitle: 'Bankers Algorithm & Safe State Detection',
        accuracyPercentage: 50,
        suggestedAction: 'Practice Resource Allocation Matrices',
        lastTestedAt: new Date().toISOString()
      }
    ]));
  });

  // 2. Student Dashboard
  console.log('📸 2/9 Capturing Student Dashboard...');
  await page.goto('http://localhost:5173/app/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig2_dashboard.png'), fullPage: false });

  // 3. PDF Analyzer with Analyzed Document
  console.log('📸 3/9 Capturing PDF Analyzer with Analyzed Document...');
  await page.goto('http://localhost:5173/app/pdf-analyzer', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_pdf_analyzer.png'), fullPage: false });

  // 4. Topic Quiz Modal
  console.log('📸 4/9 Capturing Topic Quiz Modal...');
  try {
    await page.evaluate(() => {
      const quizBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Quiz Gen'));
      if (quizBtns.length > 0) quizBtns[0].click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig4_quiz_modal.png'), fullPage: false });
  } catch (e) {
    console.warn('Quiz modal click skipped:', e.message);
  }

  // 5. Dynamic Study Planner (Calendar View)
  console.log('📸 5/9 Capturing Study Planner Calendar...');
  await page.goto('http://localhost:5173/app/planner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const calBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Calendar');
    if (calBtn) calBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig5_study_planner_calendar.png'), fullPage: false });

  // 6. AI Study Tutor
  console.log('📸 6/9 Capturing AI Tutor...');
  await page.goto('http://localhost:5173/app/ai-tutor', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig6_ai_tutor.png'), fullPage: false });

  // 7. Practice Quiz Generator
  console.log('📸 7/9 Capturing Practice Quiz Engine...');
  await page.goto('http://localhost:5173/app/quiz', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig7_quiz_generator.png'), fullPage: false });

  // 8. Weak Topics Diagnostic Remediation Dashboard
  console.log('📸 8/9 Capturing Weak Topics Remediation Dashboard...');
  await page.goto('http://localhost:5173/app/weak-topics', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig8_weak_topics.png'), fullPage: false });

  // 9. Subject Syllabus & Diagrams
  console.log('📸 9/9 Capturing Subject Syllabus & Architecture Diagram...');
  await page.goto('http://localhost:5173/app/subjects/subj_ds', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig9_subject_syllabus.png'), fullPage: false });

  await browser.close();
  console.log('🎉 All 9 screenshots captured successfully in docs_images/ folder!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
