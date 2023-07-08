const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  author: String,
});

// 這個model會跟database中的posts這個collection有連結
module.exports = mongoose.model("Post", postSchema);
