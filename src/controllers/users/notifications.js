const { sendError, sendSuccess, getDateFormat } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { isValidJson } = require("../../utils/validator");
const WORK_PLACE_TYPE = ["On-Site", "Hybrid", "Remote"]
const JOBS_TYPE = ["Full Time", "Part Time", "Contract", "Hourly Basis", "Internship"]
const { sendNotificationToFaculity } = require("../../utils/firebaseHandler");


exports.notificationList = async (req, res) => {
    try {
        const {
            facultyID,
        } = req.query;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user id name..." })
        }

        const notification = await runQuery(`SELECT CONVERT(notification.NID, CHAR(20)) as NID, CONVERT(notification.faculityID, CHAR(20)) as faculityID, 
            notification.title, notification.message, notification.type, 
            notification.linkID, notification.created_at, CONVERT(notification.status, CHAR(20)) as status, 
            jobs.job_title, CONVERT(jobs.jobId, CHAR(20)) as jobId, jobs.slug, jobs.state, jobs.city, jobs.salary_unit, CONVERT(jobs.min_experience, CHAR(20)) as min_experience, CONVERT(jobs.max_experience, CHAR(20)) as max_experience, 
            jobs.experience_unit, CONVERT(jobs.catID, CHAR(20)) as catID, applied_jobs.applyID
                        FROM notification
                        JOIN jobs ON jobs.jobID=notification.linkID
                        LEFT JOIN applied_jobs ON applied_jobs.jobId=jobs.jobId AND applied_jobs.faculityID = ?
                        /* WHERE notification.status = 1 */
                        WHERE notification.faculityID = ?
                        ORDER BY notification.NID DESC
                        LIMIT 20`, [facultyID, facultyID])

        notification.forEach(item => {
            item.created_at = getDateFormat(item.created_at)
        });
        const responseData = {
            notification: notification,
        };
        return sendSuccess(res, { data: responseData, message: "Notification data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.notificationRead = async (req, res) => {
    try {
        const {
            facultyID,
            notification_id
        } = req.query;

        // if (!facultyID) {
        //     return sendError(res, { message: "Please enter your user id name..." })
        // } 
        if (notification_id) {
            const query = `UPDATE notification SET status = 2 WHERE status != 3 AND NID = ?`
            await runQuery(query, [notification_id])
        } else {
            const query = `UPDATE notification SET status = 2 WHERE status != 3 AND faculityID =?`
            await runQuery(query, [facultyID])
        }
        return sendSuccess(res, { message: "notification marked as read...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.notificationDelete = async (req, res) => {
    try {
        const {
            facultyID,
            notification_id
        } = req.query;

        if (facultyID) {
          const query = `DELETE FROM notification WHERE faculityID = ?`
          await runQuery(query, [facultyID])
        } else {
          const query = `DELETE FROM notification WHERE NID = ?`
          await runQuery(query, [notification_id])
        }        
        return sendSuccess(res, { message: "Notification is deleted...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.sendBulkNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculityID, name, regToken, device_type FROM faculity_users 
                    WHERE regToken IS NOT Null and regToken != "" and (device_type = 'ios' or device_type = 'Android') 
                    and regToken NOT IN ('no token') and mobile IN (7976747422, 7814858262) LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'New Jobs Matched for You!', 
                    body: `🎓 Keep your education details up-to-date! Whether you’ve completed a new course or earned a degree, make sure to add it to boost your profile....`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.sendCareerPreferencesNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users
                JOIN faculity_career_preferences on faculity_career_preferences.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'What’s Your Dream Job? Let Us Know!', 
                    body: `🎯Don't forget to update your career preferences! Let us know your desired job role and industry to receive tailored job recommendations...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
exports.sendFaculityCertificateNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                JOIN faculity_certificate on faculity_certificate.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Boost Your Profile: Share Your Certificate Now!', 
                    body: `📜Great news! You've just earned a new certificate. Make sure to add it to your profile to increase your chances of getting noticed by employers...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
exports.sendFaculityCityPreferencesNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                JOIN faculity_city_preferences on faculity_city_preferences.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Help Us Find Jobs in Your Dream City!', 
                    body: `🌍Update your city preferences today! Let us know where you’d like to work, and we'll send you job opportunities in your preferred locations...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.sendFaculityExperienceNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type FROM faculity_users 
                JOIN faculity_experience on faculity_experience.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Boost Your Profile: Share Your Professional Experience!', 
                    body: `📊 Time to update your experience! Highlight your latest achievements and roles to stand out to recruiters...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.sendFaculityLanguageNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                JOIN faculity_language on faculity_language.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') and faculity_users.regToken NOT IN ('no token') 
                GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Set Your Language Preference for a Better Experience!', 
                    body: `🌐 Have you learned a new language or improved your skills? Update your language proficiency in your profile to attract more opportunities...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
exports.sendFaculityEducationNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                JOIN faculity_education on faculity_education.faculityID != faculity_users.faculityID
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset]) 

            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Enhance Your Profile: Share Your Education Background!', 
                    body: `🎓 Keep your education details up-to-date! Whether you’ve completed a new course or earned a degree, make sure to add it to boost your profile...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
exports.sendFaculitySkillNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type FROM faculity_users 
                JOIN faculity_skill on faculity_skill.faculityID != faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset])
            
            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Your Dream Job Awaits—Add Your Skills Now!', 
                    body: `💼 New skill alert! Keep your skills section updated with your latest expertise to match with jobs that require your abilities...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
exports.sendPackSubscriptionNotification = async (req, res) => {
    try {
        let offset = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          try { 
            const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type FROM faculity_users 
                JOIN pack_subscription on pack_subscription.faculityID = faculity_users.faculityID 
                WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                and faculity_users.regToken NOT IN ('no token') And (pack_subscription.expire_date < '2024-10-11' or pack_subscription.end_date < '2024-10-11') 
                GROUP by pack_subscription.faculityID LIMIT ? OFFSET ? ;`, [1000, offset])
            
            await data.forEach((value) => {
                const name  = value.name.charAt(0).toUpperCase() + value.name.slice(1);
                sendNotificationToFaculity(value.regToken, {
                    title: 'Unlock Premium Benefits—Subscribe Now!', 
                    body: `⚠ Your subscription has expired. Renew today to continue accessing premium features and stay ahead in your job search...`,
                    job_url: null
                });
            });            
            if (data.length < 1000) {
              hasMoreData = false;  // Stop fetching when less than 1000 records are returned
            }
            offset += 1000;
          } catch (err) {
            console.error('Error fetching data:', err);
            hasMoreData = false;
          }
        }
        return sendSuccess(res, { data: null, message: "notification Sent...." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


// exports.faculitySearchNotification = async (req, res) => {
//   try { 
//       if (!req.query.facultyID) {
//           return sendError(res, { message: "Please provide the faculty id..." })
//       } else { 
//           let searchData = await runQuery(`Select * from faculity_search where faculityID=? order by id DESC limit 2`, [req.query.facultyID])
//           searchData = searchData.map(row => { 
//               return (
//                   faculityID = row.faculityID,
//                   data = JSON.parse(row.data)
//               ) 
//           }); 
//           return sendSuccess(res, { data: searchData, message: "Data list..." })
           
//       }
//   } catch (error) {
//       return sendError(res, { message: error.message })
//   }
// }