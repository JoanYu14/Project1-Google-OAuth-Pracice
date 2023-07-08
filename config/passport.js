// 這個檔案內的程式碼會在主要controller(app.js)直接require，在那邊直接執行全部程式碼，寫在這裡是為了程式碼簡潔
// 把跟Strategies有關的內容放進來，例如Google Strategy(Google的登入策略)
// 下面寫的執行順序是指OAuth開始後這些程式碼的執行順序，不是全部都照程式碼寫的順序執行的
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20"); // 取得一個function

const User = require("../models/user-models"); // 取得與users這個collection連接的model

// == 執行順序5 ==
// GoogleStratagy的第二個參數(函式)的第四個參數(done)被執行時，就會執行這個函式
// 可設定要將哪些 user 資訊，儲存在 Session 中的 passport.user。（如 user._id）
passport.serializeUser((user, done) => {
  // user參數會帶入我們存在mongoDB的document
  console.log("Serialize使用者");

  // done()執行時，將參數的值放入session內部，並且在用戶端設置cookie。
  return done(null, user._id); // 將moongoDB的document的id存在session
  // 並且將id簽名後，以cookie的形式寄給使用者
  // 設定req.isAuthenticated()為true，代表已經驗證這個使用者
});

// == 執行順序7 ==
// serializeUser完成後，Passport會執行callback URL的route。進入此route之後，Passport會執行deserializeUser()。
// 可藉由從 Session 中獲得的資訊去撈該 user 的資料。
passport.deserializeUser(async (_id, done) => {
  console.log(
    "Deserialize使用者...使用serializeUser儲存的id，去找到資料庫內的資料"
  );
  let foundUser = await User.findOne({ _id }).exec();
  done(null, foundUser); // 將req.user屬性設定為foundUser
});

// == 執行順序1 ==
// 設定 Google Strategies
// 1.設定參數 2.new 一個想使用的 Strategy 3.設定用來驗證的 callback。
// 這裡passport就會幫我們自動做OAuth的動作
passport.use(
  // 把GoogleStrategy當作一個constrctor，第一個參數為一個物件，passport根據在這個物件設定的clientID、clientScret屬性與客戶給的授權來跟Google的Authorization Server(授權伺服器)索取一個token
  // 索取到token之後passport就會跟Google的Resource Server(資源伺服器)索取這個客戶的資料
  // 第二個參數是一個function，完成驗證取得資料後就會執行
  new GoogleStrategy(
    {
      // == 執行順序2 ==
      // 把ID與Secret拿去做OAuth，最後會得到token與resource owner的資訊
      // ID與Secret都是.env內定義的環境變數
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // == 執行順序6 ==
      // serializeUser完成後，Passport會執行callback URL的route
      callbackURL: "http://localhost:8080/auth/google/redirect", // 如果所有驗證都完成了就把客戶導到這個route
    },

    // == 執行順序3 ==
    // 用戶端在Google登入頁面按下登入後，Passport會自動完成Oauth的步驟，取得用戶的資料。取得用戶的資料後會自動調用這個function
    // accessToken參數會放入從Google的Authroization Server(授權伺服器)拿到的token
    // profile會放入passport從Google取得的用戶資料。
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("進入Google Strategy的區域");

        // 去尋找users這個collection中是否有googleID為profile.id的document
        // 因為await所以會return執行的結果，有的話就是那個document，沒有的話就是null
        let foundUser = await User.findOne({ googleID: profile.id }).exec();
        if (foundUser) {
          console.log("使用者已經註冊過了，無須存入資料庫內");

          // == 執行順序4 ==
          // done被呼叫時passport會透過express-session套件去執行passport.serializeUser()
          // foundUserUser會帶入passport.serializeUser(uesr,done)的user這個參數內
          done(null, foundUser);
        } else {
          console.log("偵測到新用戶，須將資料需要存入資料庫內");
          // 把User這個model當作constructor來製作新物件(documnet)
          let newUser = new User({
            name: profile.displayName,
            googleID: profile.id,
            thumbnail: profile.photos[0].value,
            email: profile.emails[0].value,
          });

          // .save()會return在users這個collection新存入的document
          let saveUser = await newUser.save();
          console.log(saveUser);
          console.log("成功創建新用戶");

          // == 執行順序4 ==
          // done被呼叫時passport會透過express-session套件去執行passport.serializeUser()
          // saveUser會帶入passport.serializeUser(uesr,done)的user這個參數內
          done(null, saveUser);
        }
      } catch (e) {
        console.log(e);
      }
    }
  )
);
