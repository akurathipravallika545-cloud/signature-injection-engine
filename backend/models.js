const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  pdfId: String,
  pageNumber: Number,
  originalHash: String,
  finalHash: String,
  createdAt: Date
});

const Audit = mongoose.model('Audit', AuditSchema);

async function connectMongo() {
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/sigdb';
  return mongoose.connect(MONGO);
}

module.exports = {connectMongo, Audit};
