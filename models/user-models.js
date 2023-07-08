const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 255,
  },
  // 用本地端登入就不會有googleID
  googleID: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now, // date屬性預設就是當下的時間
  },
  // 縮圖也只有google登入的人有圖片
  thumbnail: {
    type: String,
  },
  // 本地端或Google登入都有email
  email: {
    type: String,
  },
  // 只有本地端登入才有password
  password: {
    type: String,
    minLength: 8,
    maxLength: 1024,
  },
});

// 這個model會跟database中的users這個collection有連結
module.exports = mongoose.model("User", userSchema);
