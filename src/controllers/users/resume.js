const { sendError, sendSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { unserialize, serialize } = require('php-serialize');

exports.resumeTemplateList = async (req, res) => {
    try {
        const { faculityID } = req.query;
        if (!faculityID) {
            return sendError(res, { message: "Plase enter faculity ID..." })
        }
        const resumeHtmlRows = await runQuery('SELECT id, thumbnail, price FROM resume_html');
        let resumeHtmlData = resumeHtmlRows.map(row => ({
            ...row,
            base_url: process.env.FILE_BASE_URL
        }));


        for (let item of resumeHtmlData) {
            const resumeDataRows = await runQuery('SELECT id, templateID, faculityID, data FROM purchased_resume WHERE faculityID = ? AND templateID = ?', [faculityID, item.id]);
            const resumeData = resumeDataRows[0];
            if (resumeData) {
                resumeData.data = unserialize(resumeData.data);
                item.purchased_data = resumeData;
            } else {
                item.purchased_data = null;
            }
        }

        if (resumeHtmlData.length > 0) {
            return sendSuccess(res, { data: resumeHtmlData, message: "Resume Template List..." })
        } else {
            return sendError(res, { message: error.message })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
};

exports.useTemplate = async (req, res) => {
    const { template_id, faculityID } = req.query;

    if (!template_id) {
        return sendError(res, { message: "Please enter Template Id" })
    }

    if (!faculityID) {
        return sendError(res, { message: "Please enter faculityID" })
    }

    try {
        const resumeHtml = await runQuery(`SELECT * FROM resume_html WHERE id = ?`, [template_id]);

        if (!resumeHtml.length) {
            return sendError(res, { message: "Tempalte not found" })
        }

        const purchasedResumeData = await runQuery(`SELECT * FROM purchased_resume WHERE faculityID = ? AND templateID = ?`, [faculityID, template_id]);

        if (purchasedResumeData.length) {
            purchasedResumeData[0].data = unserialize(purchasedResumeData[0].data);
        }

        const user = await runQuery(`
            SELECT 
                faculity_users.*, 
                faculty_basic_info.address, faculty_basic_info.bio, faculty_basic_info.hometown, faculty_basic_info.pincode, faculty_basic_info.banner, faculty_basic_info.social_link,
                tbl_qualifications.qualification,
                tbl_experience.experience,
                tbl_salary.salary,
                tbl_functions.function, tbl_functions.topic_name
            FROM faculity_users
            LEFT JOIN faculty_basic_info ON faculty_basic_info.user_id = faculity_users.faculityID
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_users.qualification
            LEFT JOIN tbl_experience ON tbl_experience.ID = faculity_users.experience
            LEFT JOIN tbl_salary ON tbl_salary.ID = faculity_users.salary
            LEFT JOIN tbl_functions ON tbl_functions.ID = faculity_users.job_function
            WHERE faculity_users.faculityID = ?
        `, [faculityID]);

        const skills = await runQuery(`
            SELECT skills.skill 
            FROM faculity_skill
            LEFT JOIN skills ON skills.id = faculity_skill.skill
            WHERE faculity_skill.faculityID = ?
        `, [faculityID]);

        const skillData = skills.map(skill => skill.skill);

        const educationData = await runQuery(`
            SELECT faculity_education.*, result_type.type as result_type, education_type.type as education_type, tbl_qualifications.qualification as course_txt
            FROM faculity_education
            LEFT JOIN result_type ON result_type.id = faculity_education.result_type
            LEFT JOIN education_type ON education_type.id = faculity_education.type
            LEFT JOIN tbl_qualifications ON tbl_qualifications.ID = faculity_education.course
            WHERE faculityID = ?
        `, [faculityID]);

        const experienceData = await runQuery(`SELECT * FROM faculity_experience WHERE faculityID = ?`, [faculityID]);

        const languages = await runQuery(`
            SELECT language.language 
            FROM faculity_language
            LEFT JOIN language ON language.id = faculity_language.language
            WHERE faculityID = ?
        `, [faculityID]);

        const languageData = languages.map(language => language.language);

        const certificates = await runQuery(`SELECT * FROM faculity_certificate WHERE faculityID = ?`, [faculityID]);

        certificates.forEach(certificate => {
            certificate.certificate_file = `${process.env.FILE_BASE_URL}/sources/upload/userAttachment/user${faculityID}/${certificate.certificate_file}`;
        });

        const careerPreferences = await runQuery(`
            SELECT faculity_career_preferences.*, career_preferences.type as career_type, career_preferences.value as career_value
            FROM faculity_career_preferences
            LEFT JOIN career_preferences ON career_preferences.id = faculity_career_preferences.career_id
            WHERE faculity_career_preferences.faculityID = ?
        `, [faculityID]);

        const cityPreferences = await runQuery(`
            SELECT cities.name as city_name
            FROM faculity_city_preferences
            LEFT JOIN cities ON cities.id = faculity_city_preferences.city
            WHERE faculity_city_preferences.faculityID = ?
        `, [faculityID]);

        const cityData = cityPreferences.map(city => city.city_name);
        const socialLinks = user[0].social_link ? unserialize(user[0].social_link) : [];
        const socialLinkData = Object.keys(socialLinks).map(key => ({ name: key, url: socialLinks[key] }));
        const defaultUserImage = `${process.env.FILE_BASE_URL}/sources/user_default.png`;

        const keyArray = {
            template_price: resumeHtml[0].price,
            NAME: `${user[0].name} `,
            ADDRESS: user[0].address,
            BIO: user[0].bio,
            HOMETOWN: user[0].hometown,
            PINCODE: user[0].pincode,
            FUNCTION: user[0].function,
            CITY: user[0].city,
            STATE: user[0].state,
            PHONE_NUMBER: user[0].mobile,
            EMAIL: user[0].email,
            SKILL: skillData,
            EDUCATION: educationData,
            EXPERIENCE: experienceData,
            LANGUAGE: languageData,
            CERTIFICATE: certificates,
            CAREER: careerPreferences,
            CITY_PREFERENCES: cityData,
            SOCIAL_LINK: socialLinkData,
            IMAGE: user[0].image ? `${process.env.FILE_BASE_URL}/sources/upload/userAttachment/user${user[0].faculityID}/${user[0].image}` : defaultUserImage,
            PURCHASED_DATA: purchasedResumeData.length ? purchasedResumeData[0] : null,
            DUMMY_DATA: resumeDummyData(req)
        };

        return sendSuccess(res, { data: keyArray, message: "Template with data..." })

    } catch (error) {
        return sendError(res, { message: "Internal Server Error" })

    }
};

function resumeDummyData() {
    const defaultUserImage = `${process.env.FILE_BASE_URL}/sources/user_default.png`;
    return {
        data: {
            NAME: " Demo Name ",
            ADDRESS: " Demo Address",
            BIO: "Demo Bio",
            HOMETOWN: "Hometown",
            PINCODE: "010101",
            FUNCTION: "Your Subject",
            CITY: "City",
            STATE: "State",
            PHONE_NUMBER: "91XXXXXXXX",
            EMAIL: "email@gmail.com",
            SKILL: [
                "Skill 01",
                "Skill 02",
                "Skill 03"
            ],
            EDUCATION: [
                {
                    id: "000",
                    faculityID: "000",
                    institute_name: "University",
                    board: null,
                    type: "000",
                    course: "000",
                    start_date: "2022-06-07",
                    end_date: "2024-06-19",
                    currently: "000",
                    result_type: "% Marks of 100 Maximum",
                    result: "99%",
                    specialization: "test",
                    created_at: "2024-06-19 18:21:01",
                    education_type: "Full Time",
                    course_txt: "Masters/Post Graduation"
                }
            ],
            EXPERIENCE: [
                {
                    id: "000",
                    faculityID: "000",
                    organization: "Google",
                    designation: "Software Developer",
                    responsibilities: "As a skilled Software Developer at Google, I specialize in creating innovative solutions, optimizing performance, and enhancing user experiences. My expertise spans full-stack development, problem-sol",
                    start_date: "2023-01-31",
                    end_date: "2024-06-19",
                    currently: "1",
                    created_at: "2024-06-24 17:40:28"
                }
            ],
            LANGUAGE: [
                "HINDI",
                "ENGLISH",
                "Sanskrit",
                "Bengali"
            ],
            CERTIFICATE: [
                {
                    id: "000",
                    faculityID: "000",
                    title: "Test",
                    description: "test",
                    certificate_file: "#",
                    created_at: "2024-06-15 16:41:03"
                }
            ],
            CAREER: [
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "11",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "nature_of_employment",
                    carrer_value: "Full-time"
                },
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "6",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "job_type",
                    carrer_value: "Permament"
                },
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "9",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "preferred_shift",
                    carrer_value: "Night"
                },
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "4",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "job_role",
                    carrer_value: "dddd"
                },
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "2",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "job_role",
                    carrer_value: "bbbb"
                },
                {
                    id: "000",
                    faculityID: "000",
                    career_id: "7",
                    created_at: "2024-06-17 18:16:52",
                    carrer_type: "job_type",
                    carrer_value: "dddd"
                }
            ],
            CITY_PREFERENCES: [
                "Mumbai",
                "Delhi",
                "Kolkata"
            ],
            SOCIAL_LINK: [
                {
                    name: "linkedin",
                    url: "https://www.linkedin.com/in/your_profile"
                },
                {
                    name: "github",
                    url: "https://github.com/your_username"
                }
            ],
            IMAGE: defaultUserImage
        }
    };
}

exports.purchaseResume = async (req, res) => {

    const requestData = req.body;

    if (!requestData.templateID) {
        return sendError(res, { message: "Template id is required." });
    }

    if (!requestData.faculityID) {
        return sendError(res, { message: "Faculity id is required." });
    }

    if (requestData.faculityID && requestData.templateID) {
        const dataArray = {
            faculityID: requestData.faculityID,
            templateID: requestData.templateID,
            template_type: requestData.template_type,
            payment_type: requestData.payment_type,
            payment_status: requestData.payment_status,
            payment_mode: requestData.payment_mode,
            transaction_id: requestData.transaction_id,
            transaction_signature: requestData.transaction_signature,
            transaction_order_id: requestData.transaction_order_id,
            price: requestData.price,
            data: serialize(requestData.data)
        };

        try {
            const [purchasedResumeData] = await runQuery(`
                SELECT id, templateID, faculityID, data 
                FROM purchased_resume 
                WHERE faculityID = ? AND templateID = ?
            `, [requestData.faculityID, requestData.templateID]);

            if (purchasedResumeData) {
                await runQuery(`
                    UPDATE purchased_resume 
                    SET ? 
                    WHERE id = ?
                `, [dataArray, purchasedResumeData.id]);
            } else {
                await runQuery(`
                    INSERT INTO purchased_resume 
                    SET ?
                `, [dataArray]);
            }

            return sendSuccess(res, { data: "", message: "Resume Added" });

        } catch (error) {
            console.error(error);
            return sendError(res, { message: "Internal Server Error" });
        }
    } else {
        return sendError(res, { message: "Faculity id is required." });
    }
};

exports.purchasedResumeList = async (req, res) => {
    const {faculityID} = req.query;

    if (!faculityID) {
        return sendError(res, { message: "Faculty ID is required." });
    }

    try {
        const purchasedResumeData = await runQuery(`
            SELECT 
                purchased_resume.id, 
                purchased_resume.templateID, 
                purchased_resume.faculityID, 
                resume_html.name AS template_name
            FROM 
                purchased_resume
            LEFT JOIN 
                resume_html ON resume_html.id = purchased_resume.templateID
            WHERE 
                purchased_resume.faculityID = ?
        `, [faculityID]);

        if (purchasedResumeData && purchasedResumeData.length > 0) {
            return sendSuccess(res, {
                data: purchasedResumeData,
                message: "Resume data"
            });
        } else {
            return sendError(res, {
                message: "No data found."
            });
        }
    } catch (error) {
        return sendError(res, {
            message: "An error occurred while fetching resume data.",
            error: error.message
        });
    }
};

exports.purchasedResumeDetails =  async (req, res) => {
    const requestData = req.query;

    if (!requestData.faculityID) {
        return sendError(res, { message: "Faculty ID is required." });
    }

    if (!requestData.purchaseID) {
        return sendError(res, { message: "Purchase ID is required." });
    }

    try {
        const resumeData = await runQuery(`
            SELECT 
                purchased_resume.*, 
                resume_html.name AS template_name
            FROM 
                purchased_resume
            LEFT JOIN 
                resume_html ON resume_html.id = purchased_resume.templateID
            WHERE 
                purchased_resume.id = ? 
                AND purchased_resume.faculityID = ?
        `, [requestData.purchaseID, requestData.faculityID]);

        if (resumeData && resumeData.length > 0) {
            // Assuming the `data` field is serialized, you can deserialize it
            const resume = resumeData[0];
            if (resume.data) {
                resume.data = JSON.parse(resume.data);
            }

            return sendSuccess(res, {
                data: resume,
                message: "Resume data"
            });
        } else {
            return sendError(res, {
                message: "No data found."
            });
        }
    } catch (error) {
        return sendError(res, {
            message: "An error occurred while fetching resume data.",
            error: error.message
        });
    }
};