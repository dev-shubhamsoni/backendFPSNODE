const { sendError, sendSuccess, getDateFormat, convertToAmPm } = require("../../utils/commonFunctions");
const { applyJobMail, employerApplyJobMail } = require("../../utils/mails");
const { runQuery } = require("../../utils/executeQuery");
const { isValidJson } = require("../../utils/validator");
const WORK_PLACE_TYPE = ["On-Site", "Hybrid", "Remote"]
const JOBS_TYPE = ["Full Time", "Part Time", "Contract", "Hourly Basis", "Internship"]
const moment = require('moment');
const { sendNotificationToFaculity } = require("../../utils/firebaseHandler");

exports.filterJobs = async (req, res) => {
    try {
        const {
            facultyID,
            state,
            city,
            job_title,
            salary_minimum,
            salary_maximum,
            min_experience,
            max_experience,
            job_type,
            job_function,
            limit,
            page,
            employer_name,
            area,
            categoryID
        } = req.query;

        const facID = facultyID || 103082

        const exdate = new Date().toISOString().split('T')[0];
        const packQuery = `SELECT type FROM pack_subscription WHERE faculityID = ? AND status = '1' AND end_date > ? ORDER BY SID DESC`;
        const packValues = [facID, exdate];
        const packResult = await runQuery(packQuery, packValues);
        const pack = packResult.length ? packResult[0] : '';

        let query = `
        SELECT jobs.*, 
            COALESCE(favourite_jobs.favourite, 0) AS favourite, 
            applied_jobs.status AS applied_job, 
            applied_jobs.applyID AS applyID, 
            employer_user.employerID, 
            employer_user.name AS company_name, 
            tbl_categories.show_all, 
            employer_user.info_verified, 
            employer_user.hide_status, 
            CONCAT('https://admin.fpsjob.com/', 'sources/upload/catImg/', tbl_categories.image) AS category_images, 
            UPPER(REPLACE(tbl_categories.category, 'jobs', '')) AS category_title,
            tbl_functions.function as job_functions
        FROM jobs
        LEFT JOIN applied_jobs ON applied_jobs.jobID = jobs.jobID AND applied_jobs.faculityID = ?
        LEFT JOIN employer_user ON employer_user.employerID = jobs.employerID
        LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
        LEFT JOIN tbl_functions ON tbl_functions.ID = jobs.functionID
        LEFT JOIN favourite_jobs ON favourite_jobs.jobID = jobs.jobID AND favourite_jobs.faculityID = ?
        WHERE employer_user.info_verified = 1
        AND jobs.status != 0
        AND is_delete != 1`;

        let countQuery = `
        SELECT COUNT(*) AS total
        FROM jobs
        LEFT JOIN applied_jobs ON applied_jobs.jobID = jobs.jobID AND applied_jobs.faculityID = ?
        LEFT JOIN employer_user ON employer_user.employerID = jobs.employerID
        LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
        LEFT JOIN favourite_jobs ON favourite_jobs.jobID = jobs.jobID AND favourite_jobs.faculityID = ?
        LEFT JOIN tbl_functions ON tbl_functions.ID = jobs.functionID
        WHERE employer_user.info_verified = 1
        AND jobs.status != 0
        AND is_delete != 1`;

        const values = [facID, facID];
        const countValues = [...values];

        if (job_title) {
            query += ` AND job_title LIKE ?`;
            countQuery += ` AND job_title LIKE ?`;
            values.push(`%${job_title}%`);
            countValues.push(`%${job_title}%`);
        }

        if (state) {
            // query += ` AND state = ?`;
            // countQuery += ` AND state = ?`;
            // values.push(state);
            // countValues.push(state);

            const states = state.split(',').map(state => state.trim());
            query += ` AND state IN (${states.map(() => '?').join(', ')})`;
            countQuery += ` AND state IN (${states.map(() => '?').join(', ')})`;
            values.push(...states);
            countValues.push(...states);
        }
        
        if (city) {
            const cities = city.split(',').map(city => city.trim());
            query += ` AND city IN (${cities.map(() => '?').join(', ')})`;
            countQuery += ` AND city IN (${cities.map(() => '?').join(', ')})`;
            values.push(...cities);
            countValues.push(...cities);
        }

        if (area) {
            query += ` AND area = ?`;
            countQuery += ` AND area = ?`;
            values.push(area);
            countValues.push(area);
        }

        if (salary_minimum) {
            query += ` AND min_salary >= ?`;
            countQuery += ` AND min_salary >= ?`;
            values.push(parseInt(salary_minimum));
            countValues.push(parseInt(salary_minimum));
        }

        if (salary_maximum) {
            query += ` AND max_salary <= ?`;
            countQuery += ` AND max_salary <= ?`;
            values.push(parseInt(salary_maximum));
            countValues.push(parseInt(salary_maximum));
        }

        if (min_experience) {
            query += ` AND min_experience >= ?`;
            countQuery += ` AND min_experience >= ?`;
            values.push(parseInt(min_experience));
            countValues.push(parseInt(min_experience));
        }

        if (max_experience) {
            query += ` AND max_experience <= ?`;
            countQuery += ` AND max_experience <= ?`;
            values.push(parseInt(max_experience));
            countValues.push(parseInt(max_experience));
        }

        if (job_type) {            
            const job_types = job_type.split(',').map(job_type => job_type.trim());
            query += ` AND job_type in (?)`;
            countQuery += ` AND job_type in (?)`;
            values.push(job_types);
            countValues.push(job_types); 
        }

        if (categoryID) {
            query += ` AND catID = ?`;
            countQuery += ` AND catID = ?`;
            values.push(categoryID);
            countValues.push(categoryID);
        }

        if (job_function) {
            
            const job_functions = job_function.split(',').map(job_function => job_function.trim());
            
            const functionQuery = `SELECT GROUP_CONCAT(ID) as ID FROM tbl_functions WHERE function in (?)`;
            const functionValues = [job_functions];
            const functionResult = await runQuery(functionQuery, functionValues);
           
            if (functionResult.length > 0) {
                const functionID = functionResult[0].ID;
                query += ` AND functionID in (?)`;
                countQuery += ` AND functionID in (?)`;
                values.push(functionID);
                countValues.push(functionID);
            } else {
                query += ` AND functionID in (?)`;
                countQuery += ` AND functionID in (?)`;
                values.push(job_function);
                countValues.push(job_function);
            }
        }
        
        if (employer_name) {
            query += ` AND employer_user.name LIKE ?`;
            countQuery += ` AND employer_user.name LIKE ?`;
            values.push(`%${employer_name}%`);
            countValues.push(`%${employer_name}%`);
        }

        query += ` ORDER BY jobs.jobID DESC`;
        const resultLimit = limit && parseInt(limit) ? parseInt(limit) : 15;
        const currentPage = page && parseInt(page) ? parseInt(page) : 1;
        const offset = (currentPage - 1) * resultLimit;

        query += ` LIMIT ? OFFSET ?`;
        values.push(resultLimit, offset);
        const data = await runQuery(query, values);
        const totalCountResult = await runQuery(countQuery, countValues);
        const totalJobs = totalCountResult[0].total;
        const totalPages = Math.ceil(totalJobs / resultLimit);

        data.forEach(element => {
            element.updated_at = getDateFormat(element.updated_at)
            element.created_at = getDateFormat(element.created_at)
        });

        const jobsList = data.map(job => ({
            ...job,
            pack_type: pack.type ? pack.type : ''
            // pack_type: pack.type
        }));
        

        const responseData = {
            jobsList,
            totalPages,
            // pack_type: pack.type
            pack_type: pack.type ? pack.type : ''
        };

        return sendSuccess(res, { data: responseData, message: "Job list..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.jobDetail = async (req, res) => {
    const {
        facultyID,
        jobID
    } = req.query;

    if (!facultyID) {
        return sendError(res, { message: "Please enter your user id..." })
    } else if (!jobID) {
        return sendError(res, { message: "Please enter your Job id..." })
    }
    try {
        let jobQuery = ` SELECT jobs.*, employer_user.name, employer_user.hide_status, employer_user.brand_level, employer_details.website, employer_details.address, 
        employer_details.working_days as employer_working_days, employer_details.shift_start as employer_shift_start, employer_details.shift_end as employer_shift_end, 
        COALESCE(applied_jobs.status, 0) as appliedStatus, COALESCE(favourite_jobs.favourite, 0) as favourite, 
        applied_jobs.result, applied_jobs.applyID, applied_jobs.score, tbl_qualifications.qualification as min_qualification, 
        tbl_categories.show_all, UPPER(REPLACE(tbl_categories.category, "jobs", "")) as category_title, 
        employer_details.establish_year as employer_establish_year, employer_details.level as employer_level, employer_details.employer_detail as employer_detail, 
        employer_details.faculty_no as no_of_employee, employer_details.salary_day as employer_salary_day, tbl_functions.function as job_functions
            FROM jobs
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID=jobs.qualification
            LEFT JOIN employer_user ON employer_user.employerID=jobs.employerID
            LEFT JOIN employer_details ON employer_details.employerID=jobs.employerID
            LEFT JOIN applied_jobs ON applied_jobs.jobID=jobs.jobID AND applied_jobs.faculityID= ?
            LEFT JOIN favourite_jobs ON favourite_jobs.jobID=jobs.jobID AND favourite_jobs.faculityID= ?
            LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
            LEFT JOIN tbl_functions ON tbl_functions.ID = jobs.functionID
            WHERE jobs.slug = ?`;

        const jobQueryValue = [facultyID, facultyID, jobID];
        const job = await runQuery(jobQuery, jobQueryValue);


        const facultyUser = await runQuery(`SELECT faculity_users.update_status, faculity_users.device_type, faculity_users.regToken, faculity_users.cv_doc, faculity_users.duration_notice_period
                            FROM faculity_users
                            WHERE faculityID = ?`, [facultyID])

        let update_status;
        if (facultyUser[0]) {
            update_status = facultyUser[0].update_status;
        }

        const benefits = await runQuery(`SELECT CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/benefitsImg/',benefits.icon) as icon, benefits.title FROM job_benefits LEFT JOIN benefits on benefits.id = job_benefits.benefitID WHERE job_benefits.jobID = ?`, [job[0].jobID])
        const employerBenefits = await runQuery(`SELECT CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/benefitsImg/',benefits.icon) as icon, benefits.title FROM benefits LEFT JOIN job_benefits on job_benefits.benefitID = benefits.id WHERE job_benefits.employerID = ? GROUP By benefits.id;`, [job[0].employerID])
        
        const exdate = new Date().toISOString().split('T')[0];
        const packQuery = `
            SELECT type
            FROM pack_subscription
            WHERE faculityID = ?
            AND status = '1'
            AND end_date > ?
            ORDER BY SID DESC
            LIMIT 1
        `;
        const packValues = [facultyID, exdate];
        const packResult = await runQuery(packQuery, packValues);
        const pack = packResult.length ? packResult[0] : "";

        
        const responseData = {
            job : job[0],
            update_status: update_status,
            device_type: facultyUser[0].device_type,
            cv_doc: facultyUser[0].cv_doc,
            regToken: facultyUser[0].regToken,
            duration_notice_period: facultyUser[0].duration_notice_period,
            pack_type: (pack.type) ? pack.type : "",
            benefits: benefits,
            employer_benefits: employerBenefits
        };
        return sendSuccess(res, { data: responseData, message: "Job data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.jobDetailById = async (req, res) => {
    const {
        facultyID,
        jobID
    } = req.query;

    if (!facultyID) {
        return sendError(res, { message: "Please enter your user id..." })
    } else if (!jobID) {
        return sendError(res, { message: "Please enter your Job id..." })
    }
    try {
        let jobQuery = ` SELECT jobs.*, employer_user.name, employer_user.hide_status, employer_user.brand_level, employer_details.website, employer_details.address, 
        employer_details.working_days as employer_working_days, employer_details.shift_start as employer_shift_start, employer_details.shift_end as employer_shift_end, 
        COALESCE(applied_jobs.status, 0) as appliedStatus, COALESCE(favourite_jobs.favourite, 0) as favourite, applied_jobs.result, applied_jobs.applyID, 
        applied_jobs.score, tbl_qualifications.qualification as min_qualification, tbl_categories.show_all, UPPER(REPLACE(tbl_categories.category, "jobs", "")) as category_title, 
        employer_details.establish_year as employer_establish_year, employer_details.level as employer_level, employer_details.employer_detail as employer_detail, 
        employer_details.faculty_no as no_of_employee, employer_details.salary_day as employer_salary_day, tbl_functions.function as job_functions
            FROM jobs
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID=jobs.qualification
            LEFT JOIN employer_user ON employer_user.employerID=jobs.employerID
            LEFT JOIN employer_details ON employer_details.employerID=jobs.employerID
            LEFT JOIN applied_jobs ON applied_jobs.jobID=jobs.jobID AND applied_jobs.faculityID= ?
            LEFT JOIN favourite_jobs ON favourite_jobs.jobID=jobs.jobID AND favourite_jobs.faculityID= ?
            LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
            LEFT JOIN tbl_functions ON tbl_functions.ID = jobs.functionID
            WHERE jobs.jobID = ?`;

        const jobQueryValue = [facultyID, facultyID, jobID];
        const job = await runQuery(jobQuery, jobQueryValue);


        const facultyUser = await runQuery(`SELECT faculity_users.update_status, faculity_users.device_type, faculity_users.regToken, faculity_users.cv_doc, faculity_users.duration_notice_period
                            FROM faculity_users
                            WHERE faculityID = ?`, [facultyID])

        let update_status;
        if (facultyUser[0]) {
            update_status = facultyUser[0].update_status;
        }

        const benefits = await runQuery(`SELECT CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/benefitsImg/',benefits.icon) as icon , benefits.title FROM job_benefits LEFT JOIN benefits on benefits.id = job_benefits.benefitID WHERE job_benefits.jobID = ?`, [job[0].jobID])
        const employerBenefits = await runQuery(`SELECT CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/benefitsImg/',benefits.icon) as icon, benefits.title FROM benefits LEFT JOIN job_benefits on job_benefits.benefitID = benefits.id WHERE job_benefits.employerID = ? GROUP By benefits.id;`, [job[0].employerID])
        
        const exdate = new Date().toISOString().split('T')[0];
        const packQuery = `
            SELECT type
            FROM pack_subscription
            WHERE faculityID = ?
            AND status = '1'
            AND end_date > ?
            ORDER BY SID DESC
            LIMIT 1
        `;
        const packValues = [facultyID, exdate];
        const packResult = await runQuery(packQuery, packValues);
        const pack = packResult.length ? packResult[0] : "";

        // if(job[0].shift_start !== null && job[0].shift_start !== "00:00:00"){
        //     job[0].shift_start = convertToAmPm(job[0].shift_start)
        // }
        // if(job[0].shift_end !== null && job[0].shift_end !== "00:00:00"){
        //     job[0].shift_end = convertToAmPm(job[0].shift_end) 
        // }
        // if(job[0].employer_shift_start !== null && job[0].employer_shift_start !== "00:00:00"){
        //     job[0].employer_shift_start = convertToAmPm(job[0].employer_shift_start)
        // }
        // if(job[0].employer_shift_end !== null && job[0].employer_shift_end !== "00:00:00"){
        //     job[0].employer_shift_end = convertToAmPm(job[0].employer_shift_end)
        // }
        
        
        const responseData = {
            job : job[0],
            update_status: update_status,
            device_type: facultyUser[0].device_type,
            cv_doc: facultyUser[0].cv_doc,
            regToken: facultyUser[0].regToken,
            duration_notice_period: facultyUser[0].duration_notice_period,
            pack_type: (pack.type) ? pack.type : "",
            benefits: benefits,
            employer_benefits: employerBenefits
        };
        return sendSuccess(res, { data: responseData, message: "Job data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.appliedJobDetails = async (req, res) => {
    try {
        const {
            facultyID,
            applyID
        } = req.query;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user id..." })
        } else if (!applyID) {
            return sendError(res, { message: "Please enter your apply id..." })
        }

        let jobQuery = ` SELECT jobs.*, applied_jobs.status as appliedStatus, applied_jobs.created_at as appliedDate, applied_jobs.result, applied_jobs.score, applied_jobs.preference_date1, 
        applied_jobs.preference_date1, applied_jobs.interview_date, applied_jobs.expected_joining_date, applied_jobs.applyID, COALESCE(favourite_jobs.favourite, 0) as favourite, 
        employer_details.address, employer_details.state as employer_state, employer_details.city as employer_city, employer_details.contact_person_name, employer_details.contact_person_no, 
        employer_user.name as company_name, employer_user.brand_level, employer_details.website, employer_details.working_days as employer_working_days, employer_details.shift_start as employer_shift_start, employer_details.shift_end as employer_shift_end
                        FROM applied_jobs
                        JOIN jobs ON jobs.jobID=applied_jobs.jobID
                        LEFT JOIN employer_user ON employer_user.employerID = jobs.employerID
                        LEFT JOIN favourite_jobs ON favourite_jobs.jobID=jobs.jobID AND favourite_jobs.faculityID=?
                        LEFT JOIN employer_details ON employer_details.employerID=jobs.employerID
                        WHERE applied_jobs.applyID = ?`;

        const jobQueryValue = [facultyID, applyID];
        const job = await runQuery(jobQuery, jobQueryValue);

        const facultyUser = await runQuery(`SELECT faculity_users.update_status, faculity_users.device_type, faculity_users.regToken, faculity_users.cv_doc, faculity_users.duration_notice_period
                            FROM faculity_users
                            WHERE faculityID = ?`, [facultyID])

        let update_status;
        if (facultyUser[0]) {
            update_status = facultyUser[0].update_status;
        }

        const exdate = new Date().toISOString().split('T')[0];
        const packQuery = `
            SELECT type
            FROM pack_subscription
            WHERE faculityID = ?
            AND status = '1'
            AND end_date > ?
            ORDER BY SID DESC
            LIMIT 1
        `;
        const packValues = [facultyID, exdate];
        const packResult = await runQuery(packQuery, packValues);
        const pack = packResult.length ? packResult[0] : null;

        job[0].created_at = getDateFormat(job[0].created_at)
        job[0].updated_at = getDateFormat(job[0].updated_at)
        job[0].appliedDate = getDateFormat(job[0].appliedDate)
        job[0].preference_date1 = getDateFormat(job[0].preference_date1)
        job[0].interview_date = getDateFormat(job[0].interview_date)
        job[0].expected_joining_date = getDateFormat(job[0].expected_joining_date)
        const responseData = {
            job,
            // update_status: update_status,
            // device_type: facultyUser[0].device_type,
            // cv_doc: facultyUser[0].cv_doc,
            // regToken: facultyUser[0].regToken,
            // duration_notice_period: facultyUser[0].duration_notice_period,
            // pack_type: pack.type,
        };
        return sendSuccess(res, { data: job, message: "Job data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.appliedJobs = async (req, res) => {
    try {

        const {
            facultyID,
        } = req.query;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user id..." })
        }

        const jobs = await runQuery(`SELECT jobs.*, applied_jobs.status as appliedStatus, applied_jobs.created_at as appliedDate, applied_jobs.result, applied_jobs.score, applied_jobs.preference_date1, applied_jobs.preference_date1, applied_jobs.interview_date, applied_jobs.expected_joining_date, applied_jobs.applyID, COALESCE(favourite_jobs.favourite, 0) as favourite, employer_details.address, employer_details.state as employer_state, employer_details.city as employer_city, employer_details.contact_person_name, employer_details.contact_person_no, employer_user.name as company_name, CONCAT("https://admin.fpsjob.com/", "sources/upload/catImg/", tbl_categories.image) as category_images, UPPER(REPLACE(tbl_categories.category, "jobs", "")) as category_title, tbl_categories.show_all
                                    FROM applied_jobs
                                    JOIN jobs ON jobs.jobID=applied_jobs.jobID
                                    LEFT JOIN employer_user ON employer_user.employerID = jobs.employerID
                                    LEFT JOIN favourite_jobs ON favourite_jobs.jobID=jobs.jobID AND favourite_jobs.faculityID=?
                                    LEFT JOIN employer_details ON employer_details.employerID=jobs.employerID
                                    LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
                                    WHERE applied_jobs.faculityID = ?
                                    AND employer_user.info_verified = 1
                                    AND jobs.status !=0
                                    AND jobs.is_delete != 1`, [facultyID, facultyID])
        if (jobs.length > 0) {
            const exdate = new Date().toISOString().split('T')[0];
            const packQuery = `
                SELECT type
                FROM pack_subscription
                WHERE faculityID = ?
                AND status = '1'
                AND end_date > ?
                ORDER BY SID DESC
                LIMIT 1
            `;
            const packValues = [facultyID, exdate];
            const packResult = await runQuery(packQuery, packValues);
            const pack = packResult.length ? packResult[0] : "";

            // jobs.forEach(element => {
            //     element.updated_at = getDateFormat(element.updated_at)
            //     element.created_at = getDateFormat(element.created_at)
            // });

            jobs.forEach(item => {
                item.pack_type = pack.type ? pack.type : ''
                item.updated_at = getDateFormat(item.updated_at)
                item.created_at = getDateFormat(item.created_at)
            });
            
            return sendSuccess(res, { data: jobs, message: "Applied jobs..." })
        } else {
            return sendSuccess(res, { data: jobs, message: "No apply job found..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.appliedJobsStatus = async (req, res) => {
    try {
        const { applyID } = req.query;

        if (!applyID) {
            return sendError(res, { message: "Please enter your apply ID..." });
        }

        const currentStatus = await runQuery(`
            SELECT 
                applied_jobs.status as appliedStatus, 
                applied_jobs.faculityID, 
                jobs.catID, 
                tbl_categories.show_all, 
                UPPER(REPLACE(tbl_categories.category, "jobs", "")) as category_title,
                manual_sheduled_job.date as interview_date, manual_sheduled_job.time as interview_time, manual_sheduled_job.event_type as interview_event_type,
                manual_sheduled_job.event_host as interview_event_host, manual_sheduled_job.interviewer as interview_interviewer, manual_sheduled_job.note as interview_note
            FROM applied_jobs
            LEFT JOIN jobs ON jobs.jobID = applied_jobs.jobID
            LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
            LEFT JOIN manual_sheduled_job ON manual_sheduled_job.jobID = applied_jobs.jobID
            WHERE applyID = ?
        `, [applyID]);
         
        if (currentStatus.length > 0) {
            const exdate = new Date().toISOString().split('T')[0];
            const packQuery = `
                SELECT type
                FROM pack_subscription
                WHERE faculityID = ?
                AND status = '1'
                AND end_date > ?
                ORDER BY SID DESC
                LIMIT 1
            `;
            
            const packValues = [currentStatus[0].faculityID, exdate];
            const packResult = await runQuery(packQuery, packValues);
            const pack = packResult.length ? packResult[0] : null;

            currentStatus.forEach(item => {
                item.pack_type = pack ? pack.type : "";
            });

            let query = `
                SELECT interview_steps.label 
                FROM applied_jobs 
                JOIN jobs ON jobs.jobID = applied_jobs.jobID 
                LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID 
                LEFT JOIN interview_steps ON interview_steps.CID = tbl_categories.ID 
                WHERE applied_jobs.applyID = ?
            `;

            if (currentStatus[0].appliedStatus === "Rejected") {
                query += ` AND interview_steps.label != 'Hired'`;
            } else if (currentStatus[0].appliedStatus === "Hired") {
                query += ` AND interview_steps.label != 'Rejected'`;
            } else {
                query += ` AND interview_steps.label != 'Rejected' AND interview_steps.label != 'Hired'`;
            }
            query += ` ORDER BY interview_steps.priority ASC`;

            const data = await runQuery(query, [applyID]);

            const finalStatus = (currentStatus[0].appliedStatus !== "Rejected" && currentStatus[0].appliedStatus !== "Hired") ?
                { label: "Hired/Rejected", completed: 0 } : null;

            // Check completion status for each step
            for (let i = 0; i < data.length; i++) {
                const step = data[i];
                const statusData = await runQuery(`
                    SELECT * FROM applied_status_log 
                    WHERE applied_id = ? AND status = ?
                `, [applyID, step.label]);
                step.completed = statusData.length > 0 ? 1 : 0;
                
                if (statusData.length > 0) {
                    created_at = statusData[0].created_at
                    // const options = {
                    //     timeZone: "Asia/Kolkata",       // Convert to IST
                    //     year: "numeric",                // 4-digit year
                    //     month: "2-digit",               // 2-digit month
                    //     day: "2-digit",                 // 2-digit day
                    //     hour: "2-digit",                // 2-digit hour
                    //     minute: "2-digit",              // 2-digit minute
                    //     second: "2-digit",              // 2-digit second
                    //     hour12: true                   // 24-hour format
                    //   };
                    // step.created_at = created_at.toLocaleString('en-US', options);
                    step.created_at = getDateFormat(created_at);
                    // step.created_at = statusData[0].created_at;
                }

                if(statusData[0] !== undefined){
                    if(statusData[0].status === 'Interview scheduled'){
                        step.date = currentStatus[0].interview_date,
                        step.time = currentStatus[0].interview_time,
                        step.event_type = currentStatus[0].interview_event_type,
                        step.event_host = currentStatus[0].interview_event_host,
                        step.interviewer = currentStatus[0].interview_interviewer,
                        step.note = currentStatus[0].interview_note
                    }
                }
            }
            const returnData = {
                data,
                show_all: currentStatus[0].show_all,
                pack_type: currentStatus[0].pack_type
            }; 

            // Add final status if applicable
            if (finalStatus) {
                returnData.data.push(finalStatus);
                return sendSuccess(res, { data: returnData, message: "Applied jobs..." });
            } else {                 
                return sendSuccess(res, { data: returnData, message: "Applied jobs..." });
            }
        } else {
            return sendSuccess(res, { data: [], message: "No apply job found..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.addFavourite = async (req, res) => {
    try {
        const { facultyID, jobID  } = req.body;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user ID..." });
        }
        if (!jobID) {
            return sendError(res, { message: "Please enter your job ID..." });
        }
        currentDate = moment().format('YYYY-MM-DD HH:mm:ss')
        const queryStatus = await runQuery(`insert into favourite_jobs set faculityID=?, jobID=?, favourite=?, created_at=?`, [facultyID, jobID, 1, currentDate])
        
        if (queryStatus.insertId) {
                return sendSuccess(res, { data: [], message: "Job added to favourite..." });
        } else {
            return sendError(res, { data: [], message: "Something went wrong. Please try again later..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.removeFavourite = async (req, res) => {
    try {
        const { facultyID, jobID  } = req.body;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user ID..." });
        }
        if (!jobID) {
            return sendError(res, { message: "Please enter your job ID..." });
        }
       
        const queryStatus = await runQuery(`DELETE FROM favourite_jobs WHERE faculityID=? and jobID=?`, [facultyID, jobID])
        return sendSuccess(res, { data: [], message: "Job removed to favourite..." });
       
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.allFavourite = async (req, res) => {
    try {
        const { facultyID, order_by  } = req.query;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user ID..." });
        }
        
        if (order_by) {
            order_by_query = "fev_created_at "+order_by
        } else {
            order_by_query = "fev_created_at DESC"
        }

        var query = `SELECT jobs.*, COALESCE(favourite_jobs.favourite, 0) as favourite, tbl_categories.show_all,employer_user.name as company_name, 
                                UPPER(REPLACE(tbl_categories.category, "jobs", "")) as category_title, applied_jobs.status as appliedStatus, 
                                CONCAT("https://admin.fpsjob.com/", "sources/upload/catImg/", tbl_categories.image) as category_images, favourite_jobs.created_at as fev_created_at 
                                FROM jobs
                                JOIN favourite_jobs ON favourite_jobs.jobID=jobs.jobID AND favourite_jobs.faculityID = `+facultyID+`
                                LEFT JOIN applied_jobs ON applied_jobs.jobID = jobs.jobID AND applied_jobs.faculityID = `+facultyID+`
                                LEFT JOIN tbl_categories ON tbl_categories.ID = jobs.catID
                                LEFT JOIN employer_user ON employer_user.employerID=jobs.employerID
                                WHERE jobs.status !=0
                                AND is_delete != 1 order by `+order_by_query

        const data = await runQuery(query, [])

        const exdate = new Date().toISOString().split('T')[0];
        const packQuery = `SELECT type FROM pack_subscription WHERE faculityID = ? AND status = '1' AND end_date > ? ORDER BY SID DESC`;
        const packValues = [facultyID, exdate];
        const packResult = await runQuery(packQuery, packValues);
        const pack = packResult.length ? packResult[0] : '';

        data.forEach(item => {
            item.updated_at = getDateFormat(item.updated_at)
            item.created_at = getDateFormat(item.created_at)
        });

        const jobsList = data.map(job => ({
            ...job,
            pack_type: pack.type ? pack.type : ''
        }));
        
        return sendSuccess(res, { data: jobsList, message: "Favourite jobs list..." });       
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.applyJob = async (req, res) => {
    try {
        const { facultyID, jobID, date1, date2, expected_joining_date, regToken, device_type, duration_notice_period } = req.body
        if (!facultyID) {
            return sendError(res, { message: "Please enter your user ID..." });
        } else if (!jobID) {
            return sendError(res, { message: "Please enter your job ID..." });
        } else {
            const data = await runQuery(`select * from applied_jobs where jobID = ? AND faculityID = ?`, [jobID, facultyID])
            if (data.length > 0) {
                return sendSuccess(res, { message: "Job already applied..." })
            } else {
                let expectedJoiningDate = expected_joining_date ? expected_joining_date : null;
                let durationNoticePeriod = duration_notice_period ? duration_notice_period : "";

                const faculityData = await runQuery("SELECT faculity_users.*, tbl_experience.experience as experience_label, tbl_salary.salary as salary_label FROM faculity_users LEFT JOIN tbl_experience on tbl_experience.ID = faculity_users.experience LEFT JOIN tbl_salary on tbl_salary.ID = faculity_users.salary WHERE faculity_users.faculityID = ?", [facultyID]);
                const jobData = await runQuery("SELECT jobs.*, employer_user.name as employer_name, employer_user.email as employer_email FROM jobs LEFT JOIN employer_user on employer_user.employerID = jobs.employerID WHERE jobs.jobID = ?", [jobID]);
              
                // applied job insert query 
                const applyQuery = await runQuery(`insert into applied_jobs set status='Applied', faculityID=?, jobID=?, preference_date1=?, preference_date2=?, expected_joining_date=?, duration_notice_period=?`, [facultyID, jobID, date1, date2, expectedJoiningDate, durationNoticePeriod])
                if(applyQuery.insertId){

                    // applied job status log(application tracking)
                    await runQuery(`insert into applied_status_log set status='Applied', applied_id=?, jobID=?, user_id=?, created_at=?`, [applyQuery.insertId, jobID, facultyID, moment().format('YYYY-MM-DD HH:mm:ss')])    
                    jobUrl = process.env.FRONT_URL+"jobs/"+jobID+"/"+facultyID;
                    
                    // Set Admin notification
                    const message = faculityData[0].name+" has been applied for the job:"+jobData[0].job_title 
                    const queryData = [jobID, jobData[0].catID, jobData[0].functionID, applyQuery.insertId, facultyID, message, moment().format('YYYY-MM-DD HH:mm:ss')]
                    await runQuery(`insert into admin_notification set type='Job Application', jobID=?, catID=?, functionID=?, applyID=?, facultyID=?, message=?, created_at=?`, queryData)   


                    const notificationData = [facultyID, jobID, moment().format('YYYY-MM-DD HH:mm:ss')]
                    await runQuery(`insert into notification set type='notification', title='Apply For Job', message='You have Successfully applied for the job', status=1, faculityID=?, linkID=?, created_at=?`, notificationData)   


                    // Get All Device Token
                    const faculityTokens = await runQuery(`select GROUP_CONCAT(regToken) as regToken from faculity_device_token where faculityID = ?`, [facultyID])
                    let allTokein = faculityTokens[0].regToken
                    allTokein = allTokein?.split(',')

                    if(allTokein?.length > 0) {
                        if(allTokein?.indexOf(regToken) === -1)   {  
                            allTokein?.push(regToken)
                        } 
                    }
                     

                    
                    // await allTokein.forEach((value, key) => {
                    //     sendNotificationToFaculity(value, {
                    //         title: jobData[0].job_title+':Applied',
                    //         body: `You have Successfully applied for the job...`,
                    //         job_url: jobUrl
                    //     });
                    // });
                    
 
                    await applyJobMail(jobData, faculityData, 'Applied'); 
                    await employerApplyJobMail(jobData, faculityData); 


                    // await sendNotificationToFaculity(regToken, {
                    // await sendNotificationToFaculity(faculityData[0]?.regToken, {
                    //     title: jobData[0].job_title+':Applied',
                    //     body: `You have Successfully applied for the job...`,
                    //     job_url: jobUrl,
                    //     imageUrl: ""
                    // });                    
                    return sendSuccess(res, { data: [{appliedID:applyQuery.insertId}], message: "You have Successfully applied for the job......" })
                } else {
                    return sendError(res, { data: [], message: "Something went wrong. Please try again later..." });
                }
                
            }
        }
    } catch (error) {
        console.log(error)
        if (error.code == 'ER_NO_REFERENCED_ROW_2') {
            return sendError(res, { message: "Please select the valid job or resume..." })
        } else if (error.code == 'ER_DUP_ENTRY') {
            return sendError(res, { message: "Already applied..." })
        } else {
            return sendError(res, { message: error.message })
        }
    }
}



// Old-code ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.searchJob = async (req, res) => {
        try {
            const {
                salary_minimum,
                salary_maximum,
                experience_minimum,
                experience_maximum,
                work_place_type,
                job_type,
                job_name,
                city_name,
                state_name,
            } = req.query

            let query = `select * from jobs j join cities c on j.city_id=c.city_id join states s on j.state_id=s.state_id where job_status = ?`

            const values = []

            values.push('Open')

            if ((salary_maximum && salary_minimum) && (parseInt(salary_minimum) && parseInt(salary_maximum))) {
                query += ` and salary_minimum >=? and salary_maximum<=?`
                values.push(salary_minimum, salary_maximum)
            }

            if ((experience_minimum && experience_maximum) && (parseInt(experience_minimum) && parseInt(experience_maximum))) {
                query += ` and experience_minimum >= ? and experience_maximum <= ?`
                values.push(experience_minimum, experience_maximum)
            }

            if (WORK_PLACE_TYPE.includes(work_place_type)) {
                query += ` and work_place_type=?`
                values.push(work_place_type)
            }

            if (JOBS_TYPE.includes(job_type)) {
                query += ` and job_type=?`
                values.push(job_type)
            }

            if (job_name) {
                query += ` and (job_title like ? or job_description like ?)`
                values.push(`%${job_name}%`, `%${job_name}%`)
            }

            if (city_name) {
                query += ` and city_name like ?`
                values.push(`%${city_name}%`)
            }

            if (state_name) {
                query += ` and state_name like ?`
                values.push(`%${state_name}%`)
            }

            const data = await runQuery(query, values)

            return sendSuccess(res, { data: data, message: "Job list..." })

        } catch (error) {

            return sendError(res, { message: error.message })

        }
    }

    // exports.applyJob = async (req, res) => {
    //     try {
    //         const { job_id, u_id, rs_id } = req.body
    //         if (!job_id) {
    //             return sendError(res, { message: "Please select the job..." })
    //         } else if (!rs_id) {
    //             return sendError(res, { message: "Please select the resume..." })
    //         } else {
    //             const data = await runQuery(`select * from users where u_id = ?`, [u_id])
    //             if (data.length > 0) {
    //                 await runQuery(`insert into job_applications set job_id = ?,u_id=?,rs_id=?`, [job_id, u_id, rs_id])
    //                 return sendSuccess(res, { message: "Application has been applied..." })
    //             } else {
    //                 return sendError(res, { message: "Your account is not found..." })
    //             }
    //         }
    //     } catch (error) {
    //         if (error.code == 'ER_NO_REFERENCED_ROW_2') {
    //             return sendError(res, { message: "Please select the valid job or resume..." })
    //         } else if (error.code == 'ER_DUP_ENTRY') {
    //             return sendError(res, { message: "Already applied..." })
    //         } else {
    //             return sendError(res, { message: error.message })
    //         }
    //     }
    // }

    exports.answerSecreenQuestions = async (req, res) => {
        try {
            const { apl_id, ques_id, answer } = req.body
            if (!apl_id) {
                return sendError(res, { message: "Please apply to the job first..." })
            } else if (!ques_id) {
                return sendError(res, { message: "Please select the question..." })
            } else if (!answer || !isValidJson(answer)) {
                return sendError(res, { message: "Please valid the answer..." })
            } else {
                await runQuery(`insert into job_screening_questions_response set ques_id=?,apl_id=?,ans_text=?`, [ques_id, apl_id, answer])
                return sendSuccess(res, { message: "Answer has been submitted..." })
            }
        } catch (error) {
            if (error.code == 'ER_DUP_ENTRY') {
                return sendError(res, { message: "Already answered..." })
            }
            return sendError(res, { message: error.message })
        }
    }

    exports.saveJob = async ({ body: { job_id, u_id } }, res) => {
        try {
            if (!job_id) {
                return sendError(res, { message: "Please select the job..." })
            }
            await runQuery(`insert into saved_jobs set job_id=?,u_id=?`, [job_id, u_id])
            return sendSuccess(res, { message: "Job has been saved..." })
        } catch (error) {
            if (error.code == 'ER_DUP_ENTRY') {
                return sendError(res, { message: "This job alredy saved..." })
            }
            return sendError(res, { message: error.message })
        }
    }

    exports.removeSavedJob = async (req, res) => {
        try {
            const { saved_id } = req.params
            await runQuery(`delete from saved_jobs where saved_id = ?`, [saved_id])
            return sendSuccess(res, { message: "Job has been removed..." })
        } catch (error) {
            return sendError(res, { message: error.message })
        }
    }

    exports.savedJobs = async ({ body: { u_id } }, res) => {
        try {
            const data = await runQuery(`select *,s.state_name,c.city_name from saved_jobs sj join jobs j on sj.job_id=j.job_id join cities c on j.city_id= c.city_id join states s on s.state_id=j.state_id where sj.u_id=?`, [u_id])
            return sendSuccess(res, { data: data, message: "Saved jobs list..." })
        } catch (error) {
            return sendError(res, { message: error.message })
        }
    }