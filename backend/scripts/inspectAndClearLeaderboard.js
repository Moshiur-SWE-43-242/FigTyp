const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function clearLeaderboard() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB!');

    const Attempt = mongoose.model('Attempt', new mongoose.Schema({}, { strict: false }));

    const totalBefore = await Attempt.countDocuments();
    const practiceAttempts = await Attempt.countDocuments({
      $or: [
        { contestId: { $exists: false } },
        { contestId: null },
        { contestId: '' }
      ]
    });

    console.log(`Total attempts before: ${totalBefore}`);
    console.log(`Practice attempts to delete: ${practiceAttempts}`);

    const result = await Attempt.deleteMany({
      $or: [
        { contestId: { $exists: false } },
        { contestId: null },
        { contestId: '' }
      ]
    });

    console.log(`Successfully deleted ${result.deletedCount} practice attempt(s)!`);

    const remaining = await Attempt.countDocuments();
    console.log(`Remaining attempts (contests, etc.): ${remaining}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error clearing leaderboard data:', err);
    process.exit(1);
  }
}

clearLeaderboard();
