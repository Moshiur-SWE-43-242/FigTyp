export type Role = 'GUEST' | 'GENERAL_USER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash?: string;
  role: Role;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActive: string; // ISO string
  createdAt: string;
  themePreference?: string;
  avatarUrl?: string;
  badges?: string[];
  completedLessons?: string[];
  phoneNumber?: string;
  bio?: string;
  country?: string;
  socialLink?: string;
  institute?: string;
  professionalRole?: string;
  emailVerified?: boolean;
  registrationId?: string;
  streakLastUpdated?: string;
}

export interface TypingAttempt {
  id: string;
  userId?: string;
  mode: 'time' | 'words' | 'quote' | 'code' | 'course';
  duration: number; // in seconds
  wordCount: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  createdAt: string;
  errorHeatmap?: Record<string, number>; // key: character, value: error count
}

export interface Contest {
  id: string;
  _id?: string;
  title: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'LOBBY' | 'INACTIVE' | 'CANCELLED';
  contestText: string;
  passage?: string;
  duration: number;
  shareCode: string;
  inviteCode?: string;
  shareUrl?: string;
  joinCode?: string;
  startTime?: string;
  endTime?: string;
  createdById?: string;
  createdAt: string;
  participants?: number;
  invitedUsers?: string[];
  logoUrl?: string;
  contestLogo?: string;
}

export interface ContestAttempt {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  progress: number; // 0 to 100
  correctChars: number;
  incorrectChars: number;
  completed: boolean;
  suspicious: boolean;
  finishedAt?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  category: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  _id?: string;
  title: string;
  text: string;
  instructions: string;
  targetKeys?: string[];
  targetFinger?: string;
  minWpm?: number;
  minAccuracy?: number;
  xpReward: number;
  coinsReward: number;
}

export interface WordBank {
  _id?: string;
  id?: string;
  key: string;
  title: string;
  category: 'tech' | 'common200' | 'common1000' | 'quotes' | 'code' | 'custom';
  description?: string;
  words?: string[];
  passages?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  isActive?: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  username?: string;
  fullName: string;
  institute?: string;
  wpm: number;
  accuracy: number;
  mode: string;
  issueDate: string;
  verificationUrl?: string;
  qrCodeData?: string;
  signature: string;
  status?: string;
  recipientEmail?: string;
  contestId?: string;
  contestTitle?: string;
  contestLogo?: string;
}

export interface AuditLog {
  id: string;
  _id?: string;
  userId?: string;
  action?: string;
  actionType?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface CMSNotice {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
}
