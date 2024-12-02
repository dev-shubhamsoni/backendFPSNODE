const { sendError, sendSuccess } = require("../../utils/commonFunctions")
const { runAdminQuery } = require("../../utils/executeQuery")
const { createJWTToken } = require("../../utils/jwtHandler")
const { isValidEmail, isValidMobileNumber, isAdminPassword } = require("../../utils/validator")
const crypto = require('crypto')


exports.registration = async (req, res) => {
   



    const {
        first_name, last_name, mobile, email, state, industry, subject, city,
        added_by, password
    } = req.body;

   

    const handleValidationError = (res, field) => {
        
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
        
        return sendError(res, { message: "Please enter your bio..." })
    } else if (!isValidPassword(password)) {
        
        return sendError(res, { message: "Please enter a password that is at least 8 characters long, and includes at least one special character, one number, and one uppercase letter." })
    }

    const numberMsg = await mobileVerify(mobile);
    if (!numberMsg.success) {
        
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


       

        return sendSuccess(res, { data: [userId], message: "Registration has been completed, please verify your phone number..." });
    } catch (error) {
        
        return handleDatabaseError(res, error);
    }
};




















// -> old code

exports.adminLogin = async ({ body: { email_id, password } }, res) => {
    try {
        if (!isValidEmail(email_id)) {
            return sendError(res, { message: "Please select valid email id..." })
        } else if (!password) {
            return sendError(res, { message: "Please provide the password..." })
        } else {
            const data = await runAdminQuery(`select * from admin_info where admin_email = ?`, [email_id])
            if (data.length > 0) {
                const pwd = crypto
                    .pbkdf2Sync(password, process.env.ADMIN_PASSWORD_KEY, 1000, 64, `sha512`)
                    .toString(`hex`);
                if (data[0].admin_password == pwd) {
                    return sendSuccess(res, { data: [createJWTToken(data[0])], message: "You have logged in successfully..." })
                } else {
                    return sendError(res, { message: "Invalid passwordx..." })
                }
            } else {
                return sendError(res, { message: "Invalid email id..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.adminRolesList = async (req, res) => {
    try {
        const roles = await runAdminQuery(`select * from roles`)
        return sendSuccess(res, { data: roles, message: "Roles list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.addSubAdmins = async (req, res) => {
    try {
        // hrsupport@fpsjob.com -- use this mail for send mail 
        const { name, number, email, password, role_id } = req.body
        if (!name) {
            return sendError(res, { message: "Please provide the name..." })
        } else if (!isValidMobileNumber(number)) {
            return sendError(res, { message: "Please enter valid mobile number..." })
        } else if (!isValidEmail(email)) {
            return sendError(res, { message: "Please provide the valid email id..." })
        } else if (!isAdminPassword(password)) {
            return sendError(res, { message: "Password must be between 8 and 16 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character." })
        } else if (!role_id) {
            return sendError(res, { message: "Please select the role of admin..." })
        } else {
            const pwd = crypto
                .pbkdf2Sync(password, process.env.ADMIN_PASSWORD_KEY, 1000, 64, `sha512`)
                .toString(`hex`)
            await runAdminQuery(`insert into admin_info (admin_name,admin_number,admin_email,admin_password,role_id) values (?,?,?,?,?)`, [name, number, email, pwd, role_id])
            return sendSuccess(res, { message: "Account has been created..." })
        }
    } catch (error) {
        if (error.code == 'ER_NO_REFERENCED_ROW_2') {
            return sendError(res, { message: "Please select the valid role..." })
        } else if (error.code == 'ER_DUP_ENTRY') {
            return sendError(res, { message: "Mail id already used..." })
        }
        return sendError(res, { message: error.message })
    }
}

exports.addPermission = async ({ body: { permssion } }, res) => {
    try {
        if (!permssion) {
            return sendError(res, { message: "Please provide the name of permission..." })
        }
        await runAdminQuery(`insert into permissions(permission_name) values (?)`, [permssion])
        return sendSuccess(res, { message: "Permission has been added successfully..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.allPermissions = async (req,res)=>{
    try {
        const data = await runAdminQuery(`select * from role_permissions`)
        return sendSuccess(res,{data:data,message:"Permission..."})
    } catch (error) {
        return sendError(res,{message:error.message})
    }
}