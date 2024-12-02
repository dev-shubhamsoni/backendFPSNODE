const { sendError, sendSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { InstituteLOGO, UserResume } = require("../../utils/filesPath");
const { isValidEmail, isValidMobileNumber, isValidPassword } = require("../../utils/validator");
const crypto = require("crypto");
const fs = require("fs");
const { generateOTP, verifyOTP, sendOTPMessage } = require("../../utils/messageSender");
const {
  createJWTToken,
  createTokenResetPassword,
  verifyResetPasswordToken,
  createTokenEmailVerify,
  verifyEmailVerifyToken,
} = require("../../utils/jwtHandler");
const {
  sendMail,
  resentPasswordLink,
  emailVerifyLink,
  emailOTPVerifyLink,
  VERICATION_EMAIL,
  regitrationEmailTemplate,
} = require("../../utils/mailHandler");
const { hashPassword, compareHashPassword } = require("../../utils/bcryptfunction");
const { uploadDocument } = require("../../utils/fileUploader");
const { getMulterStorage } = require("../common");
const multer = require('multer');
const { EmployerLeadFormSuccess, loginEmailOtp } = require("../../utils/mails");
const moment = require('moment');

// done by anuj
exports.registrationSendOTP = async (req, res) => {
  try {
    const {
      institute_name,
      person_first_name,
      person_last_name,
      email_id,
      mobile_number,
      nt_id,
      fcm_token,
      password,
      added_by = "WEB",
      status = 1,
      pay_status = 0,
      otpchk = 0,
      lead,
      organization_description,
    } = req.body;


    if (!institute_name) {
      return sendError(res, { message: "Please enter the institute name..." });
    } else if (!person_first_name) {
      return sendError(res, { message: "Please enter your first name..." });
    } else if (!person_last_name) {
      return sendError(res, { message: "Please enter your last name..." });
    } else if (!isValidEmail(email_id)) {
      return sendError(res, { message: "Please enter a valid email id..." });
    } else if (!nt_id) {
      return sendError(res, { message: "Please enter category..." });
    } else if (!isValidPassword(password)) {
      return sendError(res, {
        message:
          "Your password must be 6 to 15 characters long and include at least one number and one special character.",
      });
    }
    const inputPassword = await hashPassword(password);
    const verifiedEmailExist = await runQuery(`select 1 from employer_user where email = ? AND email_verified = ?`, [
      email_id,
      1,
    ]);

    // if(lead !== 1){
    if (verifiedEmailExist?.length > 0) {
      return sendError(res, { message: "Sorry, this email id is already linked to another account..." });
    }
    const unVerifiedExist = await runQuery(
      `select employerID from employer_user where email = ? AND email_verified = ?`,
      [email_id, 0]
    );
    if (unVerifiedExist?.length > 0) {
      return sendError(res, { message: "you are already registered, please login with the email and password" });
    }
    // }



    const otpBody = generateOTP(email_id);
    const otpEmailBody = generateOTP(email_id);
    const otpNumberBody = generateOTP(mobile_number);



    // Insert into employer_user
    let leadStatus = (lead?.length > 0) ? lead : 0;
    const query = `INSERT INTO employer_user (name, email, mobile, category, otp, password, fcm_token, signuptype, status, pay_status, info_verified, otpchk, lead, email_verified_otp, phone_verified_otp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    await runQuery(query, [
      institute_name,
      email_id,
      mobile_number,
      nt_id,
      otpBody?.otp,
      inputPassword,
      fcm_token,
      added_by,
      status,
      pay_status,
      0,
      otpchk,
      leadStatus,
      otpEmailBody.otp,
      otpNumberBody.otp,
    ]);

    // Get the empid of the inserted row
    const empidQuery = `SELECT LAST_INSERT_ID() AS employerID`;
    const empidResult = await runQuery(empidQuery);
    const empid = empidResult[0].employerID;

    const query2 = `INSERT INTO employer_details (
        employerID, 
        contact_person_name,
                contact_person_first_name,
                contact_person_last_name,
                organization_description,
                level, 
                address, 
                state, 
                city, 
                website, 
                establish_year, 
                students_no, 
                faculty_no, 
                salary_day, 
                boards, 
                office_no, 
                working_time_from, 
                working_time_to, 
                contact_person_no, 
                contact_person_email, 
                contact_person_desig,  
                updated_at, 
                created_at
                ) VALUES (?, ?, ?, ?, ?, '', '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', NOW(), NOW())`;

    await runQuery(query2, [
      empid, // employerID
      `${person_first_name || ""} ${person_last_name || ""}`,
      person_first_name,
      person_last_name,
      organization_description,
    ]);

    // if(leadStatus === 1){
    //   return sendSuccess(res, {
    //     data: [],
    //     message: "Thanks for the request. Our team will contact you soon...",
    //   });
    // }


    // // Email Otp
    // const msg = `FPSJOB - ${otpEmailBody.otp} is your one time OTP for email verification`;
    // const htmlBody = emailOTPVerifyLink(msg);
    // await sendMail(email_id, "Verification OTP for your account", htmlBody, VERICATION_EMAIL);

    // Mobile Otp
    const mobileMsg = `FPSJOB - ${otpNumberBody.otp} is your one time OTP for phone verification`;
    const messageRes = await sendOTPMessage(mobile_number, mobileMsg);


    // const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for email verification`;
    // const htmlBody = emailOTPVerifyLink(msg);
    // await sendMail(email_id, "Verification OTP for your account", htmlBody, VERICATION_EMAIL);

    setTimeout(async () => {
      const user = await runQuery(`select * from employer_user where email`, [email_id]);
      if (user?.length > 0) {
        const htmlBodyRegister = regitrationEmailTemplate(empid, user[0]?.email_verified);
        sendMail(email_id, "Register New account", htmlBodyRegister, VERICATION_EMAIL);
      }
    }, 10 * 60 * 1000);
    const userData = await runQuery(`SELECT * FROM employer_user WHERE email = ?`, [email_id]);
    return sendSuccess(res, {

      // data: [otpBody.fullHash],       
      data: [],
      message: `Registration  successfully! Otp sent successfully on email and mobile number...`,

    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};


exports.salesEnquiries = async (req, res) => {
  try {
    const {
      person_first_name,
      sales_email,
      sales_phone,
      sales_company_name,
      sales_city,
      sales_subject,
      sales_message,
      person_job_role,
      company_size,
    } = req.body;

    if (!sales_company_name) {
      return sendError(res, { message: "Please enter the institute name..." });
    } else if (!person_first_name) {
      return sendError(res, { message: "Please enter your contact person name..." });
    } else if (!sales_phone) {
      return sendError(res, { message: "Please enter your contact person mobile number..." });
    } else if (!sales_city) {
      return sendError(res, { message: "Please enter your city..." });
    } else if (!sales_subject) {
      return sendError(res, { message: "Please enter enquiry subject..." });
    } else if (!sales_message) {
      return sendError(res, { message: "Please enter your contact person mobile number..." });
    } else if (!isValidEmail(sales_email)) {
      return sendError(res, { message: "Please enter a valid email id..." });
    }


    const query = `INSERT INTO sales_enquiries (first_name, sales_email, sales_phone, sales_company_name, sales_city, sales_subject, sales_message, person_job_role, company_size, status, create_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    await runQuery(query, [
      person_first_name,
      sales_email,
      sales_phone,
      sales_company_name,
      sales_city,
      sales_subject,
      sales_message,
      person_job_role,
      company_size,
      "active"
    ]);

    // Success mail
    EmployerLeadFormSuccess(sales_email, person_first_name)

    return sendSuccess(res, {
      data: [],
      message: `Thanks for the inquiry. Our team will contact you soon...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.emailVerificationSendOtp = async (req, res) => {
  try {
    const { inst_id, email_id } = req.body;
    const employee = await runQuery(`select * from employer_user where employerID = ?`, [inst_id]);
    if (employee?.length == 0) {
      return sendError(res, { message: "employee not found" });
    }
    const verifiedEmailExist = await runQuery(`select 1 from employer_user where email = ? AND employerID != ?`, [
      email_id,
      inst_id,
    ]);
    if (verifiedEmailExist.length > 0) {
      return sendError(res, { message: "Sorry, this email id is already linked to another account..." });
    }
    if (email_id && employee[0]?.email != email_id) {
      await runQuery(`UPDATE employer_user SET email = ? WHERE employerID = ?`, [email_id, inst_id]);
    }
    let newEmail = email_id || employee[0]?.email;
    const otpBody = generateOTP(newEmail);
    const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for email verification`;
    const htmlBody = emailOTPVerifyLink(msg);
    await sendMail(newEmail, "Verification OTP for your account", htmlBody, VERICATION_EMAIL);
    return sendSuccess(res, {
      data: [otpBody.fullHash],
      message: `OTP has been sent on your email id: ${newEmail} ...`,
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
//ALTER TABLE employer_user ADD fcm_token VARCHAR(200);
exports.registrationVerifyOTP = async (req, res) => {
  try {
    const { email_id, hash, otp } = req.body;

    // Validations
    if (!isValidEmail(email_id)) {
      return sendError(res, { message: "Please enter a valid email id..." });
    } else if (!hash) {
      return sendError(res, { message: "Please enter hash..." });
    } else if (!otp) {
      return sendError(res, {
        message: "Please enter otp...",
      });
    }
    const otpValidity = await verifyOTP(email_id, hash, otp);
    // Hash password
    if (!otpValidity) {
      return sendError(res, { message: "Invalid OTP..." });
    }
    const query = `UPDATE employer_user SET email_verified = ?, updated_at = NOW() WHERE email = ?`;
    await runQuery(query, [1, email_id]);
    const userData = await runQuery(`SELECT * FROM employer_user WHERE email = ?`, [email_id]);
    return sendSuccess(res, {
      data: [createJWTToken(userData[0]), [userData[0].employerID]],
      message: "Verified successfully...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.mobileSendOTP = async ({ body: { mobile_number, email_id } }, res) => {
  try {
    // if (!isValidMobileNumber(mobile_number)) {
    //   return sendError(res, { message: "Please provide the valid mobile number..." });
    // }
    // if (!isValidEmail(email_id)) {
    //   return sendError(res, { message: "Please provide the valid email..." });
    // }
    // const data = await runQuery(`select 1 from employer_user where mobile = ? or email != ? `, [
    //   mobile_number,
    //   email_id,
    // ]);

    // if (data.length > 0) {
    //   return sendError(res, { message: "Sorry, this  Mobile Number is already linked to another account..." });
    // }

    if (mobile_number && !email_id) {
      const emailData = await runQuery(`select * from employer_user where mobile = ?`, [mobile_number]);
      if (emailData.length == 0) {
        return sendError(res, { message: "Sorry, account not found with this mobile number..." });
      }

      const otpBody = generateOTP(emailData[0].mobile);
      const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for phone verification`;
      const query = `UPDATE employer_user SET phone_verified_otp = ? WHERE mobile = ?`;
      await runQuery(query, [otpBody.otp, emailData[0].mobile]);
      const messageRes = await sendOTPMessage(mobile_number, msg);

      if (messageRes.success == 1) {
        return sendSuccess(res, {
          // data: { mobile_number: mobile_number, success: 1 , "login_token":createJWTToken(emailData[0]), "user_id" : emailData[0].id },
          data: { mobile_number: mobile_number, success: 1 },
          message: "OTP has been sent...",
        });
      } else {
        return sendError(res, { message: "Something went wrong. please try again after sometime" });
      }

    } else if (email_id && !mobile_number) {

      const emailData = await runQuery(`select * from employer_user where email = ?`, [email_id]);
      if (emailData.length == 0) {
        return sendError(res, { message: "Sorry, account not found with this email..." });
      }
      const otpBody = generateOTP(emailData[0].email);

      const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for email verification`;
      const htmlBody = emailOTPVerifyLink(msg);
      await sendMail(email_id, "Verification OTP for your account", htmlBody, VERICATION_EMAIL);

      const query = `UPDATE employer_user SET email_verified_otp = ? WHERE email = ?`;
      await runQuery(query, [otpBody.otp, email_id]);

      return sendSuccess(res, {
        data: { email_id: email_id, success: 1, "hash_token": otpBody.fullHash, "user_id": emailData[0].id },
        message: "OTP has been sent...",
      });
    } else {
      const emailData = await runQuery(`select * from employer_user where mobile = ? and email = ? `, [
        mobile_number,
        email_id,
      ]);

      if (emailData.length > 0) {
        return sendError(res, { message: "Sorry, this Mobile Number is already linked to another account..." });
      }

      const otpEmailBody = generateOTP(emailData[0].email);
      const otpNumberBody = generateOTP(emailData[0].mobile);

      // Email Otp
      const msg = `FPSJOB - ${otpEmailBody.otp} is your one time OTP for email verification`;
      const htmlBody = emailOTPVerifyLink(msg);
      await sendMail(email_id, "Verification OTP for your account", htmlBody, VERICATION_EMAIL);

      // Mobile Otp
      const mobileMsg = `FPSJOB - ${otpNumberBody.otp} is your one time OTP for phone verification`;
      const messageRes = await sendOTPMessage(mobile_number, mobileMsg);

      const query = `UPDATE employer_user SET email_verified_otp = ?, phone_verified_otp = ? WHERE email = ?`;
      await runQuery(query, [otpEmailBody.otp, otpNumberBody.otp, email_id]);

      if (messageRes.success == 1) {
        return sendSuccess(res, {
          data: { mobile_number: mobile_number, success: 1 },
          message: "OTP has been sent...",
        });
      } else {
        return sendError(res, { message: "Something went wrong. please try again after sometime" });
      }


    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.mobileVerifyOTP = async ({ body: { mobile_number, phone_verified_otp, email_id, email_verified_otp, fcm_token = "NA" } }, res) => {
  try {
    // if !isValidMobileNumber(mobile_number)) {
    //   return sendError(res, { message: "Please enter valid phone number..." });
    // }
    // if (!isValidEmail(email_id)) {
    //   return sendError(res, { message: "Please provide the valid email..." });
    // }

    if (mobile_number && !email_id) {
      if (!phone_verified_otp) {
        return sendError(res, { message: "Please enter otp sent on your mobile number..." });
      }
      const mobileData = await runQuery(`select * from employer_user where mobile = ?`, [mobile_number, phone_verified_otp]);
      if (mobileData.length === 0) {
        return sendError(res, { message: "Sorry, account not found with this mobile number..." });
      }

      const query = `UPDATE employer_user SET phone_verified = ?, fcm_token = ? WHERE mobile = ?`;
      const que = await runQuery(query, ["1", fcm_token, mobile_number]);
      console.log('queque', que);

      return sendSuccess(res, {
        data: [createJWTToken(mobileData[0]), mobileData[0].employerID],
        message: "Congratulations, Your mobile number is verified...",
      });

    } else if (email_id && !mobile_number) {
      if (!email_verified_otp) {
        return sendError(res, { message: "Please enter otp sent on your email address..." });
      }
      const emailData = await runQuery(`select * from employer_user where email = ? and email_verified_otp = ?`, [email_id, email_verified_otp]);
      if (emailData.length === 0) {
        return sendError(res, { message: "Sorry, account not found with this email address..." });
      }

      const query = `UPDATE employer_user SET email_verified = ?, fcm_token=? WHERE email = ?`;
      await runQuery(query, [1, fcm_token, email_id]);

      return sendSuccess(res, {
        data: [createJWTToken(emailData[0]), emailData[0].employerID],
        message: "Congratulations, Your email is verified...",
      });
    } else {
      const commonData = await runQuery(`select * from employer_user where mobile = ? and email = ? and phone_verified_otp=? and email_verified_otp=?`, [
        mobile_number,
        email_id,
        phone_verified_otp,
        email_verified_otp,
      ]);

      if (commonData.length > 0) {
        return sendError(res, { message: "Sorry, this Mobile Number is already linked to another account..." });
      }

      const query = `UPDATE employer_user SET phone_verified = ?, email_verified = ?, fcm_token=? WHERE mobile = ?`;
      await runQuery(query, ["1", 1, fcm_token, commonData[0].mobile]);

      return sendSuccess(res, {
        data: [createJWTToken(commonData[0]), commonData[0].employerID],
        message: "Congratulations, Your account is verified...",
      });


    }
    if (!isValidEmail(email_id)) {
      return sendError(res, { message: "Please provide the valid email..." });
    }
    const userData = await runQuery(`select * from employer_user where email=?`, [email_id]);
    if (userData.length == 0) {
      return sendError(res, { message: "Sorry, account not found..." });
    }
    const otpValidity = otp == userData[0]?.otp;
    if (!otpValidity) return sendError(res, { message: "Invalid otp..." });
    await runQuery(`update employer_user set fcm_token = ?, phone_verified = ?, mobile = ? where email = ?`, [
      fcm_token,
      "1",
      mobile_number,
      email_id,
    ]);
    return sendSuccess(res, { message: "verified successfully..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
// done by anuj
exports.mobileLoginSendOTP = async ({ body: { mobile_number } }, res) => {
  try {
    if (!isValidMobileNumber(mobile_number)) {
      return sendError(res, { message: "Please provide the valid mobile number..." });
    }
    const data = await runQuery(`select * from employer_user where mobile=?`, [mobile_number]);
    if (data.length > 0) {
      const otpBody = generateOTP(mobile_number);
      const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for phone verification`;
      const messageRes = await sendOTPMessage(mobile_number, msg);

      loginEmailOtp(data[0].email, data[0].name, otpBody.otp)
      if (messageRes.success == 1) {
        return sendSuccess(res, { data: [otpBody.fullHash], message: "OTP has been sent..." });
      } else {
        return sendError(res, { message: "Something went wrong. please try again after sometime" });
      }
    } else {
      return sendError(res, { message: "Sorry, account not found on this mobile number..." });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done by anuj
exports.mobileLoginVerifyOTP = async ({ body: { mobile_number, hash, otp, fcm_token = "" } }, res) => {
  try {
    if (!isValidMobileNumber(mobile_number)) {
      return sendError(res, { message: "Please provide valid mobile number..." });
    }
    const otpValidity = await verifyOTP(mobile_number, hash, otp);
    if (!otpValidity) {
      return sendError(res, { message: "Invalid otp..." });
    }
    await runQuery(`UPDATE employer_user SET fcm_token = ?,updated_at = NOW() WHERE mobile = ?;`, [
      fcm_token,
      mobile_number,
    ]);
    const data = await runQuery(`select * from employer_user where mobile = ?`, [mobile_number]);
    //    console.log(data[0].employerID);
    return sendSuccess(res, {
      data: [createJWTToken(data[0]), [data[0].employerID]],
      message: "You have loggedin successfully...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done
exports.signInWithEmailAndPwd = async ({ body: { email, pwd, fcm_token = "NA" } }, res) => {
  try {
    if (!isValidEmail(email)) {
      return sendError(res, { message: "Please enter valid email id..." });
    } else if (!pwd) {
      return sendError(res, { message: "Please enter your password..." });
    } else {
      const data = await runQuery(`select * from employer_user where email=?`, [email]);

      if (data.length > 0) {
        if (!data[0].password) {
          return sendError(res, { message: "Please set your password first..." });
        }
        const inputPasswordCheck = await compareHashPassword(pwd, data[0].password);
        if (inputPasswordCheck) {
          await runQuery(`update employer_user set fcm_token = ? where  email= ?`, [fcm_token, email]);
          return sendSuccess(res, {
            data: [createJWTToken(data[0]), [data[0].employerID], { email_verified: data[0]?.email_verified }],
            message: "Login successfully...",
          });
        } else {
          return sendError(res, { message: "Your password is incorrect check again" });
        }
      } else {
        return sendError(res, { message: "Invalid email id..." });
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(res, { message: error.message });
  }
};
exports.emailVerificationSend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return sendError(res, { message: "Please enter valid email id..." });
    } else {
      const data = await runQuery(`select * from employer_user where email=?`, [email]);
      if (data.length == 0) return sendError(res, { message: "Email is not found...." });
      const emailVerifyToken = createTokenEmailVerify({ email: data[0]?.email });
      const htmlBody = emailVerifyLink(
        `http://${req.get("host")}/institute/authentication/verify-email/${emailVerifyToken}`
      );
      await sendMail(email, "Verification link for your account", htmlBody, VERICATION_EMAIL);
      return sendSuccess(res, {
        data: { url: `http://${req.get("host")}/institute/authentication/verify-email/${emailVerifyToken}` },
        message: "Verification link sent successfully",
      });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.verifyEmail = async ({ params: { token } }, res) => {
  try {
    if (!token) {
      return sendError(res, { message: "Please enter token..." });
    } else {
      const data = await verifyEmailVerifyToken(token);
      const dbData = await runQuery(`select password from employer_user where email = ?`, [data.email]);
      if (dbData.length == 0) return sendError(res, { message: "Something went wrong !!" });
      await runQuery(`update employer_user set email_verified = ? where email = ?`, [1, data.email]);
      return sendSuccess(res, { message: "email verified successfully" });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
// exports.profile = async ({ body: { inst_id } }, res) => {
//     try {
//         const data = await runQuery(`select inst.*,intt.nt_name,ct.city_name,st.state_name from institutions inst join cities ct on inst.city_id = ct.city_id join states st on inst.state_id=st.state_id join institution_type intt on intt.nt_id = inst.nt_id where inst_id = ?`, [inst_id])
//         if (data.length > 0 && data[0].inst_logo != null) {
//             const imagePath = `${InstituteLOGO}/${data[0].inst_logo}`
//             const image = fs.readFileSync(imagePath);
//             data[0].inst_logo = image.toString('base64')
//             data[0].current_plan = await runQuery(`select * from selected_plans sp join subscription_plans sps on sp.plan_id = sps.plan_id where inst_id = ? and activation_plan in (?,?,?) order by selection_date desc limit 1`, [inst_id, 'processing', 'activated', 'expired'])
//         }
//         return sendSuccess(res, { data: data, message: "Profile..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

//done
exports.profile = async ({ body: { inst_id } }, res) => {
  try {
    const [userData, employerDetails, subscriptionData] = await Promise.all([
      runQuery(`SELECT employer_user.*, tbl_categories.category as category_name FROM employer_user left JOIN tbl_categories on tbl_categories.ID = employer_user.category WHERE employerID=?`, [inst_id]),
      runQuery(`SELECT * FROM employer_details WHERE employerID=?`, [inst_id]),
      runQuery(
        `SELECT * FROM employer_subscription WHERE employerID = ? AND status = 'Active' ORDER BY created_at DESC LIMIT 1`,
        [inst_id]
      ),
    ]);
    const packData = await runQuery(`SELECT * FROM emp_packages WHERE id = ?`, [subscriptionData[0]?.packID]);
    // Additional logic for userData
    if (employerDetails.length > 0 && employerDetails[0].empimage != null) {
      const imagePath = `${InstituteLOGO}/${employerDetails[0].empimage}`;

      // console.log(imagePath);
      // const image = fs.readFileSync(imagePath);
      employerDetails[0].empimage = imagePath;
      //  userData[0].current_plan = await runQuery(`SELECT * FROM selected_plans sp JOIN subscription_plans sps ON sp.plan_id = sps.plan_id WHERE inst_id = ? AND activation_plan IN ('processing', 'activated', 'expired') ORDER BY selection_date DESC LIMIT 1`, [inst_id]);
    }

    const responseData = {
      userData: userData[0], // Assuming only one user is returned
      employerDetails: employerDetails[0], // Assuming only one employer detail is returned
      subscriptionData: subscriptionData[0] || "",
      packDetail: packData[0],
    };

    return sendSuccess(res, { data: responseData, message: "Profile..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

// exports.profile = async ({ body: { inst_id } }, res) => {
//     try {
//         const [userData, employerDetails] = await Promise.all([
//             runQuery(`SELECT email, mobile, name, employerID FROM employer_user WHERE employerID=?;`, [inst_id]),
//             runQuery(`SELECT * FROM employer_details WHERE employerID=?;`, [inst_id])
//         ]);

//           // Additional logic for userData
//           if (employerDetails.length > 0 && employerDetails[0].empimage != null) {
//             const imagePath = `${InstituteLOGO}/${employerDetails[0].empimage}`;

//             // console.log(imagePath);
//             // const image = fs.readFileSync(imagePath);
//             employerDetails[0].empimage = imagePath
//           //  userData[0].current_plan = await runQuery(`SELECT * FROM selected_plans sp JOIN subscription_plans sps ON sp.plan_id = sps.plan_id WHERE inst_id = ? AND activation_plan IN ('processing', 'activated', 'expired') ORDER BY selection_date DESC LIMIT 1`, [inst_id]);
//         }

//         const responseData = {
//             userData: userData[0], // Assuming only one user is returned
//             employerDetails: employerDetails[0] // Assuming only one employer detail is returned
//         };

//         return sendSuccess(res, { data: responseData, message: "Profile..." });
//     } catch (error) {
//         return sendError(res, { message: error.message });
//     }
// }

//done
exports.uploadProfileImage = async (req, res) => {
  try {
    if (req.file !== undefined) {
      const data = await runQuery(`select * from employer_details where employerID =?`, [req.body.inst_id]);
      if (data.length > 0 && data[0].inst_logo != null) {
        const imagePath = `${InstituteLOGO}/${data[0].inst_logo}`;
        fs.unlinkSync(imagePath);
      }
      await runQuery(`update employer_details set empimage = ? where employerID =?`, [
        req.file.filename,
        req.body.inst_id,
      ]);
      const updatedData = await runQuery(`select * from employer_details where employerID =?`, [req.body.inst_id]);
      return sendSuccess(res, {
        data: [`${InstituteLOGO}/${updatedData[0].empimage}`],
        message: "Images uploded succesfully...",
      });
    } else {
      return sendError(res, { message: "Please select your institute logo..." });
    }
  } catch (error) {
    fs.unlinkSync(req.file.path);
    return sendError(res, { message: error.message });
  }
};


exports.otherDetails = async (req, res) => {
  try {
    const { website, shift_start, shift_end, working_days, establish_year, salary_day, faculty_no, gst, brand_level, inst_id } = req.body;


    const employerDetails = await runQuery(`select * from employer_details where employerID = ?`, [inst_id])
    if (employerDetails.length > 0) {
      const updateQuery = `UPDATE employer_details SET website=?,shift_start= ?, shift_end = ?, working_days = ?, 
      establish_year = ?, salary_day = ?, faculty_no = ? WHERE employerID = ?`;
      await runQuery(updateQuery, [website, shift_start, shift_end, working_days, establish_year, salary_day, faculty_no, inst_id]);
    } else {
      const insertQuery = `INSERT INTO employer_details (website,shift_start, shift_end, working_days, establish_year, salary_day, faculty_no, employerID) VALUES (?,?,?,?,?,?,?,?)`;
      await runQuery(insertQuery, [website, shift_start, shift_end, working_days, establish_year, salary_day, faculty_no, inst_id]);
    }

    const empUpdateQuery = `UPDATE employer_user SET gst=?,brand_level=? WHERE employerID = ?`;
    await runQuery(empUpdateQuery, [gst, brand_level, inst_id]);

    return sendSuccess(res, {
      data: [],
      message: "Details added...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done
exports.updateProfile = async ({ body: updateData }, res) => {
  try {

    const allowedDetailsColumns = [
      "address",
      "city",
      "contact_person_desig",
      "contact_person_email",
      "contact_person_first_name",
      "contact_person_last_name",
      "contact_person_no",
      "organization_description",
      "state",
      "updated_at",
      "shift_start",
      "shift_end",
      "working_days"
    ];

    if (!updateData.inst_id) {
      return sendError(res, { message: "Please provide Institute id." });
    }

    const empProfileUpdate = [
      updateData.gst, updateData.official_name, moment().format('YYYY-MM-DD HH:mm:ss'), updateData.inst_id
    ]

    // updateData.pop("official_name");
    let contactPersonName = null;
    if (updateData.contact_person_first_name || updateData.contact_person_last_name) {
      contactPersonName = updateData.contact_person_first_name + " " + updateData.contact_person_last_name
    }

    const updateColumns = Object.keys(updateData).filter((key) => allowedDetailsColumns.includes(key));

    let setClause = updateColumns.map((column) => `${column} = ?`).join(", ");
    const updateValues = updateColumns.map((column) => updateData[column]);


    setClause = setClause + ", shift_start = ?";
    updateValues.push(updateData.shift_start);

    setClause = setClause + ", shift_end = ?";
    updateValues.push(updateData.shift_end);

    setClause = setClause + ", working_days = ?";
    updateValues.push(updateData.working_days);

    setClause = setClause + ", contact_person_name = ?";
    updateValues.push(contactPersonName);
    updateValues.push(updateData.inst_id); // Assuming you also have inst_id in your updateData

    const employerUpdateQuery = `UPDATE employer_details SET ${setClause} WHERE employerID = ?`;
    await runQuery(employerUpdateQuery, updateValues);

    const empUpdateQuery = `UPDATE employer_user SET gst = ?, official_name=?, updated_at=? WHERE employerID = ?`;
    await runQuery(empUpdateQuery, empProfileUpdate);
    // }
    return sendSuccess(res, { message: "Updated successfully." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done

exports.updatePassword = async (req, res) => {
  try {
    const { new_password, inst_id } = req.body;
    if (!new_password) {
      return sendError(res, { message: "Please enter the new password..." });
    } else if (new_password.length < 6 || new_password.length > 12) {
      return sendError(res, { message: "Password length should be between 6 to 12 characters." });
    } else {
      const pwd = await hashPassword(new_password);
      await runQuery(`update employer_user set password = ? where employerID = ?`, [pwd, inst_id]);
      return sendSuccess(res, { message: "New password has been set successfully." });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

// exports.updatePassword = async (req, res) => {
//     try {
//         const { old_password, new_password, inst_id } = req.body
//         if (!new_password) {
//             return sendError(res, { message: "Please enter the new password..." })
//         } else if (new_password.length < 6 || new_password.length > 12) {
//             return sendError(res, { message: "Password length between 6 to 12.." })
//         } else {
//             const data = await runQuery(`select * from employer_user where employerID = ?`, [inst_id])
//             console.log(data[0].password);

//             if (data.length > 0) {
//                 if (!data[0].password) {
//                     const pwd = crypto
//                         .pbkdf2Sync(new_password, process.env.SHA_KEY, 1000, 64, `sha512`)
//                         .toString(`hex`);

//                     await runQuery(`update employer_user set password = ? where employerID = ?`, [pwd, inst_id])
//                     return sendSuccess(res, { message: "New password has been setup successfully..." })
//                 } else {
//                     if (!old_password) {
//                         return sendError(res, { message: "Please enter the old password..." })
//                     }
//                     const oldPasswordHash = crypto
//                         .pbkdf2Sync(old_password, process.env.SHA_KEY, 1000, 64, `sha512`)
//                         .toString(`hex`);
//                     if (oldPasswordHash === data[0].inst_password) {
//                         const newPasswordHash = crypto
//                             .pbkdf2Sync(new_password, process.env.SHA_KEY, 1000, 64, `sha512`)
//                             .toString(`hex`);
//                         if (data[0].inst_password === newPasswordHash) {
//                             return sendError(res, { message: "Your new password is same of old password..." })
//                         } else {
//                             await runQuery(`update employer_user set password = ? where employerID = ?`, [newPasswordHash, inst_id])
//                             return sendSuccess(res, { message: "Password has been updated successfully..." })
//                         }
//                     } else {
//                         return sendError(res, { message: "Invalid previous password..." })
//                     }
//                 }
//             } else {
//                 return sendError(res, { message: "Account not found..." })
//             }
//         }
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// done but sntp problm
exports.forgotPasswordWithMail = async (req, res) => {
  try {
    const { email_id } = req.body;
    if (!isValidEmail(email_id)) {
      return sendError(res, { message: "Please enter valid email id..." });
    }
    const data = await runQuery(`select * from employer_user where email=?`, [email_id]);
    if (data.length == 0) return sendError(res, { message: "Email is not found...." });

    const values = {
      email: data[0].email,
    };

    const resetPasswordToken = createTokenResetPassword(values);
    const htmlBody = resentPasswordLink(
      `https://empapi.fpsjob.com/institute/authentication/reset-password/${resetPasswordToken}`
    );
    await sendMail(email_id, "Password reset link for your account", htmlBody, VERICATION_EMAIL);
    return sendSuccess(res, { message: "Reset password link sent successfully" });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.sendResetEJSPage = async ({ params: { token }, body: { new_password } }, res) => {
  try {
    const email = await verifyResetPasswordToken(token);
    res.render("resetPassword", { token });
  } catch (error) {
    res.send(
      "<p>We're sorry, but it looks like the password reset link you clicked has expired. For security reasons, password reset links are only valid for a limited time.</p>"
    );
  }
};

exports.sendSuccessPassword = async (req, res) => {
  try {
    res.render("successPassword", {});
  } catch (error) {
    res.send("something went wrong....");
  }
};

// match old pass word then it whenn be change

//done
exports.forgotPassword = async ({ body: { token, newPassword } }, res) => {
  try {
    if (!isValidPassword(newPassword))
      return sendError(res, {
        message:
          "Your password must be 6 to 15 characters long and include at least one number and one special character.",
      });
    const data = await verifyResetPasswordToken(token);
    const dbData = await runQuery(`select password from employer_user where email = ?`, [data.email]);
    if (dbData.length == 0) return sendError(res, { message: "Something went wrong !!" });
    const inputPassword = await hashPassword(newPassword);
    await runQuery(`update employer_user set password = ? where email = ?`, [inputPassword, data.email]);
    return sendSuccess(res, { message: "Your password has been changed..." });
  } catch (error) {
    return sendError(res, { message: "An error occurred while resetting the password. Please try again later." });
  }
};

//done
exports.sendOTPForResetPassword = async ({ body: { mobile_number } }, res) => {
  try {
    if (!isValidMobileNumber(mobile_number)) return sendError(res, { message: "Please enter valid mobile number..." });
    const data = await runQuery(`select * from employer_user where mobile=?`, [mobile_number]);
    if (data.length == 0)
      return sendError(res, { message: "Please double-check and ensure you've entered the correct number." });
    const otpBody = generateOTP(mobile_number);
    const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for phone verification`;
    const messageRes = await sendOTPMessage(mobile_number, msg);
    if (messageRes.success == 1) {
      return sendSuccess(res, { data: [otpBody.fullHash], message: "OTP has been sent..." });
    } else {
      return sendError(res, { message: "Something went wrong..." });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done
exports.verifyOTPForResetPassword = async ({ body: { hash, number, password, otp } }, res) => {
  try {
    if (!isValidPassword(password))
      return sendError(res, {
        message:
          "Your password must be 6 to 15 characters long and include at least one number and one special character.",
      });
    else if (!isValidMobileNumber(number)) return sendError(res, { message: "Please enter valid mobile number..." });
    else if (!hash) return sendError(res, { message: "Please pass the hash..." });
    else if (otp.length != 6) return sendError(res, { message: "Please enter the valid otp..." });

    const otpValidity = await verifyOTP(number, hash, otp);
    if (!otpValidity) {
      return sendError(res, { message: "Invalid otp..." });
    }
    const pwd = await hashPassword(password);
    await runQuery(`update employer_user set password = ? where mobile = ?`, [pwd, number]);
    return sendSuccess(res, { message: "Password has been changed successfully..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
