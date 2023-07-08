// 所有跟Oauth有關的route都放在這裡
const express = require("express");
const router = express.Router();
const passport = require("passport"); // 得到一個物件
const User = require("../models/user-models");
const bcrypt = require("bcrypt"); // 要用bcrypt套件提供的功能來對密碼做bcrypt雜湊函式(鹽巴的部分套件會幫我們隨機選擇)

router.get("/login", (req, res) => {
  res.render("login", { user: req.user });
});

// req.logOut()可以用來登出使用者，passport會自動刪除session
// 參數要放一個function，callbackFn的參數事如果發生錯誤的話就會帶入，沒有的話就不會帶入東西
router.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return res.send(err); //
    } else {
      return res.redirect("/");
    }
  });
});

// ========================================================================================================
// 製作註冊本地會員
router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user }); // 讓signup可以根據user來判斷使用者的登入狀態
});

router.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // 確認密碼長度
    // 這裡雖然再signup.ejs的input標籤中有設定minlength
    // 但是如果客戶不是用頁面來填寫資料而是用例如postman寄出post request的話就不受8個字的限制了，因此這裡還需判斷
    if (password.length < 8) {
      // 設定key為error_msg的flash的值為第二個參數
      req.flash("error_msg", "密碼長度過短，至少需要8個數字或英文字");
      // 把客戶導回/auth/signup這個route，且此時req.flash("error_msg")就有值了
      return res.redirect("/auth/signup");
    }

    // 確認信箱是否被註冊過了
    const foundEmail = await User.findOne({ email }).exec();
    if (foundEmail) {
      // 如果有找到這個document
      req.flash(
        "error_msg",
        "此信箱已經被註冊過了。請使用別的信箱，或使用此信箱登入系統"
      );
      return res.redirect("/auth/signup");
    }

    // 以上都沒問題就可以把資料存入mongoDB中
    // 要先對password做brycpt雜湊函式，salt round設定12(此值越大，雜湊運算所需時間越久)
    let hashPassword = await bcrypt.hash(password, 12);
    // 把User這個model當成constructor來製作一個新物件(document)
    let newUser = new User({ name, email, password: hashPassword });
    // 將newUser存入users這個collection中，因為await關鍵字，所以這整個異步函式會停在這裡直到.save()執行完畢
    await newUser.save();
    req.flash("success_msg", "恭喜註冊成功!現在可以登入系統了!");
    return res.redirect("/auth/login");
  } catch (e) {}
});

// 製作本地登入會員
// 傳到/auth/login這個route的時候就會經過passport.authenticate()這個middleware，第一個參數"local”代表要用Local Strategy驗證。
// 使用Local Strategy有一個特別的地方是，要post到有使用passport.authenticate(”local”)的route，那個會post到這個route的form(login.ejs)，他的密碼的input的name一定要叫password，帳號的input的name一定要叫username，這樣username與password才能直接套到設定的new LocalStrategy(username,password,done)的參數內
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login", // 如果驗證失敗的話要把客戶導到/auth/login這個route
    failureFlash: "登入失敗，帳號或密碼不正確", // 如果驗證失敗的話要給的flash訊息，這個flash會被自動套入app.js的req.flash("err")的值
  }),
  (req, res) => {
    // 如果passport.authenticate("local")成功的話就會執行這個function
    // 把客戶導到/profile的route
    return res.redirect("/profile");
  }
);

// ========================================================================================================
// 製作Google登入
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
