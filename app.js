// 製作一個登入系統(Request我是用Postman寄出的)

// dotenv套件可以將環境變量從.env文件加載到process.env物件裡面
require("dotenv").config(); // require dotenv套件後馬上.config()，dotenv套件

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-rotes"); // 得取auth-rotes.js的router
const profileRoutes = require("./routes/profile-routes");
require("./config/passport"); // 會自動執行passport.js的程式碼，因為檔案的所有程式碼被包在一個Function Expression內，這個function就是Module Wrapper，並且會被立即執行，就是IIFE
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// 連接到本機的MongoDB的exampleDB這個database
mongoose
  .connect("mongodb://127.0.0.1:27017/GoogleDB")
  .then(() => {
    console.log(
      "已成功連結到位於本機port 27017的mongoDB，並且連結到mongoDB中的GoogleDB這個database了"
    );
  })
  .catch((e) => {
    console.log(e);
  });

// 這裡設定了我們用的view engine是ejs，代表我們要渲染的東西都是ejs文件，這樣我們後面用res.render渲染ejs文件時都不用打附檔名了
app.set("view engine", "ejs");

// express.json()會去檢查requests的header有沒有Content-Type: application/json。如果有，就把text-based JSON換成JavaScript能夠存取的JSON物件，然後放入req.body。
app.use(express.json());
// express.urlencoded()會去檢查requests的header有沒有Content-Type: application/x-www-form-urlencoded （也就是去檢查是不是帶有資料的POST、PUT、PATCH）
// 如果有，也把text-based JSON換成JavaScript能夠存取的JSON物件然後放入req.body。
app.use(express.urlencoded({ extended: true }));

// 設定session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // 因為localhost沒有http"s"
  })
);

// 讓passport運行認證功能
// 在 middleware 中透過 passport.initialize() 來初始化 Passport
app.use(passport.initialize());

// 用以處理 Session。若有找到 passport.user，則判定其通過驗證，並呼叫 deserializeUser()。
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  // res.locals
  // 僅作用於該 request - response 的物件，因此只能在該 request-response 所轉譯的頁面取得
  // 所以不用在render的時候在另外給值，那個render的頁面能自動找到res.locals裡面的屬性

  // 讓Request寄來的時候就先設定這些資料在送到route中
  // 設定res.locals的這三個屬性為req.flash這三個key所對應的值(key所對應的value會再auth-routes的router裡面設定)
  // 並不是所有flash的key都會有對應的值，沒有的話就會是空字串
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// 經過上面的middleware傳下來的Request都會經過這裡檢查有沒有跟/auth有關的url，如果是有/auth有關的URL這個Request就會由authRoutes的Routes處理
app.use("/auth", authRoutes);

app.use("/profile", profileRoutes);

// ================================================================================================================
// Routes

app.get("/", (req, res) => {
  res.render("index", { user: req.user }); // 有登入過的客戶端寄來的Request就會有req.user，沒登入的就沒有
});

app.listen(8080, () => {
  console.log("伺服器正在聆聽port 8080....");
});
