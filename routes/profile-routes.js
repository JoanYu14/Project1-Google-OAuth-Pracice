const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("profile", { user: req.user }); // 在deserializeUser()的done執行時，把req.user屬性設定為找到的document
});

module.exports = router;
