const { sendError, sendSuccess, getDateFormat, generateUserId, generateUserIdByEnyId, replaceFacultyID } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { UserProfile, UserResume } = require("../../utils/filesPath");
const { isValidMobileNumber, isValidEmail, isValidPassword, isValidDateFormat } = require("../../utils/validator");
const crypto = require('crypto')
const fs = require('fs');
const { generateOTP, sendOTPMessage, verifyOTP } = require("../../utils/messageSender");
const { createJWTToken } = require("../../utils/jwtHandler");
const { generateToken, checkPhoneNumber, hasSixDigitsOnly } = require("./functions/functions");
const { hashPassword, compareHashPassword } = require("../../utils/bcryptfunction");
const { forgetPasswordMail, sendOtpMail, verifyEmail } = require("../../utils/mails");
const { deleteFile, moveFileToUserFolder,  } = require("../common");
const moment = require('moment');

exports.registartionOTP = async ({ body: { phone_number } }, res) => {
    try {
        if (!isValidMobileNumber(phone_number)) {
            return sendError(res, { message: "Please enter valid phone number..." })
        }
        const data = await runQuery(`select 1 from users where u_phone_number = ?`, [phone_number])
        if (data.length <= 0) {
            const otpBody = generateOTP(phone_number)
            const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for phone verification`
            const messageRes = await sendOTPMessage(phone_number, msg)
            if (messageRes.success == 1) {
                return sendSuccess(res, { data: messageRes, message: "OTP has been sent..." })
            } else {
                return sendError(res, { message: "Something went wrong..." })
            }

        } else {
            return sendError(res, { message: "Sorry, this number is already linked to another account..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

const UserResumeBasePath = process.env.USER_BASE_PATH;

exports.registration = async (req, res) => {
    const uploadedFile = req.file;
    const {
        first_name, last_name, mobile, email, state, industry, subject, city,
        added_by, password
    } = req.body;

    const handleFileDeletion = () => {
        if (uploadedFile) {
            deleteFile(uploadedFile.path);
        }
    };

    const handleValidationError = (res, field) => {
        handleFileDeletion();
        return sendError(res, { message: `Please enter your ${field}...` });
    };

    if (!first_name) return handleValidationError(res, "first name");
    if (!last_name) return handleValidationError(res, "last name");
    if (!mobile) return handleValidationError(res, "phone number");
    if (!isValidEmail(email)) return handleValidationError(res, "valid email id");
    // if (!state) return handleValidationError(res, "state");
    if (!city) return handleValidationError(res, "city");
    // if (!industry) return handleValidationError(res, "industry");
    if (!subject) return handleValidationError(res, "subject");
    if (!added_by) return handleValidationError(res, "added by");
    if (!password) {
        handleFileDeletion();
        return sendError(res, { message: "Please enter your bio..." })
    } else if (!isValidPassword(password)) {
        handleFileDeletion();
        return sendError(res, { message: "Please enter a password that is at least 8 characters long, and includes at least one special character, one number, and one uppercase letter." })
    }

    const numberMsg = await mobileVerify(mobile);
    if (!numberMsg.success) {
        handleFileDeletion();
        return sendError(res, { message: numberMsg.message });
    }

    const nameConcat = `${first_name} ${last_name}`
    const passwordHash = await hashPassword(password)

    try {
        // Retrieve state name and category ID based on city and subject
        const stateDate = await runQuery(
            "SELECT states.name as state_name FROM cities LEFT JOIN states on states.id = cities.state_id WHERE cities.name = ?",
            [city]
        );
        const catDate = await runQuery(
            "SELECT tbl_categories.ID as category_id FROM tbl_functions LEFT JOIN tbl_categories on tbl_categories.ID = tbl_functions.CID WHERE tbl_functions.ID = ?",
            [subject]
        );

        // Construct the INSERT query to include all necessary fields
        const query = `INSERT INTO faculity_users (name, mobile, email, state, city, industry_type, job_function, device_type, password, status, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Execute the query with appropriate values, merging logic from both branchesFF
        const { insertId: userId } = await runQuery(query, [
            nameConcat,             // From Shivam_fpsNode
            mobile,                 // Common to both branches
            email,                  // Common to both branches
            stateDate[0].state_name,// From Shivam_fpsNode (derived from city)
            city,                   // Common to both branches
            catDate[0].category_id, // From Shivam_fpsNode (derived from subject)
            subject,                // From Shivam_fpsNode
            added_by,               // Common to both branches
            passwordHash,           // From main
            1,                   // User status (approved default)  
            moment().format('YYYY-MM-DD HH:mm:ss') // current date and time 
        ]);


        if (uploadedFile) {
            const newFilePath = await moveFileToUserFolder(uploadedFile.path, userId, UserResumeBasePath, mobile);
            const updateQuery = `UPDATE faculity_users SET cv_doc = ? WHERE faculityID = ?`;
            await runQuery(updateQuery, [newFilePath, userId]);
        }

        //  update eny Id
        enyId = await generateUserId(userId)
        const updateQuery = `UPDATE faculity_users SET eny_id = ? WHERE faculityID = ?`;
        await runQuery(updateQuery, [enyId, userId]);

        const notificationData = [userId, moment().format('YYYY-MM-DD HH:mm:ss')]
        await runQuery(`insert into notification set type='notification', title='Registered Successfully!', message='You have registered successfully', status=1, faculityID=?, created_at=?`, notificationData)

        return sendSuccess(res, { data: [enyId], message: "Registration has been completed, please verify your phone number..." });
    } catch (error) {
        handleFileDeletion();
        return handleDatabaseError(res, error);
    }
};

exports.profileUpdate = async (req, res) => {

    // if (!facultyID) return handleValidationError(res, "user id");

    try {

        if (!req.body.facultyID) {
            return sendError(res, { message: "Please enter user id..." })
        }

        // userData = await runQuery(`SELECT faculityID, name, email, state, city, job_function, qualification, experience, salary, 
        // university, gender, passing_year, current_employer, dob, last_employer, demolecture, alternate_contact, 
        // teachingLevel, duration_notice_period, created_at FROM faculity_users WHERE faculityID=?;`, [req.body.facultyID]);


        userData = await runQuery(`SELECT faculityID, name, email, state, city, job_function, qualification, experience, salary, 
            university, gender, passing_year, current_employer, dob, last_employer, demolecture, alternate_contact, 
            teachingLevel, duration_notice_period, expected_salary, negotiable FROM faculity_users WHERE faculityID=?;`, [req.body.facultyID]);

        userUpdateData = await runQuery(`SELECT * FROM faculity_updates WHERE faculityID=?;`, [req.body.facultyID]);

        let checkData = [
            faculityID = req.body.facultyID,
            name = req.body.name,
            email = req.body.email,
            state = req.body.state,
            city = req.body.city,
            job_function = req.body.job_function,
            qualification = req.body.qualification,
            experience = req.body.experience,
            salary = req.body.salary,
            university = req.body.university,
            gender = req.body.gender,
            passing_year = req.body.passing_year,
            current_employer = req.body.current_employer,
            dob = req.body.dob,
            last_employer = req.body.last_employer,
            demolecture = req.body.demolecture,
            alternate_contact = req.body.alternate_contact,
            teachingLevel = req.body.teachingLevel,
            duration_notice_period = req.body.duration_notice_period,
            expected_salary = req.body.expected_salary,
            negotiable = req.body.negotiable,
        ]
         
        var updateStatus = false
        var user_data = userData[0]
        var lopCount = 0
        Object.keys(userData[0]).forEach(function (key) {
            var val = user_data[key];
            if (val !== checkData[lopCount]) {
                updateStatus = true
            }
            lopCount = lopCount + 1
        });


        let submitData = [
            (req.body.name) ? req.body.name : userData[0].name,
            (req.body.email) ? req.body.email : userData[0].email,
            (req.body.state) ? req.body.state : userData[0].state,
            (req.body.city) ? req.body.city : userData[0].city,
            (req.body.job_function) ? req.body.job_function : userData[0].job_function,
            (req.body.qualification) ? req.body.qualification : userData[0].qualification,
            (req.body.experience) ? req.body.experience : userData[0].experience,
            (req.body.salary) ? req.body.salary : userData[0].salary,
            (req.body.university) ? req.body.university : userData[0].university,
            (req.body.gender) ? req.body.gender : userData[0].gender,
            (req.body.passing_year) ? req.body.passing_year : userData[0].passing_year,
            (req.body.current_employer) ? req.body.current_employer : userData[0].current_employer,
            (req.body.dob) ? req.body.dob : userData[0].dob,
            (req.body.last_employer) ? req.body.last_employer : userData[0].last_employer,
            (req.body.demolecture) ? req.body.demolecture : userData[0].demolecture,
            (req.body.alternate_contact) ? req.body.alternate_contact : userData[0].alternate_contact,
            (req.body.teachingLevel) ? req.body.teachingLevel : userData[0].teachingLevel,
            (req.body.duration_notice_period) ? req.body.duration_notice_period : userData[0].duration_notice_period,
            (req.body.expected_salary) ? req.body.expected_salary : userData[0].expected_salary,
            (req.body.negotiable) ? req.body.negotiable : userData[0].negotiable,
            moment().format('YYYY-MM-DD HH:mm:ss'),
            req.body.facultyID
        ] 

        oldUpdateRquest = await runQuery(`SELECT * FROM faculity_updates WHERE faculityID=?;`, [req.body.facultyID]);
       
        if(oldUpdateRquest.length === 0){
            let updateUser = `UPDATE faculity_users SET name = ?, email = ?, state = ?, city = ?, job_function = ?, qualification = ?, experience = ?, salary = ?, 
            university = ?, gender = ?, passing_year = ?, current_employer = ?, dob = ?, last_employer = ?, demolecture = ?, alternate_contact = ?, 
            teachingLevel = ?, duration_notice_period = ?, expected_salary = ?, negotiable = ?, updated_at = ?  WHERE faculityID = ?`;
            await runQuery(updateUser, submitData);

            let query = `INSERT INTO faculity_updates ( name, email, state, city, job_function, qualification, experience, salary, 
            university, gender, passing_year, current_employer, dob, last_employer, demolecture, alternate_contact, 
            teachingLevel, duration_notice_period, expected_salary, negotiable, created_at, faculityID, status ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
            await runQuery(query, submitData);

            return sendSuccess(res, { data: [], message: "User details updated..." });
        }
        

        if (updateStatus) {
            if (!userUpdateData) {                
                let updateUser = `UPDATE faculity_users SET name = ?, email = ?, state = ?, city = ?, job_function = ?, qualification = ?, experience = ?, salary = ?, 
                university = ?, gender = ?, passing_year = ?, current_employer = ?, dob = ?, last_employer = ?, demolecture = ?, alternate_contact = ?, 
                teachingLevel = ?, duration_notice_period = ?, expected_salary = ?, negotiable = ?, updated_at = ?  WHERE faculityID = ?`;
                await runQuery(updateUser, submitData);

                let query = `INSERT INTO faculity_updates ( name, email, state, city, job_function, qualification, experience, salary, 
                university, gender, passing_year, current_employer, dob, last_employer, demolecture, alternate_contact, 
                teachingLevel, duration_notice_period, expected_salary, negotiable, created_at, faculityID, status ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
                await runQuery(query, submitData);
                return sendSuccess(res, { data: [], message: "User details updated..." });
            } else {

                let submitData = [
                    req.body.facultyID,
                    (req.body.name) ? req.body.name : userData[0].name,
                    (req.body.email) ? req.body.email : userData[0].email,
                    (req.body.state) ? req.body.state : userData[0].state,
                    (req.body.city) ? req.body.city : userData[0].city,
                    (req.body.job_function) ? req.body.job_function : userData[0].job_function,
                    (req.body.qualification) ? req.body.qualification : userData[0].qualification,
                    (req.body.experience) ? req.body.experience : userData[0].experience,
                    (req.body.salary) ? req.body.salary : userData[0].salary,
                    (req.body.university) ? req.body.university : userData[0].university,
                    (req.body.gender) ? req.body.gender : userData[0].gender,
                    (req.body.passing_year) ? req.body.passing_year : userData[0].passing_year,
                    (req.body.current_employer) ? req.body.current_employer : userData[0].current_employer,
                    (req.body.dob) ? req.body.dob : userData[0].dob,
                    (req.body.last_employer) ? req.body.last_employer : userData[0].last_employer,
                    (req.body.demolecture) ? req.body.demolecture : userData[0].demolecture,
                    (req.body.alternate_contact) ? req.body.alternate_contact : userData[0].alternate_contact,
                    (req.body.teachingLevel) ? req.body.teachingLevel : userData[0].teachingLevel,
                    (req.body.duration_notice_period) ? req.body.duration_notice_period : userData[0].duration_notice_period,
                    (req.body.expected_salary) ? req.body.expected_salary : userData[0].expected_salary,
                    (req.body.negotiable) ? req.body.negotiable : userData[0].negotiable,
                    moment().format('YYYY-MM-DD HH:mm:ss')
                ]

                const query = `INSERT INTO faculity_updates (faculityID, name, email, state, city, job_function, qualification, experience, salary, 
                university, gender, passing_year, current_employer, dob, last_employer, demolecture, alternate_contact, 
                teachingLevel, duration_notice_period, expected_salary, negotiable, created_at, status ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;
                await runQuery(query, submitData);
                return sendSuccess(res, { data: [], message: "Update request added. We will update you soon..." });
            }

        }


    } catch (error) {
        // handleFileDeletion();
        return handleDatabaseError(res, error);
    }
};

exports.verifyEmailLink = async (req, res) => {

    try {

        if (!req.query.facultyID) {
            return sendError(res, { message: "Please enter user id..." })
        }

        userData = await runQuery(`SELECT name, email, mobile FROM faculity_users WHERE faculityID=?;`, [req.query.facultyID]);

        const encryptedEmail = Buffer.from(userData[0].email).toString('base64')
        const otp = generateOTP(userData[0].mobile)
        const encryptedAuth = Buffer.from(otp['otp']).toString('base64')

        let EmailLink = process.env.FRONT_URL + "?emailIdentity=" + encryptedEmail + "&auth=" + encryptedAuth
        verifyEmail(userData[0], EmailLink)

        // if(updateStatus){
        const updateQuery = `UPDATE faculity_users SET emailtoken = ? WHERE faculityID = ?`;
        await runQuery(updateQuery, [otp['otp'], req.query.facultyID]);
        // console.log(query)
        // }

        return sendSuccess(res, { data: [], message: "We have sent verification link to your registered email..." });
    } catch (error) {
        // handleFileDeletion();
        return handleDatabaseError(res, error);
    }
};

exports.verifyEmailLinkApprove = async (req, res) => {

    try {

        if (!req.query.emailIdentity) {
            return sendError(res, { message: "Please enter Email Identity..." })
        } else if (!req.query.auth) {
            return sendError(res, { message: "Please enter auth token..." })
        }

        userEmail = Buffer.from(req.query.emailIdentity, 'base64').toString('utf8')
        authToken = Buffer.from(req.query.auth, 'base64').toString('utf8')

        userData = await runQuery(`SELECT * FROM faculity_users WHERE email=? and emailtoken=?;`, [userEmail, authToken]);

        if (userData[0]) {
            const updateQuery = `UPDATE faculity_users SET emailtoken = ?, emailverify=? WHERE faculityID = ?`;
            await runQuery(updateQuery, [null, 1, req.query.facultyID]);

            // return sendSuccess(res, { data: [], message: "We have sent verification link to your registered email..." });

            const token = await generateToken();

            await runQuery(`update faculity_users set emailtoken = ?, emailverify=?, login_token = ? where email= ?`, [null, 1, token, userData[0].email]);

            const notificationData = [req.query.facultyID, moment().format('YYYY-MM-DD HH:mm:ss')]
            await runQuery(`insert into notification set type='notification', title='Profile Verified!', message='Your profile verified successfully...', status=1, faculityID=?, created_at=?`, notificationData)

            const main = {
                data: userData[0],
                token
            }
            return sendSuccess(res, {
                data: main,
                message: "Your profile verified successfully...",
            });

        } else {
            return sendError(res, { message: "Invalid auth deatils..." });
        }




    } catch (error) {
        // handleFileDeletion();
        return handleDatabaseError(res, error);
    }
};

// Function to handle database errors jusr for above function
const handleDatabaseError = (res, error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return sendError(res, { message: "Sorry, this number is already linked to another account..." });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return sendError(res, { message: "Please select a valid city or state..." });
    }
    return sendError(res, { message: error.message });
};

const mobileVerify = async (mobile) => {
    try {

        if (!isValidMobileNumber(mobile) && !mobile) {
            // return sendError(res, { message: "Please enter valid phone number..." })
            returnMsg = {
                success: 0,
                message: "Please enter valid phone number..."
            }
        }

        const data = await runQuery(`SELECT * FROM faculity_users WHERE mobile = ?`, [mobile])
        if (data.length > 0) {
            returnMsg = {
                success: 0,
                message: "This phone number already linked to another account..."
            }
            //    return await sendError(res, { message: "This phone number already linked to another account..." }) 
            //        return res.status(500).json({
            //             status: "error",
            //             message: "This phone number already linked to another account..."
            //         });
        } else {
            returnMsg = {
                success: 1,
                message: "success..."
            }
        }

        return returnMsg;

    } catch (error) {
        // return sendError(res, { message: error.message })
    }
}

exports.registartionAdditionalInformation = async (req, res) => {
    try {
        const { u_id, bio, u_skills = ["NA"], address, linkedin_link = "NA" } = req.body
        if (!bio) {
            return sendError(res, { message: "Please enter your bio..." })
        } else if (!address) {
            return sendError(res, { message: "Please provide your full address..." })
        } else if (!Array.isArray(u_skills)) {
            return sendError(res, { message: "Please select atleast one skill..." })
        } else {
            const query = `update users set u_bio = ?, u_skills = ?, u_address = ?, linkedin_profile = ? where u_id = ?`
            await runQuery(query, [bio, JSON.stringify(u_skills), address, linkedin_link, u_id])
            return sendSuccess(res, { message: "Information has been updated successfully..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.mobileSendOTP = async ({ body: { phone_number } }, res) => {
    try {
        if (!checkPhoneNumber(phone_number)) {
            return sendError(res, { message: "Please enter valid phone number..." });
        }
        const data = await runQuery(`select * from faculity_users where mobile = ?`, [phone_number]);
        if (data.length > 0) {

            if (data[0].status == 0) {
                return sendError(res, { message: "I regret to inform you that you are not currently an active user..." })
            }

            const otpBody = generateOTP(phone_number)
            const msg = `FPSJOB - ${otpBody.otp} is your one time OTP for phone verification`
            const messageRes = await sendOTPMessage(phone_number, msg);
            const sendMain = await sendOtpMail();
            if (messageRes.success === 1) {
                const updateOtpQ = await runQuery(`UPDATE faculity_users SET hash = ?, otp = ? where mobile = ?`, [otpBody.fullHash.toString(), otpBody.otp, phone_number.toString()])
                const otpLogQuery = `INSERT INTO otp_log (
                    user_type, 
                    user_id, 
                    otp_type, 
                    otp, 
                    hash, 
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?)`;

                await runQuery(otpLogQuery, [
                    "faculity_users",
                    data[0].faculityID,
                    'otp_login',
                    otpBody.otp,
                    otpBody.fullHash.toString(),
                    moment().format('YYYY-MM-DD HH:mm:ss')
                ]);

                if (updateOtpQ.affectedRows > 0) {
                    return sendSuccess(res, { data: [otpBody.fullHash], message: "OTP has been sent..." })
                } else {
                    return sendError(res, { message: "Unable to save otp, mobile and hash..." });
                }
            } else {
                return sendError(res, { message: "Something went wrong..." })
            }
        } else {
            return sendError(res, { message: "Sorry, account is not found on this number..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.mobileVerifyOTP = async (req, res) => {
    const { phone_number, hash, otp, fcm_token, device_type } = req.body;
    const deviceId = req.headers['device-id'];
    const ipAddress = req.ip;

    if (!phone_number) {
        return sendError(res, { message: "Please enter Phone Number" });
    }
    if (!hash) {
        return sendError(res, { message: "Please enter hash" });
    }
    if (!otp) {
        return sendError(res, { message: "Please enter otp" });
    }
    if (!checkPhoneNumber(phone_number)) {
        return sendError(res, { message: "Please enter valid phone number..." });
    }
    if (!hasSixDigitsOnly(otp)) {
        return sendError(res, { message: "Please enter valid 6 digit otp..." });
    }

    try {

        const searchOtp = await runQuery(`select * from faculity_users where mobile = ?`, [phone_number])

        if (searchOtp.length > 0) {
            // const otpLog = await runQuery(`SELECT * FROM otp_log where user_id = ? and otp_type = 'otp_login' and user_type = 'faculity_users'  and otp = ? and hash = ?  ;`, [searchOtp[0].faculityID, otp, hash])            
            const otpLog = await runQuery(`SELECT * FROM otp_log where user_id = ? and otp_type = 'otp_login' and user_type = 'faculity_users' and otp = ? ;`, [searchOtp[0].faculityID, otp])
            const hashLog = await runQuery(`SELECT * FROM otp_log where user_id = ? and otp_type = 'otp_login' and user_type = 'faculity_users' and hash = ? ;`, [searchOtp[0].faculityID, hash])

            if (!otpLog.length > 0 || !hashLog.length > 0) {
                return sendError(res, { message: "Invalid Otp..." });
            } else {
                await runQuery(
                    `DELETE FROM otp_log WHERE user_id = ? and otp_type = 'otp_login' and user_type = 'faculity_users'`,
                    [searchOtp[0].faculityID]
                );
            }
        }


        // const searchOtp = await runQuery(
        //     `SELECT faculityID FROM faculity_users WHERE mobile = ? AND hash = ? AND otp = ?`,
        //     [phone_number, hash, otp]
        // );

        // if (!searchOtp.length) {
        //     return sendError(res, { data: {}, message: "Data not found..." });
        // }

        const token = await generateToken();

        const updateResult = await runQuery(
            // `UPDATE faculity_users SET login_token = ? WHERE mobile = ? AND otp = ?`,
            `UPDATE faculity_users SET login_token = ? WHERE mobile = ?`,
            [token, phone_number, otp]
        );

        if (updateResult.affectedRows > 0) {

            await runQuery(
                `UPDATE faculity_users SET regToken = ?, last_login = ? WHERE faculityID = ?`,
                [fcm_token, moment().format('YYYY-MM-DD HH:mm:ss'), searchOtp[0].faculityID]
            );

            const fcm = await runQuery(
                `SELECT regToken FROM faculity_device_token WHERE regToken = ?`,
                [fcm_token]
            );

            if (fcm.length > 0) {
                await runQuery(
                    `DELETE FROM faculity_device_token WHERE regToken = ?`,
                    [fcm_token]
                );
                await runQuery(`insert into faculity_device_token set faculityID = ?, device_type = ?, device_id = ?, ip_address = ?, regToken = ?`, [searchOtp[0].faculityID, device_type, deviceId, ipAddress, fcm_token])
            } else {
                await runQuery(`insert into faculity_device_token set faculityID = ?, device_type = ?, device_id = ?, ip_address = ?, regToken = ?`, [searchOtp[0].faculityID, device_type, deviceId, ipAddress, fcm_token])
            }

            // const JwtToken = createJWTToken(searchOtp[0], searchOtp[0].faculityID);


            const main = {
                status: "success",
                loginToken: token,
                UID: searchOtp[0].faculityID
            }
            return sendSuccess(res, { data: main, message: "Login successfully..." });
        } else {
            return sendError(res, { message: "Failed to update login token..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.changePassword = async ({ body: { faculty_id:facultyId, old_password, new_password } }, res) => {
    try {
        // if (!isValidPassword(password)) {
        //     return sendError(res, { message: "Password is invalid. It must be at least six characters long and contain at least one numeric digit and one special character." })
        // }
        if (!faculty_id) {
            return sendError(res, { message: "Please enter User Id" });
        }
        if (!old_password) {
            return sendError(res, { message: "Please enter old password" });
        }
        if (!new_password) {
            return sendError(res, { message: "Please enter new password" });
        }
        const faculty_id = generateUserIdByEnyId(facultyId)
        const data = await runQuery(`select * from faculity_users where faculityID = ?`, [faculty_id])

        const inputPasswordCheck = await compareHashPassword(old_password, data[0].password);
        if (inputPasswordCheck) {
            const newPasswordHash = await hashPassword(new_password);

            await runQuery(`update faculity_users set password = ? where faculityID = ?`, [newPasswordHash, faculty_id])
            return sendSuccess(res, { message: "Password has been updated successfully..." })
        } else {
            return sendError(res, { message: "Invalid previous password..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

// exports.forgetPassword = async (req, res) => { 
exports.forgetPassword = async ({ body: { username } }, res) => {
    try {
        // const { username } = req.body

        if (!username) {
            return sendError(res, { message: "Please enter valid email or number..." });
        } else {

            if (typeof username != "number") {
                if (!isValidEmail(username)) {
                    return sendError(res, { message: "Please enter valid email id..." })
                }
            } else {
                if (!isValidMobileNumber(username)) {
                    return sendError(res, { message: "Please enter valid phone number..." })
                }
            }

            const data = await runQuery(`select * from faculity_users where email = ? or mobile=?`, [username, username])
            let otp = createOtp()
            if (data[0]) {
                await forgetPasswordMail(data[0], otp);

                await runQuery(`update faculity_users set otp = ? where faculityID = ?`, [otp, data[0].faculityID])
                // const user = await runQuery(`select * from faculity_users where faculityID=?`, [data[0].faculityID])
                return sendSuccess(res, { data: [], message: "Send Verification Code. Please Check Your Email..." })
            } else {
                return sendError(res, { message: "Invalid username..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.resetPassword = async (req, res) => {

    try {
        const { otp, new_password, confirm_password, username } = req.body

        if (!otp) {
            return sendError(res, { message: "OTP is missing..." });
        } else if (!new_password) {
            return sendError(res, { message: "New password is missing..." });
        } else if (!confirm_password) {
            return sendError(res, { message: "Confirm password is missing..." });
        } else if (!username) {
            return sendError(res, { message: "Please enter valid email or number..." });
        } else {
            if (typeof username != "number") {
                if (!isValidEmail(username)) {
                    return sendError(res, { message: "Please enter valid email id..." })
                }
            } else {
                if (!isValidMobileNumber(username)) {
                    return sendError(res, { message: "Please enter valid phone number..." })
                }
            }
            const data = await runQuery(`select * from faculity_users where (email = ? or mobile=?) AND otp=? `, [username, username, otp])
            if (data[0]) {
                let newPassword = await hashPassword(new_password)
                await runQuery(`update faculity_users set password = ? where faculityID = ?`, [newPassword, data[0].faculityID])
                return sendSuccess(res, { message: "Password has been updated successfully..." })
            } else {
                return sendError(res, { message: "Invalid username and otp..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }

}

function createOtp() {
    const string = '70123456789';
    // const string = '99999999999';
    const stringShuffled = string.split('').sort(() => 0.5 - Math.random()).join('');
    const otp = stringShuffled.substring(1, 5);
    return otp;
}


exports.signInWithEmailAndPwd = async (req, res) => {

    const { username, password } = req.body

    const regToken = null
    const ip_address = null

    try {
        if (!username) {
            return sendError(res, { message: "Please enter valid email or number..." });
        } else if (!password) {
            return sendError(res, { message: "Please enter your password..." })
        } else {

            if (typeof username !== "number") {
                if (!isValidEmail(username)) {
                    return sendError(res, { message: "Please enter valid email id..." })
                }
            } else {
                if (!isValidMobileNumber(username)) {
                    return sendError(res, { message: "Please enter valid phone number..." })
                }
            }

            const data = await runQuery(`select * from faculity_users where email=? or mobile=?`, [username, username])
            if (data.length > 0) {
                if (data[0].status !== 1) {
                    return sendError(res, { message: "Your account is currently inactive. To reactivate your account and access all features of Tallento.ai, please log in and follow the reactivation steps. If you need assistance, contact our support team..." });
                }
                const inputPasswordCheck = await compareHashPassword(password, data[0].password);
                if (inputPasswordCheck) {

                    const token = await generateToken();

                    if (typeof username !== "number") {
                        await runQuery(`update faculity_users set regToken=?, ip_address=? ,login_token = ? ,last_login = ? where email= ?`, [regToken, ip_address, token, moment().format('YYYY-MM-DD HH:mm:ss'), data[0].email]);
                    } else {
                        await runQuery(`update faculity_users set regToken=?, ip_address=? ,login_token = ? ,last_login = ? where mobile= ?`, [regToken, ip_address, token, moment().format('YYYY-MM-DD HH:mm:ss'), data[0].mobile]);
                    }

                    // const JwtToken = createJWTToken(data[0], data[0].faculityID);

                    const main = {
                        data: data[0],
                        token
                    }
                    return sendSuccess(res, {
                        data: main,
                        message: "Login successfully...",
                    });

                } else {
                    return sendError(res, { message: "Your password is incorrect check again" });
                }
            } else {

                return sendError(res, { message: "Invalid login details..." });

            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.userProfile = async ({ body: { u_id } }, res) => {
    try {
        const data = await runQuery(`select * from users where u_id = ?`, [u_id])
        if (data.length > 0 && data[0].profile_image != null) {
            const imagePath = `${UserProfile}/${data[0].profile_image}`
            const image = fs.readFileSync(imagePath);
            data[0].profile_image = image.toString('base64')
            data[0].u_skills = JSON.parse(data[0].u_skills)
            const eduction = await runQuery(`select * from users_education where u_id=? order by create_at desc`, [u_id])
            const experience = await runQuery(`select * from users_work_experience where u_id=? order by create_at desc`, [u_id])
            data[0].eduction = eduction
            data[0].experience = experience
        }

        return sendSuccess(res, { data: data, message: "Your profile..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.setNewPassword = async ({ body: { u_id, password } }, res) => {
    try {
        if (!isValidPassword(password)) {
            return sendError(res, { message: "Password is invalid. It must be at least six characters long and contain at least one numeric digit and one special character." })
        }
        const pwd = crypto
            .pbkdf2Sync(password, process.env.SHA_KEY, 1000, 64, `sha512`)
            .toString(`hex`);
        await runQuery(`update users set password = ? where u_id =?`, [pwd, u_id])
        return sendSuccess(res, { data: [pwd], message: "Password has been created successfull..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.uploadProfileImage = async (req, res) => {
    try {
        if (req.file !== undefined) {
            const data = await runQuery(`select * from users where u_id =?`, [req.body.u_id])
            if (data.length > 0 && data[0].profile_image != null) {
                const imagePath = `${UserProfile}/${data[0].profile_image}`
                fs.unlinkSync(imagePath)
            }
            await runQuery(`update users set profile_image = ? where u_id =?`, [req.file.filename, req.body.u_id])
            return sendSuccess(res, { data: [], message: "Images uploded succesfully..." })
        } else {
            return sendError(res, { message: "Please select your profile photo..." })
        }
    } catch (error) {
        fs.unlinkSync(req.file.path)
        return sendError(res, { message: error.message })
    }
}

exports.uploadResume = async (req, res) => {
    const uploadedFile = req.file;

    try {
        if (req.file !== undefined) {
            const data = await runQuery(`select * from faculity_users where faculityID = ?`, [req.body.facultyID])
            const phoneNumber = data[0]?.mobile
            const pathData = data[0]?.cv_doc


            if (data.length > 0) {

                const delFilePath = `${process.env.USER_BASE_PATH}user${req.body.facultyID}/${pathData}`
                await deleteFile(delFilePath);
                const newFilePath = await moveFileToUserFolder(uploadedFile.path, req.body.facultyID, UserResumeBasePath, phoneNumber);
                const updateQuery = `UPDATE faculity_users SET cv_doc = ? WHERE faculityID = ?`;
                await runQuery(updateQuery, [newFilePath, req.body.facultyID]);
                return sendSuccess(res, { message: "Resume has been uploaded..." })
            } else {
                fs.unlinkSync(uploadedFile.path)
                return sendError(res, { message: "Your account is not found..." })
            }
        } else {
            return sendError(res, { message: "Please select your resume..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.resumeList = async ({ body: { u_id } }, res) => {
    try {
        const data = await runQuery(`select * from users where u_id = ?`, [u_id])
        if (data.length > 0) {
            const result = await runQuery(`select rs_id id, resume_original_name resume_name, upload_time from users_resume where u_id =? and is_deleted =?`, [u_id, 0])
            return sendSuccess(res, { data: result, message: "Resume list..." })
        } else {
            return sendError(res, { message: "Your account is not found..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.viewResume = async ({ params: { rs_id } }, res) => {
    try {
        const data = await runQuery(`select * from users_resume where rs_id=?`, [rs_id])
        if (data.length == 0) return sendError(res, { message: "Resume not found..." })
        const resumePath = `${UserResume}/${data[0].resume_db_name}`
        fs.readFile(resumePath, (error, result) => {
            if (error) {
                return sendError(res, { message: error.message })
            } else {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=${data[0].resume_original_name}`)
                res.send(result)
            }
        })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.suggestedProfileRequest = async (req, res) => {
    try {
        const { jobID, employerID, note } = req.body

        if (!jobID) {
            return sendError(res, { message: "Please enter school or college name..." })
        } else if (!employerID) {
            return sendError(res, { message: "Please enter your degree..." })
        } else {
            await runQuery(`insert into suggested_profile_request set jobID=?, employerID=?, note=?, created_at=?`, [jobID, employerID, note, moment().format('YYYY-MM-DD HH:mm:ss')])
            return sendSuccess(res, { message: "Request added, We will update you soon..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.employerSalaryBreakdownSet = async (req, res) => {
    try {
        const { employerID:emp_id, deduction_key, deduction_value } = req.body
        if (!emp_id) {
            return sendError(res, { message: "Please enter employer ID..." })
        } else if (!deduction_key) {
            return sendError(res, { message: "Please enter deduction type..." })
        } else if (!deduction_value) {
            return sendError(res, { message: "Please enter deduction %..." })
        } else {
            if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
            const employerID = await getEmployerIdByEnyId(emp_id)
            if (!employerID) return sendError(res, { message: 'Invalid Institute ID' })

            const data = await runQuery(`select * from employer_salary_breakdown where employerID=? and deduction_key=?`, [employerID, deduction_key])
            if (data.length == 0) {
                await runQuery(`insert into employer_salary_breakdown set employerID=?, deduction_key=?, deduction_value=?, created_at=?`, [employerID, deduction_key, deduction_value, moment().format('YYYY-MM-DD HH:mm:ss')])
                return sendSuccess(res, { message: "Data Added..." })
            } else {
                const updateQuery = `UPDATE employer_salary_breakdown SET deduction_value = ? WHERE id = ?`;
                await runQuery(updateQuery, [deduction_value, data[0].id]);
                return sendSuccess(res, { message: "Data Updated..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.employerSalaryBreakdownGet = async (req, res) => {
    try {
        const { employerID:emp_id } = req.query
        if (!emp_id) {
            return sendError(res, { message: "Please enter employer ID..." })
        } else {
            const employerID = await getEmployerIdByEnyId(emp_id)
            if (!employerID) return sendError(res, { message: 'Invalid Institute ID' })

            const data = await runQuery(`select * from employer_salary_breakdown where employerID=?`, [employerID])
            if (data.length > 0) {
                return sendSuccess(res, { data: data, message: "data list..." })
            } else {
                return sendError(res, { message: "Please enter valid employer id..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.addEducation = async (req, res) => {
    try {
        const { institute_name, degree, field = "NA", started, completed, u_id } = req.body
        if (!institute_name) {
            return sendError(res, { message: "Please enter school or college name..." })
        } else if (!degree) {
            return sendError(res, { message: "Please enter your degree..." })
        } else if (!isValidDateFormat(started) || !isValidDateFormat(completed)) {
            return sendError(res, { message: "Please select the valid date..." })
        } else {
            await runQuery(`insert into users_education set u_id=?, institute_name=?, degree=?, major=?, start_date=?, end_date=?`, [u_id, institute_name, degree, field, started, completed])
            return sendSuccess(res, { message: "Added successfully..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.addExperience = async (req, res) => {
    try {
        const { institute_name, position, start_date, end_date, short_description = "NA", u_id } = req.body
        if (!institute_name) {
            return sendError(res, { message: "Please provide the institute name..." })
        } else if (!position) {
            return sendError(res, { message: "Please enter the position..." })
        } else if (!isValidDateFormat(start_date)) {
            return sendError(res, { message: "Please select the valid start date..." })
        } else {
            await runQuery(`insert into users_work_experience set u_id=?, institute_name=?, position=?, short_description=?, start_date=?, end_date=?`, [u_id, institute_name, position, short_description, start_date, end_date])
            return sendSuccess(res, { message: "Added successfully..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.generateProfileLink = async (req, res) => {
    try {
        const facultyID = req.query.facultyID;

        if (facultyID) {
            const encryptedUserId = Buffer.from(facultyID).toString('base64')
            const userData = {
                encryptedUserId: Buffer.from(facultyID).toString('base64'),
                url: `${process.env.FRONT_URL}user/${encryptedUserId}`
            };
            res.status(200).json({ status: true, statusCode: 200, success: true, message: 'User profile link...', data: userData });
        } else {
            res.status(400).json({ data: 'Faculity ID is required.', status: false, statusCode: 400, success: false, message: 'Faculty ID is required.' });
        }

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.getSharedProfile = async (req, res) => {
    try {
        let facultyID = req.query.facultyID;

        if (facultyID) {
            facultyID = Buffer.from(facultyID, 'base64').toString('utf8')

            // Main user query
            let userQuery = `
                SELECT 
                    faculity_users.packID,
                    faculity_users.demolecture,
                    tbl_functions.CID,
                    faculity_users.login_token,
                    faculity_users.video,
                    faculity_users.faculityID,
                    faculity_users.premium,
                    faculity_users.name,
                    faculity_users.email,
                    faculity_users.mobile,
                    faculity_users.state,
                    faculity_users.city,
                    faculity_users.qualification AS qualification_id,
                    tbl_qualifications.qualification,
                    faculity_users.experience AS experience_id,
                    tbl_experience.experience,
                    faculity_users.salary AS salary_id,
                    tbl_salary.salary,
                    faculity_users.status,
                    CASE 
                        WHEN faculity_users.image IS NOT NULL 
                        THEN CONCAT('https://admin.fpsjob.com/', 'sources/upload/userAttachment/user', faculity_users.faculityID, '/', faculity_users.image)
                        ELSE ''
                    END AS image,
                    CASE 
                        WHEN faculity_users.cv_doc IS NOT NULL 
                        THEN CONCAT('https://admin.fpsjob.com/', 'sources/upload/userAttachment/user', faculity_users.faculityID, '/', faculity_users.cv_doc)
                        ELSE ''
                    END AS cv_doc,
                    faculity_users.regToken,
                    faculity_users.update_status,
                    faculity_users.updated_at,
                    faculity_users.created_at,
                    tbl_functions.function AS job_function_name,
                    tbl_functions.topic_name,
                    faculity_users.job_function AS job_function_id,
                    faculity_users.last_employer,
                    faculity_users.university,
                    faculity_users.current_employer,
                    faculity_users.dob,
                    faculity_users.passing_year,
                    faculity_users.skill,
                    faculity_users.work_status,
                    faculity_users.alternate_contact,
                    faculity_users.duration_notice_period
                FROM faculity_users
                LEFT JOIN tbl_salary ON tbl_salary.ID = faculity_users.salary
                LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_users.qualification
                LEFT JOIN tbl_functions ON tbl_functions.ID = faculity_users.job_function
                LEFT JOIN tbl_experience ON tbl_experience.ID = faculity_users.experience
                WHERE faculity_users.faculityID = ?
            `;
            let user = await runQuery(userQuery, [facultyID]);

            if (user.length === 0) {
                return res.status(200).json({
                    status: "error",
                    message: "User not found."
                });
            }
            user = user[0];

            // Notification query
            let noteQuery = `SELECT COUNT(*) AS num_rows FROM notification WHERE faculityID = ? AND status = 1`;
            const note = await runQuery(noteQuery, [facultyID]);
            user.unread_notification = note[0].num_rows;

            // Experience data query
            let experienceQuery = `SELECT * FROM faculity_experience WHERE faculityID = ?`;
            user.experience_data = await runQuery(experienceQuery, [facultyID]);

            // Education data query
            let educationQuery = `
                SELECT 
                    faculity_education.*, 
                    result_type.type AS result_type, 
                    education_type.type AS education_type, 
                    tbl_qualifications.qualification AS course_txt
                FROM faculity_education
                LEFT JOIN result_type ON result_type.id = faculity_education.result_type
                LEFT JOIN education_type ON education_type.id = faculity_education.type
                LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_education.course
                WHERE faculityID = ?
            `;
            user.education_data = await runQuery(educationQuery, [facultyID]);

            // Skill data query
            let skillQuery = `
                SELECT 
                    faculity_skill.*, 
                    skills.*
                FROM faculity_skill
                LEFT JOIN skills ON skills.id = faculity_skill.skill
                WHERE faculity_skill.faculityID = ?
            `;
            user.skill_data = await runQuery(skillQuery, [facultyID]);

            // Language data query
            let languageQuery = `
                SELECT 
                    faculity_language.*, 
                    language.language AS language_text
                FROM faculity_language
                LEFT JOIN language ON language.id = faculity_language.language
                WHERE faculityID = ?
            `;
            const languageData = await runQuery(languageQuery, [facultyID]);
            for (const value of languageData) {
                value.can_read_txt = value.can_read === 1 ? "Read" : "";
                value.can_write_txt = value.can_write === 1 ? "Write" : "";
                value.can_speak_txt = value.can_speak === 1 ? "Speak" : "";
            }
            user.language_data = languageData;

            // Certificate data query
            let certificateQuery = `
                SELECT * FROM faculity_certificate WHERE faculityID = ?
            `;
            const certificateData = await runQuery(certificateQuery, [facultyID]);
            for (const value of certificateData) {
                value.certificate_file = `${process.env.FILE_BASE_URL}sources/upload/userAttachment/user${facultyID}/${value.certificate_file}`;
            }
            user.certificate_data = certificateData;

            // Career preferences data query
            let careerPreferencesQuery = `
                SELECT 
                    faculity_career_preferences.*, 
                    career_preferences.type AS career_type, 
                    career_preferences.value AS career_value
                FROM faculity_career_preferences
                LEFT JOIN career_preferences ON career_preferences.id = faculity_career_preferences.career_id
                WHERE faculity_career_preferences.faculityID = ?
            `;
            user.career_preferences = await runQuery(careerPreferencesQuery, [facultyID]);

            // City preferences data query
            let cityPreferencesQuery = `
                SELECT 
                    faculity_city_preferences.*, 
                    cities.name AS city_name
                FROM faculity_city_preferences
                LEFT JOIN cities ON cities.id = faculity_city_preferences.city
                WHERE faculity_city_preferences.faculityID = ?
            `;
            user.city_preferences = await runQuery(cityPreferencesQuery, [facultyID]);

            // Salary preferences data query
            let salaryPreferencesQuery = `
                SELECT 
                    faculity_users.faculityID, 
                    tbl_salary.salary AS salary, 
                    tbl_salary.ID AS salary_id
                FROM faculity_users
                LEFT JOIN tbl_salary ON tbl_salary.ID = faculity_users.expected_salary
                WHERE faculity_users.faculityID = ?
            `;
            user.salary_preferences = await runQuery(salaryPreferencesQuery, [facultyID]);

            // Social link data query

            const socialLinkQuery = `SELECT social_link FROM faculty_basic_info WHERE user_id = ?`;
            const socialLinkData = await runQuery(socialLinkQuery, [facultyID]);

            let socialLink = null;

            if (socialLinkData.length > 0 && socialLinkData[0].social_link) {
                try {
                    const dataUnserial = unserialize(socialLinkData[0].social_link);
                    socialLink = Object.entries(dataUnserial).map(([platform, value]) => ({ platform, value }));
                } catch (error) {
                    console.error("Failed to unserialize social link data:", error);
                }
            }

            user.social_link = socialLink || [];

            // Other details query
            let otherDetailsQuery = `
                SELECT 
                    faculty_basic_info.bio, 
                    faculty_basic_info.address, 
                    faculty_basic_info.hometown, 
                    faculty_basic_info.pincode, 
                    faculty_basic_info.banner, 
                    faculity_users.gender, 
                    faculity_users.dob
                FROM faculty_basic_info
                LEFT JOIN faculity_users ON faculity_users.faculityID = faculty_basic_info.user_id
                WHERE user_id = ?
            `;
            const otherDetails = await runQuery(otherDetailsQuery, [facultyID]);
            if (otherDetails.length && otherDetails[0].banner) {
                otherDetails[0].banner = `${process.env.FILE_BASE_URL}sources/upload/userAttachment/user${facultyID}/${otherDetails[0].banner}`;
            }
            user.other_details = otherDetails[0];
            user.created_at = getDateFormat(user.created_at)
            user.updated_at = getDateFormat(user.updated_at)

            const path = `${process.env.FILE_BASE_URL}sources/upload/user_videos`;
            const responseData = {
                user: user,
                unread_notification: user.unread_notification,
                path: path
            }


            return sendSuccess(res, { data: responseData, message: "User Detail List..." })
        } else {
            res.status(400).json({ data: 'Faculity ID is required.', status: false, statusCode: 400, success: false, message: 'Faculty ID is required.' });
        }

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.authCheck = async (req, res) => {
    try {
        let email = req.query.email;
        let mobile = req.query.mobile;

        if (email) {

            if (!isValidEmail(email)) {
                return sendError(res, { message: "Please enter valid email id..." })
            }
            // Main user query
            let userQuery = `SELECT email FROM faculity_users WHERE email = ?`;
            let user = await runQuery(userQuery, [email]);

            if (user.length !== 0) {
                return res.status(200).json({
                    status: "error",
                    message: "Email already exists."
                });
            }
            return sendSuccess(res, { data: "", message: "data..." })
        } else if (mobile) {
            if (!isValidMobileNumber(mobile)) {
                return sendError(res, { message: "Please enter valid phone number..." })
            }

            // Main user query
            let userQuery = `SELECT mobile FROM faculity_users WHERE mobile = ?`;
            let user = await runQuery(userQuery, [mobile]);

            if (user.length !== 0) {
                return res.status(200).json({
                    status: "error",
                    message: "Mobile already exists."
                });
            }
            return sendSuccess(res, { data: "", message: "data..." })

        } else {
            res.status(400).json({ data: '', status: false, statusCode: 400, success: false, message: 'Email/Number is required.' });
        }

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.verifyToken = async (req, res) => {
    try {
        const { facultyID, login_token, fcm_token, device_type, device_id, user_ip } = req.body

        if (!facultyID) {
            return sendError(res, { message: "Please provide the faculty id..." })
        } else if (!login_token) {
            return sendError(res, { message: "Please enter the token..." })
        } else {
            // const data = await runQuery(`Select * from faculity_users where faculityID=? and login_token=?`, [facultyID, login_token])
            const data = await runQuery(`Select * from faculity_users where faculityID=?`, [facultyID])
            if (data.length > 0) {

                if (data[0].login_token == login_token) {
                    const main = {
                        status: "success",
                        loginToken: login_token,
                        UID: data[0].faculityID
                    }
                    return sendSuccess(res, { data: main, message: "Login successfully..." });
                } else {
                    const token = await generateToken();
                    const updateResult = await runQuery(
                        `UPDATE faculity_users SET login_token = ? WHERE mobile = ?`,
                        [token, data[0].mobile]
                    );

                    if (updateResult.affectedRows > 0) {
                        await runQuery(
                            `UPDATE faculity_users SET regToken = ?, device_type=?, last_login = ? WHERE faculityID = ?`,
                            [fcm_token, device_type, moment().format('YYYY-MM-DD HH:mm:ss'), data[0].faculityID]
                        );

                        const fcm = await runQuery(
                            `SELECT regToken FROM faculity_device_token WHERE regToken = ?`,
                            [fcm_token]
                        );

                        if (fcm.length > 0) {
                            await runQuery(
                                `DELETE FROM faculity_device_token WHERE regToken = ?`,
                                [fcm_token]
                            );
                            await runQuery(`insert into faculity_device_token set faculityID = ?, device_type = ?, device_id = ?, ip_address = ?, regToken = ?`, [data[0].faculityID, device_type, device_id, user_ip, fcm_token])
                        } else {
                            await runQuery(`insert into faculity_device_token set faculityID = ?, device_type = ?, device_id = ?, ip_address = ?, regToken = ?`, [data[0].faculityID, device_type, device_id, user_ip, fcm_token])
                        }
                        const main = {
                            status: "success",
                            loginToken: token,
                            UID: data[0].faculityID
                        }
                        return sendSuccess(res, { data: main, message: "Login successfully..." });
                    }
                }
            } else {
                return sendError(res, { data: {}, message: "Login token expired..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.faculitySearchSave = async (req, res) => {
    try {
        const { facultyID, data } = req.body
        if (!facultyID) {
            return sendError(res, { message: "Please provide the faculty id..." })
        } else if (!data) {
            return sendError(res, { message: "Please enter the search data..." })
        } else {
            const searchData = await runQuery(`Select * from faculity_search where faculityID=?`, [facultyID])
            if (searchData.length == 10) {
                const deletedata = await runQuery(`Select * from faculity_search where faculityID=? order by id ASC limit 1`, [facultyID])
                await runQuery(`DELETE FROM faculity_search where id=? `, [deletedata[0].id])

                await runQuery(`insert into faculity_search set faculityID=?, data=?, created_at=?`, [facultyID, JSON.stringify(data), moment().format('YYYY-MM-DD HH:mm:ss')])
                return sendSuccess(res, { message: "Search history added..." })
            } else {
                await runQuery(`insert into faculity_search set faculityID=?, data=?, created_at=?`, [facultyID, JSON.stringify(data), moment().format('YYYY-MM-DD HH:mm:ss')])
                return sendSuccess(res, { message: "Search history added..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.faculitySearchList = async (req, res) => {
    try {
        if (!req.query.facultyID) {
            return sendError(res, { message: "Please provide the faculty id..." })
        } else {
            let searchData = await runQuery(`Select * from faculity_search where faculityID=? order by id DESC`, [req.query.facultyID])
            searchData = searchData.map(row => {
                return (
                    faculityID = row.faculityID,
                    data = JSON.parse(row.data)
                )
            });
            return sendSuccess(res, { data: searchData, message: "Data list..." })

        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
 
