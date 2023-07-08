const express = require("express");
const router = express.Router();
const Post = require("../models/post-model"); // 取得與posts這個collection連結的model

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

router.get("/", authCheck, async (req, res) => {
  // 當初在製作要存到posts這個collection的新document時，屬性author的值就是req.user._id
  // 所以可以用Post.find({ author: req.user._id })來找到所有這個user製作的posts裡的document
  let foundPosts = await Post.find({ author: req.user._id }); // return一個array

  // 在deserializeUser()的done執行時，把req.user屬性設定為找到的users這個collection的document
  // 把foundPosts設定為posts屬性的值一起送到profile.ejs內
  return res.render("profile", { user: req.user, posts: foundPosts });
});

// 跟會員新增POST有關的routes
// 到這個route就會給客戶一個有表單的頁面(post.ejs)
router.get("/post", authCheck, (req, res) => {
  return res.render("post", { user: req.user });
});

//
router.post("/post", authCheck, async (req, res) => {
  let { title, content } = req.body;
  let newPost = new Post({ title, content, author: req.user._id }); // 在deserializeUser()的done執行時，把req.user屬性設定為找到的document
  try {
    await newPost.save();
    return res.redirect("/profile");
  } catch (e) {
    // 因為在postSchema中有設定title與content都是必要的，所以如果沒有填寫的話.save()會出錯
    req.flash("error_msg", "標題與內容都需要填寫");
    return res.redirect("/profile/post");
  }
});
module.exports = router;
