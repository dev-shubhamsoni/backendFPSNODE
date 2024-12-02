const admin = require('firebase-admin')
const serviceAccount = require('./firebase_key.json')
const jwt = require('jsonwebtoken')
const { sendSuccess, sendError } = require('./commonFunctions')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://fpsjobs-1516428149169.firebaseio.com'
})

exports.validateUID = async (id) => {
  try {
    await admin.auth().getUser(id)
    return true
  } catch (error) {
    return false
  }
}

const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n')


exports.createToken = async (id) => {
  // try {
  //   const expirationInMilliseconds = 3 * 30 * 24 * 60 * 60 * 1000;
  //   const {token} = await admin.auth().createCustomToken(id, { expirationInMilliseconds })
  //   console.log(token);
  //  // const idToken = await admin.auth().verifyIdToken(token)
  //   return token
  // } catch (error) {
  //   throw new Error(error)
  // }

  try {
    const expiresIn = 3 * 30 * 24 * 60 * 60 * 1000
    const token = jwt.sign({ id }, privateKey, {
      algorithm: 'RS256',
      issuer: serviceAccount.client_email,
      subject: serviceAccount.client_email,
      audience: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      expiresIn
    })
    return token
  } catch (error) {
    throw new Error(error)
  }
}

exports.verifyToken = async (token) => {
  // try {
  //   const decode = await admin.auth().verifyIdToken(token)
  //   return decode
  // } catch (error) {
  //   throw new Error(error)
  // }

  try {
    const data = jwt.verify(token, privateKey, { algorithms: ['RS256'] })
    return data
  } catch (error) {
    throw new Error(error)
  }
}


exports.sendNotification = async (req, res) => {
  try {
    const { title = "Test", description, token } = req.body
    // let payload = {
    //   notification:{
    //     title:title,
    //     body:description
    //   }
    // }
    // const data = await admin.messaging().sendToDevice(token,payload)

    const message = {
      data: {
        title: title,
        body: description,
        sound: ""
      },
      token: token
    };
    if (dData) {
      payload.data = dData;
    }
    admin.messaging().send(message)
      .then((response) => {
        console.log('Notification sent:', response);
      })
      .catch((error) => {
        console.error('Error sending notification:', error);
      });

    return sendSuccess(res, { data: data, message: "....." })
  } catch (error) {
    return sendError(res, { message: error.message })
  }
}

exports.sendNotificationToFaculity = async (token, notification, jobUrl = "", imageUrl = "", dData) => {
  try { 
    const message = {
      // notification: {
      //   title: notification?.title,
      //   body: notification?.body, 
      // },
      data: {
        title: notification?.title,
        message: notification?.body, 
        job_url: jobUrl,
        imageUrl: imageUrl,
      },
      apns: {
        payload: {
          aps: {
            sound: "default", // Ensure sound is set for iOS
          },
        },
      },
      token: token
    };

    // If there's additional data, add it to the data payload
    if (dData) {
      message.data = { ...message.data, ...dData };
    } 
    // Send the notification using Firebase admin SDK
    admin.messaging().send(message)
      .then((response) => {
        console.log('Notification sent:', response);
      })
      .catch((error) => {
        console.error('Error sending notification:', error);
      });
    // const data = await admin.messaging().sendToDevice(token,payload);
  } catch (error) {
    throw new Error(error);
  }
}
exports.testNotification = async (token, notification, jobUrl = "", imageUrl = "", dData) => {
  try {
    const message = {
      // notification: {
      //   title: notification?.title,
      //   body: notification?.body, 
      // },
      data: {
        title: notification?.title,
        message: notification?.body,
        // job_url: jobUrl,
        job_url: "https://tallento.ai/jobs/7325/123018",
        imageUrl: imageUrl, 
      },
      apns: {
        payload: {
          aps: {
            sound: "default", // Ensure sound is set for iOS
          },
        },
      },
      token: token
    };
    console.log(message)
    // If there's additional data, add it to the data payload
    if (dData) {
      message.data = { ...message.data, ...dData };
    }

    // Send the notification using Firebase admin SDK
    admin.messaging().send(message)
      .then((response) => {
        console.log('Notification sent:', response);
      })
      .catch((error) => {
        console.error('Error sending notification:', error);
      });
    return true;
  } catch (error) {
    throw new Error(error);
  }
}


