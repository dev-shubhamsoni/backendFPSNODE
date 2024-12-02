const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
dotenv.config({ path: "./.env" });
const moment = require('moment');

/* const cors = require("cors"); */
const { OAuth2Client } = require('google-auth-library');
const app = express();
const server = http.createServer(app);
const socketUtils = require("./utils/socketHandler");

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
/* var corsOptions = {
  origin: "*"
};
app.use(cors(corsOptions)); */
app.set("view engine", "ejs");

// Body parser middleware (if you choose to use it)
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Routes
const adminRoute = require("./routes/admin");
const instituteRoute = require("./routes/institute");
const userRoute = require("./routes/user");
const requestRoute = require("./routes/requests");
const { generateToken } = require("./controllers/users/functions/functions");
const { runQuery } = require("./utils/executeQuery");

app.use("/admin", adminRoute);
app.use("/institute", instituteRoute);
app.use("/user", userRoute);
app.use("/request", requestRoute);

async function getUserData(access_token) {

  const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

  //console.log('response',response);
  const data = await response.json();
  console.log('data', data);
  return data
}


app.get('/oauth', async (req, res) => {



  const code = req.query.code;

  console.log(code);

  try {
    const redirectURL = "https://empapi.fpsjob.com/oauth"
    const oAuth2Clientt = new OAuth2Client(
      process.env.GOOGLE_AUTH_CLIENT_ID,

      process.env.GOOGLE_AUTH_CLIENT_SECRET,
      redirectURL
    );
    const r = await oAuth2Clientt.getToken(code);

    // console.log(r);

    // Make sure to set the credentials on the OAuth2 client.
    await oAuth2Clientt.setCredentials(r.tokens);
    console.info('Tokens acquired.');
    const user = oAuth2Clientt.credentials;
    console.log('credentials', user);
    const data = await getUserData(oAuth2Clientt.credentials.access_token);

    const { name, email } = data;

    const checkForEmail = await runQuery(
      `SELECT email FROM faculity_users WHERE email = ?`,
      [email]
    );

    console.log('checkForEmail', checkForEmail);

    if (checkForEmail?.length > 0) {

      const userData = {
        status: false,
        message: 'Email ID already registered, please login',
        loginToken: '',
        UID: '',
      }

      const dataEnco = JSON.stringify({ message: 'Success', userData });

      res.redirect(303, `https://tallento.ai/login/?data=${dataEnco}`);

    } else {

      const query = `INSERT INTO faculity_users (name, email, job_function, industry_type, created_at) VALUES ( ?, ?, ?,?,?)`;

      const { insertId: userId } = await runQuery(query, [
        name,
        email,
        0,
        0,
        moment().format('YYYY-MM-DD HH:mm:ss')
      ]);

      const token = await generateToken();

      const updateResult = await runQuery(
        `UPDATE faculity_users SET login_token = ? WHERE faculityID = ?`,
        [token, userId]
      );

      console.log('updateResult', updateResult);

      const main = {
        status: "success",
        loginToken: token,
        UID: userId,
        message: 'Account registered'

      }

      const dataEnco = await JSON.stringify({ message: 'Success', userData: main });

      console.log('dataEnco', dataEnco);

      res.redirect(303, `https://tallento.ai/dashboard/profile?profile=${dataEnco}`);

    }




  } catch (err) {
    console.log('Error logging in with OAuth2 user', err);
  }




});



// Web Socket
socketUtils.setupSocket(server);

// const PORT = process.env.PORT || 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is started on port ${PORT}`);
});

app.use("/uploads", express.static("uploads"));
// Login Token
// glpat-ShE4Rqn2c8JztQJE6iJp
