#!/usr/bin/env node

/**
 * CMS Seed Script - Initialize database with default CMS content
 * Run with: node backend/scripts/seedCMS.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CMSContent = require('../models/CMSContent');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/figtyp';

const defaultContent = [
  // Timeline Content
  {
    contentType: 'timeline',
    key: 'timeline_item_1',
    title: 'M-Square Devs Group Began',
    shortDescription: 'The consortium started shaping immersive learning architecture and premium interface systems.',
    fullDescription: 'The M-Square Devs Group consortium was formally established to architect and deliver FigTyp\'s immersive learning ecosystem. The team focused on designing modular curriculum architecture, premium user interfaces, and comprehensive learning pathways that prioritize both engagement and educational rigor.',
    date: 'Feb 2025',
    color: 'purple',
    order: 1,
    isActive: true
  },
  {
    contentType: 'timeline',
    key: 'timeline_item_2',
    title: 'Platform Expansion',
    shortDescription: 'The product research arm advanced typing intelligence, certification systems, and cognitive workflow design.',
    fullDescription: 'Platform expansion phase saw significant advancement in typing intelligence algorithms, real-time analytics engines, and professional certification systems. The team integrated cognitive workflow design patterns to maximize skill retention and performance tracking capabilities.',
    date: 'Oct 2025',
    color: 'cyan',
    order: 2,
    isActive: true
  },
  {
    contentType: 'timeline',
    key: 'timeline_item_3',
    title: 'Daffodil SWE Alliance',
    shortDescription: 'Moshiur Riat commences prototyping the FigTyp modular design specs.',
    fullDescription: 'A strategic alliance was formed with Daffodil International University to prototype and validate FigTyp\'s modular design specifications. This collaboration brought academic rigor and engineering excellence to the platform\'s core architecture, ensuring scalability and reliability.',
    date: '2026, Q4',
    color: 'emerald',
    order: 3,
    isActive: true
  },
  {
    contentType: 'timeline',
    key: 'timeline_item_4',
    title: 'FigTyp Arena Launched',
    shortDescription: 'Officially entered commercial status offering global neural typist arenas.',
    fullDescription: 'FigTyp Arena officially launched as a commercial platform, introducing competitive typing arenas with real-time multiplayer capabilities, professional-grade performance analytics, and certification programs for global users seeking to master typing as a core professional skill.',
    date: '2026',
    color: 'teal',
    order: 4,
    isActive: true
  },
  // Company Info
  {
    contentType: 'company_info',
    key: 'msquare_devs_group',
    title: 'M-Square Devs Group',
    shortDescription: 'Designing immersive learning journeys with premium interface systems.',
    fullDescription: 'M-Square Devs Group is the platform design and delivery partner for FigTyp, engineering the modular curriculum, user experience, and immersive course architecture that make the platform feel premium, motivating, and easy to adopt. Every lesson, visual system, and reward loop is shaped to support skill progression while preserving the polished look and feel of a modern developer learning arena.',
    order: 1,
    isActive: true
  },
  // Hero Section
  {
    contentType: 'hero',
    key: 'hero_main',
    title: 'Master Typing. Master Speed. Master Your Craft.',
    shortDescription: 'The world\'s most advanced competitive typing arena for developers and professionals.',
    fullDescription: 'FigTyp combines low-latency gaming infrastructure, real-time multiplayer competition, and professional-grade analytics to create the ultimate typing mastery platform. Train like a pro. Race like a champion. Certify your skill.',
    order: 1,
    isActive: true
  },
  // Contest template section
  {
    contentType: 'contest_template',
    key: 'contest_template_default',
    title: 'Default Contest Template',
    shortDescription: 'Template used for generated contest sessions and challenge cards.',
    fullDescription: 'This template outlines the default contest branding, challenge metadata, and progression flow for newly created contest rooms.',
    data: {
      mode: 'speed',
      difficulty: 'beginner',
      durationMinutes: 10
    },
    order: 1,
    isActive: true
  }
];

async function seedCMS() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing CMS content
    await CMSContent.deleteMany({});
    console.log('Cleared existing CMS content');

    // Insert default content
    const result = await CMSContent.insertMany(defaultContent);
    console.log(`✓ Seeded ${result.length} CMS items`);

    // Display summary
    const summary = await CMSContent.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } }
    ]);

    console.log('\nContent Summary:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} items`);
    });

    console.log('\n✓ CMS seed completed successfully!');
  } catch (error) {
    console.error('CMS seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedCMS();
