const { sendSuccess, sendError } = require("../../utils/commonFunctions")
const { runQuery } = require("../../utils/executeQuery")
const moment = require('moment');

const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require("../users/functions/functions");

exports.request = async (req, res) => {

    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Referrer-Policy', 'no-referrer-when-downgrade');

    const redirectUrl = 'https://empapi.fpsjob.com/oauth'

    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_AUTH_CLIENT_ID,
        process.env.GOOGLE_AUTH_CLIENT_SECRET,
        redirectUrl
    )

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        prompt: 'consent'
    });

    return sendSuccess(res, { data: authorizeUrl, message: "authorizeUrl..." })


}


async function getUserData(access_token) {

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

    //console.log('response',response);
    const data = await response.json();
    console.log('data', data);
    return data
}


exports.oAuth = async (req, res) => {

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
                message: 'Email ID already registered, please login'
            }

            const dataEnco = JSON.stringify({ message: 'Success', userData });

            res.redirect(303, `http://localhost:5173/login/?data=${dataEnco}`);

        } else {

            const query = `INSERT INTO faculity_users (name, email, created_at) VALUES ( ?, ?, ?)`;

            const { insertId: userId } = await runQuery(query, [
                name,
                email,
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
                UID: userId
            }

            const dataEnco = await JSON.stringify({ message: 'Success', userData: main });

            console.log('dataEnco', dataEnco);

            res.redirect(303, `http://localhost:5173/?data=${dataEnco}`);

        }




    } catch (err) {
        console.log('Error logging in with OAuth2 user', err);
    }





};