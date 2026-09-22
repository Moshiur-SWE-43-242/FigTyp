const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('../models/Course');

// Curated vocabulary pools for programmatic generation
const HOME_ROW_WORDS = ['as', 'ask', 'all', 'fall', 'falls', 'salad', 'flask', 'glad', 'flash', 'salsa', 'half', 'hall', 'dash', 'slash', 'glass', 'adds', 'dads', 'lads', 'alas', 'kala'];
const TOP_ROW_WORDS = ['tree', 'write', 'fruit', 'power', 'equip', 'true', 'quiet', 'route', 'peter', 'prior', 'quote', 'tower', 'water', 'write', 'yield', 'input', 'outer', 'point', 'query', 'ratio'];
const BOTTOM_ROW_WORDS = ['cabin', 'climb', 'voice', 'zebra', 'ban', 'zone', 'next', 'vivid', 'music', 'noble', 'clean', 'brave', 'nexus', 'box', 'civic', 'blank', 'venom', 'mixer', 'zonal', 'bench'];

const COMMON_VOCABULARY = [
  'accuracy', 'algorithm', 'balance', 'bandwidth', 'cadence', 'circuit', 'clarity', 'client',
  'cognitive', 'compiler', 'control', 'database', 'dynamic', 'efficiency', 'endurance', 'engine',
  'feedback', 'firmware', 'fluent', 'focus', 'framework', 'frequency', 'hardware', 'horizon',
  'interface', 'iteration', 'keystroke', 'kinetic', 'latency', 'machine', 'matrices', 'memory',
  'modular', 'monitor', 'muscle', 'network', 'neural', 'operator', 'optimize', 'parallel',
  'pattern', 'pipeline', 'platform', 'precision', 'processor', 'protocol', 'quantum', 'quickness',
  'reaction', 'reflex', 'rhythm', 'routine', 'runtime', 'scalable', 'segment', 'signal',
  'software', 'speed', 'stamina', 'standard', 'strategy', 'structure', 'syntax', 'system',
  'tactile', 'telemetry', 'template', 'terminal', 'throughput', 'timing', 'velocity', 'workflow'
];

const CODE_TEMPLATES = [
  "const calculateWpm = (chars, seconds) => Math.round((chars / 5) / (seconds / 60));",
  "async function fetchTelemetry(token) { const res = await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } }); return res.json(); }",
  "def binary_search(arr, target): left, right = 0, len(arr) - 1; while left <= right: mid = (left + right) // 2; if arr[mid] == target: return mid; elif arr[mid] < target: left = mid + 1; else: right = mid - 1; return -1",
  "SELECT u.username, MAX(a.wpm) AS peak_wpm, AVG(a.accuracy) AS avg_acc FROM users u JOIN attempts a ON u.id = a.user_id GROUP BY u.username HAVING peak_wpm >= 75 ORDER BY peak_wpm DESC LIMIT 10;",
  "export interface UserProfile { id: string; username: string; coins: number; xp: number; badges: string[]; completedLessons: string[]; isVerified: boolean; }",
  "fn merge_sort<T: Ord + Clone>(slice: &[T]) -> Vec<T> { if slice.len() <= 1 { return slice.to_vec(); } let mid = slice.len() / 2; let left = merge_sort(&slice[..mid]); let right = merge_sort(&slice[mid..]); merge(&left, &right) }",
  "class PerformanceMonitor extends EventEmitter { constructor(intervalMs = 1000) { super(); this.interval = intervalMs; this.timer = null; } start() { this.timer = setInterval(() => this.emit('pulse', process.memoryUsage()), this.interval); } }",
  "const sanitizeInput = (input: string): string => input.trim().replace(/[<>\"']/g, (m) => ({ '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[m] || m));",
  "public static int fibonacci(int n) { if (n <= 1) return n; int a = 0, b = 1; for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; } return b; }",
  "docker run -d --name redis_cache -p 6379:6379 -v redis_data:/data --restart unless-stopped redis:7-alpine redis-server --appendonly yes"
];

// Helper to construct exact word count text
function buildSentenceOfWords(count, vocabPool) {
  const words = [];
  for (let i = 0; i < count; i++) {
    const word = vocabPool[i % vocabPool.length];
    words.push(word);
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

// 1. Generate 100 Beginner Lessons
function generateBeginnerLessons() {
  const lessons = [];
  for (let i = 1; i <= 100; i++) {
    let title = '';
    let text = '';
    let targetKeys = [];
    let targetFinger = 'index';
    let instructions = '';

    if (i <= 20) {
      targetFinger = i % 2 === 0 ? 'index' : 'middle';
      targetKeys = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'].slice(0, (i % 8) + 1);
      title = `Home Row Drill ${i}: Key Precision`;
      instructions = 'Keep fingers grounded on home row tactile landmarks. Strike keys cleanly without lifting wrists.';
      const sample = ['ffff', 'jjjj', 'dddd', 'kkkk', 'asdf', ';lkj', 'glad', 'flask', 'salsa', 'salad'];
      text = Array.from({ length: 6 + (i % 5) }, (_, idx) => sample[(i + idx) % sample.length]).join(' ');
    } else if (i <= 40) {
      targetFinger = 'middle';
      targetKeys = ['e', 'i', 'r', 'u', 't', 'y'];
      title = `Top Row Reach ${i}: Syllable Chords`;
      instructions = 'Reach upward smoothly from home row. Snap back immediately to rest position.';
      text = Array.from({ length: 8 + (i % 6) }, (_, idx) => TOP_ROW_WORDS[(i + idx) % TOP_ROW_WORDS.length]).join(' ');
    } else if (i <= 60) {
      targetFinger = 'ring';
      targetKeys = ['v', 'm', 'b', 'n', 'c', 'x', 'z'];
      title = `Bottom Row Integration ${i}: Dual-Hand Control`;
      instructions = 'Lower finger rows demand steady wrist posture. Maintain balance without dragging.';
      text = Array.from({ length: 10 + (i % 6) }, (_, idx) => BOTTOM_ROW_WORDS[(i + idx) % BOTTOM_ROW_WORDS.length]).join(' ');
    } else if (i <= 80) {
      targetFinger = 'pinky';
      targetKeys = ['Shift', 'Caps', '.', ','];
      title = `Shift & Syntax Fundamentals ${i}`;
      instructions = 'Engage pinkies for Shift while opposite hand keys the capital character.';
      text = `Exercise ${i}: The quick brown fox jumps steadily over the lazy dog. Practice builds muscle memory every single day.`;
    } else {
      targetFinger = 'all';
      targetKeys = ['all'];
      title = `Foundation Velocity ${i}: Full Fluency`;
      instructions = 'Combine home, top, and bottom rows with relaxed shoulders and confident rhythm.';
      text = `Progressive milestone lesson ${i}. Developing smooth kinetic cadence is the secret to unbroken typing velocity. Focus on ninety-five percent accuracy before pushing for raw speed.`;
    }

    lessons.push({
      lessonId: `beg_${i}`,
      title,
      text,
      instructions,
      targetKeys,
      targetFinger,
      minWpm: Math.min(40, 15 + Math.floor(i * 0.25)),
      minAccuracy: Math.min(96, 90 + Math.floor(i * 0.06)),
      xpReward: 25 + Math.floor(i * 0.5), // 25 to 75
      coinsReward: 15 + Math.floor(i * 0.35), // 15 to 50
      order: i
    });
  }
  return lessons;
}

// 2. Generate 200 Intermediate Lessons (Word +1, XP +1, Coins +1 per lesson)
function generateIntermediateLessons() {
  const lessons = [];
  for (let i = 1; i <= 200; i++) {
    const wordCount = 14 + i; // 15 words up to 214 words
    const xpReward = 49 + i; // 50 XP up to 249 XP (+1 per lesson)
    const coinsReward = 29 + i; // 30 Coins up to 229 Coins (+1 per lesson)
    const minWpm = Math.min(65, 30 + Math.floor(i * 0.16));
    const minAccuracy = Math.min(95, 91 + Math.floor(i * 0.02));

    const text = buildSentenceOfWords(wordCount, COMMON_VOCABULARY);

    lessons.push({
      lessonId: `int_${i}`,
      title: `Flow Progression ${i}: Cadence & Sustained Rhythm`,
      text,
      instructions: `Target sustained flow across ${wordCount} words. Maintain constant rhythmic typing without stutter or pauses.`,
      targetKeys: ['all'],
      targetFinger: 'all',
      minWpm,
      minAccuracy,
      xpReward,
      coinsReward,
      order: i
    });
  }
  return lessons;
}

// 3. Generate 300 Advanced Lessons (Increasing difficulties: uppercase, lowercase, numbers, symbols, points & coins +1 per lesson)
function generateAdvancedLessons() {
  const lessons = [];
  const symbols = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '{', '}', '[', ']', ':', '"', ';', "'", '<', '>', ',', '.', '?', '/', '\\', '|'];

  for (let i = 1; i <= 300; i++) {
    const xpReward = 99 + i; // 100 XP up to 399 XP (+1 per lesson)
    const coinsReward = 59 + i; // 60 Coins up to 359 Coins (+1 per lesson)
    const minWpm = Math.min(75, 38 + Math.floor(i * 0.12));
    const minAccuracy = Math.min(96, 92 + Math.floor(i * 0.015));

    const sym1 = symbols[(i * 3) % symbols.length];
    const sym2 = symbols[(i * 7) % symbols.length];
    const sym3 = symbols[(i * 11) % symbols.length];
    const num1 = (i * 13) % 999;
    const num2 = (i * 29) % 8999 + 1000;
    const wordA = COMMON_VOCABULARY[(i * 2) % COMMON_VOCABULARY.length];
    const wordB = COMMON_VOCABULARY[(i * 5) % COMMON_VOCABULARY.length];

    const patterns = [
      `SELECT * FROM ${wordA}_table WHERE id = ${num1} AND token_${i} = '${sym1}${wordB}${sym2}' AND status = 'ACTIVE';`,
      `const config_${i} = { apiHost: 'https://${wordA}.${wordB}.io/v1/${num1}', secretKey: '${sym1}${num2}${sym2}${sym3}', retries: ${i % 10 + 1} };`,
      `function calculate_${wordA}(input: number): string { return \`${sym1}\${input * ${num1}}${sym2}\` + '${wordB}_${sym3}'; }`,
      `curl -X POST 'https://api.figtyp.net/telemetry/${num1}' -H 'Authorization: Bearer ${sym1}${wordA}_${num2}${sym2}' -d '{"acc": 98.${i % 9}}'`,
      `export const REGEX_${i} = /^[A-Z0-9_${sym1}]{3,16}@[a-z0-9-${sym2}]+\\.[a-z]{2,4}$/; // Test with ID #${num2}`
    ];

    const text = patterns[i % patterns.length];

    lessons.push({
      lessonId: `adv_${i}`,
      title: `Advanced Operator ${i}: Numeric & Symbol Matrices`,
      text,
      instructions: `High-density punctuation, digits, uppercase, and special characters (${sym1} ${sym2} ${sym3}). Strike precisely.`,
      targetKeys: [sym1, sym2, sym3, String(num1 % 10)],
      targetFinger: 'various',
      minWpm,
      minAccuracy,
      xpReward,
      coinsReward,
      order: i
    });
  }
  return lessons;
}

// 4. Generate 400 Pro Performance Lessons (Real code syntax, words increase by 5 per lesson sequentially, coins & XP +1 per lesson)
function generateProLessons() {
  const lessons = [];

  for (let i = 1; i <= 400; i++) {
    const xpReward = 149 + i; // 150 XP up to 549 XP (+1 per lesson)
    const coinsReward = 99 + i; // 100 Coins up to 499 Coins (+1 per lesson)
    const minWpm = Math.min(85, 45 + Math.floor(i * 0.1));
    const minAccuracy = Math.min(97, 93 + Math.floor(i * 0.01));

    const targetWords = 15 + (i - 1) * 5;

    const baseSnippet = CODE_TEMPLATES[(i - 1) % CODE_TEMPLATES.length];
    const wordsInBase = baseSnippet.split(/\s+/).length;
    let text = baseSnippet;

    if (targetWords > wordsInBase) {
      const extraNeeded = targetWords - wordsInBase;
      const extraCodeLines = [
        `// Step ${i}: Verify state consistency`,
        `if (!result) throw new Error("Null pointer at index ${i}");`,
        `const metrics = { wpm: ${60 + (i % 30)}, acc: 98, latencyMs: ${12 + (i % 20)} };`,
        `return { success: true, timestamp: Date.now(), data: result };`,
        `await database.transaction(async (tx) => { await tx.save(metrics); });`
      ];
      const addedWords = [];
      for (let w = 0; w < extraNeeded; w++) {
        const line = extraCodeLines[w % extraCodeLines.length];
        const lineWords = line.split(/\s+/);
        addedWords.push(lineWords[w % lineWords.length]);
      }
      text = baseSnippet + ' ' + addedWords.join(' ');
    }

    lessons.push({
      lessonId: `pro_${i}`,
      title: `Pro Lab ${i}: Multi-Language Code Architecture`,
      text,
      instructions: `Elite programming syntax and multi-token execution. Target clean typing cadence across ${targetWords} code words.`,
      targetKeys: ['all'],
      targetFinger: 'all',
      minWpm,
      minAccuracy,
      xpReward,
      coinsReward,
      order: i
    });
  }
  return lessons;
}

// Master seeder runner
async function seedAllCourses() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected.');

  console.log('Generating curriculum...');
  const beginnerLessons = generateBeginnerLessons();
  const intermediateLessons = generateIntermediateLessons();
  const advancedLessons = generateAdvancedLessons();
  const proLessons = generateProLessons();

  console.log(`- Beginner Foundation: ${beginnerLessons.length} lessons`);
  console.log(`- Intermediate Flow: ${intermediateLessons.length} lessons`);
  console.log(`- Advanced Operator: ${advancedLessons.length} lessons`);
  console.log(`- Pro Performance Lab: ${proLessons.length} lessons`);

  const coursesData = [
    {
      courseId: 'beginner_foundation',
      title: 'Beginner Foundation',
      description: 'Master home-row posture, touch typing foundations, and build instinctive motor memory across 100 progressive exercises.',
      difficulty: 'Beginner',
      category: 'Beginner',
      order: 1,
      lessons: beginnerLessons
    },
    {
      courseId: 'intermediate_flow',
      title: 'Intermediate Flow',
      description: 'Expand mental bandwidth with 200 progressive fluency drills, advancing by +1 word, +1 XP, and +1 coin per lesson.',
      difficulty: 'Intermediate',
      category: 'Intermediate',
      order: 2,
      lessons: intermediateLessons
    },
    {
      courseId: 'advanced_operator',
      title: 'Advanced Operator',
      description: 'Sharpen elite dexterity across 300 lessons combining uppercase, lowercase, numbers, and comprehensive special symbols.',
      difficulty: 'Advanced',
      category: 'Advanced',
      order: 3,
      lessons: advancedLessons
    },
    {
      courseId: 'pro_performance_lab',
      title: 'Pro Performance Lab',
      description: 'Master high-speed coding syntax across 400 exercises scaling by +5 words per lesson. Complete to unlock Platinum Hardcopy Diploma eligibility.',
      difficulty: 'Pro',
      category: 'Pro',
      order: 4,
      lessons: proLessons
    }
  ];

  for (const c of coursesData) {
    console.log(`Upserting course: ${c.title}...`);
    await Course.findOneAndUpdate(
      { courseId: c.courseId },
      { $set: c },
      { returnDocument: 'after', upsert: true }
    );
  }

  console.log('All 4 courses and 1,000 lessons successfully seeded into MongoDB!');
  process.exit(0);
}

seedAllCourses().catch(err => {
  console.error('Curriculum seeding failed:', err);
  process.exit(1);
});
