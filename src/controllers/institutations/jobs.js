const { sendError, sendSuccess, sendPaginationSuccess, notificationMesssage, getEmployerIdByEnyId, replaceEmployerID, replaceFacultyID, generateUserIdByEnyId } = require("../../utils/commonFunctions");
const { isValidHtml, isValidDateFormat, isValidJson, isArrayCheck } = require("../../utils/validator");
const { runQuery } = require("../../utils/executeQuery");
const { employerApplyStatus } = require("../../utils/mails");
const {
  APPLICATION_STATUS,
  APPLICATION_SCREENING_STATUS,
  APPLICATION_INTERVIEW_STATUS,
  APPLICATION_OFFER_STATUS,
} = require("../../utils/enums");
const { InstituteLOGO } = require("../../utils/filesPath");
const fs = require("fs");
const { application } = require("express");
const {
  JobPostTemplate,
  RemainingJobTemplate,
  sendMail,
  InterviewSchedualTemplate,
  ApplyStatusChangeTemplate,
  VERICATION_EMAIL,
} = require("../../utils/mailHandler");
const { sendNotificationToFaculity } = require("../../utils/firebaseHandler");
const WORK_PLACE_TYPE = ["On-Site", "Hybrid", "Remote"];
const JOBS_TYPE = ["Full Time", "Part Time", "Contract", "Hourly Basis", "Internship"];
const SELECTION_PROCESS = ["Demo", "Written+Demo", "Telephonic Interview", "F2F Interview", "Online Interview"];
const SALARY_TYPE = ["Hourly", "Weekly", "Monthly", "Annually"];
const QUESTIONS_TYPE = ["Text", "Single Choice"];
const moment = require('moment');

exports.workPlaceType = async (req, res) => {
  try {
    return sendSuccess(res, { data: WORK_PLACE_TYPE, message: "Work place type..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.salaryType = async (req, res) => {
  try {
    return sendSuccess(res, { data: SALARY_TYPE, message: "Work place type..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.salaryList = async (req, res) => {
  try {
    const data = await runQuery(`select * from tbl_salary`);
    return sendSuccess(res, { data: data, message: "salary list..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.jobTypes = async (req, res) => {
  try {
    const data = await runQuery(`select GROUP_CONCAT(type) as type from job_type`);
    return sendSuccess(res, { data: data[0].type.split(","), message: "Work place type..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.qualification = async (req, res) => {
  try {
    const data = await runQuery(`select ID, qualification, sort_order from tbl_qualifications where status = ?`, [1]);
    return sendSuccess(res, { data: data, message: "Qualifications..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.selectionProcess = async (req, res) => {
  try {
    return sendSuccess(res, { data: SELECTION_PROCESS, message: "Work place type..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.questionsType = async (req, res) => {
  try {
    return sendSuccess(res, { data: QUESTIONS_TYPE, message: "Questions type..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done by anuj

exports.experinceLevel = async (req, res) => {
  try {
    const categories = await runQuery(`SELECT * FROM tbl_experience`);

    const responseData = {
      status: true,
      statusCode: 200,
      data: categories,
      message: "experience list...",
    };
    res.status(200).json(responseData);
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

const getSalaryType = (salary_type, min_salary, max_salary) => {
  let salary_u = "";
  const salaryType = salary_type;
  const salaryMin = min_salary;
  const salaryMax = max_salary;

  switch (salaryType) {
    case "Hourly":
      salary_u = salaryMin + "-" + salaryMax + " " + "Per/Hour";
      break;
    case "Weekly":
      salary_u = salaryMin + "-" + salaryMax + " " + "Per/Week";
      break;
    case "Monthly":
      salary_u = salaryMin + "-" + salaryMax + " " + "Per/Month";
      break;
    case "Annually":
      salary_u = salaryMin + "-" + salaryMax + " " + "LPA";
      break;
    default:
      salary_u = " ";
      break;
  }
  return salary_u;
};

exports.createJob = async (req, res) => {
  try {
    let salary_u = getSalaryType(req.body.salary_type, req.body.min_salary, req.body.max_salary);
    const {
      latestPlanId,
      activePlan,
      employerID:emp_id,
      catID,
      functionID,
      job_title,
      no_of_requirement,
      state,
      city,
      job_type,
      job_level,
      min_experience,
      max_experience,
      experience_unit,
      qualification,
      job_description,
      doc_required,
      job_designation,
      min_salary,
      max_salary,
      salary_type,
      salary_unit,
      selection_process,
      process_location,
      process_state,
      process_city,
      area,
      remarks,
      shift_start,
      shift_end,
      working_days,
      benefits,
    } = req.body;

    if (!emp_id) {
      return sendError(res, { message: "Please provide the Employer..." });
    } else if (!catID) {
      return sendError(res, { message: "Please select the Category..." });
    } else if (!functionID) {
      return sendError(res, { message: "Please enter your Subject..." });
    } else if (!job_title) {
      return sendError(res, { message: "Please select the job title..." });
    } else if (!no_of_requirement) {
      return sendError(res, { message: "Please enter the no of requirement..." });
    }

    // else if (!city) {
    //   return sendError(res, { message: "Please select the city..." });
    // } 

    // else if (!state) {
    //   return sendError(res, { message: "Please select the state..." });
    // } 

    else if (!job_type) {
      return sendError(res, { message: "Please select the job type..." });
    } else if (!job_level) {
      return sendError(res, { message: "Please select the job level..." });
    } else if (parseInt(min_salary) < 1 || !min_salary) {
      return sendError(res, { message: "Please provide the minimum salary 1.." });
    } else if (parseInt(max_salary) > 9900000 || !max_salary) {
      return sendError(res, { message: "Please enter below the salary range 99 lakh.." });
    } else if (parseInt(max_salary) < parseInt(min_salary)) {
      return sendError(res, { message: "Please enter valid salary range..." });
    } else if (!experience_unit) {
      return sendError(res, { message: "Please select the Experience Unit..." });
    } else if (!qualification) {
      return sendError(res, { message: "Please provide qualification..." });
    } else if (!job_description) {
      return sendError(res, { message: "Please provide job description..." });
    } else if (!benefits) {
      return sendError(res, { message: "Please provide job benefits..." });
    } /* else if (!job_designation) {
      return sendError(res, { message: "Please provide designation..." });
    }  */ else if (!salary_type) {
      return sendError(res, { message: "Please provide salary type..." });
    } else if (!selection_process) {
      return sendError(res, { message: "Please provide selection process..." });
    } /* else if (!process_location) {
      return sendError(res, { message: "Please provide process location..." });
    } else if (!process_state) {
      return sendError(res, { message: "Please provide process state..." });
    } else if (!process_city) {
      return sendError(res, { message: "Please provide process city..." });
    } */ else if (min_experience > max_experience) {
      return sendError(res, { message: "Please select the valid experience..." });
    } else if (!max_experience || !min_experience) {
      return sendError(res, { message: "Please provide the experience range..." });
    } else {
      var slug = "";
      const employerID = await getEmployerIdByEnyId(emp_id)      
      if (!employerID) return sendError(res, { message: 'Invalid Institute ID' })

      if (job_title) {
        // const slugData =  await runQuery('SELECT jobID, job_title FROM jobs WHERE job_title = ?', [job_title], (error, results) => {
        const slugData = await runQuery(`SELECT jobID, job_title FROM jobs WHERE job_title = ?`, [job_title]);
        if (slugData.length >= 0) {
          const count = slugData.length + 1;
          slug = job_title.trim().toLowerCase().replace(/\s+/g, "-") + "-" + count;
        } else {
          slug = job_title.trim().toLowerCase().replace(/\s+/g, "-");
        }
      } else {
        callback(null); // No title provided
      }

      const areaQuery = `Select * from area where area = ?`;
      var areaData = await runQuery(areaQuery, [area]);

      if (areaData.length == 0) {
        await runQuery(`INSERT INTO area set area=?, City=?, District=?, State=?`, [
          area,
          city,
          city,
          state
        ]);
      }

      const data = await runQuery(
        `insert into jobs set posted_by=?, employerID=?, catID=?, functionID=?, job_title=?, slug=?, 
            state=?, city=?, job_type=?, job_level=?, min_experience=?, max_experience=?, experience_unit=?, qualification=?, 
            job_description=?, doc_required=?, job_designation=?, 
            no_of_requirement=?, min_salary=?, max_salary=?, salary_type=?, salary_unit=?, selection_process=?, process_location=?, process_state=?,
            process_city=?, area=?, remarks=?, shift_start=?, shift_end=?, working_days=?,created_at=NOW(), 
            updated_at=NOW()`,
        [
          0,
          employerID,
          catID,
          functionID,
          job_title,
          slug,
          state,
          city,
          job_type,
          job_level,
          min_experience,
          max_experience,
          experience_unit,
          qualification,
          job_description,
          doc_required,
          job_designation,
          no_of_requirement,
          min_salary,
          max_salary,
          salary_type,
          salary_u,
          selection_process,
          process_location || "",
          process_state || "",
          process_city || "",
          area,
          remarks,
          shift_start,
          shift_end,
          working_days,
        ]
      );
      await runQuery(
        `UPDATE employer_subscription SET remaining_jobs = GREATEST(remaining_jobs - 1, 0)  WHERE id = ?`,
        [latestPlanId]
      );

      await benefits.map((x) => {
        const insertQuery = "INSERT INTO job_benefits (jobID, employerID, benefitID, created_at) VALUES (?, ?, ?, NOW())";
        runQuery(insertQuery, [data.insertId, employerID, x]);
      })

      const employer = await runQuery(`select * from employer_user where employerID = ? `, [employerID]);
      await runQuery(`INSERT INTO cron_job_mail set jobID=?, catID=?, status=?`, [
        data.insertId,
        catID,
        employer[0]?.info_verified ? "waiting" : "pending",
      ]);
      const htmlBody = JobPostTemplate(job_title);
      await sendMail(employer[0]?.email, "New Job Post", htmlBody);
      if (activePlan?.remaining_jobs <= 1) {
        const plan = await runQuery(`select * from emp_packages where id = ? `, [activePlan?.packID]);
        const htmlBody = RemainingJobTemplate(plan[0]?.name);
        await sendMail(employer[0]?.email, "No Remaining Job", htmlBody);
      }
      return sendSuccess(res, { data: [{ job_id: data.insertId }], message: "Job has been post successfully..." });
    }
  } catch (error) {
    console.log(error);
    if (error.code == "ER_BAD_NULL_ERROR") {
      return sendError(res, { message: "Somethin went wrong..." });
    }
    return sendError(res, { message: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    // console.log(jobId)
    // return true

    let salary_u = getSalaryType(req.body.salary_type, req.body.min_salary, req.body.max_salary);
    const {
      employerID:emp_id,
      catID,
      functionID,
      job_title,
      no_of_requirement,
      state,
      city,
      job_type,
      job_level,
      min_experience,
      max_experience,
      experience_unit,
      qualification,
      job_description,
      doc_required,
      job_designation,
      min_salary,
      max_salary,
      salary_type,
      salary_unit,
      selection_process,
      process_location,
      process_state,
      process_city,
      area,
      remarks,
      shift_start,
      shift_end,
      working_days,
      benefits,
    } = req.body;

    if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })

    const employerID = await getEmployerIdByEnyId(emp_id)
    if (!employerID) return sendError(res, { message: 'Invalid Institute ID' })

    let updateQuery = `UPDATE jobs SET `;
    let updateValues = [];
    let conditions = [];
    let updatedFields = [];

    if (remarks) {
      updateValues.push(`remarks=?`);
      updatedFields.push(remarks);
    }

    if (!benefits) {
      return sendError(res, { message: "Please select job benefits..." });
    }

    if (!catID) {
      return sendError(res, { message: "Please select the Cat..." });
    } else {
      updateValues.push(`catID=?`);
      updatedFields.push(catID);
    }
    if (!functionID) {
      return sendError(res, { message: "Please enter your Subject..." });
    } else {
      updateValues.push(`functionID=?`);
      updatedFields.push(functionID);
    }

    if (!job_title) {
      return sendError(res, { message: "Please select the job title..." });
    } else {
      updateValues.push(`job_title=?`);
      updatedFields.push(job_title);
    }

    if (!no_of_requirement) {
      return sendError(res, { message: "Please enter the no of requirement..." });
    } else {
      updateValues.push(`no_of_requirement=?`);
      updatedFields.push(no_of_requirement);
    }

    if (!city) {
      return sendError(res, { message: "Please select the city..." });
    } else {
      updateValues.push(`city=?`);
      updatedFields.push(city);
    }
    if (!state) {
      return sendError(res, { message: "Please select the state..." });
    } else {
      updateValues.push(`state=?`);
      updatedFields.push(state);
    }

    if (!job_type) {
      return sendError(res, { message: "Please select the job type..." });
    } else {
      updateValues.push(`job_type=?`);
      updatedFields.push(job_type);
    }
    if (!job_level) {
      return sendError(res, { message: "Please select the job level..." });
    } else {
      updateValues.push(`job_level=?`);
      updatedFields.push(job_level);
    }

    if (parseInt(min_salary) < 1 || !min_salary) {
      return sendError(res, { message: "Please provide the minimum salary 1.." });
    } else if (parseInt(max_salary) > 9900000 || !max_salary) {
      return sendError(res, { message: "Please enter below the salary range 99 lakh.." });
    } else if (parseInt(max_salary) < parseInt(min_salary)) {
      return sendError(res, { message: "Please enter valid salary range..." });
    } else {
      updateValues.push(`min_salary=?`);
      updatedFields.push(min_salary);

      updateValues.push(`max_salary=?`);
      updatedFields.push(max_salary);
    }

    if (!experience_unit) {
      return sendError(res, { message: "Please select the Experience Unit..." });
    } else {
      updateValues.push(`experience_unit=?`);
      updatedFields.push(experience_unit);
    }

    if (!qualification) {
      return sendError(res, { message: "Please provide qualification..." });
    } else {
      updateValues.push(`qualification=?`);
      updatedFields.push(qualification);
    }

    if (!job_description) {
      return sendError(res, { message: "Please provide job description..." });
    } else {
      updateValues.push(`job_description=?`);
      updatedFields.push(job_description);
    }

    if (job_designation) {
      updateValues.push(`job_designation=?`);
      updatedFields.push(job_designation);
    }

    if (!salary_type) {
      return sendError(res, { message: "Please provide salary type..." });
    } else {
      updateValues.push(`salary_type=?`);
      updatedFields.push(salary_type);
    }

    if (!selection_process) {
      return sendError(res, { message: "Please provide selection process..." });
    } else {
      updateValues.push(`selection_process=?`);
      updatedFields.push(selection_process);
    }
    if (process_location) {
      updateValues.push(`process_location=?`);
      updatedFields.push(process_location);
    }
    if (process_state) {
      updateValues.push(`process_state=?`);
      updatedFields.push(process_state);
    }
    if (process_city) {
      updateValues.push(`process_city=?`);
      updatedFields.push(process_city);
    }
    if (area) {
      updateValues.push(`area=?`);
      updatedFields.push(area);
    }
    if (!doc_required) {
      return sendError(res, { message: "Please provide required doc..." });
    } else {
      updateValues.push(`doc_required=?`);
      updatedFields.push(doc_required);
    }

    if (min_experience > max_experience) {
      return sendError(res, { message: "Please select the valid experience..." });
    } else if (!max_experience || !min_experience) {
      return sendError(res, { message: "Please provide the experience range..." });
    } else {
      updateValues.push(`min_experience=?`);
      updatedFields.push(min_experience);

      updateValues.push(`max_experience=?`);
      updatedFields.push(max_experience);
    }

    updateValues.push(`salary_unit=?`);
    updatedFields.push(salary_u);

    updateValues.push(`shift_start=?`);
    updatedFields.push(shift_start);

    updateValues.push(`shift_end=?`);
    updatedFields.push(shift_end);

    updateValues.push(`working_days=?`);
    updatedFields.push(working_days);

    conditions.push(`jobID = ?`);
    updatedFields.push(jobId);
    updateQuery += updateValues.join(", ");
    updateQuery += " WHERE " + conditions.join(" AND ");
    if (updateValues.length == 0)
      return sendError(res, { message: "Please provide the atleast one field to update..." });
    const updateSuccess = await runQuery(updateQuery, updatedFields);
    if (updateSuccess.affectedRows == 0) {
      return sendError(res, { message: "record not found." });
    }

    await runQuery("DELETE FROM job_benefits WHERE employerID = ?", [employerID]);

    await benefits.map((x) => {
      const insertQuery = "INSERT INTO job_benefits (jobID, employerID, benefitID, created_at) VALUES (?, ?, ?, NOW())";
      runQuery(insertQuery, [jobId, employerID, x]);
    })


    const employer = await runQuery(`select * from employer_user where employerID = ? `, [employerID]);
    const jobCron = await runQuery(`select 1 from cron_job_mail where jobID = ?`, [jobId]);
    if (jobCron?.length == 0) {
      await runQuery(`INSERT cron_job_mail SET catID = ?, status = ?, jobID = ?`, [
        catID,
        employer[0]?.info_verified ? "waiting" : "pending",
        jobId,
      ]);
    } else {
      await runQuery(`UPDATE cron_job_mail SET catID = ?, status = ? WHERE jobID = ?`, [
        catID,
        employer[0]?.info_verified ? "waiting" : "pending",
        jobId,
      ]);
    }
    return sendSuccess(res, { message: "Job has been updated successfully..." });
  } catch (error) {
    if (error.code == "ER_NO_REFERENCED_ROW") {
      return sendError(res, { message: "Kindly ensure thorough review of the form for accuracy and completeness." });
    }
    return sendError(res, { message: error.message });
  }
};

//done by anuj
exports.jobList = async ({ query, body: { inst_id:emp_id } }, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      subject,
      from_date,
      to_date,
      order_by = "created_at",
      order_type = "DESC",
    } = query;
    if (!emp_id) {
      return res.status(400).json({ status: false, message: "Employer ID is required." });
    }

    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    const pageSize = Number(limit) || 20;
    const offset = (Number(page) - 1) * pageSize;
    let raw_query = `SELECT 
     jobs.*, 
     COUNT(t_app.applyID) AS total_application, 
     SUM(CASE WHEN t_app.status = 'Applied' THEN 1 ELSE 0 END) AS total_new_application,
SUM(CASE WHEN (t_app.status = 'Applied' OR t_app.status = 'Reviewed By FPS' OR t_app.status = 'Resume Reviewed') THEN 1 ELSE 0 END) AS total_inactive_application,
     SUM(CASE WHEN t_app.interview_date >= CURDATE() AND t_app.status = 'Interview scheduled' THEN 1 ELSE 0 END) AS total_schedual_interview
 FROM jobs LEFT JOIN applied_jobs AS t_app ON t_app.jobID = jobs.jobID WHERE jobs.employerID = ?`;
    let filter_query = "";
    const values = [inst_id];
    if (search) {
      filter_query += ` AND jobs.job_title LIKE ?`;
      values.push(`%${search}%`);
    }
    if (category) {
      filter_query += ` AND jobs.catID= ?`;
      values.push(category);
    }
    if (subject) {
      filter_query += ` AND jobs.functionID= ?`;
      values.push(subject);
    }
    if (status) {
      filter_query += ` AND jobs.status= ?`;
      values.push(status);
    }
    if (from_date && to_date) {
      filter_query += ` AND date(jobs.created_at) BETWEEN ? AND ?`;
      values.push(from_date, to_date);
    }
    const validOrderByFields = ["created_at", "job_title", "status"];
    const validOrderType = ["ASC", "DESC"];
    const orderByField = validOrderByFields.includes(order_by) ? order_by : "created_at";
    const orderByType =
      validOrderByFields.includes(order_by) && validOrderType.includes(order_type) ? order_type : "DESC";
    let statusOrder = "";
    if (order_by == "status") {
      statusOrder = ", jobs.created_at DESC";
    }
    let main_query =
      raw_query + filter_query + ` GROUP BY jobs.jobID ORDER BY jobs.${orderByField} ${orderByType}${statusOrder}`;
    main_query += ` LIMIT ? OFFSET ?`;
    const jobs = await runQuery(main_query, [...values, parseInt(pageSize), offset]);
    const totalJobsCount = await runQuery(
      "SELECT COUNT(*) AS total FROM jobs as jobs WHERE jobs.employerID = ?" + filter_query,
      values
    );
    const totalJobs = totalJobsCount[0].total;

    for (const value of jobs) {
      value.employerID = replaceEmployerID('employerID',emp_id,inst_id); 
    }
    
    return sendPaginationSuccess(res, { data: jobs, total_data: totalJobs, message: "Job list..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.jobDetails = async ({ params: { jobId } }, res) => {
  try {
    const jobData = await runQuery(
      `SELECT jobs.*, emp_user.name as emp_name, emp_user.emp_eny_id as emp_eny_id, cat.category as cat_name, fun.function as fun_name FROM 
        jobs LEFT join employer_user as emp_user on jobs.employerID = emp_user.employerID LEFT JOIN tbl_categories as cat on jobs.catID = cat.ID 
        LEFT join tbl_functions as fun on jobs.functionID = fun.ID WHERE jobs.jobID =? `,
      [jobId]
    );

    const benefits = await runQuery(
      `SELECT title FROM benefits LEFT JOIN job_benefits ON benefits.id = job_benefits.id WHERE jobID = ?`,
      [jobId]
    );

   
    if (jobData.length > 0) {
      jobData[0].benefits = benefits.map((benefit) => benefit.title); 
      jobData[0].employerID = replaceEmployerID('employerID', jobData[0].emp_eny_id, jobData[0].employerID); 
    }

    return sendSuccess(res, { data: [jobData[0]], message: "Job details..." }); 
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};


// exports.jobDetails = async ({ body: { inst_id }, params: { jobId } }, res) => {
//     try {
//         const jobData = await runQuery(`select *,j.city_id,j.state_id from jobs j join cities c on c.city_id = j.city_id join states s on s.state_id=c.state_id
//         join institutions inst on j.inst_id = inst.inst_id left join board_level bl on j.bl_id=bl.bl_id where job_id=? and j.inst_id=?`, [jobId, inst_id])
//         if (jobData.length > 0) {
//             const questins = await runQuery(`select * from job_screening_questions where job_id=? and is_ques_delete = ?`, [jobId, "0"])
//             jobData[0]['screen_questions'] = questins
//             const applications = await runQuery(`select ja.apl_id, ja.apl_viewed,u.u_full_name name ,ur.resume_original_name resume, ja.apl_date
//             date,ur.rs_id, u.* from job_applications ja join users u on ja.u_id=u.u_id join users_resume ur on ja.rs_id=ur.rs_id where ja.job_id = ?`, [jobId])
//             jobData[0]['applications'] = applications
//         }
//         await Promise.all(jobData.map(async (item) => {
//             const imagePath = `${InstituteLOGO}/${item.inst_logo}`;
//             const image = await fs.promises.readFile(imagePath);
//             item.inst_logo = image.toString('base64');
//         }));
//         return sendSuccess(res, { data: jobData, message: "Job details..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.applicationDetail = async ({ params: { job_id,apl_id } }, res) => {
//     try {
//         const jobData = await runQuery(`SELECT jobs.*, emp_user.name as emp_name, cat.category as cat_name, fun.function as fun_name FROM
//         jobs LEFT join employer_user as emp_user on jobs.employerID = emp_user.employerID LEFT JOIN tbl_categories as cat on jobs.catID = cat.ID
//         LEFT join tbl_functions as fun on jobs.functionID = fun.ID WHERE jobs.jobID =? `, [job_id])
//         const data = await runQuery(`SELECT * FROM applied_jobs WHERE applyID = ?`, [job_id, apl_id])

//         console.log(data);
//         // if (data.length > 0) {
//         //     const quesAns = await runQuery(`select * from job_screening_questions_response jsqr join job_screening_questions jsq on jsqr.ques_id=jsq.ques_id where jsqr.apl_id=?`, [apl_id])
//         //     data[0].screening_answer = quesAns
//         //     await runQuery(`update job_applications set apl_viewed=? where apl_id=?`, [1, apl_id])
//         // }
//         return sendSuccess(res, { jobData:jobData,data: data, message: "Application details..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

exports.applicationDetail = async ({ params: { job_id, apl_id } }, res) => {
  try {
    const [jobDetails, application] = await Promise.all([
      runQuery(
        `SELECT jobs.*, emp_user.name as emp_name, cat.category as cat_name, fun.function as fun_name FROM 
                     jobs LEFT join employer_user as emp_user on jobs.employerID = emp_user.employerID LEFT JOIN tbl_categories as cat on jobs.catID = cat.ID 
                     LEFT join tbl_functions as fun on jobs.functionID = fun.ID WHERE jobs.jobID =?`,
        [job_id]
      ),
      runQuery(`SELECT * FROM applied_jobs WHERE applyID = ?`, [apl_id]),
    ]);

    const jobData = await Promise.all(
      jobDetails.map(async (job) => {
          const employerId = await replaceEmployerID('employerID', null, job.employerID);
          return {
              ...job,
              employerID: employerId,
          };
      })
    );
    
    const applicationData = await Promise.all(
      application.map(async (user) => {
          const faculityID = await replaceFacultyID('faculityID', null, user.faculityID);
          return {
              ...user,
              faculityID: faculityID,
          };
      })
    );
    
    const responseData = {
      jobDetails: jobData, // Assuming only one user is returned
      application: applicationData, // Assuming only one employer detail is returned
    };

    return sendSuccess(res, { data: responseData, message: "Profile..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.screenQuestion = async (req, res) => {
  const { jobID } = req.params;
  try {
    let query = `select * from job_screening_questions WHERE is_deleted = 0 AND jobID = ?`;
    const question = await runQuery(query, [jobID]);
    return sendSuccess(res, { data: question, message: "Question list for job..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.addScreenQuestion = async (req, res) => {
  try {
    const { jobID, question, type, options, required = 0 } = req.body;
    if (!jobID) {
      return sendError(res, { message: "Please select the job..." });
    } else if (!question) {
      return sendError(res, { message: "Please enter the question..." });
    } else if (!QUESTIONS_TYPE.includes(type)) {
      return sendError(res, { message: "Please select the valid question type..." });
    } else if (!options && type == "Single Choice") {
      return sendError(res, { message: "Please provide options..." });
    } else if (options && !Array.isArray(options)) {
      return sendError(res, { message: "Please provide valid the question options array..." });
    } else {
      await runQuery(`insert into job_screening_questions set question=?, type=?, options=?, required=? ,jobID=?`, [
        question,
        type,
        options ? JSON.stringify(options) : undefined,
        required,
        jobID,
      ]);
      return sendSuccess(res, { message: "Question is addedd successfully..." });
    }
  } catch (error) {
    if (error.code == "ER_NO_REFERENCED_ROW_2") {
      return sendError(res, { message: "Please select the valid job..." });
    } else if (error.code == "ER_INVALID_JSON_TEXT") {
      return sendError(res, { message: "Please provide the valid options.." });
    } else {
      return sendError(res, { message: error.message });
    }
  }
};
exports.updateScreeningQuestion = async (
  { params: { ques_id }, body: { question, type, options, required, is_deleted } },
  res
) => {
  try {
    let query = `update job_screening_questions set`;
    const values = [];
    const updateFields = [];
    if (type == "Single Choice" && (!options || !Array.isArray(options))) {
      return sendError(res, { message: "Please provide the valid options.." });
    }
    if (question) {
      updateFields.push("question = ?");
      values.push(question);
    }
    if (type) {
      if (QUESTIONS_TYPE.includes(type)) {
        updateFields.push("type = ?");
        values.push(type);
        /* if (QUESTIONS_TYPE == "Text") {
          updateFields.push("options = ");
        } */
      } else {
        return sendError(res, { message: "Please select the valid question type..." });
      }
    }
    if ([0, 1].includes(required)) {
      updateFields.push("required = ?");
      values.push(required);
    }
    if (type == "Single Choice" && options && Array.isArray(options)) {
      updateFields.push("options = ?");
      values.push(JSON.stringify(options));
    }
    query += ` ${updateFields.join(", ")} where id = ?`;
    values.push(ques_id);
    await runQuery(query, values);
    return sendSuccess(res, { message: "Question has been updated successfully..." });
  } catch (error) {
    if (error.code == "ER_PARSE_ERROR") {
      return sendError(res, { message: "Pass atleast one field for update..." });
    } else if (error.code == "WARN_DATA_TRUNCATED") {
      return sendError(res, { message: "Select valid question type..." });
    }
    return sendError(res, { message: error.message });
  }
};
exports.deleteScreenQuestion = async ({ params: { ques_id } }, res) => {
  try {
    let query = `update job_screening_questions set is_deleted = ? where id = ?`;
    await runQuery(query, [1, ques_id]);
    return sendSuccess(res, { message: "Question has been deleted successfully..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.jobsHistory = async ({ query: { status, page = 1 }, body: { inst_id: emp_id } }, res) => {
  try {
    if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    let query = `select *,c.city_name,s.state_name from jobs j join cities c on j.city_id= c.city_id join states s on j.state_id=s.state_id where inst_id = ?`;
    const values = [inst_id];
    if (status == "Open" || status == "Closed") {
      query += ` and job_status = ?`;
      values.push(status);
    }
    query += ` LIMIT ? OFFSET ?`;
    values.push(parseInt(pageSize), offset);
    const data = await runQuery(query, values);
    data.employerID = replaceEmployerID('employerID',emp_id,inst_id); 

    return sendSuccess(res, { data: data, message: "All jobs profiles.." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.processApplication = async ({ body: updateData, params: params }, res) => {
  try {
    const keyMap = {
      application_view: "apl_viewed",
      application_status: "apl_status",
      application_screening_status: "apl_screen_status",
      application_interview_status: "apl_interview_status",
      application_offer_status: "apl_offer_status",
    };
    const revKeyMap = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]));

    const objectEntries = Object.entries(updateData);
    if (objectEntries.length !== 3) {
      return sendError(res, { message: "Please update only one field..." });
    }
    const columnsToUpdate = objectEntries.map(([key]) => keyMap[key]).filter(Boolean);
    if (columnsToUpdate.length !== 1) {
      return sendError("Please update valid field...");
    }

    const setClause = columnsToUpdate.map((column) => `${column} = ?`).join(", ");
    const updateQuery = `UPDATE job_applications SET ${setClause} WHERE apl_id = ?`;
    const valuesToUpdate = columnsToUpdate.map((column) => updateData[revKeyMap[column]]);
    valuesToUpdate.push(params.apl_id);
    if (
      APPLICATION_STATUS.includes(valuesToUpdate[0]) ||
      APPLICATION_SCREENING_STATUS.includes(valuesToUpdate[0]) ||
      APPLICATION_INTERVIEW_STATUS.includes(valuesToUpdate[0]) ||
      APPLICATION_OFFER_STATUS.includes(valuesToUpdate[0])
    ) {
      await runQuery(updateQuery, valuesToUpdate);
      return sendSuccess(res, { message: "Process successfully..." });
    } else {
      return sendError(res, { message: "Please select the valid status..." });
    }
  } catch (error) {
    if (error.code == "ER_BAD_FIELD_ERROR") {
      return sendError(res, { message: "Please provide the valid status..." });
    }
    return sendError(res, { message: error.message });
  }
};

exports.boardLevel = async (req, res) => {
  try {
    const data = await runQuery(`select * from job_level where status = ?`, [1]);
    return sendSuccess(res, { data: data, message: "Board level..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.updateCandidateStatus = async (req, res) => {
  try {
    const { applyID, new_status } = req.body;
    const appliedData = await runQuery(
      `SELECT applied_jobs.faculityID, jobs.catID, jobs.job_title, jobs.jobID, applied_jobs.status FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE applyID = ?`,
      [applyID]
    );
    if (appliedData.length == 0) {
      return sendError(res, { code: 400, message: "Applied Id not matched" });
    }
    const validStatus = await runQuery(`SELECT label FROM interview_steps WHERE CID = ? AND label = ?`, [
      appliedData?.[0]?.catID,
      new_status,
    ]);
    if (validStatus.length == 0) {
      return sendError(res, { code: 400, message: "Invalid status." });
    }
    // Update candidate status in applied_jobs table
    const updateQuery = `UPDATE applied_jobs SET status = ? WHERE applyID = ?`;
    await runQuery(updateQuery, [new_status, applyID]);
    const all_setps = await runQuery(
      `SELECT label, priority FROM interview_steps WHERE CID = ? ORDER BY priority ASC`,
      [appliedData?.[0]?.catID]
    );
    const endIndex = (all_setps.findIndex((step) => step?.label == new_status) || 0) + 1;
    const filteredSteps = all_setps.slice(0, endIndex);
    filteredSteps?.length > 0 && (await runQuery(`DELETE FROM applied_status_log WHERE applied_id = ?`, [applyID]));
    for (const step of filteredSteps) {
      const updateAppliedStatusLog = `INSERT INTO applied_status_log (applied_id, jobID, user_id, status) VALUES(?, ?, ?, ?)`;
      await runQuery(updateAppliedStatusLog, [
        applyID,
        appliedData[0]?.jobID,
        appliedData[0]?.faculityID,
        step?.label,
      ]);
    }
    const faculityData = await runQuery("SELECT * FROM faculity_users WHERE faculityID = ?", [
      appliedData[0]?.faculityID,
    ]);
    if (appliedData[0]?.status != new_status) {

      let notificationMesssage = notificationMesssage(new_status)
      faculityData[0]?.regToken &&
        sendNotificationToFaculity(faculityData[0]?.regToken, {
          title: new_status,
          body: `Your applied job status change from ${appliedData[0]?.status} to ${new_status}`,
        });
      const htmlBody = ApplyStatusChangeTemplate({ from: appliedData[0]?.status, to: new_status });
      await employerApplyStatus(appliedData[0], faculityData[0], new_status);
    }
    return sendSuccess(res, { message: "Candidate status updated successfully." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.createSheduledInteview = async (req, res) => {
  try {
    const { inst_id, apply_id, date = "", time = "", event_type, interviewer, note } = req.body;
    const ValidEventType = ["On Site Interview", "Zoom", "Call", "Google Meet"];
    if (!apply_id) {
      return sendError(res, { message: "Please enter apply_id..." });
    } else if (!event_type) {
      return sendError(res, { message: "Please select event_type..." });
    } else if (!ValidEventType.includes(event_type)) {
      return sendError(res, { message: "Invalid event type." });
    } else if (!interviewer) {
      return sendError(res, { message: "Please enter interviewer..." });
    } else if (!note) {
      return sendError(res, { message: "Please enter the note..." });
    }
    const appliedData = await runQuery(
      `SELECT applied_jobs.*, jobs.catID FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE applyID = ?`,
      [apply_id]
    );
    if (appliedData?.length == 0) {
      return sendError(res, { message: "record not found..." });
    }
    const employer = await runQuery(`SELECT name FROM employer_user WHERE employerID = ?`, [inst_id]);
    const jobData = await runQuery(`SELECT job_title FROM jobs WHERE jobID = ?`, [appliedData[0].jobID]);
    if (jobData?.length == 0) {
      return sendError(res, { message: "Job not found..." });
    }
    const newTitle = employer[0]?.name + " in " + jobData[0]?.job_title;
    const alreadyExistSchedual = await runQuery(
      `SELECT 1 FROM manual_sheduled_job WHERE candidate_id = ? AND jobID = ?`,
      [appliedData[0].faculityID, appliedData[0].jobID]
    );
    if (alreadyExistSchedual?.length > 0) {
      await runQuery(
        "Update manual_sheduled_job set title = ?, date = ?, time = ?, event_type = ?, event_host = ?, interviewer = ?, note = ?, created_at = NOW() WHERE candidate_id = ? AND jobID = ?",
        [
          newTitle,
          date,
          time,
          event_type,
          employer[0]?.name,
          interviewer,
          note,
          appliedData[0].faculityID,
          appliedData[0].jobID,
        ]
      );
    } else {
      const insertQuery =
        "INSERT INTO manual_sheduled_job (candidate_id, employeeId, jobID, title, date, time, event_type, event_host, interviewer, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ? , ?, ?, NOW())";
      await runQuery(insertQuery, [
        appliedData[0].faculityID,
        inst_id,
        appliedData[0].jobID,
        newTitle,
        date,
        time,
        event_type,
        employer[0]?.name,
        interviewer,
        note,
      ]);
    }
    await runQuery("Update applied_jobs set status = ? , interview_date = ? WHERE applyID = ?", [
      "Interview scheduled",
      date,
      apply_id,
    ]);
    const all_setps = await runQuery(
      `SELECT label, priority FROM interview_steps WHERE CID = ? ORDER BY priority ASC`,
      [appliedData?.[0]?.catID]
    );
    const endIndex = (all_setps.findIndex((step) => step?.label == "Interview scheduled") || 0) + 1;
    const filteredSteps = all_setps.slice(0, endIndex);
    filteredSteps?.length > 0 && (await runQuery(`DELETE FROM applied_status_log WHERE applied_id = ?`, [apply_id]));
    for (const step of filteredSteps) {
      const updateAppliedStatusLog = `INSERT INTO applied_status_log (applied_id, jobID, user_id, status) VALUES(?, ?, ?, ?)`;
      await runQuery(updateAppliedStatusLog, [
        apply_id,
        appliedData[0]?.jobID,
        appliedData[0]?.faculityID,
        step?.label,
      ]);
    }
    const faculityData = await runQuery("SELECT * FROM faculity_users WHERE faculityID = ?", [
      appliedData[0]?.faculityID,
    ]);
    faculityData[0]?.regToken &&
      sendNotificationToFaculity(faculityData[0]?.regToken, {
        title: "Interview scheduled",
        body: `your interview schedual on Date: ${date}, Time:${time}`,
      });
    const htmlBody = InterviewSchedualTemplate({ date: date, time: time });
    await sendMail(faculityData[0]?.email, "Interview schedual info", htmlBody);
    return sendSuccess(res, { message: "Sheduled job successfully." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.getSheduledInteviewList = async ({ query, body }, res) => {
  try {
    const { inst_id : emp_id} = body;

    if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    const { page = 1, limit = 20, search } = query;
    const pageSize = Number(limit) || 20;
    const offset = (Number(page) - 1) * pageSize;
    let raw_query = `SELECT 
    applied_jobs.*, 
    jobs.catID,
    jobs.job_title as job_title,
    jobs.slug as job_slug,
    jobs.catID as job_catID,
    jobs.functionID as job_functionID,
    jobs.state as job_state,
    jobs.city as job_city,
    jobs.job_type as job_type,
    jobs.job_level as job_level,
    jobs.min_experience as job_min_experience,
    jobs.max_experience as job_max_experience,
    jobs.experience_unit as job_experience_unit,
    jobs.medium as job_medium,
    jobs.qualification as job_qualification,
    jobs.job_description as job_job_description,
    jobs.doc_required as job_doc_required,
    jobs.job_designation as job_doc_required,
    jobs.no_of_requirement as job_doc_required,
    jobs.min_salary as job_min_salary,
    jobs.max_salary as job_max_salary,
    jobs.salary_type as job_salary_type,
    jobs.salary_unit as job_salary_unit,
    jobs.selection_process as job_selection_process,
    jobs.process_location as job_doc_required,
    jobs.process_state as job_process_state,
    jobs.process_city as job_area,
    jobs.area as job_area,
    jobs.featured as job_featured,
    jobs.meta_title as job_meta_title,
    jobs.meta_description as job_meta_description,
    jobs.meta_keywords as job_meta_keywords,
    jobs.og_title as job_og_title,
    jobs.og_description as job_og_description,
    jobs.og_keywords as job_og_keywords,
    jobs.livedemo as job_livedemo,
    jobs.onlinetest as job_onlinetest,
    jobs.openstatus as job_is_delete,
    jobs.is_delete as job_is_delete,
    jobs.status as job_status,
    jobs.job_session as job_session,
    jobs.job_orderid as job_session,
    jobs.views as job_views,
    jobs.remarks as job_remarks,
    latest_manual_scheduled_job.title AS m_interview_title,
    latest_manual_scheduled_job.date AS m_interview_date, 
    latest_manual_scheduled_job.time AS m_interview_time,
    latest_manual_scheduled_job.event_type AS m_interview_event_type,
    latest_manual_scheduled_job.event_host AS m_interview_event_host, 
    latest_manual_scheduled_job.interviewer AS m_interview_interviewer, 
    latest_manual_scheduled_job.note AS m_interview_note, COALESCE(
      CONCAT(
          '[',
          GROUP_CONCAT(
            DISTINCT CONCAT(
                  '{"label": "', interview_steps.label, '", "priority": ', interview_steps.priority, '}'
              ) ORDER BY interview_steps.priority ASC SEPARATOR ','
          ),
          ']'
      ),
      '[]'
  ) AS interview_steps, CASE WHEN favourite_faculity.jobID IS NOT NULL THEN 1 ELSE 0 END AS favourite, faculity_users.status as faculity_status, faculity_users.work_status, faculity_users.packID, faculity_users.packsubid, faculity_users.premium, faculity_users.name, faculity_users.personal_lname, faculity_users.email, faculity_users.mobile, faculity_users.gender, faculity_users.country_code,faculity_users.alternate_contact,	faculity_users.dob, faculity_users.device_type, faculity_users.state, faculity_users.city, faculity_users.language, faculity_users.skill, faculity_users.job_function, faculity_users.industry_type, faculity_users.qualification, faculity_users.university, faculity_users.passing_year, faculity_users.experience, faculity_users.month_experience, faculity_users.salary, faculity_users.current_employer, faculity_users.current_start_year, faculity_users.current_start_month, faculity_users.last_employer, faculity_users.last_duration_start_year, faculity_users.last_duration_start_month, faculity_users.last_duration_end_year	, faculity_users.last_duration_end_month, faculity_users.image, faculity_users.created_by, faculity_users.duration_notice_period, faculity_users.nopack_noti, faculity_users.cv_doc, faculity_users.salary_slip, faculity_users.current_drawn_salary, faculity_users.expected_salary, faculity_users.update_status, faculity_users.video, faculity_users.emailverify, faculity_users.demolecture, faculity_users.call_note, faculity_users.remarks, faculity_users.extra_note, faculity_users.remarksAdded, faculity_users.selectedEmployer, faculity_users.selectedJoiningDate, faculity_users.selectedPackage, faculity_users.teachingLevel, faculity_users.otherTeachingLevel, faculity_users.lat, faculity_users.lon, faculity_users.location, faculity_users.ip_address FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID LEFT JOIN favourite_faculity ON applied_jobs.faculityID = favourite_faculity.faculityID AND applied_jobs.jobID = favourite_faculity.jobID LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID LEFT JOIN interview_steps ON interview_steps.CID = jobs.catID LEFT JOIN 
  manual_sheduled_job AS latest_manual_scheduled_job 
ON applied_jobs.faculityID = latest_manual_scheduled_job.candidate_id AND applied_jobs.status = "Interview scheduled"
AND applied_jobs.jobID = latest_manual_scheduled_job.jobID 
AND latest_manual_scheduled_job.id = (
    SELECT MAX(id) 
    FROM manual_sheduled_job 
    WHERE candidate_id = applied_jobs.faculityID 
    AND jobID = applied_jobs.jobID
) WHERE applied_jobs.status = 'Interview scheduled' AND jobs.employerID = ?`;
    let filter_query = "";
    const values = [inst_id];
    if (search) {
      filter_query += " AND faculity_users.name LIKE ?";
      values.push(`%${search}%`);
    }

    let main_query = raw_query + filter_query + ` GROUP BY applied_jobs.applyID ORDER BY applied_jobs.created_at`;
    main_query += ` LIMIT ? OFFSET ?`;
    const candiateList = await runQuery(main_query, [...values, parseInt(pageSize), offset]);
    const newList = candiateList.map(async (ele) => {
      const faculityID = await replaceFacultyID('faculityID', null, ele?.faculityID);
      return {
        ...ele,
        faculityID:faculityID,
        cv_doc:
          (ele?.cv_doc &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc}`
            : "",
        image:
          (ele?.image &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image}`
            : "",
        interview_steps: ele.interview_steps ? JSON.parse(ele.interview_steps) : [],
      };
    });
    const totalCandidateCount = await runQuery(
      `SELECT COUNT(*) AS total FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE applied_jobs.status = 'Interview scheduled' AND jobs.employerID = ?` +
      filter_query,
      values
    );
    const totalCandidate = totalCandidateCount[0].total;
    return sendPaginationSuccess(res, {
      data: newList,
      total_data: totalCandidate,
      message: "Interview Schedual for job",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.appliedCandidateList = async ({ query, params }, res) => {
  try {
    const { jobId } = params;
    const {
      page = 1,
      limit = 20,
      min_age,
      max_age,
      language,
      min_salary,
      max_salary,
      search,
      min_batch,
      max_batch,
      location,
      preferred_location,
      current_organization,
      job_function,
      qualification,
      institute,
      duration_notice_period,
      min_experience,
      max_experience,
      industry_type,
      teaching_level,
      application_within_days,
      status,
    } = query;
    const pageSize = Number(limit) || 20;
    const offset = (Number(page) - 1) * pageSize;
    let raw_query = `SELECT applied_jobs.*, jobs.catID, latest_manual_scheduled_job.title AS m_interview_title,
    latest_manual_scheduled_job.date AS m_interview_date, 
    latest_manual_scheduled_job.time AS m_interview_time,
    latest_manual_scheduled_job.event_type AS m_interview_event_type,
    latest_manual_scheduled_job.event_host AS m_interview_event_host, 
    latest_manual_scheduled_job.interviewer AS m_interview_interviewer, 
    latest_manual_scheduled_job.note AS m_interview_note, COALESCE(
      CONCAT(
          '[',
          GROUP_CONCAT(
            DISTINCT CONCAT(
                  '{"label": "', interview_steps.label, '", "priority": ', interview_steps.priority, '}'
              ) ORDER BY interview_steps.priority ASC SEPARATOR ','
          ),
          ']'
      ),
      '[]'
  ) AS interview_steps, CASE WHEN favourite_faculity.jobID IS NOT NULL THEN 1 ELSE 0 END AS favourite, faculity_users.status as faculity_status, faculity_users.work_status, faculity_users.packID, faculity_users.packsubid, faculity_users.premium, faculity_users.name, faculity_users.personal_lname, faculity_users.email, faculity_users.mobile, faculity_users.gender, faculity_users.country_code,faculity_users.alternate_contact,	faculity_users.dob, faculity_users.device_type, faculity_users.state, faculity_users.city, faculity_users.language, faculity_users.skill, faculity_users.job_function, faculity_users.industry_type, faculity_users.qualification, faculity_users.university, faculity_users.passing_year, faculity_users.experience, faculity_users.month_experience, faculity_users.salary, faculity_users.current_employer, faculity_users.current_start_year, faculity_users.current_start_month, faculity_users.last_employer, faculity_users.last_duration_start_year, faculity_users.last_duration_start_month, faculity_users.last_duration_end_year	, faculity_users.last_duration_end_month, faculity_users.image, faculity_users.created_by, faculity_users.duration_notice_period, faculity_users.nopack_noti, faculity_users.cv_doc, faculity_users.salary_slip, faculity_users.current_drawn_salary, faculity_users.expected_salary, faculity_users.update_status, faculity_users.video, faculity_users.emailverify, faculity_users.demolecture, faculity_users.call_note, faculity_users.remarks, faculity_users.extra_note, faculity_users.remarksAdded, faculity_users.selectedEmployer, faculity_users.selectedJoiningDate, faculity_users.selectedPackage, faculity_users.teachingLevel, faculity_users.otherTeachingLevel, faculity_users.lat, faculity_users.lon, faculity_users.location, faculity_users.ip_address FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID LEFT JOIN favourite_faculity ON applied_jobs.faculityID = favourite_faculity.faculityID AND applied_jobs.jobID = favourite_faculity.jobID LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID LEFT JOIN interview_steps ON interview_steps.CID = jobs.catID LEFT JOIN 
  manual_sheduled_job AS latest_manual_scheduled_job 
ON applied_jobs.faculityID = latest_manual_scheduled_job.candidate_id
AND applied_jobs.status = "Interview scheduled"
AND applied_jobs.jobID = latest_manual_scheduled_job.jobID 
AND latest_manual_scheduled_job.id = (
    SELECT MAX(id) 
    FROM manual_sheduled_job 
    WHERE candidate_id = applied_jobs.faculityID 
    AND jobID = applied_jobs.jobID
) WHERE applied_jobs.jobID = ?`;
    /* let raw_query = `SELECT applied_jobs.*, CASE WHEN favourite_faculity.jobID IS NOT NULL THEN 1 ELSE 0 END AS favourite, faculity_users.status as faculity_status, faculity_users.work_status, faculity_users.packID, faculity_users.packsubid, faculity_users.premium, faculity_users.name, faculity_users.personal_lname, faculity_users.email, faculity_users.mobile, faculity_users.gender, faculity_users.country_code,faculity_users.alternate_contact,	faculity_users.dob, faculity_users.device_type, faculity_users.state, faculity_users.city, faculity_users.language, faculity_users.skill, faculity_users.job_function, faculity_users.industry_type, faculity_users.qualification, faculity_users.university, faculity_users.passing_year, faculity_users.experience, faculity_users.month_experience, faculity_users.salary, faculity_users.current_employer, faculity_users.current_start_year, faculity_users.current_start_month, faculity_users.last_employer, faculity_users.last_duration_start_year, faculity_users.last_duration_start_month, faculity_users.last_duration_end_year	, faculity_users.last_duration_end_month, faculity_users.image, faculity_users.created_by, faculity_users.duration_notice_period, faculity_users.nopack_noti, faculity_users.cv_doc, faculity_users.salary_slip, faculity_users.current_drawn_salary, faculity_users.expected_salary, faculity_users.update_status, faculity_users.video, faculity_users.emailverify, faculity_users.demolecture, faculity_users.call_note, faculity_users.remarks, faculity_users.extra_note, faculity_users.remarksAdded, faculity_users.selectedEmployer, faculity_users.selectedJoiningDate, faculity_users.selectedPackage, faculity_users.teachingLevel, faculity_users.otherTeachingLevel, faculity_users.lat, faculity_users.lon, faculity_users.location, faculity_users.ip_address FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID LEFT JOIN favourite_faculity ON applied_jobs.faculityID = favourite_faculity.faculityID AND applied_jobs.jobID = favourite_faculity.jobID WHERE applied_jobs.jobID = ?`;   */
    let filter_query = "";
    const values = [jobId];
    if (search) {
      filter_query += " AND faculity_users.name LIKE ?";
      values.push(`%${search}%`);
    }
    if (institute) {
      filter_query += " AND faculity_users.university LIKE ?";
      values.push(`%${institute}%`);
    }
    if (current_organization) {
      if (isArrayCheck(current_organization, "current_organization")) {
        if (JSON.parse(current_organization)?.length > 0) {
          filter_query += ` AND faculity_users.current_employer IN (?)`;
          values.push(JSON.parse(current_organization));
        }
      } else {
        return sendError(res, { message: "current_organization should be array..." });
      }
    }
    if (job_function) {
      if (isArrayCheck(job_function, "job_function")) {
        if (JSON.parse(job_function)?.length > 0) {
          filter_query += ` AND faculity_users.job_function IN (?)`;
          values.push(JSON.parse(job_function));
        }
      } else {
        return sendError(res, { message: "job_function should be array..." });
      }
    }
    if (qualification) {
      if (isArrayCheck(qualification, "qualification")) {
        if (JSON.parse(qualification)?.length > 0) {
          filter_query += ` AND faculity_users.qualification IN (?)`;
          values.push(JSON.parse(qualification));
        }
      } else {
        return sendError(res, { message: "qualification should be array..." });
      }
    }
    if (industry_type) {
      if (isArrayCheck(industry_type, "industry_type")) {
        if (JSON.parse(industry_type)?.length > 0) {
          filter_query += ` AND faculity_users.industry_type IN (?)`;
          values.push(JSON.parse(industry_type));
        }
      } else {
        return sendError(res, { message: "industry_type should be array..." });
      }
    }
    if (location) {
      if (isArrayCheck(location, "location")) {
        if (JSON.parse(location)?.length > 0) {
          filter_query += ` AND faculity_users.city IN (?)`;
          values.push(JSON.parse(location));
        }
      } else {
        return sendError(res, { message: "location should be array..." });
      }
    }
    if (preferred_location) {
      if (isArrayCheck(preferred_location, "preferred_location")) {
        if (JSON.parse(preferred_location)?.length > 0) {
          filter_query += ` AND faculity_users.city IN (?)`;
          values.push(JSON.parse(preferred_location));
        }
      } else {
        return sendError(res, { message: "preferred_location should be array..." });
      }
    }
    if (language) {
      if (isArrayCheck(language, "language")) {
        if (JSON.parse(language)?.length > 0) {
          filter_query += ` AND faculity_users.language IN (?)`;
          values.push(JSON.parse(language));
        }
      } else {
        return sendError(res, { message: "language should be array..." });
      }
    }
    if (teaching_level) {
      if (isArrayCheck(teaching_level, "teaching_level")) {
        if (JSON.parse(teaching_level)?.length > 0) {
          filter_query += ` AND faculity_users.teachingLevel IN (?)`;
          values.push(JSON.parse(teaching_level));
        }
      } else {
        return sendError(res, { message: "teaching_level should be array..." });
      }
    }
    if (min_batch && max_batch) {
      if (Number(min_batch || 0) < Number(max_batch || 0)) {
        filter_query += ` AND faculity_users.passing_year BETWEEN ? AND ?`;
        values.push(min_batch);
        values.push(max_batch);
      } else {
        return sendError(res, { message: "min_batch should be less than max_batch..." });
      }
    }
    if (min_age && max_age) {
      if (Number(min_age || 0) < Number(max_age || 0)) {
        filter_query += ` AND (DATEDIFF(CURRENT_DATE, DATE(faculity_users.dob)) / 365.25) BETWEEN ? AND ?`;
        values.push(Number(min_age));
        values.push(Number(max_age));
      } else {
        return sendError(res, { message: "min age should be less than max age..." });
      }
    }
    if (min_experience && max_experience) {
      if (Number(min_experience || 0) < Number(max_experience || 0)) {
        filter_query += ` AND faculity_users.experience BETWEEN ? AND ?`;
        values.push(min_experience);
        values.push(max_experience);
      } else {
        return sendError(res, { message: "min_experience should be less than max_experience..." });
      }
    }
    if (min_salary && max_salary) {
      if (Number(min_salary || 0) < Number(max_salary || 0)) {
        filter_query += ` AND faculity_users.expected_salary BETWEEN ? AND ?`;
        values.push(Number(min_salary));
        values.push(Number(max_salary));
      } else {
        return sendError(res, { message: "min_salary should be less than max_salary..." });
      }
    }
    if (duration_notice_period) {
      filter_query += ` AND applied_jobs.duration_notice_period = ?`;
      values.push(duration_notice_period);
    }
    if (application_within_days) {
      filter_query += ` AND applied_jobs.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)`;
      values.push(application_within_days);
    }
    /*  if (status) {
      filter_query += ` AND applied_jobs.status = ?`;
      values.push(status);
    } */
    if (status) {
      if (isArrayCheck(status, "status")) {
        if (JSON.parse(status)?.length > 0) {
          filter_query += ` AND applied_jobs.status IN (?)`;
          values.push(JSON.parse(status));
        }
      } else {
        return sendError(res, { message: "status should be array..." });
      }
    }

    let main_query = raw_query + filter_query + ` GROUP BY applied_jobs.applyID ORDER BY applied_jobs.updated_at DESC`;
    main_query += ` LIMIT ? OFFSET ?`;
    const candiateList = await runQuery(main_query, [...values, parseInt(pageSize), offset]);
    /*  https://admin.fpsjob.com/sources/upload/userAttachment/user116486/8e029d43306ba3406416e59da73ae37a.pdf */
    const newList = candiateList.map(async (ele) => {
      // const employerId = await replaceEmployerID('employerID', null, ele.employerID);
      const faculityID = await replaceFacultyID('faculityID', null, ele?.faculityID);
      return {
        ...ele,
        // employerId:employerId,
        faculityID:faculityID,
        cv_doc:
          (ele?.cv_doc &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc}`
            : "",
        image:
          (ele?.image &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image}`
            : "",
        interview_steps: ele.interview_steps ? JSON.parse(ele.interview_steps) : [],

      };
    });
    const totalCandidateCount = await runQuery(
      `SELECT COUNT(*) AS total FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID WHERE applied_jobs.jobID = ?` +
      filter_query,
      values
    );
    const totalCandidate = totalCandidateCount[0].total;
    return sendPaginationSuccess(res, {
      data: newList,
      total_data: totalCandidate,
      message: "Applied Candidate list for job...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.currentOrganizationList = async ({ params }, res) => {
  try {
    const { jobId } = params;
    let raw_query = `SELECT DISTINCT faculity_users.current_employer FROM applied_jobs LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID WHERE applied_jobs.jobID = ? AND faculity_users.current_employer IS NOT NULL AND faculity_users.current_employer <> ""`;
    const organizationList = await runQuery(raw_query, [jobId]);
    return sendSuccess(res, {
      data: organizationList,
      message: "organization list for job...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.appliedCandidateProfile = async ({ params: { applyId } }, res) => {
  try {
    const appliedJob = await runQuery(`SELECT * from applied_jobs where applyId = ?`, [applyId]);
    if (appliedJob?.length < 1) {
      return sendError(res, { code: 404, message: "No record found" });
    }
    const profile = await runQuery(
      `SELECT faculity_users.*, tbl_qualifications.qualification as qualification_text from faculity_users LEFT JOIN tbl_qualifications ON faculity_users.qualification = tbl_qualifications.ID where faculity_users.faculityID = ?`,
      [appliedJob[0]?.faculityID]
    );
    const basicInfo = await runQuery(`SELECT * from faculty_basic_info where 	fact_info_id  = ?`, [
      appliedJob[0]?.faculityID,
    ]);

    for (const value of basicInfo) {
      value.faculityID = replaceFacultyID('faculityID',faculty_id = null, basicInfo[0]?.faculityID); 
    }
  
    const newProfile = profile.map(async (ele) => {
      const faculityID = await replaceFacultyID('faculityID', null, ele?.faculityID);
      return {
        ...ele,
        faculityID:faculityID,
        cv_doc:
          (ele?.cv_doc &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc || ""}`
            )) == true
            ? ele?.cv_doc
            : "",
        image:
          (ele?.image &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image || ""}`
            )) == true
            ? ele?.image
            : "",
      };
    });
    return sendSuccess(res, {
      data: {
        candidateProfile: newProfile[0],
        candidateBasicInfo: basicInfo[0],
        appliedJob: appliedJob[0],
      },
      message: "Applied candidate profile...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.addToFavouriteJob = async (req, res) => {
  try {
    const { inst_id:emp_id, faculityID:faculty_id, jobID } = req.body; 

    if (!emp_id) {
      return sendError(res, { message: "Please enter institute id..." });
    } else if (!faculty_id) {
      return sendError(res, { message: "Please enter faculityID..." });
    } else if (!jobID) {
      return sendError(res, { message: "Please enter jobID..." });
    }
    
    const faculityID = await generateUserIdByEnyId(faculty_id)
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    const alreadyExist = await runQuery("SELECT * FROM favourite_faculity WHERE faculityID = ? AND jobID = ?", [
      faculityID,
      jobID,
    ]);
    if (alreadyExist?.length > 0) {
      return sendError(res, { message: "already added to favourite" });
    }
    const insertQuery =
      "INSERT INTO favourite_faculity (faculityID, jobID, employeeID, created_at) VALUES (?, ?, ?, NOW())";
    await runQuery(insertQuery, [faculityID, jobID, inst_id]);
    return sendSuccess(res, { message: "Add to favourite successfully." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.addEmployerBenefits = async (req, res) => {
  try {
    const { inst_id:emp_id, benefits, benefits_other } = req.body;

    if (!emp_id) {
      return sendError(res, { message: "Please enter institute id..." });
    } else if (!benefits) {
      return sendError(res, { message: "Please enter benefits..." });
    }

    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    await runQuery("DELETE FROM employer_benefits WHERE employerID = ?", [inst_id]);
    await benefits.map((x) => {
      const insertQuery = "INSERT INTO employer_benefits (employerID, benefitID, created_at) VALUES (?, ?, NOW())";
      runQuery(insertQuery, [inst_id, x]);
    })

    if (benefits_other) {

      // let benefitsOther = benefits_other.split(",")
      await benefits_other.map(async (x) => {

        const benefitSelect = "Select * from benefits where title = ?";
        const benefit_select = await runQuery(benefitSelect, [x]);

        if (benefit_select.length > 0) {
          const employerBenefits = "INSERT INTO employer_benefits (employerID, benefitID, created_at) VALUES (?, ?, NOW())";
          runQuery(employerBenefits, [inst_id, benefit_select[0].id]);
        } else {
          const insertQuery = "INSERT INTO benefits (title, created_at) VALUES (?, NOW())";
          const data = await runQuery(insertQuery, [x]);

          const employerBenefits = "INSERT INTO employer_benefits (employerID, benefitID, created_at) VALUES (?, ?, NOW())";
          runQuery(employerBenefits, [inst_id, data.insertId]);
        }
      })
    }

    // console.log(benefits)


    return sendSuccess(res, { message: "Benefits Added successfully." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.interviewStepList = async (req, res) => {
  const { CID } = req.params;
  try {
    const data = await runQuery(`select * from interview_steps where CID = ? ORDER BY priority ASC`, [CID]);
    return sendSuccess(res, { data: data, message: "interview steps..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.lanuageList = async ({ params }, res) => {
  try {
    const languages = [
      "English",
      "Hindi",
      "Assamese",
      "Bengali",
      "Bodo",
      "Dogri",
      "Gujarati",
      "Kannada",
      "Kashmiri",
      "Konkani",
      "Maithili",
      "Malayalam",
      "Manipuri",
      "Marathi",
      "Nepali",
      "Odia",
      "Punjabi",
      "Sanskrit",
      "Santali",
      "Sindhi",
      "Tamil",
      "Telugu",
      "Urdu",
    ];
    return sendSuccess(res, {
      data: languages,
      message: "lanuage list...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.faculityProfileView = async (req, res) => {
  let { inst_id:emp_id, applyID, view_field, log_type, jobID, faculityID:faculty_id } = req.body;
  try {
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })
      
    const faculityID = await generateUserIdByEnyId(faculty_id)
    if (!faculityID) return sendError(res, { message: 'Invalid faculity ID' })

    if (!view_field) {
      return sendError(res, { message: "Please enter view_field..." });
    }

    if (!applyID) {
      applyID = null
    }
    // const appliedData = await runQuery(`select * from applied_jobs where applyID = ?`, [applyID]);
    // if (appliedData?.length == 0) {
    //   return sendError(res, { message: "applied id not exist" });
    // }

    jobData = await runQuery(`SELECT employer_user.employerID FROM jobs left JOIN employer_user on employer_user.employerID = jobs.employerID WHERE jobs.jobID =?;`, [jobID]);
    await runQuery(
      `INSERT INTO employer_faculity_logs (employerID, faculityID, applyID, jobID, view_field, log_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [inst_id, faculityID, applyID, jobID, view_field, log_type]
    );

    userData = await runQuery(`SELECT regToken FROM faculity_users WHERE faculityID=?;`, [faculityID]);
    empData = await runQuery(`SELECT name FROM employer_user WHERE employerID=?;`, [jobData[0].employerID]);

    if (empData[0].name === null || empData[0].name === undefined) {
      message = 'your profile is viewed by Tallento team'
    } else {
      message = 'your profile is viewed by' + empData[0]?.name
    }

    jobUrl = process.env.FRONT_URL + "jobs/" + jobID + "/" + faculityID;
    sendNotificationToFaculity(userData[0].regToken, {
      title: 'Profile viewed!',
      body: message,
      job_url: jobUrl
    }, jobUrl);

    const notificationData = [message, faculityID, jobID, moment().format('YYYY-MM-DD HH:mm:ss')]
    await runQuery(`insert into notification set type='notification', title='Profile Viewd!', message=?, status=1, faculityID=?, linkID=?, created_at=?`, notificationData)

    return sendSuccess(res, { message: "View Successfully..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.suggestedProfileList = async ({ body }, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      category,
      job_function,
      qualification,
      city,
      state,
      job_level,
      min_salary,
      max_salary,
      duration_notice_period,
      min_experience,
      max_experience,
      jobId,
    } = body;
    let pageSize = Number(limit);
    let offset = (Number(page) - 1) * pageSize;
    let raw_query = `SELECT * FROM faculity_users WHERE is_deleted = 0`;

    let total_data = Number(process.env.SUGGESTED_PROFILE_REQUEST)
    if (jobId) {
      const allowProfileCount = await runQuery(`SELECT sum(allow_profile) as allow_profile FROM suggested_profile_request WHERE activity_by IS NOT NULL and jobID = ? GROUP BY jobID;`, [jobId])
      if (allowProfileCount.length > 0) {
        total_data = Number(total_data) + Number(allowProfileCount[0].allow_profile)
      }
    }


    let filter_query = "";
    let order_query = " ORDER BY";
    const conditions = [];
    const values = [];
    const orderValue = [];
    if (category) {
      conditions.push("industry_type = ?");
      values.push(category);
      order_query += " CASE WHEN industry_type = ? THEN 0 ELSE 1 END,";
      orderValue.push(category);
    }
    if (job_function) {
      conditions.push("job_function = ?");
      values.push(job_function);
      order_query += " CASE WHEN job_function = ? THEN 0 ELSE 1 END,";
      orderValue.push(job_function);
    }
    if (job_level) {
      conditions.push("teachingLevel = ?");
      values.push(job_level?.trim());
      order_query += " CASE WHEN teachingLevel = ? THEN 0 ELSE 1 END,";
      orderValue.push(job_level?.trim());
    }
    if (qualification) {
      conditions.push("qualification = ?");
      values.push(qualification);
      order_query += " CASE WHEN qualification = ? THEN 0 ELSE 1 END,";
      orderValue.push(qualification);
    }
    if (min_experience && max_experience) {
      conditions.push("experience BETWEEN ? AND ?");
      values.push(Number(min_experience));
      values.push(Number(max_experience));
      order_query += " CASE WHEN experience = ? THEN 0 ELSE 1 END,";
      order_query += " CASE WHEN experience = ? THEN 0 ELSE 1 END,";
      orderValue.push(min_experience);
      orderValue.push(Number(max_experience));
    } else {
      if (min_experience) {
        conditions.push("experience >= ?");
        values.push(Number(min_experience));
        order_query += " CASE WHEN experience = ? THEN 0 ELSE 1 END,";
        orderValue.push(min_experience);
      }
      if (max_experience) {
        conditions.push("experience <= ?");
        values.push(Number(max_experience));
        order_query += " CASE WHEN experience = ? THEN 0 ELSE 1 END,";
        orderValue.push(max_experience);
      }
    }
    if (min_salary && max_salary) {
      conditions.push("expected_salary BETWEEN ? AND ?");
      values.push(Number(min_salary));
      values.push(Number(max_salary));
      order_query += " CASE WHEN expected_salary = ? THEN 0 ELSE 1 END,";
      order_query += " CASE WHEN expected_salary = ? THEN 0 ELSE 1 END,";
      orderValue.push(min_salary);
      orderValue.push(max_salary);
    } else {
      if (min_salary) {
        conditions.push("expected_salary >= ?");
        values.push(Number(min_salary));
        order_query += " CASE WHEN expected_salary = ? THEN 0 ELSE 1 END,";
        orderValue.push(min_salary);
      }
      if (max_salary) {
        conditions.push("expected_salary <= ?");
        values.push(Number(max_salary));
        order_query += " CASE WHEN expected_salary = ? THEN 0 ELSE 1 END,";
        orderValue.push(max_salary);
      }
    }
    if (state) {
      conditions.push("state = ?");
      values.push(state?.trim());
      order_query += " CASE WHEN state = ? THEN 0 ELSE 1 END,";
      orderValue.push(state);
    }
    if (city) {
      conditions.push("city = ?");
      values.push(city?.trim());
      order_query += " CASE WHEN city = ? THEN 0 ELSE 1 END,";
      orderValue.push(city);
    }
    if (duration_notice_period) {
      conditions.push("duration_notice_period = ?");
      values.push(duration_notice_period?.trim());
      order_query += " CASE WHEN duration_notice_period = ? THEN 0 ELSE 1 END,";
      orderValue.push(duration_notice_period);
    }
    if (conditions.length > 0) {
      filter_query += " AND (" + conditions.join(" OR ") + ")";
    }
    order_query += " CASE WHEN last_login IS NULL THEN 1 ELSE 0 END, last_login DESC";
    let main_query = raw_query + filter_query + order_query;
    main_query += ` LIMIT ? OFFSET ?`;
    // main_query += ` LIMIT ?`;
    // const candiateList = await runQuery(main_query, [...values, ...orderValue, 50]);
    const candiateList = await runQuery(main_query, [...values, ...orderValue, parseInt(pageSize), offset]);
    const newList = candiateList.map(async (ele) => {
      const faculityID = await replaceFacultyID('faculityID', null, ele?.faculityID);
      return {
        ...ele,
        faculityID:faculityID,
        cv_doc:
          (ele?.cv_doc &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.cv_doc}`
            : "",
        image:
          (ele?.image &&
            fs.existsSync(
              `../admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image || ""}`
            )) == true
            ? `https://admin.fpsjob.com/sources/upload/userAttachment/user${ele?.faculityID}/${ele?.image}`
            : "",
      };
    });
    const totalCandidateCount = await runQuery(
      `SELECT COUNT(*) AS total FROM faculity_users WHERE is_deleted = 0` + filter_query,
      values
    );
    const totalCandidate = totalCandidateCount[0].total;
    return sendPaginationSuccess(res, {
      data: newList,
      total_data: total_data,
      message: "Suggest Candidate list...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//old code

// const { sendError, sendSuccess } = require("../../utils/commonFunctions")
// const { isValidHtml, isValidDateFormat, isValidJson } = require("../../utils/validator")
// const { runQuery } = require("../../utils/executeQuery");
// const { APPLICATION_STATUS, APPLICATION_SCREENING_STATUS, APPLICATION_INTERVIEW_STATUS, APPLICATION_OFFER_STATUS } = require("../../utils/enums");
// const { InstituteLOGO } = require("../../utils/filesPath");
// const fs = require('fs');
// const WORK_PLACE_TYPE = ["On-Site", "Hybrid", "Remote"]
// const JOBS_TYPE = ["Full Time", "Part Time", "Contract", "Hourly Basis", "Internship"]
// const SELECTION_PROCESS = ["Demo", "Written+Demo", "Telephonic Interview", "F2F Interview", "Online Interview"]
// const SALARY_TYPE = ["Hourly", "Weekly", "Monthly", "Annually"]
// const QUESTIONS_TYPE = ['Text', 'Yes/No', 'Number', 'Single Choice', 'Multi Choice']

// //done
// exports.workPlaceType = async (req, res) => {
//     try {
//         return sendSuccess(res, { data: WORK_PLACE_TYPE, message: "Work place type..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// //done
// exports.salaryType = async (req, res) => {
//     try {
//         return sendSuccess(res, { data: SALARY_TYPE, message: "Work place type..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// //done
// exports.jobTypes = async (req, res) => {
//     try {
//         return sendSuccess(res, { data: JOBS_TYPE, message: "Work place type..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// //done
// exports.selectionProcess = async (req, res) => {
//     try {
//         return sendSuccess(res, { data: SELECTION_PROCESS, message: "Work place type..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// //done
// exports.questionsType = async (req, res) => {
//     try {
//         return sendSuccess(res, { data: QUESTIONS_TYPE, message: "Questions type..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.experinceLevel = async (req, res) => {
//     const start = 0;
//     const end = 30;
//     const increment = 1;
//     const numberOfElements = (end - start) / increment + 1;
//     const numbers = Array.from({ length: numberOfElements }, (_, index) => start + index * increment);

//     return sendSuccess(res, { data: numbers, message: "experience level..." })
// }

// exports.createJob = async (req, res) => {
//     try {
//         const {
//             job_title,
//             work_place_type,
//             job_type,
//             street,
//             area,
//             city_id,
//             state_id,
//             job_descripion,
//             salary_minimum,
//             salary_maximum,
//             salary_type,
//             deadline,
//             inst_id,
//             exp_minimum,
//             exp_maximum,
//             interview_process,
//             bl_id,
//             gender = 'all',
//             graduation_start_date,
//             graduation_end_date
//         } = req.body

//         if (!job_title) {
//             return sendError(res, { message: "Please provide the job title..." })
//         } else if (!WORK_PLACE_TYPE.includes(work_place_type)) {
//             return sendError(res, { message: "Please select the work place type..." })
//         } else if (!street) {
//             return sendError(res, { message: "Please enter your address..." })
//         } else if (!city_id) {
//             return sendError(res, { message: "Please select the city..." })
//         } else if (!state_id) {
//             return sendError(res, { message: "Please select the state..." })
//         } else if (parseInt(salary_minimum) < 1000 || !salary_minimum) {
//             return sendError(res, { message: "Please provide the minimum salary 1k.." })
//         } else if (parseInt(salary_maximum) > 9900000 || !salary_maximum) {
//             return sendError(res, { message: "Please enter below the salary range 99 lakh.." })
//         } else if (parseInt(salary_maximum) < parseInt(salary_minimum)) {
//             return sendError(res, { message: "Please enter valid salary range..." })
//         } else if (!SALARY_TYPE.includes(salary_type)) {
//             return sendError(res, { message: "Please select the valid salary type..." })
//         } else if (!job_descripion) {
//             return sendError(res, { message: "Please provide the job description..." })
//         } else if (!job_descripion) {
//             return sendError(res, { message: "Please provide job description..." })
//         } else if (!SELECTION_PROCESS.includes(interview_process)) {
//             return sendError(res, { message: "Please select the valid interview process..." })
//         } else if (exp_minimum > exp_maximum) {
//             return sendError(res, { message: "Please select the valid experience..." })
//         } else if (!exp_maximum || !exp_minimum) {
//             return sendError(res, { message: "Please provide the experience range..." })
//         } else if (!JOBS_TYPE.includes(job_type)) {
//             return sendError(res, { message: "Please select the valid job type..." })
//         } else if (!bl_id) {
//             return sendError(res, { message: "Please select the board level..." })
//         } else if (['male', 'female', 'other', 'all'].includes(gender)) {
//             return sendError(res, { message: "Please select the valid gender...." })
//         } else {
//             const data = await runQuery(`insert into jobs set job_title=?,work_place_type=?,street=?,area=?,
//             city_id=?,state_id=?,job_description=?,salary_minimum=?,salary_maximum=?,salary_type=?,deadline=?,
//             experience_minimum=?,experience_maximum=?,interview_process=?,inst_id=?,job_type=?,bl_id=?,gender=?,graduation_start_date=?,
//             graduation_end_date=?`, [job_title, work_place_type, street, area,
//                 city_id, state_id, job_descripion, salary_minimum, salary_maximum, salary_type, deadline, exp_minimum, exp_maximum,
//                 interview_process, inst_id, job_type, bl_id, gender, graduation_start_date, graduation_end_date
//             ])
//             return sendSuccess(res, { data: [{ job_id: data.insertId }], message: "Job has been post successfully..." })
//         }
//     } catch (error) {
//         if (error.code == 'ER_BAD_NULL_ERROR') {
//             return sendError(res, { message: "Somethin went wrong..." })
//         }
//         return sendError(res, { message: error.message })
//     }
// }

// exports.updateJob = async (req, res) => {
//     try {
//         const {
//             job_title,
//             work_place_type,
//             street,
//             area,
//             city_id,
//             state_id,
//             job_description,
//             salary_minimum,
//             salary_maximum,
//             salary_type,
//             deadline,
//             job_status,
//             experience_minimum,
//             experience_maximum,
//             interview_process,
//             job_type,
//             gender,
//             bl_id,
//             graduation_start_date,
//             graduation_end_date
//         } = req.body

//         const jobId = req.params.jobId

//         let updateQuery = `UPDATE jobs SET `
//         let updateValues = []
//         let conditions = []
//         let updatedFields = []

//         if (job_title) {
//             updateValues.push(`job_title=?`)
//             updatedFields.push(job_title)
//         }

//         if (work_place_type && WORK_PLACE_TYPE.includes(work_place_type)) {
//             updateValues.push(`work_place_type = ?`)
//             updatedFields.push(work_place_type)
//         }

//         if (street) {
//             updateValues.push(`street=?`)
//             updatedFields.push(street)
//         }
//         if (area) {
//             updateValues.push(`area=?`)
//             updatedFields.push(area)
//         }
//         if (city_id) {
//             updateValues.push(`city_id=?`)
//             updatedFields.push(city_id)
//         }
//         if (state_id) {
//             updateValues.push(`state_id=?`)
//             updatedFields.push(state_id)
//         }

//         if (job_description) {
//             updateValues.push(`job_description=?`)
//             updatedFields.push(job_description)
//         }
//         if (salary_minimum) {
//             updateValues.push(`salary_minimum=?`)
//             updatedFields.push(salary_minimum)
//         }
//         if (salary_maximum) {
//             updateValues.push(`salary_maximum=?`)
//             updatedFields.push(salary_maximum)
//         }
//         if (salary_type && SALARY_TYPE.includes(salary_type)) {
//             updateValues.push(`salary_type=?`)
//             updatedFields.push(salary_type)
//         }

//         if (deadline) {
//             updateValues.push(`deadline=?`)
//             updatedFields.push(deadline)
//         }

//         if (job_status && ['Open', 'Closed'].includes(job_status)) {
//             updateValues.push(`job_status=?`)
//             updatedFields.push(job_status)
//         }

//         if (experience_minimum) {
//             updateValues.push(`experience_minimum=?`)
//             updatedFields.push(experience_minimum)
//         }

//         if (experience_maximum) {
//             updateValues.push(`experience_maximum=?`)
//             updatedFields.push(experience_maximum)
//         }

//         if (interview_process && SELECTION_PROCESS.includes(interview_process)) {
//             updateValues.push(`interview_process=?`)
//             updatedFields.push(interview_process)
//         }

//         if (job_type && JOBS_TYPE.includes(job_type)) {
//             updateValues.push(`job_type=?`)
//             updatedFields.push(job_type)
//         }
//         if (gender && ['male', 'female', 'all'].includes(gender)) {
//             updateValues.push(`gender=?`)
//             updatedFields.push(gender)
//         }
//         if (bl_id) {
//             updateValues.push(`bl_id=?`)
//             updatedFields.push(bl_id)
//         }

//         if (graduation_start_date) {
//             updateValues.push(`graduation_start_date=?`)
//             updatedFields.push(graduation_start_date)
//         }
//         if (graduation_end_date) {
//             updateValues.push(`graduation_end_date=?`)
//             updatedFields.push(graduation_end_date)
//         }
//         conditions.push(`job_id = ?`)
//         updatedFields.push(jobId)
//         updateQuery += updateValues.join(", ")
//         updateQuery += " WHERE " + conditions.join(" AND ")
//         if (updateValues.length == 0) return sendError(res, { message: "Please provide the atleast one field to update..." })
//         await runQuery(updateQuery, updatedFields)
//         return sendSuccess(res, { message: "Job has been updated successfully..." })
//     } catch (error) {
//         if (error.code == 'ER_NO_REFERENCED_ROW') {
//             return sendError(res, { message: "Kindly ensure thorough review of the form for accuracy and completeness." })
//         }
//         return sendError(res, { message: error.message })
//     }
// }

// exports.jobList = async ({
//     query: { job_status, page = 1, pageSize = 10, title, work_place_type, job_type, gender_type, start_date, end_date },
//     body: { inst_id } }, res) => {
//     try {
//         const offset = (page - 1) * pageSize
//         let query = `select j.*,inst.inst_logo,inst.inst_name, c.city_name,s.state_name, count(ja.job_id) total_applications from jobs j
//         join cities c on c.city_id = j.city_id
//         join states s on s.state_id=c.state_id
//         join institutions inst on j.inst_id = inst.inst_id
//         left join job_applications ja on ja.job_id = j.job_id
//         where j.inst_id = ?`
//         const values = [inst_id]
//         if (job_status && ['Open', 'Closed'].includes(job_status)) {
//             query += ` and job_status = ?`
//             values.push(job_status)
//         }

//         if (title) {
//             query += ` and job_title like ?`
//             values.push(`%${title}%`)
//         }

//         if (work_place_type && WORK_PLACE_TYPE.includes(work_place_type)) {
//             query += ` and work_place_type = ?`
//             values.push(work_place_type)
//         }

//         if (gender_type && ['male', 'female', 'all'].includes(gender_type)) {
//             query += ` and gender = ?`
//             values.push(gender_type)
//         }

//         if (job_type && JOBS_TYPE.includes(job_type)) {
//             query += ` and job_type = ?`
//             values.push(job_type)
//         }

//         if (isValidDateFormat(start_date) && isValidDateFormat(end_date)) {
//             query += ` and date(post_date) between ? and ?`
//             values.push(start_date, end_date)
//         }

//         query += ` group by j.job_id order by post_date desc limit ? offset ?`
//         values.push(pageSize, offset)
//         const data = await runQuery(query, values)
//         await Promise.all(data.map(async (item) => {
//             const imagePath = `${InstituteLOGO}/${item.inst_logo}`;
//             const image = await fs.promises.readFile(imagePath);
//             item.inst_logo = image.toString('base64');
//         }));
//         return sendSuccess(res, { data: data, message: "Job list..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.jobDetails = async ({ body: { inst_id }, params: { jobId } }, res) => {
//     try {
//         const jobData = await runQuery(`select *,j.city_id,j.state_id from jobs j join cities c on c.city_id = j.city_id join states s on s.state_id=c.state_id
//         join institutions inst on j.inst_id = inst.inst_id left join board_level bl on j.bl_id=bl.bl_id where job_id=? and j.inst_id=?`, [jobId, inst_id])
//         if (jobData.length > 0) {
//             const questins = await runQuery(`select * from job_screening_questions where job_id=? and is_ques_delete = ?`, [jobId, "0"])
//             jobData[0]['screen_questions'] = questins
//             const applications = await runQuery(`select ja.apl_id, ja.apl_viewed,u.u_full_name name ,ur.resume_original_name resume, ja.apl_date
//             date,ur.rs_id, u.* from job_applications ja join users u on ja.u_id=u.u_id join users_resume ur on ja.rs_id=ur.rs_id where ja.job_id = ?`, [jobId])
//             jobData[0]['applications'] = applications
//         }
//         await Promise.all(jobData.map(async (item) => {
//             const imagePath = `${InstituteLOGO}/${item.inst_logo}`;
//             const image = await fs.promises.readFile(imagePath);
//             item.inst_logo = image.toString('base64');
//         }));
//         return sendSuccess(res, { data: jobData, message: "Job details..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.applicationDetail = async ({ params: { job_id, apl_id } }, res) => {
//     try {
//         const data = await runQuery(`select * from job_applications ja join users u on ja.u_id=u.u_id join jobs j on ja.job_id=j.job_id join cities c on c.city_id = j.city_id join states s on s.state_id=c.state_id join users_resume ur on ur.rs_id = ja.rs_id where ja.job_id=? and ja.apl_id=?`, [job_id, apl_id])
//         if (data.length > 0) {
//             const quesAns = await runQuery(`select * from job_screening_questions_response jsqr join job_screening_questions jsq on jsqr.ques_id=jsq.ques_id where jsqr.apl_id=?`, [apl_id])
//             data[0].screening_answer = quesAns
//             await runQuery(`update job_applications set apl_viewed=? where apl_id=?`, [1, apl_id])
//         }
//         return sendSuccess(res, { data: data, message: "Application details..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.addScreenQuestion = async (req, res) => {
//     try {
//         const { job_id, question_text, question_type, ques_options, is_mandatory = 0 } = req.body
//         if (!job_id) {
//             return sendError(res, { message: "Please select the job..." })
//         } else if (!question_text) {
//             return sendError(res, { message: "Please enter the question..." })
//         } else if (!QUESTIONS_TYPE.includes(question_type)) {
//             return sendError(res, { message: "Please select the question type..." })
//         } else if (ques_options && !Array.isArray(ques_options)) {
//             return sendError(res, { message: "Please provide valid the question options..." })
//         } else {
//             await runQuery(`insert into job_screening_questions set ques_text=?,ques_type=?,job_id=?,ques_options=?,is_mandatory=?`,
//                 [question_text, question_type, job_id, JSON.stringify(ques_options), is_mandatory])
//             return sendSuccess(res, { message: "Question is addedd successfully..." })
//         }
//     } catch (error) {
//         if (error.code == 'ER_NO_REFERENCED_ROW_2') {
//             return sendError(res, { message: "Please select the valid job..." })
//         } else if (error.code == 'ER_INVALID_JSON_TEXT') {
//             return sendError(res, { message: "Please provide the valid options.." })
//         } else {
//             return sendError(res, { message: error.message })
//         }
//     }
// }

// exports.updateScreeningQuestion = async ({ params: { ques_id }, body: { ques_text, ques_type, ques_delete, ques_options, is_mandatory
// } }, res) => {
//     try {
//         let query = `update job_screening_questions set`
//         const values = []
//         const updateFields = []
//         if (ques_text) {
//             updateFields.push('ques_text = ?')
//             values.push(ques_text)
//         }
//         if (ques_type || QUESTIONS_TYPE.includes(ques_type)) {
//             updateFields.push('ques_type = ?')
//             values.push(ques_type)
//         }
//         if (ques_delete && [0, 1].includes(ques_delete)) {
//             updateFields.push('is_ques_delete = ?')
//             values.push(ques_delete)
//         }
//         if (is_mandatory && [0, 1].includes(is_mandatory)) {
//             updateFields.push('is_mandatory = ?')
//             values.push(is_mandatory)
//         }
//         if (Array.isArray(ques_options)) {
//             updateFields.push('ques_options = ?')
//             values.push(JSON.stringify(ques_options))
//         }
//         query += ` ${updateFields.join(', ')} where ques_id = ?`
//         values.push(ques_id)
//         await runQuery(query, values)
//         return sendSuccess(res, { message: "Question has been updated successfully..." })
//     } catch (error) {
//         if (error.code == 'ER_PARSE_ERROR') {
//             return sendError(res, { message: "Pass atleast one field for update..." })
//         } else if (error.code == 'WARN_DATA_TRUNCATED') {
//             return sendError(res, { message: "Select valid question type..." })
//         }
//         return sendError(res, { message: error.message })
//     }
// }

// exports.jobsHistory = async ({ query: { status, page = 1 }, body: { inst_id } }, res) => {
//     try {
//         const pageSize = 20
//         const offset = (page - 1) * pageSize
//         let query = `select *,c.city_name,s.state_name from jobs j join cities c on j.city_id= c.city_id join states s on j.state_id=s.state_id where inst_id = ?`
//         const values = [inst_id]
//         if (status == "Open" || status == "Closed") {
//             query += ` and job_status = ?`
//             values.push(status)
//         }
//         query += ` LIMIT ? OFFSET ?`
//         values.push(parseInt(pageSize), offset);
//         const data = await runQuery(query, values)
//         return sendSuccess(res, { data: data, message: "All jobs profiles.." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }

// exports.processApplication = async ({ body: updateData, params: params }, res) => {
//     try {
//         const keyMap = {
//             application_view: 'apl_viewed',
//             application_status: 'apl_status',
//             application_screening_status: 'apl_screen_status',
//             application_interview_status: 'apl_interview_status',
//             application_offer_status: 'apl_offer_status'
//         }
//         const revKeyMap = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]))

//         const objectEntries = Object.entries(updateData)
//         if (objectEntries.length !== 3) {
//             return sendError(res, { message: "Please update only one field..." })
//         }
//         const columnsToUpdate = objectEntries.map(([key]) => keyMap[key]).filter(Boolean)
//         if (columnsToUpdate.length !== 1) {
//             return sendError('Please update valid field...');
//         }

//         const setClause = columnsToUpdate.map((column) => `${column} = ?`).join(', ');
//         const updateQuery = `UPDATE job_applications SET ${setClause} WHERE apl_id = ?`;
//         const valuesToUpdate = columnsToUpdate.map((column) => updateData[revKeyMap[column]]);
//         valuesToUpdate.push(params.apl_id);
//         if (APPLICATION_STATUS.includes(valuesToUpdate[0]) ||
//             APPLICATION_SCREENING_STATUS.includes(valuesToUpdate[0]) ||
//             APPLICATION_INTERVIEW_STATUS.includes(valuesToUpdate[0]) ||
//             APPLICATION_OFFER_STATUS.includes(valuesToUpdate[0])) {
//             await runQuery(updateQuery, valuesToUpdate);
//             return sendSuccess(res, { message: "Process successfully..." });
//         } else {
//             return sendError(res, { message: "Please select the valid status..." })
//         }
//     } catch (error) {
//         if (error.code == 'ER_BAD_FIELD_ERROR') {
//             return sendError(res, { message: "Please provide the valid status..." })
//         }
//         return sendError(res, { message: error.message })
//     }
// }

// exports.boardLevel = async (req, res) => {
//     try {
//         const data = await runQuery(`select * from board_level where bl_status = ?`, [1])
//         return sendSuccess(res, { data: data, message: "Board level..." })
//     } catch (error) {
//         return sendError(res, { message: error.message })
//     }
// }
