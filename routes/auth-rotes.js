// 所有跟Oauth有關的route都放在這裡
const express = require("express");
const router = express.Router();
const passport = require("passport"); // 得到一個物件

router.get("/login", (req, res) => {
  res.render("login");
});

router.get(
  "/google",
  // 用以驗證使用者。可設定要採用的 Strategy、驗證成功與失敗導向的頁面。Google的Strategy設定在config資料夾的passport.js這個檔案內
  // passport物件的authenticate這個method，本身是一個middleware，第一個參數放入"google"代表我們要用google的authenticate(認證)
  // 第二個參數是一個物件
  passport.authenticate("google", {
    // scope屬性要設定一個陣列，裡面就放我們要從Google的resource server中拿到什麼資料
    // profile舊式個人資料
    scope: ["profile", "email"],
    // 設定prompt: "select_account"讓使用者每次到登入頁面可以選擇一個Google帳號做登入
    prompt: "select_account",
  })
);

// 要在這個route加上passport.authenticate("google")這個middleware是因為通過驗證才能使用這個route
// 通過驗證的客戶會被導到這個route
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  // 把客戶重新導向到profile這個route
  res.redirect("/profile");
});

// 把整個router物件取代module.exports物件，這樣app.js在require(”auth-routes”)時得到的東西就是整個router
module.exports = router;
