const nodemailer = require("nodemailer");
exports.VERICATION_EMAIL = "verification@fpsjob.com";
let transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  secure: false,
  auth: {
    user: "info@fpsjob.com",
    pass: "PHtE6r0FFOzi2WcnpkUD7KXpR87yYYh7/ONkLQlOs4oTXvECSk0D/t0sxGDlrxwpVPlCQvOayIlqtLqasrrQIWrrNj1IXmqyqK3sx/VYSPOZsbq6x00VtFgZdkzeVo7ucdJj3CPeut/aNA==",
  },
  tls: {
    rejectUnauthorized: false
  }
});
/* let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "shivamit.fps@gmail.com",
    pass: "qnrl jfwn ekuh jet",
  },
}); */
exports.sendMail = async (toMail, subject, body, from) => {
  const mailOption = {
    from: from ? from : "info@fpsjob.com",
    to: toMail,
    subject: subject,
    html: body,
  };

  try {
    const result = await transporter.sendMail(mailOption);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
exports.sendMailWithAttachment = async (toMail, subject, body,attachments, from = this.VERICATION_EMAIL) => {
  const mailOption = {
    from: from,
    to: toMail,
    subject: subject,
    html: body,
    attachments: attachments,
  };
  try {
    const result = await transporter.sendMail(mailOption);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
exports.resentPasswordLink = (link) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body>
      <p>Dear User,</p>
      <p>We have received a request to reset your password for your account on application. To proceed with the password reset process, please follow the link below: 
      <a href=${link}>Reset Password</a></p>
     
      <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
     
      <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
      <br>
      <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
      <br>
      <p>Thank you for your cooperation.</p>
      <br>
      <p>Best regards,<br>
      FPS Job Teams<br>
    </body>
    </html>
    `;
};

exports.emailVerifyLink = (link) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verify</title>
    </head>
    <body>
      <p>Dear User,</p>
      <p>We have received a request to email verify for your account on application. To verify email, please follow the link below: 
      <a href=${link}>Verify Email</a></p>
     
      <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
     
      <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
      <br>
      <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
      <br>
      <p>Thank you for your cooperation.</p>
      <br>
      <p>Best regards,<br>
      FPS Job Teams<br>
    </body>
    </html>
    `;
};

exports.emailOTPVerifyLink = (OTP) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email OTP Verify</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>We have received a request to email verify for your account on application. To verify email</p>
    <p style="text-align:center;">${OTP}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
exports.regitrationEmailTemplate = (id, verified) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register success</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>you are successfully Registered${verified ? "" : ", please login and verify your account"}</p>
    <p style="text-align:center;"> your employer id : ${id}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
  
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
exports.JobPostTemplate = (title) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Post</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>you are posted new job</p>
    <p style="text-align:center;">Job Title : ${title}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
exports.RemainingJobTemplate = (planName) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remaining Job</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>You cant post more jobs, you have no remaining jobs in plan <b>${planName}</b>, purchase new plan</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};

exports.PlanPurchaseTemplate = (data) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan purchase</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>you purchase a plan</p> 
    <p style="text-align:center;"> Plan : ${data}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
exports.BankPlanPurchaseTemplate = (data) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan purchase</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>you purchase a plan</p> 
    <p style="text-align:center;"> Plan : ${data}</p>
   <p>we are verifying your payment request, when its completed then inform to you</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};

exports.InterviewSchedualTemplate = (data) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Post</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>your interview schedual on Date: ${data?.date}, time: ${data?.time}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
exports.ApplyStatusChangeTemplate = (data) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Post</title>
  </head>
  <body>
    <p>Dear User,</p>
    <p>your applied status changed from: ${data?.from} to: ${data?.to}</p>
   
    <p>If you did not initiate this request or believe it to be in error, please disregard this email. Your password will remain unchanged.</p>
   
    <p>For security purposes, please ensure that you keep your new password confidential and do not share it with anyone. Additionally, we recommend choosing a strong password that includes a combination of letters, numbers, and special characters to enhance the security of your account.</p>
    <br>
    <p>If you have any questions or concerns, please feel free to reach out to our support team at <a href="mailto:support@fpsjob.com">support@fpsjob.com</a>. We are here to assist you.</p>
    <br>
    <p>Thank you for your cooperation.</p>
    <br>
    <p>Best regards,<br>
    FPS Job Teams<br>
  </body>
  </html>
  `;
};
