const { sendSuccess, sendError } = require("../../utils/commonFunctions")
const { runQuery } = require("../../utils/executeQuery")
const { createJWTToken } = require("../../utils/jwtHandler")
const { isValidEmail, isValidMobileNumber, isValidJson } = require("../../utils/validator")
const crypto = require('crypto')
const fs = require('fs')

exports.registrationCallUsers = async (req, res) => {
    try {
        const {
            name,
            email_id,
            phone_number,
            password
        } = req.body
        if (!name) {
            return sendError(res, { message: "Please provide employee name..." })
        } else if (!isValidEmail(email_id)) {
            return sendError(res, { message: "Please provide the valid email id..." })
        } else if (!isValidMobileNumber(phone_number)) {
            return sendError(res, { message: "Please provide the valid mobile number..." })
        } else if (!password || password.length > 18 || password.length < 6) {
            return sendError(res, { message: "Password length between six to eighteen..." })
        } else {
            const pwd = crypto
                .pbkdf2Sync(password, process.env.SHA_KEY, 1000, 64, `sha512`)
                .toString(`hex`);
            await runQuery(`insert into call_users set u_name=?,e_mail=?,phone_number=?,password=?`, [name, email_id, phone_number, pwd])
            return sendSuccess(res, { message: "Account has been created successfully..." })
        }
    } catch (error) {
        if (error.code == "ER_DUP_ENTRY") {
            return sendError(res, { message: "This mail already used. Try New" })
        }
        return sendError(res, { message: error.message })
    }

}

exports.callLogLogin = async ({ body: { email_id, password } }, res) => {
    try {
        if (!isValidEmail(email_id)) {
            return sendError(res, { message: "Please enter the email id..." })
        } else if (!password) {
            return sendError(res, { message: "Please enter the password..." })
        } else {
            const data = await runQuery(`select * from call_users where e_mail = ?`, [email_id])
            if (data.length > 0) {
                const pwd = crypto
                    .pbkdf2Sync(password, process.env.SHA_KEY, 1000, 64, `sha512`)
                    .toString(`hex`);
                if (data[0].password == pwd) {
                    return sendSuccess(res, { data: [createJWTToken(data[0])], message: "Login has been completed..." })
                } else {
                    return sendError(res, { message: "Invalid password..." })
                }
            } else {
                return sendError(res, { message: "Account not found on this email id..." })
            }
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.uploadCallLogs = async (req, res) => {
    try {
        const { body, u_id } = req.body
        if (!isValidJson(JSON.stringify(body))) {
            return sendError(res, { message: "Please upload valid data..." })
        } else {
            let jsonBody = JSON.parse(body)
            const values = jsonBody.map(item => {
                const now = new Date();
                now.setHours(now.getHours() + 5);
                now.setMinutes(now.getMinutes() + 30);
                return [
                    u_id,
                    item.call_type || 'incoming',
                    item.caller_phone_number || '',
                    item.receiver_phone_number || '',
                    item.call_start_time || now,
                    item.call_end_time || null,
                    item.call_duration_sec || '',
                    item.call_status || null
                ]
            })
            await runQuery(`insert into call_logs (u_id,call_type, caller_phone_number, receiver_phone_number, call_start_time, call_end_time, call_duration_sec, call_status) values ?`, [values])
            return sendSuccess(res, { message: "Call logs has been uploaded..." })
        }

    } catch (error) {
        console.log(error);
        if (error.code == 'ER_TRUNCATED_WRONG_VALUE') {
            return sendError(res, { message: "Please provide the valid values..." })
        }
        return sendError(res, { message: error.message })
    }
}


exports.callUserList = async ({ query: { status, name, number } }, res) => {
    try {
        let query = `SELECT * FROM call_users WHERE 1=1`;
        const values = [];

        if (status && (status === 'yes' || status === 'no')) {
            query += ` AND u_active = ?`;
            values.push(status);
        }
        if (name) {
            query += ` AND u_name LIKE ?`;
            values.push(`%${name}%`);
        }
        if (number) {
            query += ` AND phone_number LIKE ?`;
            values.push(`%${number}%`);
        }
        const data = await runQuery(query, values);
        return sendSuccess(res, { data: data, message: "Users list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.usersCallList = async ({ params: { u_id }, body, query: { fromDate, toDate } }, res) => {
    try {
        if (!u_id && body && body.u_id) {
            u_id = body.u_id;
        }
        let whereClause = '';
        let queryParams = [u_id];
        if (fromDate && toDate) {
            whereClause = 'WHERE u_id = ? AND date(call_adding_time) BETWEEN ? AND ?';
            queryParams.push(fromDate, toDate);
        } else {
            whereClause = 'WHERE u_id = ? AND date(call_adding_time) = CURDATE()';
        }
        const query = `
            SELECT 
            count(*) as total_calls,
                SUM(CASE WHEN call_type = 'incoming' THEN 1 ELSE 0 END) AS total_incoming,
                SUM(CASE WHEN call_type = 'outgoing' THEN 1 ELSE 0 END) AS total_outgoing,
                SUM(CASE WHEN call_type = 'missed' THEN 1 ELSE 0 END) AS total_missed,
                SUM(CASE WHEN call_type = 'incoming' THEN call_duration_sec ELSE 0 END) AS total_incoming_duration,
                SUM(CASE WHEN call_type = 'outgoing' THEN call_duration_sec ELSE 0 END) AS total_outgoing_duration
            FROM call_logs
            ${whereClause}
        `;

        const callListQuery = `
            SELECT *
            FROM call_logs
            ${whereClause}
        `;

        const callList = await runQuery(callListQuery, queryParams)
        const statistics = await runQuery(query, queryParams)
        return sendSuccess(res, { data: [{ statistics, callList }], message: "Users data...." })

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.callLogDashboard = async (req, res) => {
    try {
        const query = `
            SELECT 
            cu.u_name,
            cl.u_id,
            COUNT(*) AS total_calls,
                SUM(CASE WHEN call_type = 'incoming' THEN 1 ELSE 0 END) AS total_incoming,
                SUM(CASE WHEN call_type = 'outgoing' THEN 1 ELSE 0 END) AS total_outgoing,
                SUM(CASE WHEN call_type = 'missed' THEN 1 ELSE 0 END) AS total_missed,
                SUM(CASE WHEN call_type = 'incoming' THEN call_duration_sec ELSE 0 END) AS total_incoming_duration,
                SUM(CASE WHEN call_type = 'outgoing' THEN call_duration_sec ELSE 0 END) AS total_outgoing_duration
            FROM call_logs cl join call_users cu on cu.u_id=cl.u_id
            WHERE DATE(call_start_time) = CURDATE()
            GROUP BY u_id
        `;
        const data = await runQuery(query)
        return sendSuccess(res, { data: data, message: "All today data..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.downloadCallLogCSV = async ({ query: { user_id, from_date, to_date } }, res) => {
    try {

        let whereClause = '';
        const queryParams = []
        if (from_date && to_date) {
            whereClause = 'WHERE date(call_adding_time) BETWEEN ? AND ?';
            queryParams.push(from_date, to_date);
        } else {
            whereClause = 'WHERE  date(call_adding_time) = CURDATE()';
        }

        if (user_id) {
            whereClause += ` and u_id = ?`
            queryParams.push(user_id)
        }

        let query = `select u_name,call_type,caller_phone_number, call_start_time,call_end_time,call_duration_sec, call_status,receiver_phone_number ,call_adding_time from call_logs cl join call_users cu on cu.u_id = cl.u_id ${whereClause}`
        const data = await runQuery(query, queryParams)
        const csvContent = data.map(row => Object.values(row).join(',')).join('\n')
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="output.csv"');
        res.send(csvContent);

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.callUserProfile = async (req, res) => {
    try {
        const { u_id } = req.body
        const q = `select * from call_users where u_id=?`
        const data = await runQuery(q, [u_id])
        return sendSuccess(res, { data: data, message: "User profiel..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.callChangePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, u_id } = req.body
        const data = await runQuery(`select * from call_users where u_id=?`, [u_id])
        if (data.length > 0) {
            const oldPwd = crypto
                .pbkdf2Sync(oldPassword, process.env.SHA_KEY, 1000, 64, `sha512`)
                .toString(`hex`)
            if (data[0].password == oldPwd) {
                const pwd = crypto
                    .pbkdf2Sync(newPassword, process.env.SHA_KEY, 1000, 64, `sha512`)
                    .toString(`hex`);
                await runQuery(`update call_users set password=? where u_id=?`, [pwd, u_id])
                return sendSuccess(res, { message: "Password has been changed successfully..." })
            } else {
                return sendError(res, { message: "Invalid old password..." })
            }
        } else {
            return sendError(res, { message: "Account not found..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}