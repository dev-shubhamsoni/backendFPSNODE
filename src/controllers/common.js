const { sendError, sendSuccess, generateUserIdByEnyId } = require("../utils/commonFunctions")
const { isValidEmail } = require("../utils/validator");
const { runQuery } = require("../utils/executeQuery")
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
// const sharp = require('sharp');
const { contactUsEmail } = require("../utils/mails");
const moment = require('moment');
const { testNotification, sendNotificationToFaculity } = require("../utils/firebaseHandler");

exports.featuredData = async (req, res) => {
    try {

        let citiesData = await runQuery(`SELECT DISTINCT cities.*, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/city/',icon) as icon, count(jobs.jobID) AS jobs_count FROM cities LEFT JOIN jobs ON cities.name = jobs.city WHERE cities.featured = 1 GROUP BY cities.name`)
        let statesData = await runQuery(`SELECT DISTINCT states.*, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/state/',icon) as icon,  count(jobs.jobID) AS jobs_count FROM states LEFT JOIN jobs ON states.name = jobs.state WHERE states.featured = 1 GROUP BY states.name`)
        let catData = await runQuery(`SELECT DISTINCT tbl_categories.*, count(jobs.jobID) AS jobs_count FROM tbl_categories LEFT JOIN jobs ON tbl_categories.ID = jobs.catID WHERE tbl_categories.featured = 1 GROUP BY tbl_categories.category`)
        let empData = await runQuery(`SELECT DISTINCT employer_user.*, count(jobs.jobID) AS jobs_count FROM employer_user LEFT JOIN jobs ON employer_user.employerID = jobs.employerID WHERE employer_user.featured = 1 GROUP BY employer_user.name`)

        data = {
            cities: citiesData,
            states: statesData,
            categories: catData,
            employer: empData
        }

        return sendSuccess(res, { data: data, message: "Featured Data..." })

    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.stateList = async (req, res) => {
    try {
        const data = await runQuery(`select CAST(id as CHAR) AS id, name from states where country_id in (101,229,178)`)
        return sendSuccess(res, { data: data, message: "States..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.qualifications = async (req, res) => {
    try {
        const data = await runQuery(`select * FROM tbl_qualifications`)
        return sendSuccess(res, { data: data, message: "Qualification List..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.stateCities = async (req, res) => {
    try {
        const { id } = req.params

        const data = await runQuery(`select CAST(id as CHAR) AS id, name, CAST(state_id as CHAR) AS state_id from cities where state_id = ?`, id)
        return sendSuccess(res, { data: data, message: "State cities..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.cityList = async (req, res) => {
    try {
        const data = await runQuery(`select CAST(id AS CHAR) AS id, name AS city from cities`, [])
        return sendSuccess(res, { data: data, message: "All City list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.salaryList = async (req, res) => {
    try {
        const data = await runQuery(`SELECT CAST(ID AS CHAR) AS ID, salary, value FROM tbl_salary ORDER BY value ASC`, [])
        return sendSuccess(res, { data: data, message: "Salary list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.blogList = async (req, res) => {
    try {
        const blogCount = await runQuery(`SELECT count(*) as blogCount FROM blog`, [])
        let limit = 10
        let offset = (req.query.page - 1) * limit;

        const blogs = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/blog/',blogimage) as blogimage FROM blog order by blogid desc limit ? OFFSET ? `, [limit, offset])
        let restrunData = {}
        if (blogCount[0]['blogCount'] > 0) {
            restrunData = {
                totalPages: Math.ceil(blogCount[0]['blogCount'] / limit),
                currentPage: req.query.page,
                item_per_page: limit,
                blogs: blogs
            }

        } else {
            restrunData = {
                totalPages: 0,
                currentPage: 0,
                item_per_page: 0,
                blogs: []
            }
        }
        return sendSuccess(res, { data: restrunData, message: "Blogs list..." })


    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.blogsByCategory = async (req, res) => {
    try {
        // const { category } = req.body
        const blogCount = await runQuery(`SELECT count(*) as blogCount FROM blog`, [])
        let limit = 10
        let offset = (req.query.page - 1) * limit;

        const blogs = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/blog/',blogimage) as blogimage FROM blog where category = ? order by blogid desc limit ? OFFSET ? `, [req.query.category, limit, offset])
        let restrunData = {}
        if (blogCount[0]['blogCount'] > 0) {
            restrunData = {
                totalPages: Math.ceil(blogCount[0]['blogCount'] / limit),
                currentPage: req.query.page,
                item_per_page: limit,
                blogs: blogs
            }

        } else {
            restrunData = {
                totalPages: 0,
                currentPage: 0,
                item_per_page: 0,
                blogs: []
            }
        }
        return sendSuccess(res, { data: restrunData, message: "Blogs list..." })


    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.featuredBlogs = async (req, res) => {
    try {
        const blogCount = await runQuery(`SELECT count(*) as blogCount FROM blog where featured = 1`, [])
        let limit = 10
        let offset = (req.query.page - 1) * limit;

        const blogs = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/blog/',blogimage) as blogimage FROM blog where featured = 1 order by blogid desc `, [])
        let restrunData = {}
        if (blogCount[0]['blogCount'] > 0) {
            restrunData = {
                blogs: blogs
            }
        } else {
            restrunData = {
                blogs: []
            }
        }
        return sendSuccess(res, { data: restrunData, message: "Blogs list..." })


    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.blogDetail = async (req, res) => {
    try {
        const { blogId } = req.body
        const blog = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/blog/',blogimage) as blogimage FROM blog WHERE blogid=?`, [blogId])
        const blogComment = await runQuery(`SELECT comment FROM blog_comments WHERE blog_id=?`, [blogId])
        blog[0].comments = blogComment

        return sendSuccess(res, { data: blog, message: "Blog data..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.blogCommentAdd = async (req, res) => {
    try {
        const { blog_id, user_id, name, email, comment } = req.body
        if (!blog_id) {
            return sendError(res, { message: "Please enter valid blog id..." });
        } else if (!comment) {
            return sendError(res, { message: "Please enter comment..." });
        } else {
            const otpLogQuery = `INSERT INTO blog_comments (
                blog_id, 
                user_id, 
                name, 
                email, 
                comment, 
                approve_status, 
                status, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`; 
            await runQuery(otpLogQuery, [
                blog_id,
                user_id,
                name,
                email,
                comment,
                "0",
                1,
                moment().format('YYYY-MM-DD HH:mm:ss')
            ]);
            return sendSuccess(res, { data: [], message: "Thanks for comment..." })
        }

        
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.blogAddLike = async (req, res) => {
    try {
        const { blog_id, activity } = req.body
        if (!blog_id) {
            return sendError(res, { message: "Please enter valid blog id..." });
        } else if (!activity) {
            return sendError(res, { message: "Please enter activity..." });
        } else {

            const blogLikes = await runQuery(`select likes from blog where blogid = ?`, [blog_id]);

            if(activity == "like"){
                var likes = blogLikes[0].likes + 1
            } else {
                var likes = blogLikes[0].likes - 1
            }
            await runQuery(`UPDATE blog SET likes = ? WHERE blogid = ?;`, [
                likes,
                blog_id,
              ]);
            return sendSuccess(res, { data: [], message: "Thanks for response..." })
        }

        
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.jobType = async (req, res) => {
    try {
        const data = await runQuery(`SELECT * FROM job_type`, [])
       
        return sendSuccess(res, { data, message: "Job Type..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.languageList = async (req, res) => {
    try {
        const facultyID = req.query.facultyID
        const data = await runQuery(`SELECT * FROM language`, [])

        for (const value of data) {
            const facultyLanguage = await runQuery(`SELECT * FROM faculity_language Where language=? and faculityID=?`, [value.id, facultyID])
            value.active = 0
            if(facultyLanguage[0]){
                console.log(facultyLanguage)
                value.active = 1
            }
        }
        return sendSuccess(res, { data, message: "Language list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.getVersion = async (req, res) => {
    try {
        const data = await runQuery(`SELECT * FROM settings WHERE ID = 1`, [])
        return sendSuccess(res, { data: data, message: "Application version..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.jobLevel = async (req, res) => {
    try {
        const data = await runQuery(`SELECT level FROM job_level`, []);
        const levels = data.map(item => item.level);
        return sendSuccess(res, { data: levels, message: "Job Level..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.skillSearch = async (req, res) => {
    const { facultyID : faculty_id, skill } = req.body;
    const facultyID = await generateUserIdByEnyId(faculty_id)
    if (!facultyID) {
        return sendError(res, { message: "Invalid User!, Please login again." });
    }

    try {
        let allSkillsList

        if (skill) {
            allSkillsList = await runQuery(`SELECT * FROM skills WHERE skill LIKE ?`, [`${skill}%`]);
        } else {
            allSkillsList = await runQuery(`SELECT * FROM skills limit 50`);
        }

        const allSkillsListOG = await runQuery(`SELECT * FROM skills`);

        let facultySkillsInInteger = [];

        if (facultyID) {
            const data = await runQuery(`SELECT skill FROM faculity_skill WHERE faculityID = ?`, [facultyID]);
            facultySkillsInInteger = data.map(record => ({
                skill: parseInt(record.skill, 10)
            }));
        }

        // Process allSkillsList and add 'active' field
        const processedSkillsList = allSkillsList.map(skillItem => ({
            ...skillItem,
            active: facultySkillsInInteger.some(facultySkill => facultySkill.skill === skillItem.id) ? 1 : 0
        }));


        const facultySkillsWithNames = facultySkillsInInteger.map(facultySkill => {
            const matchingSkill = allSkillsListOG.find(skillItem => skillItem.id === facultySkill.skill);
            // console.log('skillItem.id',skillItem.id);
            return {
                id: facultySkill.skill,
                skill: matchingSkill ? matchingSkill.skill : 'Unknown Skills',
                created_at: matchingSkill ? matchingSkill.created_at : 'Unknown created_at',
                active: 1
            };
        });

        const uniqueSkillsMap = new Map([...facultySkillsWithNames, ...processedSkillsList].map(skill => [skill.id, skill]));
        const finalUniqueSkillsList = Array.from(uniqueSkillsMap.values());

        return sendSuccess(res, { data: finalUniqueSkillsList, message: "Skills matching the search criteria." });

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.subCategories = async (req, res) => {
    const {categoryID} = req.query
    try {
        if(categoryID){
            const query = `
                SELECT tbl_functions.ID, tbl_functions.function, tbl_functions.image, tbl_functions.color
                FROM tbl_functions
                LEFT JOIN tbl_categories ON tbl_categories.ID = tbl_functions.CID
                WHERE tbl_functions.status != 0
                AND tbl_categories.status != 0
                AND tbl_categories.ID = ?;
            `;
            const data = await runQuery(query,[categoryID]);
            return sendSuccess(res, { data, message: "Sub categories ..." });   
        } else {
            const query = `
                SELECT tbl_functions.ID, tbl_functions.function, tbl_functions.image, tbl_functions.color
                FROM tbl_functions
                LEFT JOIN tbl_categories ON tbl_categories.ID = tbl_functions.CID
                WHERE tbl_functions.status != 0
                AND tbl_categories.status != 0 ;
            `;
            const data = await runQuery(query,[]);
            return sendSuccess(res, { data, message: "Sub categories ..." });   
        }

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.experience = async (req, res) => {
    try {
        const data = await runQuery(`SELECT CAST(ID AS CHAR) AS ID, experience, CAST(exp_num AS CHAR) AS exp_num FROM tbl_experience`, []);
        return sendSuccess(res, { data: data, message: "Experience list..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.resultType = async (req, res) => {
    try {
        const data = await runQuery(`SELECT * FROM result_type`, [])
        return sendSuccess(res, { data: data, message: "Result Type list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.categories = async (req, res) => {
    try {
        const data = await runQuery(`SELECT * FROM tbl_categories WHERE status = 1`, []);

        const stringData = data.map(row => {
            let stringRow = {};
            for (let key in row) {
                if (row.hasOwnProperty(key)) {
                    if (key === 'image') {
                        stringRow[key] = `${process.env.FILE_BASE_URL}sources/upload/catImg/${String(row[key])}`;
                    } else {
                        stringRow[key] = String(row[key]);
                    }
                }
            }
            return stringRow;
        });

        return sendSuccess(res, { data: stringData, message: "Categories list..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.careerPreferenceList = async (req, res) => {
    try {
        const data = await runQuery(`SELECT * FROM career_preferences`, []);

        const groupedData = {};
        data.forEach(item => {
            const type = item.type;
            if (!groupedData[type]) {
                groupedData[type] = [];
            }
            groupedData[type].push(item);
        });

        return sendSuccess(res, { data: groupedData, message: "Career Preference List..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.CatWithSubCat = async (req, res) => {

    try {

        const categoryData = await runQuery(`SELECT ID, category, image, show_all, status, featured FROM tbl_categories where status = 1`, []);

        for (let i = 0; i < categoryData.length; i++) {
            const categoryId = categoryData[i].ID;
            const subCategories = await runQuery(`SELECT ID,function,image FROM tbl_functions WHERE CID = ?`, [categoryId]);
            categoryData[i].subcategories = subCategories;
        }

        const main = {
            catpicLink: `${process.env.FILE_BASE_URL}sources/upload/`,
            categoryData
        }

        return sendSuccess(res, { data: main, message: "Categories list with Banner and SubCategories" });

    } catch (error) {

        return sendError(res, { message: error.message });
    }

}

exports.banners = async (req, res) => {
    try {
        const bannerData = await runQuery(`Select * FROM banners WHERE status = 1 AND position = 'Home' ORDER BY ID DESC`, [])
        const main = {
            picLink: `${process.env.FILE_BASE_URL}sources/upload/bannerImg/`,
            bannerData,
        }
        return sendSuccess(res, { data: main, message: "Categories list with Banner and SubCategories" });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}


exports.educationType = async (req, res) => {
    try {
        const educationTypeData = await runQuery(`Select * FROM education_type`, [])
       
        return sendSuccess(res, { data: educationTypeData, message: "Education Type Data" });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}

exports.keywordSuggestion = async ({ query: { keyword } }, res) => {
    try {
        if (!keyword) {
            return sendError(res, { message: "Please enter any keyword..." });
        } else {
            
            
            if (keyword.length < 3) {

                // let data = [];
                var query = "SELECT GROUP_CONCAT(category) as category FROM tbl_categories WHERE category LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var categorsysKey = await runQuery(query, []);
                
                var query = "SELECT GROUP_CONCAT(function) as function FROM tbl_functions WHERE function LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var functionKey = await runQuery(query, []);
                var data = "";
                if(categorsysKey[0].category){
                    data = data +","+categorsysKey[0].category
                }

                if(functionKey[0].function){
                    data = data +","+functionKey[0].function
                }
                
                retrunArray = data.split(',')
                retrunArray = retrunArray.filter(value => value.trim() !== "")
                retrunArray = [...new Set(retrunArray)];
            
            } else if (keyword.length === 3) {
                var query = "SELECT GROUP_CONCAT(category) as category FROM tbl_categories WHERE category LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var categorsysKey = await runQuery(query, []);
                
                var query = "SELECT GROUP_CONCAT(function) as function FROM tbl_functions WHERE function LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var functionKey = await runQuery(query, []);
                var data = "";
                if(categorsysKey[0].category){
                    data = data +","+categorsysKey[0].category
                }

                if(functionKey[0].function){
                    data = data +","+functionKey[0].function
                }
                
                retrunArray = data.split(',')
                retrunArray = retrunArray.filter(value => value.trim() !== "")
                retrunArray = [...new Set(retrunArray)];
            } else {
                
                var query = "SELECT GROUP_CONCAT(category) as category FROM tbl_categories WHERE category LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var categorsysKey = await runQuery(query, []);
                
                var query = "SELECT GROUP_CONCAT(function) as function FROM tbl_functions WHERE function LIKE '"+keyword+"%' AND status !=0 LIMIT 5"
                var functionKey = await runQuery(query, []);

                var query = "SELECT GROUP_CONCAT(job_title) as job_title FROM jobs WHERE job_title LIKE '"+keyword+"%' AND jobs.status !=0 AND is_delete != 1 GROUP BY job_title ORDER BY created_at DESC LIMIT 5"
                var jobKey = await runQuery(query, []);
                var data = "";
                if(categorsysKey[0].category){
                    data = data +","+categorsysKey[0].category
                }
                if(functionKey[0].function){
                    data = data +","+functionKey[0].function
                }
                if(jobKey[0].job_title){
                    data = data +","+jobKey[0].job_title.split(',')
                } 
                retrunArray = data.split(',')
                retrunArray = retrunArray.filter(value => value.trim() !== "")
                retrunArray = [...new Set(retrunArray)];
            }
            return sendSuccess(res, {
                data: retrunArray,
                message: "Keyword Suggestion list...",
            });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}


exports.filterCategories = async (req, res) => {
    try {
        const data = await runQuery(`SELECT tbl_categories.ID, tbl_categories.category, tbl_categories.show_all, tbl_categories.color, 
            tbl_categories.status, tbl_categories.type, tbl_categories.featured, 
            CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/catImg/',image) as image, (select count(*) FROM jobs WHERE jobs.catID = tbl_categories.ID AND jobs.status=1) as jobs FROM tbl_categories where status = 1 ORDER by jobs DESC;`, []);
        return sendSuccess(res, { data: data, message: "Categories list..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.filterSubCategories = async (req, res) => {
    const {categoryID} = req.query
     
    try {
        if(categoryID){
            const query = `
                SELECT tbl_functions.ID, tbl_functions.function, tbl_functions.image, tbl_functions.color, (select count(*) FROM jobs WHERE jobs.functionID = tbl_functions.ID AND jobs.status=1) as jobs
                FROM tbl_functions
                LEFT JOIN tbl_categories ON tbl_categories.ID = tbl_functions.CID
                WHERE tbl_functions.status != 0
                AND tbl_categories.status != 0
                AND tbl_categories.ID = ? ORDER by jobs DESC;
            `;
            const data = await runQuery(query,[categoryID]);
            return sendSuccess(res, { data, message: "Sub categories ..." });   
        } else {
            const query = `
                SELECT tbl_functions.ID, tbl_functions.function, tbl_functions.image, tbl_functions.color, (select count(*) FROM jobs WHERE jobs.functionID = tbl_functions.ID AND jobs.status=1) as jobs
                FROM tbl_functions
                LEFT JOIN tbl_categories ON tbl_categories.ID = tbl_functions.CID
                WHERE tbl_functions.status != 0
                AND tbl_categories.status != 0 ORDER by jobs DESC;
            `;
            const data = await runQuery(query,[]);
            return sendSuccess(res, { data, message: "Sub categories..." });   
        }

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.filterCatFuncationData = async (req, res) => {
    try {
        const {subject} = req.query
        const query = `
            SELECT tbl_functions.ID, tbl_functions.function, tbl_functions.CID, (select count(*) FROM jobs WHERE jobs.functionID = tbl_functions.ID AND jobs.status=1) as jobs
            FROM tbl_functions
            LEFT JOIN tbl_categories ON tbl_categories.ID = tbl_functions.CID
            WHERE tbl_functions.status != 0 AND tbl_functions.function = ?
            AND tbl_categories.status != 0 ORDER by jobs DESC;
        `;
        const data = await runQuery(query,[subject]);

        let citiesData = await runQuery(`SELECT DISTINCT cities.name, count(jobs.jobID) AS jobs_count FROM cities LEFT JOIN jobs ON cities.name = jobs.city WHERE cities.featured = 1 GROUP BY cities.name  Limit 10`)
        const otherSubject = `
            SELECT tbl_functions.ID, tbl_functions.function, (select count(*) FROM jobs WHERE jobs.functionID = tbl_functions.ID AND jobs.status=1) as jobs
                FROM tbl_functions
                WHERE tbl_functions.status != 0
                AND tbl_functions.CID = ? AND  tbl_functions.ID != ? ORDER by jobs DESC Limit 10;
        `;
        const otherSubjectData = await runQuery(otherSubject,[data[0].CID, data[0].ID]);
        const result = {
            searchResults: data,
            allCity: citiesData,
            otherSubject: otherSubjectData,
        }
        return sendSuccess(res, { data: result, message: "data..." }); 
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.filterCityList = async (req, res) => {
    try {
        const data = await runQuery(`select CAST(id AS CHAR) AS id, name AS city, (select count(*) FROM jobs WHERE jobs.city = cities.name AND jobs.status=1) as jobs from cities GROUP BY cities.name ORDER by jobs DESC`, [])
        return sendSuccess(res, { data: data, message: "All City list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.filterStateCities = async (req, res) => {
    try {
        const { id } = req.params
        const data = await runQuery(`select CAST(id as CHAR) AS id, name, CAST(state_id as CHAR) AS state_id, (select count(*) FROM jobs WHERE jobs.city = cities.name AND jobs.status=1) as jobs from cities where state_id = ? ORDER by jobs DESC`, id)
        return sendSuccess(res, { data: data, message: "State cities..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.filterStateList = async (req, res) => {
    try {
        const data = await runQuery(`select CAST(id as CHAR) AS id, name, (select count(*) FROM jobs WHERE jobs.state = states.name AND jobs.status=1) as jobs from states where country_id in (101,229,178) ORDER by jobs DESC`)
        return sendSuccess(res, { data: data, message: "States..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.stateWithCountry = async (req, res) => {
    try {
        const data = await runQuery(`select id, code, name from country_phone where id in (101,229,178)`)

        for(var i = 0; i < data.length;i++){
            const states = await runQuery(`select id, name from states where country_id = ?`,data[i].id)
            data[i].state = states
        }

        return sendSuccess(res, { data: data, message: "States..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.appWelcome = async (req, res) => {
    try {
        const data = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/bannerImg/',image) as image FROM banners where status = 1 AND position = 'App Welcome';`, []);
        // console.log(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/bannerImg/',image) as image FROM banners where position = 'App Welcome';`)
        return sendSuccess(res, { data: data, message: "Welcome banner image..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.relevantJobFeedback = async (req, res) => {
    try {
        const {device_type, faculityID, feedback} = req.query
        
        const otpLogQuery = `INSERT INTO relevant_job_feedback (
            device_type, 
            faculityID, 
            feedback, 
            created_at
        ) VALUES (?, ?, ?, ?)`;

        await runQuery(otpLogQuery, [
            device_type,
            faculityID,
            feedback,
            moment().format('YYYY-MM-DD HH:mm:ss')
        ]);
        return sendSuccess(res, { data: [], message: "Thank you for feedback..." });

    } catch (error) {
        return sendError(res, { message: error.message });
        // throw error;
    }
};

exports.appFeedback = async (req, res) => {
    try {
        const {device_type, faculityID, feedback, message} = req.body
        
        const otpLogQuery = `INSERT INTO app_feedback (
            device_type, 
            faculityID, 
            feedback, 
            message, 
            created_at
        ) VALUES (?, ?, ?, ?, ?)`;

        await runQuery(otpLogQuery, [
            device_type,
            faculityID,
            feedback,
            message,
            moment().format('YYYY-MM-DD HH:mm:ss')
        ]);
        return sendSuccess(res, { data: [], message: "Thank you for feedback..." });

    } catch (error) {
        return sendError(res, { message: error.message });
        // throw error;
    }
};
exports.areaByCity = async (req, res) => {
    try {
        const {city} = req.query
        const areaQuery = `Select * from area where City = ?`;
        var areaData = await runQuery(areaQuery, [city]);
        return sendSuccess(res, { data: areaData, message: "Area data by city..." });
    } catch (error) {
        return sendError(res, { message: error.message });
        // throw error;
    }
};
exports.getBannerType = async (req, res) => {
    try {
        var bannerType = await runQuery("SELECT position FROM `banners` WHERE status = 1 GROUP By position;");
        return sendSuccess(res, { data: bannerType, message: "Banner type data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
        // throw error;
    }
};
exports.getBaneerByType = async (req, res) => {
    try {
        const {banner_type} = req.query
        const bannerQuery = `Select *, CONCAT('` + process.env.FILE_BASE_URL + `/sources/upload/bannerImg/',image) as image from banners where status = 1 and position = ?`;
        var bannerData = await runQuery(bannerQuery, [banner_type]);
        return sendSuccess(res, { data: bannerData, message: "Banner Data..." });
    } catch (error) {
        return sendError(res, { message: error.message }); 
    }
};

exports.faqListUser = async (req, res) => {
    try { 
        var bannerData = await runQuery(`Select * from tbl_defaultquerylist where type='user'`, []);
        return sendSuccess(res, { data: bannerData, message: "FAQ Data..." });
    } catch (error) {
        return sendError(res, { message: error.message }); 
    }
};

exports.faqListEmployer = async (req, res) => {
    try { 
        var bannerData = await runQuery(`Select * from tbl_defaultquerylist where type='employer'`, []);
        return sendSuccess(res, { data: bannerData, message: "FAQ Data..." });
    } catch (error) {
        return sendError(res, { message: error.message }); 
    }
};


exports.testNotification = async (req, res) => {
    try {
        // var tokenHello = "embfDng1TzCfm1IwOeEd4D:APA91bFs9Sk0Wip3C35F1Gskdxfy52-EQLxR83BmqPWIYKdcb068OPTBIK4Pg5j-dd-cR95jg5ehFbQV-PnCjLZfotmp_VqM1-QwvqBBxpXgRBF14BToeTZiZMlXOjFGlgGON6ndhVYm"
        testNotification(req.query.token, {
            title: 'Applied hello',
            body: `You have Successfully applied for the job...`,
            job_url: "#"
        });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.scheduleNotification = async (req, res) => {
     
        try {
            let offset = 0;
            let hasMoreData = true;            
            while (hasMoreData) {
                try {             
                    // let offset = 0;
                    // let hasMoreData = true;
                    const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                        WHERE faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                        and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                        and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset])
                        // and faculity_users.regToken NOT IN ('no token') and faculity_users.faculityID = 126140 GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [1000, offset])
                    
                    const notificationData = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/NotificationImg/',image) as image FROM schedule_notification where schedule_date=? limit 1;`, [moment().format('YYYY-MM-DD')])
                    var regToken = "cEjpeCjpS06MaJDegpAB4G:APA91bHToU4aBxV1BJ9wFmreHqjYsp9_1jigM4qmjP5KFqg4ZTky-0Wp32LnmT262zCHQkkcqaZwBhNkEOE9fwYQs8dJNL5HBXLnyPACtWcGfnktoFtJjucxf_B2g7Uvk3fRd0oGZ1tD"
                    var imageUrl = (notificationData[0].image) ? notificationData[0].image : "" ;
                    // console.log(notificationData)
                    // console.log(imageUrl)
                    // console.log(data)
                    await data.forEach((value) => {                        
                        sendNotificationToFaculity(value.regToken, {
                        // sendNotificationToFaculity(regToken, {
                            title: notificationData[0].title, 
                            body: notificationData[0].message,
                            job_url: null,
                            imageUrl: imageUrl
                        }, "", imageUrl);
                        // console.log(value.regToken)
                        // console.log(regToken)
                    });  
                              
                    if (data.length < 1000) {
                        hasMoreData = false;  // Stop fetching when less than 1000 records are returned
                        // await runQuery(
                        //     `DELETE FROM schedule_notification WHERE id = ? `,
                        //     [notificationData[0].id]
                        // );
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


exports.birthdayNotification = async (req, res) => {
     
        try {
            let offset = 0;
            let hasMoreData = true;            
            while (hasMoreData) {
                try {             
                   
                    const data = await runQuery(`SELECT faculity_users.faculityID, faculity_users.name, faculity_users.regToken, faculity_users.device_type  FROM faculity_users 
                        WHERE faculity_users.dob = ? and faculity_users.regToken IS NOT Null and faculity_users.regToken != "" 
                        and (faculity_users.device_type = 'ios' or faculity_users.device_type = 'Android') 
                        and faculity_users.regToken NOT IN ('no token') GROUP by faculity_users.faculityID LIMIT ? OFFSET ? ;`, [moment().format('YYYY-MM-DD'), 1000, offset])
                    
                    var regToken = "cEjpeCjpS06MaJDegpAB4G:APA91bHToU4aBxV1BJ9wFmreHqjYsp9_1jigM4qmjP5KFqg4ZTky-0Wp32LnmT262zCHQkkcqaZwBhNkEOE9fwYQs8dJNL5HBXLnyPACtWcGfnktoFtJjucxf_B2g7Uvk3fRd0oGZ1tD"
                    
                    console.log(data)
                    await data.forEach((value) => {                        
                        // sendNotificationToFaculity(value.regToken, {
                        sendNotificationToFaculity(regToken, {
                            title: "Happy Birthday", 
                            body: "Happy Birthday",
                            job_url: null,
                            imageUrl: "#"
                        }, "", "#");
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

exports.ChatGptKey = async (req, res) => {
    try {
        return sendSuccess(res, { data: process.env.CHATGPTAPIKEY, message: "Chat Gpt Key..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.cityByKey = async (req, res) => {
    try {
        if(req.query.key){             
            const data = await runQuery(
                `SELECT * FROM cities WHERE name LIKE '%`+req.query.key+`%' ORDER BY featured DESC, name ASC limit 50;`,
                []
            );
            return sendSuccess(res, { data: data, message: "City Data..." });
        } else { 
            const data = await runQuery(
                `SELECT * FROM cities ORDER BY featured DESC, name ASC limit 50;`,
                []
            );
            return sendSuccess(res, { data: data, message: "City Data..." });
        }
        
        
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.stateByKey = async (req, res) => {
    try { 
        const data = await runQuery(
            `SELECT * FROM states WHERE name LIKE '%`+req.query.key+`%';`,
            []
        );
        return sendSuccess(res, { data: data, message: "States Data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.subjectByKey = async (req, res) => {
    try { 
        const data = await runQuery(
            `SELECT * FROM tbl_functions WHERE function LIKE '%`+req.query.key+`%';`,
            []
        );
        return sendSuccess(res, { data: data, message: "States Data..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.addAreaByCity = async (req, res) => {
    try {
        const { state, city, area } = req.body;

        if (!state) {
            return sendError(res, { message: "Please enter your State..." })
        } else if (!city) {
            return sendError(res, { message: "Please enter valid City..." })
        } else if (!area) {
            return sendError(res, { message: "Please enter valid area..." })
        } else {
            
            const otpLogQuery = `INSERT INTO area (
                State, 
                City, 
                area
            ) VALUES (?, ?, ?)`;
    
            await runQuery(otpLogQuery, [
                state,
                city,
                area
            ]);
            return sendSuccess(res, { data: [], message: "Area added..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// async function downloadImage(url, imagePath) {
//     const response = await axios({
//         url,
//         responseType: 'stream',
//     });
//     return new Promise((resolve, reject) => {
//         const writer = fs.createWriteStream(imagePath);
//         response.data.pipe(writer);
//         writer.on('finish', resolve);
//         writer.on('error', reject);
//     });
// }

// exports.banners = async (req, res) => {
//     try {
//         const bannerData = await runQuery(`Select * FROM banners WHERE status = 1 ORDER BY ID DESC`, []);
//         const picLink = "https://admin.fpsjob.com/sources/upload/bannerImg/";
//         const tempDir = path.join(__dirname, 'temp');

//         // Ensure temp directory exists
//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir);
//         }

//         // Process each banner image
//         const processedBannerData = await Promise.all(bannerData.map(async (banner) => {
//             const imageUrl = `${picLink}${banner.image}`;
//             const localImagePath = path.join(tempDir, banner.image);
//             const outputImagePath = path.join(tempDir, `compressed_${banner.image}`);

//             // Download the image
//             await downloadImage(imageUrl, localImagePath);

//             // Resize the image by 30%
//             await sharp(localImagePath)
//                 .resize({ width: Math.round(0.7 * (await sharp(localImagePath).metadata()).width) })
//                 .toFile(outputImagePath);

//             return {
//                 ...banner,
//                 imageUrl: `${picLink}compressed_${banner.image}`
//             };
//         }));

//         const main = {
//             picLink,
//             bannerData: processedBannerData,
//         };
//         return sendSuccess(res, { data: main, message: "Categories list with Banner and SubCategories" });
//     } catch (error) {
//         return sendError(res, { message: error.message });
//     } finally {
//         // Clean up temp directory
//         fs.readdir(tempDir, (err, files) => {
//             if (err) throw err;
//             for (const file of files) {
//                 fs.unlink(path.join(tempDir, file), err => {
//                     if (err) throw err;
//                 });
//             }
//         });
//     }
// };

exports.testimonials = async (req, res) => {
    try {
        const data = await runQuery(`SELECT ID, name, image, details FROM testimonial WHERE status = 1`, []);
        const processedData = data.map(row => {
            const nameData = row.name.split("(");
            return {
                ...row,
                name: nameData[0].trim(),
                designation: nameData[1] ? nameData[1].replace(")", "").trim() : ""
            };
        });
        const main = {
            base_url: "https:\/\/admin.fpsjob.com\/sources\/upload\/testimonial\/",
            data: processedData
        }
        return sendSuccess(res, { data: main, message: "Testimonials list..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.bankDetails = async (req, res) => {
    try {
        const data = await runQuery(`SELECT *, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/',qr_img) as qr_img  FROM bank_details WHERE ID = 1`, []);
        return sendSuccess(res, { data: data, message: "Bank details..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.contactUs = async (req, res) => {
    try {
        const { name, email, message, number } = req.body

        if (!isValidEmail(email)) {
            return sendError(res, { message: "Please enter valid email id..." })
        } else if (!name) {
            return sendError(res, { message: "Please enter your name..." })
        } else if (!number) {
            return sendError(res, { message: "Please enter your mobile..." })
        } else if (!message) {
            return sendError(res, { message: "Please enter your message..." })
        } else {
            let data = {
                name: req.body.name,
                email: req.body.email,
                message: req.body.message,
                mobile: req.body.number
            }
            await runQuery(`INSERT INTO contactus (contact_name, contact_email, contact_phone, contact_message, created_at) VALUES (?, ?, ?, ?, ?)`, [data['name'], data['email'], data['mobile'], data['message'], moment().format('YYYY-MM-DD HH:mm:ss')]);
            await contactUsEmail(data); 
            return sendSuccess(res, { message: "We will contact you soon..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

exports.contactInfo = async (req, res) => {
    try {
        let data = await runQuery(`select * from contact_info`, [])
        data[0].mobile_number = data[0].mobile_number.split(" ").join("")
        data[0].mobile_number = data[0].mobile_number.split(',')
       
        data[0].email = data[0].email.split(" ").join("")
        data[0].email = data[0].email.split(',')
        return sendSuccess(res, { data: data, message: "Contact Info..." })
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------old code below


exports.addState = async (req, res) => {
    try {
        const { state_name, country_id } = req.body;
        if (!state_name || !country_id) {
            return sendError(res, { message: "Please provide both state name and country id." });
        }

        await runQuery(`INSERT INTO states (name, country_id) VALUES (?, ?)`, [state_name, country_id]);
        return sendSuccess(res, { message: "State has been added successfully." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}

exports.addCity = async (req, res) => {
    try {
        const { state_id, city_name } = req.body
        if (!city_name) {
            return sendError(res, { message: "Please enter the city name..." })
        }
        const stateData = await runQuery(`select * from states where state_id = ?`, [state_id])
        if (stateData.length > 0) {
            await runQuery(`insert into cities set state_id = ?, city_name = ?`, [state_id, city_name])
            return sendSuccess(res, { message: "City has been added successfully..." })
        } else {
            return sendError(res, { message: "Please select the valid state..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.cityAutoComplete = async (req, res) => {
    const { search = "" } = req.query;
    try {
        let query = `select * from cities`;
        let value = [];
        if (search) {
            query += ` WHERE name LIKE ?`;
            value.push(`%${search}%`);
        }
        query += ` LIMIT ? OFFSET ?`;
        const data = await runQuery(query, [...value, 100, 0]);
        return sendSuccess(res, { data: data, message: "City list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.salaryBreakdownType = async (req, res) => { 
    try {
        let query = `select * from salary_breakdown_type`;
         
        const data = await runQuery(query, []);
        return sendSuccess(res, { data: data, message: "City list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.brandLevel = async (req, res) => { 
    try {
        let query = `select group_concat(level) as level from brand_level`;
         
        const data = await runQuery(query, []);
        return sendSuccess(res, { data: data[0].level.split(","), message: "Brand level list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.benefitsList = async (req, res) => { 
    try {
        let query = `SELECT id, title, CONCAT('` + process.env.FILE_BASE_URL + `sources/upload/benefitsImg/',icon) as icon FROM benefits WHERE status = 1;`;
         
        const data = await runQuery(query, []);
        return sendSuccess(res, { data: data, message: "Benefits list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

// File handling ->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});


const upload = multer({ storage: storage });
const uploadFile = upload.single('file');

const deleteFile = async (filename) => {
    try {
        await fs.remove(`uploads/${filename}`);
        return { success: true };
    } catch (err) {
        throw new Error('Error deleting file');
    }
};

const updateFile = async (oldFilename, newFile) => {
    try {
        await fs.remove(`uploads/${oldFilename}`);
        const result = await new Promise((resolve, reject) => {
            uploadFile(newFile, null, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(newFile.file);
                }
            });
        });
        return result;
    } catch (err) {
        throw new Error('Error updating file');
    }
};


exports.getMulterStorage = (userId) => {

    const baseDirectory = 'uploads/user';

    if (!fs.existsSync(baseDirectory)) {
        fs.mkdirSync(baseDirectory, { recursive: true });
    }

    const userDirectory = path.join(baseDirectory, `user${userId}`);

    if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory, { recursive: true });
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, userDirectory);
        },
        filename: (req, file, cb) => {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const uniqueSuffix = `${date}_${time}-${file.originalname}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}`);
        }
    });
};

exports.moveFileToUserFolder = async (filePath, userId, destBasePath, endAppend) => {
    try {
        const userFolder = path.join(destBasePath, `user${userId.toString()}`);
        await fs.ensureDir(userFolder);
        await fs.chmod(userFolder, 0o777);

        const fileName = path.basename(filePath);
        const fileExt = path.extname(fileName); 
        const fileNameWithoutExt = path.basename(fileName, fileExt); 
        const newFileName = `${fileNameWithoutExt}_${endAppend ? endAppend : "no-phone-number"}${fileExt}`; 
        const newFilePath = path.join(userFolder, newFileName);

        await fs.rename(filePath, newFilePath);
        
        return newFileName;
    } catch (error) {
        console.error('Error moving file:', error);
        throw error;
    }
};

exports.deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
        // throw error;
    }
};

