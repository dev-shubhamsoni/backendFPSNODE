const fs = require("fs");
const { sendError, sendSuccess, sendPaginationSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { isValidEmail, isValidMobileNumber } = require("../../utils/validator");

//done
exports.dashbaord = async ({ body: { inst_id } }, res) => {
  try {
    const totalJobs = await runQuery(`SELECT COUNT(*) AS count FROM jobs WHERE employerID = ?`, [inst_id]);
    const activeJobs = await runQuery(`SELECT COUNT(*) AS count FROM jobs WHERE status = ? AND employerID = ?`, [
      1,
      inst_id,
    ]);
    const totalApplication = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE jobs.employerID = ?`,
      [inst_id]
    );
    const closedJobs = await runQuery(`SELECT COUNT(*) AS count FROM jobs WHERE status='0' AND employerID = ?`, [
      inst_id,
    ]);
    const newAplication = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE applied_jobs.status = 'Applied' AND jobs.employerID = ?`,
      [inst_id]
    );
    const inActiveAplication = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE (applied_jobs.status = 'Applied' OR applied_jobs.status = 'Reviewed By FPS' OR applied_jobs.status = 'Resume Reviewed') AND jobs.employerID = ?`,
      [inst_id]
    );
    const rejectedApplication = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE applied_jobs.status = 'Rejected' AND jobs.employerID = ?`,
      [inst_id]
    );
    const interviewSchedualed = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE applied_jobs.status = 'Interview scheduled' AND jobs.employerID = ? AND applied_jobs.interview_date >= CURDATE()`,
      [inst_id]
    );
    const todayInterviewSchedualed = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE applied_jobs.status = 'Interview scheduled' AND jobs.employerID = ? AND applied_jobs.interview_date = CURDATE()`,
      [inst_id]
    );
    const hiredCandidate = await runQuery(
      `SELECT COUNT(*) AS count FROM applied_jobs LEFT JOIN jobs ON applied_jobs.jobID  = jobs.jobID WHERE applied_jobs.status = 'Hired' AND jobs.employerID = ?`,
      [inst_id]
    );
    return sendSuccess(res, {
      data: {
        totalJobs: totalJobs[0].count,
        activeJobs: activeJobs[0].count,
        closedJobs: closedJobs[0].count,
        totalApplication: totalApplication[0].count,
        newAplication: newAplication[0].count,
        inActiveAplication:inActiveAplication[0].count,
        rejectedApplication: rejectedApplication[0].count,
        interviewSchedualed: interviewSchedualed[0].count,
        todayInterviewSchedualed: todayInterviewSchedualed[0].count,
        hiredCandidate: hiredCandidate[0].count,
      },
      message: "dashboard...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

// 'SELECT
//         COUNT(DISTINCT jobs.job_id) AS total_jobs,
//         SUM(CASE WHEN jobs.job_status = 'Open' THEN 1 ELSE 0 END) AS open_jobs,
//         SUM(CASE WHEN jobs.job_status = 'Closed' THEN 1 ELSE 0 END) AS closed_jobs,
//         COUNT(DISTINCT job_applications.apl_id) AS total_applications,
//         SUM(CASE WHEN job_applications.apl_status = 'Pending' THEN 1 ELSE 0 END) AS pending_applications,
//         SUM(CASE WHEN job_applications.apl_status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_applications,
//         SUM(CASE WHEN job_applications.apl_status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_applications,
//         SUM(CASE WHEN job_applications.apl_interview_status = 'Scheduled' THEN 1 ELSE 0 END) AS interview_scheduled,
//         SUM(CASE WHEN job_applications.apl_offer_status = 'Accepted' THEN 1 ELSE 0 END) AS hired_candidate
//       FROM
//         jobs
//       LEFT JOIN
//         job_applications ON jobs.job_id = job_applications.job_id where inst_id = ?`

exports.insgetCategories = async (req, res) => {
  try {
    const categories = await runQuery(`select * from tbl_categories`);
    const totaldataCount = await runQuery("SELECT COUNT(*) AS total FROM tbl_categories WHERE status = 1");
    const totaldata = totaldataCount[0].total;

    const responseData = {
      status: true,
      statusCode: 200,
      total_data: totaldata,
      data: categories,
      message: "categories list...",
    };
    res.status(200).json(responseData);
    //return sendSuccess(res, {  data: categories, message: "categories list..." })
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//done
exports.getSubCategories = async (req, res) => {
  try {
    const { CID } = req.query;
    const categories = await runQuery(`SELECT * FROM tbl_functions WHERE CID = ?`, [CID]);
    const totaldataCount = await runQuery("SELECT COUNT(*) AS total FROM tbl_functions WHERE CID = ?", [CID]);
    const totaldata = totaldataCount[0].total;

    const responseData = {
      status: true,
      statusCode: 200,
      total_data: totaldata,
      data: categories,
      message: "Categories list...",
    };
    res.status(200).json(responseData);
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.getAllSubCategories = async (req, res) => {
  try {
    const categories = await runQuery(`select * from tbl_functions`);
    const totaldataCount = await runQuery("SELECT COUNT(*) AS total FROM tbl_functions");
    const totaldata = totaldataCount[0].total;

    const responseData = {
      status: true,
      statusCode: 200,
      total_data: totaldata,
      data: categories,
      message: "categories list...",
    };
    res.status(200).json(responseData);
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.getAQuote = async (req, res) => {
  const {
    first_name,
    last_name,
    sales_email,
    sales_phone,
    sales_company_name,
    sales_city,
    sales_subject,
    sales_message,
  } = req.body;
  try {
    if (!first_name) {
      return sendError(res, { message: "Please provide the First Name..." });
    } else if (!last_name) {
      return sendError(res, { message: "Please provide the Last Name..." });
    } else if (!sales_email) {
      return sendError(res, { message: "Please enter your sales_email..." });
    } else if (!isValidEmail(sales_email)) {
      return sendError(res, { message: "Please provide the valid sales_email..." });
    } else if (!sales_phone) {
      return sendError(res, { message: "Please provide sales_phone..." });
    } else if (!isValidMobileNumber(sales_phone)) {
      return sendError(res, { message: "Please provide the valid sales_phone..." });
    } else if (!sales_company_name) {
      return sendError(res, { message: "Please enter sales_company_name..." });
    } else if (!sales_city) {
      return sendError(res, { message: "Please select the city..." });
    } else if (!sales_subject) {
      return sendError(res, { message: "Please select sales_subject..." });
    } else if (!sales_message) {
      return sendError(res, { message: "Please enter sales_message..." });
    } else {
      const data = await runQuery(
        `insert into sales_enquiries set first_name=?, last_name=?, sales_email=?, sales_phone=?, sales_company_name=?, sales_city=?, 
            sales_subject=?, sales_message=?, status='active', create_date=NOW()`,
        [first_name, last_name, sales_email, sales_phone, sales_company_name, sales_city, sales_subject, sales_message]
      );
      return sendSuccess(res, { data: [{ id: data.insertId }], message: "Sales enquiry added successfully..." });
    }
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.bankList = async (req, res) => {
  try {
    const bankList = await runQuery(`SELECT * FROM bank_details`);
    const totaldataCount = await runQuery("SELECT COUNT(*) AS total FROM bank_details");
    const totaldata = totaldataCount[0].total;

    const responseData = {
      status: true,
      statusCode: 200,
      total_data: totaldata,
      data: bankList,
      message: "Bank list...",
    };
    res.status(200).json(responseData);
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.employeeNotificationList = async (req, res) => {
  const { inst_id } = req.body;
  const { page = 1, limit = 20, search } = req.query;
  const pageSize = Number(limit) || 20;
  const offset = (Number(page) - 1) * pageSize;
  try {
    const data = await runQuery(
      `select 
      *
      from applied_jobs LEFT JOIN emp_notification ON applied_jobs.applyID = emp_notification.applyID LEFT JOIN faculity_users ON applied_jobs.faculityID = faculity_users.faculityID LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE jobs.employerID = ? AND emp_notification.status = 1 AND applied_jobs.status = ? ORDER BY applied_jobs.created_at DESC LIMIT ? OFFSET ?`,
      [inst_id, "Applied", pageSize, offset]
    );
    const newList = data.map((ele) => {
      return {
        ...ele,
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
    const totalNotiCount = await runQuery(
      `select COUNT(*) AS total from applied_jobs LEFT JOIN emp_notification ON applied_jobs.applyID = emp_notification.applyID LEFT JOIN jobs ON applied_jobs.jobID = jobs.jobID WHERE jobs.employerID = ? AND emp_notification.status = 1 AND applied_jobs.status = ?`,
      [inst_id, "Applied"]
    );
    const totalNoti = totalNotiCount[0].total;
    return sendPaginationSuccess(res, {
      data: newList,
      total_data: totalNoti,
      message: "newly apllied list...",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.deActiveEmployeeNotification = async (req, res) => {
  const { NID } = req.params;
  try {
    const data = await runQuery(`UPDATE emp_notification SET status = ? WHERE NID = ?`, [0, NID]);
    if (data?.affectedRows < 1) {
      return sendError(res, { message: "Record Not Found", code: 404 });
    }
    return sendSuccess(res, { data: data, message: "Deleted successfully..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
