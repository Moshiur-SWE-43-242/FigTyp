const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // কোন ইউজারের লগ
  actionType: { 
    type: String, 
    enum: ['PRACTICE', 'CONTEST_JOIN', 'CONTEST_FINISH', 'PROFILE_UPDATE', 'LEVEL_UP', 'CERTIFICATE_CLAIM', 'LOGIN'], 
    required: true 
  },
  details: { type: String, required: true }, // যেমন: "Joined Global Speed Match" বা "Scored 45 WPM"
  metadata: { type: Object }, // এক্সট্রা ডাটা যেমন WPM, Accuracy, Contest ID ইত্যাদি
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);