const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Initial catalog seeder if database courses collection is empty
const seedDefaultCourses = async () => {
  const count = await Course.countDocuments();
  if (count > 0) return;

  const defaultCatalog = [
    {
      courseId: 'beginner_foundation',
      title: 'Beginner Foundation',
      description: 'Start with home-row habits, steady finger placement, and clean keystrokes for confident first steps.',
      difficulty: 'Beginner',
      category: 'Beginner',
      order: 1,
      lessons: [
        {
          lessonId: 'beg_1',
          title: 'Home Row Index (F & J)',
          text: 'ffff jjjj fjfj jfjf ff jj fj jf ffjj jjff',
          instructions: 'Place your left index finger on F and right index finger on J. Feel the tactile bumps on the keys.',
          targetKeys: ['f', 'j'],
          targetFinger: 'index',
          minWpm: 15,
          minAccuracy: 92,
          xpReward: 25,
          coinsReward: 15,
          order: 1
        },
        {
          lessonId: 'beg_2',
          title: 'Home Row Middle (D & K)',
          text: 'dddd kkkk dkdk kdkd df jk fd kj dk fj',
          instructions: 'Use your left middle finger for D and right middle finger for K. Keep your palms gently elevated.',
          targetKeys: ['d', 'k'],
          targetFinger: 'middle',
          minWpm: 18,
          minAccuracy: 92,
          xpReward: 30,
          coinsReward: 20,
          order: 2
        },
        {
          lessonId: 'beg_3',
          title: 'Home Row Ring & Pinky (S, A, L, ;)',
          text: 'aaaa ssss llll ;;;; asdf ;lkj asdf ;lkj salsa flask salad',
          instructions: 'Engage your ring and pinky fingers. Practice slow, steady muscle memory before picking up speed.',
          targetKeys: ['a', 's', 'l', ';'],
          targetFinger: 'pinky',
          minWpm: 20,
          minAccuracy: 90,
          xpReward: 35,
          coinsReward: 25,
          order: 3
        },
        {
          lessonId: 'beg_4',
          title: 'Top Row Reach (E & I)',
          text: 'dede kiki deki fide life side like feed silk file leaf',
          instructions: 'Reach up from D to E with your left middle finger, and from K to I with your right middle finger.',
          targetKeys: ['e', 'i'],
          targetFinger: 'middle',
          minWpm: 22,
          minAccuracy: 90,
          xpReward: 40,
          coinsReward: 30,
          order: 4
        },
        {
          lessonId: 'beg_5',
          title: 'Top Row Index (R & U)',
          text: 'frfr juju fur run user rude rule true sure surf rude',
          instructions: 'Reach upward with your index fingers to tap R and U, returning immediately to the home row.',
          targetKeys: ['r', 'u'],
          targetFinger: 'index',
          minWpm: 25,
          minAccuracy: 90,
          xpReward: 45,
          coinsReward: 35,
          order: 5
        }
      ]
    },
    {
      courseId: 'intermediate_flow',
      title: 'Intermediate Flow',
      description: 'Grow into balanced pacing, punctuation control, and natural sentence transitions.',
      difficulty: 'Intermediate',
      category: 'Intermediate',
      order: 2,
      lessons: [
        {
          lessonId: 'int_1',
          title: 'Shift Key & Capitalization',
          text: 'Java Python Rust React Node Docker Linux GitHub Figma Agile',
          instructions: 'Use the opposite pinky to hold Shift while striking the letter with the other hand.',
          targetKeys: ['Shift', 'J', 'P', 'R'],
          targetFinger: 'pinky',
          minWpm: 30,
          minAccuracy: 92,
          xpReward: 50,
          coinsReward: 35,
          order: 1
        },
        {
          lessonId: 'int_2',
          title: 'Punctuation Precision',
          text: 'Speed is good, but precision is gold. Keep rhythm alive; steady wins every race.',
          instructions: 'Pay close attention to commas, periods, and semicolons without breaking your typing pace.',
          targetKeys: [',', '.', ';'],
          targetFinger: 'ring',
          minWpm: 35,
          minAccuracy: 92,
          xpReward: 55,
          coinsReward: 40,
          order: 2
        },
        {
          lessonId: 'int_3',
          title: 'Number Row Fundamentals',
          text: 'Release 1.0 launched in 2024 with 48 active engineers and 365 test rounds.',
          instructions: 'Reach to the number row with finger columns. Try not to glance down at the keyboard.',
          targetKeys: ['1', '2', '3', '4', '8'],
          targetFinger: 'various',
          minWpm: 32,
          minAccuracy: 90,
          xpReward: 60,
          coinsReward: 45,
          order: 3
        }
      ]
    },
    {
      courseId: 'advanced_operator',
      title: 'Advanced Operator',
      description: 'Train for technical accuracy, code syntax, and the rapid burst stamina needed for elite typing.',
      difficulty: 'Advanced',
      category: 'Advanced',
      order: 3,
      lessons: [
        {
          lessonId: 'adv_1',
          title: 'Developer Syntax & Symbols',
          text: 'const calculateWpm = (chars, seconds) => Math.round((chars / 5) / (seconds / 60));',
          instructions: 'Code requires arrow brackets, equal signs, parentheses, and semicolons. Strike with deliberate care.',
          targetKeys: ['=', '>', '(', ')', ';'],
          targetFinger: 'pinky',
          minWpm: 40,
          minAccuracy: 93,
          xpReward: 70,
          coinsReward: 50,
          order: 1
        },
        {
          lessonId: 'adv_2',
          title: 'Async & Promise Patterns',
          text: 'async function fetchTelemetryData(token) { const res = await fetch("/api/stats"); return res.json(); }',
          instructions: 'Type async JavaScript patterns fluently while maintaining rhythm and 0 backspaces.',
          targetKeys: ['{', '}', '"', '/', '.'],
          targetFinger: 'various',
          minWpm: 45,
          minAccuracy: 94,
          xpReward: 75,
          coinsReward: 55,
          order: 2
        }
      ]
    },
    {
      courseId: 'pro_performance_lab',
      title: 'Pro Performance Lab',
      description: 'Blend complex technical vocabulary, prose, and fast-twitch keystroke velocity.',
      difficulty: 'Pro',
      category: 'Pro',
      order: 4,
      lessons: [
        {
          lessonId: 'pro_1',
          title: 'Neural Architecture & Systems',
          text: 'Distributed consensus requires cryptographic integrity, low-latency gossip protocols, and fault-tolerant state machines.',
          instructions: 'High complexity multi-syllabic technical words. Build effortless muscle memory.',
          targetKeys: ['-'],
          targetFinger: 'various',
          minWpm: 55,
          minAccuracy: 95,
          xpReward: 90,
          coinsReward: 70,
          order: 1
        },
        {
          lessonId: 'pro_2',
          title: 'Godlike Velocity Benchmark',
          text: 'True mastery is the synthesis of unhesitating accuracy, relaxed wrists, and consistent rhythmic cadences.',
          instructions: 'Push your peak velocity past 80+ WPM without sacrificing a single percent of accuracy.',
          targetKeys: ['all'],
          targetFinger: 'all',
          minWpm: 70,
          minAccuracy: 96,
          xpReward: 120,
          coinsReward: 100,
          order: 2
        }
      ]
    }
  ];

  await Course.insertMany(defaultCatalog);
  console.log('Seeded default typing courses catalog.');
};

let cachedCourses = null;
let lastCoursesCacheTime = 0;
const COURSES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const invalidateCoursesCache = () => {
  cachedCourses = null;
  lastCoursesCacheTime = 0;
};

// GET /api/lessons - Publicly retrieve all courses and lessons (Instant cached response)
router.get('/', async (req, res) => {
  try {
    if (cachedCourses && (Date.now() - lastCoursesCacheTime < COURSES_CACHE_TTL)) {
      return res.json(cachedCourses);
    }

    let courses = await Course.find({ isActive: true }).sort({ order: 1 }).lean();
    if (!courses || courses.length === 0) {
      await seedDefaultCourses();
      courses = await Course.find({ isActive: true }).sort({ order: 1 }).lean();
    }

    // Format for frontend
    const formatted = courses.map(c => ({
      id: c.courseId || String(c._id),
      _id: c._id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      category: c.category,
      order: c.order,
      lessons: (c.lessons || []).map(l => ({
        id: l.lessonId || String(l._id),
        _id: l._id,
        title: l.title,
        text: l.text,
        instructions: l.instructions,
        targetKeys: l.targetKeys || [],
        targetFinger: l.targetFinger || 'index',
        minWpm: l.minWpm || 15,
        minAccuracy: l.minAccuracy || 90,
        xpReward: l.xpReward || 25,
        coinsReward: l.coinsReward || 15,
        order: l.order || 0
      }))
    }));

    cachedCourses = formatted;
    lastCoursesCacheTime = Date.now();
    res.json(formatted);
  } catch (error) {
    console.error('Failed to load courses:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

// User: Get persistent progress across curriculum
router.get('/user-progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      completedLessons: user.completedLessons || [],
      badges: user.badges || [],
      xp: user.xp || 0,
      coins: user.coins || 0
    });
  } catch (error) {
    console.error('Failed to get user progress:', error);
    res.status(500).json({ error: 'Failed to get user course progress' });
  }
});

// User: Complete a lesson, award rewards, and award course graduation badges
router.post('/complete-lesson', protect, async (req, res) => {
  try {
    const { lessonId, courseId, xpReward = 25, coinsReward = 15, wpm = 30, accuracy = 90 } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.completedLessons) user.completedLessons = [];
    if (!user.badges) user.badges = [];

    const isFirstTime = !user.completedLessons.includes(lessonId);
    if (isFirstTime) {
      user.completedLessons.push(lessonId);
      user.xp = (user.xp || 0) + Number(xpReward);
      user.coins = (user.coins || 0) + Number(coinsReward);
      user.level = Math.max(1, Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1);
    }

    // Check course completion status
    let courseCompleted = false;
    let badgeAwarded = null;

    if (courseId) {
      const course = await Course.findOne({
        $or: [
          { courseId },
          ...(mongoose.isValidObjectId(courseId) ? [{ _id: courseId }] : [])
        ],
        isActive: true
      });
      if (course && course.lessons && course.lessons.length > 0) {
        const allLessonIds = course.lessons.map(l => l.lessonId || String(l._id));
        const completedCount = allLessonIds.filter(id => user.completedLessons.includes(id)).length;
        
        if (completedCount >= allLessonIds.length) {
          courseCompleted = true;
          const BADGE_MAP = {
            'beginner_foundation': 'COURSE_BEGINNER',
            'intermediate_flow': 'COURSE_INTERMEDIATE',
            'advanced_operator': 'COURSE_ADVANCED',
            'pro_performance_lab': 'COURSE_PRO',
            'Beginner': 'COURSE_BEGINNER',
            'Intermediate': 'COURSE_INTERMEDIATE',
            'Advanced': 'COURSE_ADVANCED',
            'Pro': 'COURSE_PRO'
          };
          const targetBadge = BADGE_MAP[course.courseId] || BADGE_MAP[course.category] || BADGE_MAP[course.difficulty] || BADGE_MAP[courseId];
          if (targetBadge && !user.badges.includes(targetBadge)) {
            user.badges.push(targetBadge);
            badgeAwarded = targetBadge;
            
            // Record graduation in ActivityLog
            try {
              await ActivityLog.create({
                userId: String(user._id),
                actionType: 'LEVEL_UP',
                details: `Graduated from ${course.title}! Awarded badge: ${targetBadge}`,
                metadata: { courseId: course.courseId, badge: targetBadge, wpm, accuracy }
              });
            } catch (logErr) {
              console.warn('Could not create graduation activity log:', logErr);
            }
          }
        }
      }
    }

    await user.save();

    res.json({
      success: true,
      completedLessons: user.completedLessons,
      badges: user.badges,
      xp: user.xp,
      coins: user.coins,
      level: user.level,
      isFirstTime,
      courseCompleted,
      badgeAwarded
    });
  } catch (error) {
    console.error('Failed to complete lesson:', error);
    res.status(500).json({ error: error.message || 'Failed to complete lesson' });
  }
});

// Admin endpoints: Create/Update/Delete courses & lessons
router.post('/course', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, difficulty, category, order } = req.body;
    if (!title) return res.status(400).json({ error: 'Course title is required' });

    const courseId = title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-4);
    const course = new Course({
      courseId,
      title,
      description: description || '',
      difficulty: difficulty || 'Beginner',
      category: category || 'General',
      order: order || 0,
      lessons: [],
      createdBy: req.user.id
    });

    await course.save();
    invalidateCoursesCache();
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('Failed to create course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/course/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, difficulty, category, order, isActive } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (difficulty !== undefined) course.difficulty = difficulty;
    if (category !== undefined) course.category = category;
    if (order !== undefined) course.order = order;
    if (isActive !== undefined) course.isActive = isActive;
    course.updatedBy = req.user.id;

    await course.save();
    invalidateCoursesCache();
    res.json({ success: true, course });
  } catch (error) {
    console.error('Failed to update course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/course/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    invalidateCoursesCache();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Failed to delete course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Add a lesson to a course
router.post('/course/:id/lesson', protect, adminOnly, async (req, res) => {
  try {
    const { title, text, instructions, targetKeys, targetFinger, minWpm, minAccuracy, xpReward, coinsReward, order } = req.body;
    if (!title || !text) return res.status(400).json({ success: false, error: 'Lesson title and practice text are required' });

    let course = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      course = await Course.findById(req.params.id);
    }
    if (!course) {
      course = await Course.findOne({ courseId: req.params.id });
    }
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const lessonId = `les_${Date.now().toString().slice(-6)}`;
    const newLesson = {
      lessonId,
      title: title.trim(),
      text: text.trim(),
      instructions: instructions || '',
      targetKeys: Array.isArray(targetKeys) ? targetKeys : (targetKeys ? [targetKeys] : []),
      targetFinger: targetFinger || 'index',
      minWpm: Number(minWpm) || 20,
      minAccuracy: Number(minAccuracy) || 90,
      xpReward: Number(xpReward) || 30,
      coinsReward: Number(coinsReward) || 20,
      order: Number(order) || (course.lessons.length + 1)
    };

    course.lessons.push(newLesson);
    if (mongoose.Types.ObjectId.isValid(req.user?.id)) {
      course.updatedBy = req.user.id;
    }
    await course.save();
    invalidateCoursesCache();

    res.status(201).json({ success: true, lesson: newLesson, course });
  } catch (error) {
    console.error('Failed to add lesson:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to add lesson' });
  }
});

// Update a specific lesson within a course
router.put('/course/:courseId/lesson/:lessonId', protect, adminOnly, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const {
      title,
      text,
      instructions,
      targetKeys,
      targetFinger,
      minWpm,
      minAccuracy,
      xpReward,
      coinsReward,
      order
    } = req.body;

    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ courseId });
    }
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const lesson = course.lessons.find(
      l => l.lessonId === lessonId || String(l._id) === lessonId || l.id === lessonId
    );
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found in this track' });

    if (title !== undefined) lesson.title = title.trim();
    if (text !== undefined) lesson.text = text.trim();
    if (instructions !== undefined) lesson.instructions = instructions;
    if (targetKeys !== undefined) {
      lesson.targetKeys = Array.isArray(targetKeys) ? targetKeys : (targetKeys ? [targetKeys] : []);
    }
    if (targetFinger !== undefined) lesson.targetFinger = targetFinger;
    if (minWpm !== undefined) lesson.minWpm = Number(minWpm) || lesson.minWpm;
    if (minAccuracy !== undefined) lesson.minAccuracy = Number(minAccuracy) || lesson.minAccuracy;
    if (xpReward !== undefined) lesson.xpReward = Number(xpReward) || lesson.xpReward;
    if (coinsReward !== undefined) lesson.coinsReward = Number(coinsReward) || lesson.coinsReward;
    if (order !== undefined) lesson.order = Number(order) || lesson.order;

    if (mongoose.Types.ObjectId.isValid(req.user?.id)) {
      course.updatedBy = req.user.id;
    }
    await course.save();
    invalidateCoursesCache();

    res.json({ success: true, message: 'Lesson updated successfully', lesson, course });
  } catch (error) {
    console.error('Failed to update lesson:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update lesson' });
  }
});

// Delete a lesson from a course
router.delete('/course/:courseId/lesson/:lessonId', protect, adminOnly, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ courseId });
    }
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const prevLength = course.lessons.length;
    course.lessons = course.lessons.filter(
      l => l.lessonId !== lessonId && String(l._id) !== lessonId && l.id !== lessonId
    );

    if (course.lessons.length === prevLength) {
      return res.status(404).json({ success: false, error: 'Lesson not found in track' });
    }

    if (mongoose.Types.ObjectId.isValid(req.user?.id)) {
      course.updatedBy = req.user.id;
    }
    await course.save();
    invalidateCoursesCache();

    res.json({ success: true, message: 'Lesson deleted successfully', course });
  } catch (error) {
    console.error('Failed to delete lesson:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete lesson' });
  }
});

module.exports = router;
