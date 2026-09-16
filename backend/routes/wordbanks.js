const express = require('express');
const WordBank = require('../models/WordBank');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const seedDefaultWordBanks = async () => {
  const count = await WordBank.countDocuments();
  if (count > 0) return;

  const defaultBanks = [
    {
      key: '10fastfingers_top200',
      title: '10FastFingers Top 200 Common English Words',
      category: 'common200',
      description: 'The standard 10FastFingers benchmark collection composed of the most frequently used 200 English words.',
      difficulty: 'Easy',
      words: [
        "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not",
        "on", "she", "at", "by", "this", "we", "you", "do", "but", "his", "from", "they", "say", "her", "she", "or", "an",
        "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which",
        "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year",
        "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over",
        "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want",
        "because", "any", "these", "give", "day", "most", "us", "great", "between", "need", "large", "under", "system",
        "group", "world", "number", "always", "next", "without", "program", "question", "work", "play", "small", "end", "put",
        "home", "read", "hand", "port", "spell", "air", "away", "house", "point", "page", "letter", "mother", "answer", "found",
        "study", "still", "learn", "should", "america", "world", "high", "every", "near", "add", "food", "between", "own",
        "below", "country", "plant", "last", "school", "father", "keep", "tree", "never", "start", "city", "earth", "eyes",
        "light", "thought", "head", "under", "story", "saw", "left", "don't", "few", "while", "along", "might", "close", "something"
      ]
    },
    {
      key: 'tech_neural_words',
      title: 'Neural Engineering & Modern Tech Words',
      category: 'tech',
      description: 'Elite computer science, software architecture, algorithm, and cloud computing vocabulary.',
      difficulty: 'Medium',
      words: [
        "absolute", "coalition", "deep-tech", "computing", "groups", "engineer", "virtual", "architectures", 
        "redefine", "standard", "digital", "interfaces", "computer", "programs", "structured", "logic", 
        "matrices", "resolve", "biometric", "keystroke", "coordinates", "mathematical", "precision", 
        "MiraCore", "Logix", "empowers", "software", "engineering", "scientists", "Daffodil", "International", 
        "University", "build", "premier", "neural", "typing", "arenas", "muscle", "memory", "elegant", 
        "neuro-motor", "pipeline", "requiring", "warmups", "deliberate", "practice", "persistent", "analysis", 
        "assessment", "keystrokes", "evaluate", "plateaus", "characters", "algorithms", "synergy", "cognitive", 
        "cybernetic", "bandwidth", "latency", "throughput", "compiler", "runtime", "optimization", "synthesizer", 
        "holographic", "interface", "protocol", "quantum", "encryption", "firewall", "mainframe", "database", 
        "distributed", "consensus", "cryptographic", "immutable", "ledger", "artificial", "intelligence", 
        "network", "synapse", "dendrite", "axon", "sensory", "feedback", "kinesthetic", "tactile", "dexterity", 
        "ergonomic", "velocity", "acceleration", "millisecond", "calibration", "diagnostic", "telemetry", 
        "stochastic", "gradient", "descent", "backpropagation", "tensor", "matrix", "vector", "dimension", 
        "recursion", "iteration", "polymorphism", "inheritance", "encapsulation", "abstraction", "asynchronous", 
        "concurrence", "multithreading", "parallelism", "scalability", "robustness", "modular", "syntactic", 
        "sugar", "bytecode", "interpreter", "executable", "firmware", "hardware", "biocompatible", "prosthetic", 
        "augmentation", "synthetic", "evolution", "singularity", "transcendence", "paradigm", "shift", 
        "disruption", "innovation", "enterprise", "ecosystem", "infrastructure", "deployment", "integration", 
        "verification", "diagnostics", "compiler", "execution", "concurrency", "performance", "responsive", 
        "automation", "machine", "learning", "neural-network", "cybersecurity", "analytics", "architecture"
      ]
    },
    {
      key: 'curated_developer_quotes',
      title: 'Timeless Software Engineering Quotes',
      category: 'quotes',
      description: 'Classic quotes from Edsger Dijkstra, Linus Torvalds, Martin Fowler, and computer pioneers.',
      difficulty: 'Medium',
      passages: [
        "Talk is cheap. Show me the code. Clean architecture is not about doing less work, but doing the right work with unyielding precision.",
        "Simplicity is prerequisite for reliability. Programs must be written for people to read, and only incidentally for machines to execute.",
        "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
        "Premature optimization is the root of all evil. Write clean, idiomatic logic first; profile real bottlenecks before modifying architecture.",
        "The function of good software is to make the complex appear effortless and to turn intricate logic into seamless human experiences."
      ]
    }
  ];

  await WordBank.insertMany(defaultBanks);
  console.log('Seeded default wordbanks & quote collections.');
};

// GET /api/wordbanks - Get all wordbanks
router.get('/', async (req, res) => {
  try {
    let banks = await WordBank.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    if (!banks || banks.length === 0) {
      await seedDefaultWordBanks();
      banks = await WordBank.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    }
    res.json(banks);
  } catch (error) {
    console.error('Failed to load wordbanks:', error);
    res.status(500).json({ error: 'Failed to load wordbanks' });
  }
});

// GET /api/wordbanks/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const banks = await WordBank.find({ category: req.params.category, isActive: true });
    res.json(banks);
  } catch (error) {
    console.error('Failed to load category wordbanks:', error);
    res.status(500).json({ error: 'Failed to load category wordbanks' });
  }
});

// Admin endpoints: CRUD
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, category, description, words, passages, difficulty } = req.body;
    if (!title) return res.status(400).json({ error: 'Wordbank title is required' });

    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-4);
    const bank = new WordBank({
      key,
      title,
      category: category || 'tech',
      description: description || '',
      words: Array.isArray(words) ? words : (words ? words.split(/[,\s]+/).filter(Boolean) : []),
      passages: Array.isArray(passages) ? passages : (passages ? [passages] : []),
      difficulty: difficulty || 'Medium',
      createdBy: req.user.id
    });

    await bank.save();
    res.status(201).json({ success: true, bank });
  } catch (error) {
    console.error('Failed to create wordbank:', error);
    res.status(500).json({ error: 'Failed to create wordbank' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, category, description, words, passages, difficulty, isActive } = req.body;
    const bank = await WordBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ error: 'Wordbank not found' });

    if (title !== undefined) bank.title = title;
    if (category !== undefined) bank.category = category;
    if (description !== undefined) bank.description = description;
    if (words !== undefined) {
      bank.words = Array.isArray(words) ? words : words.split(/[,\s]+/).filter(Boolean);
    }
    if (passages !== undefined) {
      bank.passages = Array.isArray(passages) ? passages : [passages];
    }
    if (difficulty !== undefined) bank.difficulty = difficulty;
    if (isActive !== undefined) bank.isActive = isActive;

    await bank.save();
    res.json({ success: true, bank });
  } catch (error) {
    console.error('Failed to update wordbank:', error);
    res.status(500).json({ error: 'Failed to update wordbank' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const bank = await WordBank.findByIdAndDelete(req.params.id);
    if (!bank) return res.status(404).json({ error: 'Wordbank not found' });
    res.json({ success: true, message: 'Wordbank deleted successfully' });
  } catch (error) {
    console.error('Failed to delete wordbank:', error);
    res.status(500).json({ error: 'Failed to delete wordbank' });
  }
});

module.exports = router;
