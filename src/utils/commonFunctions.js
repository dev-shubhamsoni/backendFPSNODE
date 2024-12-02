const crypto = require('crypto')
const moment = require('moment');
const { runQuery } = require("../utils/executeQuery")

const sendError = (res, { data = [], message, code = 400 }) => {
    res.json({
        status: false,
        statusCode: code,
        data: data,
        message: message
    })
}


const sendSuccess = (res, { data = [], message, code = 200 }) => {
    const response = {
        status: true,
        statusCode: code,
        data: data,
        message: message
    };

    res.json(response);
}
const sendPaginationSuccess = (res, { data = [], total_data = 0, message, code = 200 }) => {
    res.json({
        status: true,
        statusCode: code,
        data: data,
        total_data: total_data,
        message: message
    })
}

function generateUniqueString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

function getDateFormat(date) {

    if (date != null && date != "Invalid Date") {
        const options = {
            timeZone: "Asia/Kolkata",       // Convert to IST
            year: "numeric",                // 4-digit year
            month: "2-digit",               // 2-digit month
            day: "2-digit",                 // 2-digit day
            hour: "2-digit",                // 2-digit hour
            minute: "2-digit",              // 2-digit minute
            second: "2-digit",              // 2-digit second
            hour12: true                   // 24-hour format
        };
        date = date.toLocaleString('en-US', options);
        const formattedDate = moment(date, "MM/DD/YYYY, hh:mm:ss A").format("DD,MMM YYYY hh:mm A");
        return formattedDate;
    } else {
        return null;
    }

}
function convertToAmPm(date) {

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let amPm = hours >= 12 ? 'PM' : 'AM';

    // Convert 24-hour time to 12-hour time
    hours = hours % 12;
    hours = hours ? hours : 12; // Hour '0' should be '12'

    // Add a leading zero to minutes if they are less than 10
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${amPm}`;

}

function notificationMesssage(status) {

    const messageArray = {
        "Applied": {
            "title": "test title",
            "message": "test message"
        },
        "Demo Round": {
            "title": "test title",
            "message": "test message"
        },
        "Hired": {
            "title": "test title",
            "message": "test message"
        },
        "Interview scheduled": {
            "title": "test title",
            "message": "test message"
        },
        "Offers Made": {
            "title": "test title",
            "message": "test message"
        },
        "Profile on hold": {
            "title": "test title",
            "message": "test message"
        },
        "Profile Reviewed": {
            "title": "test title",
            "message": "test message"
        },
        "Profile Shortlisted": {
            "title": "test title",
            "message": "test message"
        },
        "Rejected": {
            "title": "test title",
            "message": "test message"
        },
        "Salary negotiation": {
            "title": "test title",
            "message": "test message"
        },
        "Written demo/Technical Round": {
            "title": "test title",
            "message": "test message"
        }
    };

    return messageArray[status];

}

function generateUserId(userId) {
    const ENCRYPTION_KEY = crypto.randomBytes(32); // Must be 32 bytes for AES-256
    const IV = crypto.randomBytes(16); // Initialization vector, must be 16 bytes

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(userId.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    let enyIdOne = Math.floor(Math.random() * 90000) + 10000;
    let enyIdTwo = Math.floor(Math.random() * 90000) + 10000;
    enyID = enyIdOne + "" + encrypted + "" + enyIdTwo;
    return enyID;
}

async function generateUserIdByEnyId(eny_id) {
    const data = await runQuery(`SELECT * from faculity_users WHERE eny_id = ?`, [eny_id]);
    if (data.length > 0) {
        return data[0].faculityID;
    } else {
        return null;
    }
}

async function replaceFacultyID(keyArray, eny_id = null, facultyID) {    
    const faculityKeyArray = [
        "faculityID", "faculitId", "user_id", "faculity_id" 
    ]
    if(faculityKeyArray.includes(keyArray)){
        if(!eny_id){
            data = await runQuery(`SELECT eny_id from faculity_users WHERE faculityID = ?`, [facultyID]) 
            return data[0].eny_id
        } else {
            return eny_id;
        }
    }
}

async function getEmployerIdByEmployerID(employerID) {

    const data = await runQuery(`SELECT * from employer_user WHERE employerID  = ?`, [employerID])

    
    if (data.length > 0) {
        // console.log('data',data[0].emp_eny_id);
        return data[0].emp_eny_id;
    } else {
        return null;
    }
}

async function getEnyIdByJobId(jobID) {

    const data = await runQuery(`SELECT * from jobs WHERE jobID  = ?`, [jobID])
    
    if (data.length > 0) {
        return data[0].job_eny_id;
    } else {
        return null;
    }
}
async function getJobIdByEnyId(encID) {

    const data = await runQuery(`SELECT * from jobs WHERE encID  = ?`, [encID])
    
    if (data.length > 0) {
        return data[0].jobID;
    } else {
        return null;
    }
}


module.exports = {
    sendError,
    sendSuccess,
    sendPaginationSuccess,
    notificationMesssage,
    generateUserId,
    getDateFormat,
    convertToAmPm,
    generateUserIdByEnyId,
    replaceFacultyID,
    generateUniqueString,
    getEmployerIdByEmployerID,
    getEnyIdByJobId
}