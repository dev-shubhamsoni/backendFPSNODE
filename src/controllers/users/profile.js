const { sendSuccess, sendError, getDateFormat, generateUserIdByEnyId, replaceFacultyID } = require("../../utils/commonFunctions")
const { runQuery } = require("../../utils/executeQuery")
const { unserialize, serialize } = require('php-serialize');
const moment = require('moment');
const { moveFileToUserFolder, deleteFile } = require("../common");
const UserResumeBasePath = process.env.USER_BASE_PATH;
const { URL } = require('url');


// Faculty Get Api's...

exports.facultyAllData = async (req, res) => {
    try {
        const { facultyID } = req.query;

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
                faculity_users.duration_notice_period,
                states.id as state_id,
                cities.id as city_id,
                tbl_categories.category as category_name
            FROM faculity_users
            LEFT JOIN tbl_salary ON tbl_salary.ID = faculity_users.salary
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_users.qualification
            LEFT JOIN tbl_functions ON tbl_functions.ID = faculity_users.job_function
            LEFT JOIN tbl_categories ON tbl_categories.ID = faculity_users.industry_type
            LEFT JOIN tbl_experience ON tbl_experience.ID = faculity_users.experience
            LEFT JOIN states ON states.name = faculity_users.state
            LEFT JOIN cities ON cities.name = faculity_users.city
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

        // Applied job count
        let appliedJobCountQuery = `SELECT count(*) as applied_job_count  FROM applied_jobs WHERE faculityID = ? `;
        appliedJobCount = await runQuery(appliedJobCountQuery, [facultyID]);
        user.applied_job_count = appliedJobCount[0].applied_job_count

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
            value.certificate_file = value.certificate_file ? `${process.env.FILE_BASE_URL}sources/upload/userAttachment/user${facultyID}/${value.certificate_file}` : '';
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


    } catch (error) {
        return sendError(res, { message: error.message })

    }
}

// Faculty Experience ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultyExperience = async (req, res) => {
    try {
        let data;
        const { facultyID, id } = req.query

        if (id) {
            data = await runQuery(`SELECT * FROM faculity_experience WHERE faculityID = ? AND id = ?`, [facultyID, id])
        } else {
            data = await runQuery(`SELECT * FROM faculity_experience WHERE faculityID = ? `, facultyID)
        }

        return sendSuccess(res, { data: data, message: "Faculty Experience..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.saveFaculityExperience = async (req, res) => {
    try {
        const facultyData = req.body;

        if (!Array.isArray(facultyData)) {
            return sendError(res, { message: "Invalid input format. Expected an array." });
        }
        for (const value of facultyData) {

            const { faculityID, organization, designation, responsibilities, start_date, end_date, currently } = value;

            if (!faculityID || !organization || !designation || !responsibilities || !start_date ) {

                return sendError(res, { message: "Please fill all the input fields." });

            }

            const dataArray = {
                faculityID,
                organization,
                designation,
                responsibilities,
                start_date: start_date,
                end_date: end_date,
                currently,
            };

            await runQuery('INSERT INTO faculity_experience SET ?', dataArray);

        }

        return sendSuccess(res, { message: "Faculty experiences have been updated successfully." });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

exports.updateFaculityExperience = async (req, res) => {

    try {
        const { faculityID, organization, designation, responsibilities, start_date, end_date, currently, id } = req.body;

        // if (!faculityID || !organization || !designation || !responsibilities || !start_date || !end_date || !id) {

        //     return sendError(res, { message: "Please fill all the input fields." });

        // }

        if (!faculityID) {
            return sendError(res, { message: "Please enter faculity ID." });
        }

        if (!organization) {
            return sendError(res, { message: "Please enter organization." });
        }

        if (!designation) {
            return sendError(res, { message: "Please enter designation." });
        }

        if (!responsibilities) {
            return sendError(res, { message: "Please enter responsibilities." });
        }

        if (!start_date) {
            return sendError(res, { message: "Please enter start_date." });
        }

      

        if (!id) {
            return sendError(res, { message: "Please enter experience id." });
        }

        const existingRecord = await runQuery('SELECT * FROM faculity_experience WHERE id = ?', [id]);


        if (existingRecord.length === 0) {

            return sendError(res, { message: `Faculty record doesnt exist.` });

        }

        const updateData = {
            faculityID,
            organization,
            designation,
            responsibilities,
            start_date: start_date,
            end_date: end_date,
            currently,
        };

        const set = await runQuery('UPDATE faculity_experience SET ? WHERE id = ?', [updateData, id]);

        return sendSuccess(res, { message: `Faculty experience has been updated successfully.` });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

exports.deleteFaculityExperience = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return sendError(res, { message: "Please provide an id for the record to delete." });
        }

        const existingRecord = await runQuery('SELECT 1 FROM faculity_experience WHERE id = ?', [id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record with id ${id} not found.` });
        }

        await runQuery('DELETE FROM faculity_experience WHERE id = ?', [id]);

        return sendSuccess(res, { message: `Faculty experience  has been deleted successfully.` });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// Faculty Language ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultyLanguage = async (req, res) => {
    const { facultyID : faculty_id, id } = req.query
    if (!faculty_id) return sendError(res, { message: 'Please provide Faculty Id' })
    try {
        const facultyID = await generateUserIdByEnyId(faculty_id)
        let data
        if (id) {

            data = await runQuery(`SELECT faculity_language.*, language.language AS language_name
                                    FROM faculity_language
                                    JOIN language ON faculity_language.language = language.id
                                    WHERE faculity_language.faculityID = ? AND faculity_language.id = ?`, [facultyID, id])
        } else {
            data = await runQuery(`SELECT faculity_language.*, language.language AS language_name
                                    FROM faculity_language
                                    JOIN language ON faculity_language.language = language.id
                                    WHERE faculity_language.faculityID = ?`, [facultyID])
        }

        for (const value of data) {
            value.faculityID = replaceFacultyID('faculityID',faculty_id,facultyID);
            
            value.can_read_txt = value.can_read === 1 ? "Read" : "";
            value.can_write_txt = value.can_write === 1 ? "Write" : "";
            value.can_speak_txt = value.can_speak === 1 ? "Speak" : "";
        }

        

        return sendSuccess(res, { data: data, message: "Faculty Language List..." })

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.saveFaculityLangauge = async (req, res) => {
    try {
        const facultyData = req.body;
        if (!Array.isArray(facultyData)) {
            return sendError(res, { message: "Invalid input format. Expected an array." });
        }
        for (const value of facultyData) {
            const { faculityID, language, read, write, speak, proficiency } = value;
            if (!faculityID) {
                return sendError(res, { message: "Please enter faculityID..." });
            } else if (!language) {
                return sendError(res, { message: "Please enter language..." });
            } else if (read === null || read === undefined) {
                return sendError(res, { message: "Please enter read..." });
            } else if (write === null || write === undefined) {
                return sendError(res, { message: "Please enter write..." });
            } else if (speak === null || speak === undefined) {
                return sendError(res, { message: "Please enter speak..." });
            } else if (!proficiency) {
                return sendError(res, { message: "Please enter proficiency..." });
            }
            const existingRecord = await runQuery('SELECT * FROM faculity_language WHERE faculityID = ? AND language = ?', [faculityID, language]);
            if (existingRecord.length > 0) {
                return sendError(res, { message: `Faculty record with language already exists.` });
            }
            const dataArray = {
                faculityID,
                language,
                can_read: read,
                can_write: write,
                can_speak: speak,
                proficiency,
            };
            await runQuery('INSERT INTO faculity_language SET ?', dataArray);
        }
        return sendSuccess(res, { message: "Faculty experiences have been updated successfully." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.updateFaculityLanguage = async (req, res) => {
    try {

        const { faculityID, language, read, write, speak, proficiency, id } = req.body;

        if (!faculityID) {
            return sendError(res, { message: "Please send faculty id." });
        } else if (read === undefined || read === null) {
            return sendError(res, { message: "Please send read field." });
        } else if (write === undefined || write === null) {
            return sendError(res, { message: "Please send write field." });
        } else if (speak === undefined || speak === null) {
            return sendError(res, { message: "Please send speak field." });
        } else if (!proficiency) {
            return sendError(res, { message: "Please send proficiency field." });
        } else if (!id) {
            return sendError(res, { message: "Please send the id of the language data." });
        } else if (!language) {
            return sendError(res, { message: "Please send language." });
        }

        const existingRecord = await runQuery('SELECT * FROM faculity_language WHERE id = ? ', [id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record not found.` });
        }

        const updateData = {
            faculityID,
            language,
            can_read: read,
            can_write: write,
            can_speak: speak,
            proficiency,
        };

        await runQuery('UPDATE faculity_language SET ? WHERE id = ?', [updateData, id]);

        return sendSuccess(res, { message: `Faculty langauge has been updated successfully.` });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

exports.UpdatefacultyVideoLink = async (req, res) => {
    try {

        const { facultyID, videoUrl } = req.body;

        if (!facultyID) {
            return sendError(res, { message: "Please send faculty id." });
        } else if (!videoUrl) {
            return sendError(res, { message: "Please send video url." });
        } 
        if (new URL(videoUrl)) {
            await runQuery('UPDATE faculity_users SET video=? WHERE faculityID = ?', [videoUrl, facultyID]);
            return sendSuccess(res, { message: `Video link updated successfully...` });
        }  
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.deleteFaculityLanguage = async (req, res) => {

    try {
        const { id } = req.query;

        if (!id) {
            return sendError(res, { message: "Please provide an id for the record to delete." });
        }

        const existingRecord = await runQuery('SELECT 1 FROM faculity_language WHERE id = ?', [id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record with id ${id} not found.` });
        }

        await runQuery('DELETE FROM faculity_language WHERE id = ?', [id]);

        return sendSuccess(res, { message: `Faculty language  has been deleted successfully.` });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// Faculty Education ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultyEducation = async (req, res) => {
    const { facultyID, id } = req.query

    if (!facultyID) return sendError(res, { message: 'Please provide Faculty Id' })

    try {
        let data;
        if (id) {
            data = await runQuery(`SELECT faculity_education.*, result_type.type as result_type_txt, education_type.type as education_type, tbl_qualifications.qualification as course_txt
                                FROM faculity_education
                                LEFT JOIN result_type ON result_type.id=faculity_education.result_type
                                LEFT JOIN education_type ON education_type.id=faculity_education.type
                                LEFT JOIN tbl_qualifications ON tbl_qualifications.ID =faculity_education.course
                                WHERE faculity_education.faculityID = ? AND faculity_education.id = ?`, [facultyID, id])
        } else {
            data = await runQuery(`SELECT faculity_education.*, result_type.type as result_type_txt, education_type.type as education_type, tbl_qualifications.qualification as course_txt
                                FROM faculity_education
                                LEFT JOIN result_type ON result_type.id=faculity_education.result_type
                                LEFT JOIN education_type ON education_type.id=faculity_education.type
                                LEFT JOIN tbl_qualifications ON tbl_qualifications.ID =faculity_education.course
                                WHERE faculity_education.faculityID = ?`, facultyID)
        }
        return sendSuccess(res, { data: data, message: "Faculty Education List..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.saveFaculityEducation = async (req, res) => {
    try {
        const facultyData = req.body;

        if (!Array.isArray(facultyData)) {
            return sendError(res, { message: "Invalid input format. Expected an array." });
        }

        for (const value of facultyData) {

            const { faculityID, institute_name, course, type, start_date, end_date, result, result_type, specialization, currently } = value;

            if (!faculityID) {
                return sendError(res, { message: "Please fill faculityID." });
            } else if (!institute_name) {
                return sendError(res, { message: "Please fill institute_name." });
            } else if (!course) {
                return sendError(res, { message: "Please fill course." });
            } else if (!type) {
                return sendError(res, { message: "Please fill type." });
            } else if (!start_date) {
                return sendError(res, { message: "Please fill start_date." });
            } else if (!result) {
                return sendError(res, { message: "Please fill result." });
            } else if (!result_type) {
                return sendError(res, { message: "Please fill result_type." });
            } else if (!specialization) {
                return sendError(res, { message: "Please fill specialization." });
            } else if (currently === null || currently === undefined) {
                return sendError(res, { message: "Please fill currently." });
            }


            const dataArray = {
                faculityID,
                institute_name,
                course,
                type,
                start_date,
                end_date,
                result,
                result_type,
                specialization,
                currently,
            };

            await runQuery('INSERT INTO faculity_education SET ?', dataArray);

        }

        return sendSuccess(res, { message: "Faculty Education saved successfully." });

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.updateFaculityEducation = async (req, res) => {
    try {

        const { faculityID, institute_name, course, type, start_date, end_date, result, result_type, specialization, currently, education } = req.body;

        if (!faculityID) {
            return sendError(res, { message: "Please fill faculityID." });
        } else if (!institute_name) {
            return sendError(res, { message: "Please fill institute_name." });
        } else if (!course) {
            return sendError(res, { message: "Please fill course." });
        } else if (!type) {
            return sendError(res, { message: "Please fill type." });
        } else if (!start_date) {
            return sendError(res, { message: "Please fill start_date." });
        } else if (!result) {
            return sendError(res, { message: "Please fill result." });
        } else if (!result_type) {
            return sendError(res, { message: "Please fill result_type." });
        } else if (!specialization) {
            return sendError(res, { message: "Please fill specialization." });
        } else if (currently === null || currently === undefined) {
            return sendError(res, { message: "Please fill currently." });
        } else if (!education) {
            return sendError(res, { message: "Please fill currently." });
        }

        const existingRecord = await runQuery('SELECT * FROM faculity_education WHERE id = ? ', [education]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record not found.` });
        }

        const updateData = {
            faculityID,
            institute_name,
            course,
            type,
            start_date,
            end_date,
            result,
            result_type,
            specialization,
            currently,
        };

        await runQuery('UPDATE faculity_education SET ? WHERE id = ?', [updateData, education]);

        return sendSuccess(res, { message: `Faculty Education has been updated successfully.` });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

exports.deleteFaculityEducation = async (req, res) => {

    try {
        const { id } = req.query;

        if (!id) {
            return sendError(res, { message: "Please provide an id for the record to delete." });
        }

        const existingRecord = await runQuery('SELECT 1 FROM faculity_education WHERE id = ?', [id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record with id ${id} not found.` });
        }

        await runQuery('DELETE FROM faculity_education WHERE id = ?', [id]);

        return sendSuccess(res, { message: `Faculty Education  has been deleted successfully.` });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// Faculty Skill ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultySkill = async (req, res) => {
    const { facultyID } = req.query
    if (!facultyID) {
        return sendError(res, { message: "Please provide facultyID." });
    }
    try {
        const data = await runQuery(`SELECT * FROM faculity_skill WHERE faculityID = ?`, facultyID)
        return sendSuccess(res, { data: data, message: "Faculty Skill..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.facultySkillSave = async (req, res) => {
    const { faculityID, skills } = req.body;

    if (!faculityID) {
        return sendError(res, { message: "Please provide faculityID." });
    } else if (!Array.isArray(skills) || skills.length === 0) {
        return sendError(res, { message: "Please provide at least 1 skill to add." });
    }

    try {
        await runQuery(`DELETE FROM faculity_skill WHERE faculityID = ?`, [faculityID]);

        for (const skill of skills) {
            await runQuery(`INSERT INTO faculity_skill (faculityID, skill) VALUES (?, ?)`, [faculityID, skill]);
        }

        return sendSuccess(res, { data: [], message: "Faculty skills updated successfully." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// Faculty Career Preference ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultyCareerPreference = async (req, res) => {
    try {
        const { facultyID } = req.query;

        const [data, cityPreference, salaryID] = await Promise.all([
            runQuery(`
                SELECT * 
                FROM faculity_career_preferences 
                LEFT JOIN career_preferences 
                ON faculity_career_preferences.career_id = career_preferences.id 
                WHERE faculity_career_preferences.faculityID = ?`,
                facultyID
            ),
            runQuery(`
                SELECT * 
                FROM faculity_city_preferences 
                WHERE faculityID = ?`,
                facultyID
            ),
            runQuery(`
                SELECT expected_salary 
                FROM faculity_users 
                WHERE faculityID = ?`,
                facultyID
            )
        ]);
        
        const salary = salaryID?.[0]?.expected_salary 
        const salaryPreferencePromise = salary
            ? runQuery(`
                SELECT CAST(ID AS CHAR) AS salary_id, salary 
                FROM tbl_salary 
                WHERE ID = ?`,
                salary
            )
            : Promise.resolve([]);
        const salaryPreference = await salaryPreferencePromise;
        let segregatedData = ""
        // segregatedData.nature_of_employment = ""
        // segregatedData.job_type = ""
        // segregatedData.preferred_shift = ""
        // segregatedData.job_role = ""
        segregatedData = data.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});

        if(!segregatedData.nature_of_employment){
            segregatedData.nature_of_employment = []
        }
        if(!segregatedData.job_type){
            segregatedData.job_type = []
        }
        if(!segregatedData.preferred_shift){
            segregatedData.preferred_shift = []
        } 
        if(!segregatedData.job_role){
            segregatedData.job_role = []
        }

        segregatedData.cityPreferences = []
        if (cityPreference.length > 0) {
            segregatedData.cityPreferences = cityPreference;
        }
        segregatedData.salaryPreferences = []
        if (salaryPreference.length > 0) {
            segregatedData.salaryPreferences = salaryPreference;
        }
        return sendSuccess(res, { data: segregatedData, message: "Faculty Career Preference..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.facultyCareerPreferenceSave = async (req, res) => {
    const { facultyID, nature_of_employment, job_type, preferred_shift, job_role, preferred_city, preferred_salary } = req.body

    if (!facultyID) return sendError(res, { message: 'Please provide Faculty Id' })
    else if (!nature_of_employment) return sendError(res, { message: 'Please provide Nature of Employment' })
    else if (!job_type) return sendError(res, { message: 'Please provide Job Type' })
    else if (!preferred_shift) return sendError(res, { message: 'Please provide Preferred Shift' })
    else if (!job_role) return sendError(res, { message: 'Please provide Job Role' })
    else if (!preferred_city) return sendError(res, { message: 'Please provide Preferred City' })
    else if (!preferred_salary) return sendError(res, { message: 'Please provide Preferred Salary' })

    try {
        await runQuery('DELETE FROM faculity_city_preferences WHERE faculityID = ?', [facultyID]);
        await runQuery('DELETE FROM faculity_career_preferences WHERE faculityID = ?', [facultyID]);
        await runQuery('UPDATE faculity_users SET expected_salary = ? WHERE faculity_users.faculityID = ?', [preferred_salary, facultyID]);
        for (const city of preferred_city) {
            await runQuery(`INSERT INTO faculity_city_preferences (faculityID, city) VALUES (?, ?)`, [facultyID, city]);
        }
        const fourData = [nature_of_employment, job_type, preferred_shift, job_role];
        for (const data of fourData) {
            await runQuery(`INSERT INTO faculity_career_preferences (faculityID, career_id) VALUES (?, ?)`, [facultyID, data]);
        }
        return sendSuccess(res, { data: [], message: "Faculty Career Preference Posted..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.facultyCityPreference = async (req, res) => {
    try {
        const { facultyID } = req.query
        const data = await runQuery(`SELECT * FROM faculity_city_preferences WHERE faculityID = ?`, facultyID)
        return sendSuccess(res, { data: data, message: "Faculty City Preference..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

// Faculty Certificate  ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultyCertificate = async (req, res) => {
    try {
        const { facultyID, id } = req.query

        let data;
        if (id) {
            data = await runQuery(`SELECT * FROM faculity_certificate WHERE faculityID = ? AND id = ?`, [facultyID, id])
        } else {
            data = await runQuery(`SELECT * FROM faculity_certificate WHERE faculityID = ?`, facultyID)
        }



        return sendSuccess(res, { data: data, message: "Faculty Certificate..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.facultyCertificateSave = async (req, res) => {
    const { facultyID, title, description } = req.body;
    const uploadedFile = req.file;

    if (!facultyID || !title || !description) {
        if (uploadedFile) {
            deleteFile(uploadedFile.path);
        }
        const missingField = !facultyID ? "facultyID" :
            !title ? "title" :
                !description ? "description" : "unknown";

        return sendError(res, { message: `Please enter your ${missingField}...` });
    }

    let fileToPath

    if (uploadedFile) {
        try {
            const data = await runQuery(`select * from faculity_users where faculityID = ?`, [facultyID])
            const phoneNumber = data[0].mobile
            fileToPath = await moveFileToUserFolder(uploadedFile.path, facultyID, UserResumeBasePath, phoneNumber);
        } catch (error) {
            return sendError(res, { message: `File upload failed: ${error.message}` });
        }
    }

    try {
        const query = `
                INSERT INTO faculity_certificate ( faculityID, title, description, certificate_file) 
                VALUES (?, ?, ?, ?)
            `;
        const values = [facultyID, title, description, fileToPath];
        await runQuery(query, values);

        return sendSuccess(res, { message: "Certificate Saved." });
    } catch (error) {
        return sendError(res, { message: `Database query failed: ${error.message}` });
    }
};

exports.deleteFaculityCertificate = async (req, res) => {

    try {
        const { id } = req.query;

        if (!id) {
            return sendError(res, { message: "Please provide an id for the record to delete." });
        }

        const existingRecord = await runQuery('SELECT * FROM faculity_certificate WHERE id = ?', [id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record with id ${id} not found.` });
        }

        const fileToPath = existingRecord[0]?.certificate_file
        if (fileToPath) deleteFile(fileToPath);


        await runQuery('DELETE FROM faculity_certificate WHERE id = ?', [id]);

        return sendSuccess(res, { message: `Faculty Certificate has been deleted successfully.` });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.updateFaculityCertificate = async (req, res) => {

    const { certificate_id, title, description } = req.body;

    if (!certificate_id) {
        return sendError(res, { message: "Please fill Certificate ID." });
    } else if (!title) {
        return sendError(res, { message: "Please fill title." });
    } else if (!description) {
        return sendError(res, { message: "Please fill description." });
    }
    const uploadedFile = req.file;

    try {
        const existingRecord = await runQuery('SELECT * FROM faculity_certificate WHERE id = ? ', [certificate_id]);

        if (existingRecord.length === 0) {
            return sendError(res, { message: `Faculty record not found.` });
        }

        const facultyID = existingRecord[0]?.faculityID
        const existingFilePath = existingRecord[0]?.certificate_file
        let updateData
        let pathToFile

        if (uploadedFile) {

            const delFilePath = `${process.env.USER_BASE_PATH}user${facultyID}/${existingFilePath}`
            await deleteFile(delFilePath);

            try {

                const data = await runQuery(`select * from faculity_users where faculityID = ?`, [facultyID])
                const mobileNumber = data[0]?.mobile

                pathToFile = await moveFileToUserFolder(uploadedFile.path, facultyID, UserResumeBasePath, mobileNumber);

            } catch (error) {
                return sendError(res, { message: `File upload failed: ${error.message}` });
            }

            updateData = {
                title,
                description,
                certificate_file: pathToFile
            };
        } else {
            updateData = {
                title,
                description,
            };
        }
        await runQuery('UPDATE faculity_certificate SET ? WHERE id = ?', [updateData, certificate_id]);

        return sendSuccess(res, { message: `Faculty certificate has been updated successfully.` });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

// Faculty Social Media  ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.facultySocialLink = async (req, res) => {
    try {
        const { facultyID } = req.query;

        const data = await runQuery(
            `SELECT social_link FROM faculty_basic_info WHERE user_id = ?`,
            facultyID
        );

        let dataUnserial;
        if (data && data[0] && data[0].social_link) {
            dataUnserial = data[0].social_link;
        } else {
            dataUnserial = null;
        }

        let dataInArray;

        if (dataUnserial) {
            const dataSerial = unserialize(dataUnserial);
            dataInArray = Object.entries(dataSerial).map(([platform, value]) => ({
                platform,
                value,
            }));
        } else {
            dataInArray = [];
        }


        return sendSuccess(res, {
            data: dataInArray,
            message: "Faculty Social Link...",
        });
    } catch (error) {

        return sendError(res, { message: error.message });
    }
};



exports.facultySocialLinkSave = async (req, res) => {
    const { facultyID, social_link } = req.body;
    if (!facultyID) {
        return sendError(res, { message: "Please fill facultyID." });
    } else if (!Array.isArray(social_link) || social_link.length === 0) {
        return sendError(res, { message: "Please send Social Link." });
    }
    try {
        const serializedSocialLink = serialize(
            social_link.reduce((acc, item) => {
                const [key, value] = Object.entries(item)[0];
                acc[key] = value;
                return acc;
            }, {})
        );
        console.log('serializedSocialLink', serializedSocialLink);
        await runQuery(`UPDATE faculty_basic_info SET social_link = ? WHERE user_id = ?`, [serializedSocialLink, facultyID]);
        return sendSuccess(res, { data: [], message: "Faculty Social Link updated successfully." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


// Profile photo upload api ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.uploadProfileImageUser = async (req, res) => {


    const { facultyID } = req.body;

    if (!facultyID) {
        return sendError(res, { message: "Please fill facultyID." });
    }

    try {

        if (req.file !== undefined) {
            const uploadedFile = req.file;
            const data = await runQuery(`select * from faculity_users where faculityID = ?`, [facultyID])
            if (data.length > 0) {
                const facultyid = data[0].faculityID
                const pathData = data[0]?.image
                const delFilePath = `${process.env.USER_BASE_PATH}user${facultyid}/${pathData}`
                await deleteFile(delFilePath);
            } else {
                console.log('previous file path not valid');
            }
            const phoneNumber = data[0]?.mobile
            const pathToFile = await moveFileToUserFolder(uploadedFile.path, facultyID, UserResumeBasePath, phoneNumber);
            await runQuery(`update faculity_users set image = ? where faculityID = ?`, [pathToFile, facultyID])
            return sendSuccess(res, { data: [], message: "Images uploded succesfully..." })
        } else {
            return sendError(res, { message: "Please select your profile photo..." })
        }

    } catch (error) {
        await deleteFile(req.file.path);
        return sendError(res, { message: error.message })
    }
}

// Work Status api ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.faculityWorkStatus = async (req, res) => {

    const { facultyID, status } = req.body;

    if (!facultyID) {
        return sendError(res, { message: "Please fill facultyID." });
    }

    if (status === undefined || status === null) {
        return sendError(res, { message: "Please fill status." });
    }

    try {

        const updateQuery = `UPDATE faculity_users SET work_status = ? WHERE faculityID = ?`;

        await runQuery(updateQuery, [status, facultyID]);

        return sendSuccess(res, { message: "Faculty Work Status Updated successfully." });

    } catch (error) {

        return sendError(res, { message: error.message });

    }
};

// Other Details api ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.otherDetails = async (req, res) => {
    try {
        const { facultyID } = req.query
        const data = await runQuery(`SELECT 
        faculty_basic_info.bio, 
        faculty_basic_info.address, 
        faculty_basic_info.hometown, 
        faculty_basic_info.pincode, 
        faculty_basic_info.banner, 
        faculity_users.gender, 
        faculity_users.dob 
        FROM 
        faculty_basic_info 
        LEFT JOIN 
        faculity_users 
        ON 
        faculity_users.faculityID = faculty_basic_info.user_id 
        WHERE 
        faculty_basic_info.user_id = ?`, facultyID)
        return sendSuccess(res, { data: data, message: "Other Details..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.updateOtherDetails = async (req, res) => {
    const { facultyID, bio, address, hometown, pincode, gender, dob } = req.body;

    if (!facultyID) {
        return sendError(res, { message: "Please fill facultyID." });
    }

    let updateArray = {};

    if (bio) {
        if (bio.length > 500) {
            return sendError(res, { message: 'Bio must be in 500 characters only.', statusCode: 400 });
        } else {
            updateArray.bio = bio;
        }
    }

    if (address) {
        if (address.length > 500) {
            return sendError(res, { message: 'Address must be in 500 characters only.', statusCode: 400 });
        } else {
            updateArray.address = address;
        }
    }

    if (hometown) {
        updateArray.hometown = hometown;
    }
    if (pincode) {
        updateArray.pincode = pincode;
    }

    const existingDetails = await runQuery('SELECT * FROM faculty_basic_info WHERE user_id = ?', [facultyID]);

    let bannerFile;
    if (req.file) {
        try {
            if (existingDetails.length > 0) {



                const bannerPath = existingDetails[0]?.banner
                const delFilePath = `${process.env.USER_BASE_PATH}user${facultyID}/${bannerPath}`
                await deleteFile(delFilePath);




                const data = await runQuery(`select * from faculity_users where faculityID = ?`, [facultyID])
                const phoneNumber = data[0].mobile
                bannerFile = await moveFileToUserFolder(req.file.path, facultyID, UserResumeBasePath, phoneNumber);


            }
            updateArray.banner = bannerFile;
        } catch (error) {
            return sendError(res, { message: `File upload error: ${error.message}`, statusCode: 400 });
        }
    }

    try {

        if (existingDetails.length > 0) {
            await runQuery('UPDATE faculty_basic_info SET ? WHERE user_id = ?', [updateArray, facultyID]);
        } else {
            await runQuery('INSERT INTO faculty_basic_info SET ?', { user_id: facultyID, ...updateArray });
        }

        let userArray = {};
        if (gender) {
            userArray.gender = gender;
        }
        if (dob) {
            userArray.dob = dob;
        }
        if (Object.keys(userArray).length > 0) {
            await runQuery('UPDATE faculity_users SET ? WHERE faculityID = ?', [userArray, facultyID]);
        }

        return sendSuccess(res, { message: 'User Details Updated', data: [] });

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// Profile Percentage api ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.profilePercentage = async (req, res) => {

    const { facultyID } = req.query;

    if (!facultyID) {
        return sendError(res, { message: 'Faculty ID is required.', statusCode: 400 });
    }

    try {
        let dataCount = {};

        const [otherDetails] = await runQuery(`
            SELECT 
                faculty_basic_info.bio, 
                faculty_basic_info.address, 
                faculty_basic_info.hometown, 
                faculty_basic_info.pincode, 
                faculty_basic_info.banner, 
                faculity_users.gender, 
                faculity_users.dob, 
                faculity_users.cv_doc
            FROM faculty_basic_info
            LEFT JOIN faculity_users ON faculity_users.faculityID = faculty_basic_info.user_id
            WHERE user_id = ?`, [facultyID]);


        if (otherDetails) {

            const otherDetailsArray = Object.entries(otherDetails)
                .filter(([key]) => key !== 'cv_doc' && key !== 'banner')
                .map(([_, value]) => value ? 'yes' : 'no');
            dataCount.other_details = otherDetailsArray.includes('no') ? 'no' : 'yes';
            dataCount.cv_doc = otherDetails.cv_doc ? 'yes' : 'no';
        } else {
            dataCount.cv_doc = 'no';
            dataCount.other_details = 'no';
        }

        const experienceResult = await runQuery('SELECT * FROM faculity_experience WHERE faculityID = ?', [facultyID]);
        dataCount.faculity_experience = experienceResult.length > 0 ? 'yes' : 'no';

        const educationResult = await runQuery(`
            SELECT * 
            FROM faculity_education
            LEFT JOIN result_type ON result_type.id = faculity_education.result_type
            LEFT JOIN education_type ON education_type.id = faculity_education.type
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_education.course
            WHERE faculityID = ?`, [facultyID]);
        dataCount.faculity_education = educationResult.length > 0 ? 'yes' : 'no';

        const skillResult = await runQuery(`
            SELECT * 
            FROM faculity_skill
            LEFT JOIN skills ON skills.id = faculity_skill.skill
            WHERE faculity_skill.faculityID = ?`, [facultyID]);
        dataCount.faculity_skill = skillResult.length > 0 ? 'yes' : 'no';

        const languageResult = await runQuery(`
            SELECT * 
            FROM faculity_language
            LEFT JOIN language ON language.id = faculity_language.language
            WHERE faculityID = ?`, [facultyID]);
        dataCount.faculity_language = languageResult.length > 0 ? 'yes' : 'no';

        const careerPreferencesResult = await runQuery(`
            SELECT * 
            FROM faculity_career_preferences
            LEFT JOIN career_preferences ON career_preferences.id = faculity_career_preferences.career_id
            WHERE faculityID = ?`, [facultyID]);
        dataCount.faculity_career_preferences = careerPreferencesResult.length > 0 ? 'yes' : 'no';

        const cityPreferencesResult = await runQuery(`
            SELECT * 
            FROM faculity_city_preferences
            LEFT JOIN cities ON cities.id = faculity_city_preferences.city
            WHERE faculityID = ?`, [facultyID]);
        dataCount.faculity_city_preferences = cityPreferencesResult.length > 0 ? 'yes' : 'no';

        const certificateResult = await runQuery('SELECT * FROM faculity_certificate WHERE faculityID = ?', [facultyID]);
        dataCount.faculity_certificate = certificateResult.length > 0 ? 'yes' : 'no';

        const [socialLinkResult] = await runQuery('SELECT social_link FROM faculty_basic_info WHERE user_id = ?', [facultyID]);

        dataCount.social_link = socialLinkResult && socialLinkResult.social_link ? 'yes' : 'no';

        // Adjust the count and percentage calculation
        const arrayCount = Object.keys(dataCount).length;
        const perPercentage = 100 / arrayCount;
        const yesCount = Object.values(dataCount).filter(value => value === 'yes').length;
        const percentage = yesCount * perPercentage;

        dataCount.percentage = Math.round(percentage);
        dataCount.perPercentage = Math.round(perPercentage);

        return sendSuccess(res, { message: 'User Check Profile Percentage', data: dataCount });
    } catch (error) {
        return sendError(res, { message: error.message, statusCode: 500 });
    }
};

