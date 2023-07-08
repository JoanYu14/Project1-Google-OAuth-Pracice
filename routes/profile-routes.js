const express = require("express");
const router = express.Router();

// profile的route應該要被保護，就是有驗證過的人才可以使用這個route
// 製作一個叫做authCheck的middleware放在route中
const authCheck = (req, res, next) => {
  // 如果有使用Google登入驗證完成的話，在serializeUser()的done被執行的時候，就會設定req.isAuthenticated()為true
  // 因此可以用這個來確認是否有驗證過，有的話才能執行route的callbackFn
  if (req.isAuthenticated()) {
    next();
  } else {
    // 如果沒登入的話就把這個客戶導向登入的頁面
    return res.redirect("/auth/login");
  }
};

router.get("/", authCheck, (req, res) => {
  res.render("profile", { user: req.user }); // 在deserializeUser()的done執行時，把req.user屬性設定為找到的document
});

module.exports = router;
