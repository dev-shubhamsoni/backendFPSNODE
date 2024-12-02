const { sendError, sendSuccess } = require("../../utils/commonFunctions")
const { runAdminQuery, runQuery } = require("../../utils/executeQuery")

const PLANS_TYPE = ['prepaid', 'postpaid']
const USER_TYPE = ['user', 'institute']

exports.planType = async (req, res) => {
    return sendSuccess(res, { data: PLANS_TYPE, message: "Plans types..." })
}

exports.usersType = async (req, res) => {
    return sendSuccess(res, { data: USER_TYPE, message: "Plans types..." })
}

exports.createNormalPlan = async (req, res) => {
    try {
        const { title, description, plan_type, plan_price, nt_id, total_jobs, validity, user_type, gst,
            is_marketing = 0, cutted_price = 0.0, discount_per = 0 } = req.body
        if (!title) {
            return sendError(res, { message: "Please provide the title of subscription plan..." })
        } else if (!description) {
            return sendError(res, { message: "Please provide the description of plan..." })
        } else if (!PLANS_TYPE.includes(plan_type)) {
            return sendError(res, { message: "Please select the valid type of plan..," })
        } else if (parseFloat(plan_price) <= 0) {
            return sendError(res, { message: "Please provide the valid price..." })
        } else if (!nt_id) {
            return sendError(res, { message: "Please select the type of institutions..." })
        } else if (!total_jobs) {
            return sendError(res, { message: "Please provide the total job..." })
        } else if (!validity) {
            return sendError(res, { message: "Please provide the valid vaidity..." })
        } else if (!USER_TYPE.includes(user_type)) {
            return sendError(res, { message: "Please select the valid user type..." })
        } else if (!gst) {
            return sendError(res, { message: "Please provide the gst..." })
        } else if (is_marketing == 1 && parseFloat(cutted_price) <= 0) {
            return sendError(res, { message: "Please provide the valid cutted price..." })
        } else if (is_marketing == 1 && parseFloat(discount_per)<=0) {
            return sendError(res, { message: "Please provide the discount percentage..." })
        } else {
            const query = `insert into subscription_plans(plan_title,plan_type,plan_price,nt_id,total_jobs,plan_description,gst,
                plan_validity,plan_for,is_marketing,cutted_price,discount_per) values (?,?,?,?,?,?,?,?,?,?,?,?)`
            await runQuery(query, [title, plan_type, plan_price, nt_id, total_jobs, description, gst, validity, user_type, is_marketing,
                cutted_price, discount_per])
            return sendSuccess(res, { message: "Plan has been added successfully..." })
        }
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}
exports.planList = async ({ query: { status, is_marketing } }, res) => {
    try {
        let qr = `SELECT *, 
                    (plan_price * (1 + gst / 100)) AS gst_include_amount,
                    (cutted_price * discount_per / 100) AS dis_amount
              FROM subscription_plans sp 
              JOIN institution_type it ON sp.nt_id = it.nt_id 
              WHERE 1 = 1`;
        const values = [];

        if (status === '1' || status === '0') {
            qr += ` AND plan_active = ?`;
            values.push(status);
        }

        if (is_marketing === '1' || is_marketing === '0') {
            qr += ` AND is_marketing = ?`;
            values.push(is_marketing);
        }

        const data = await runQuery(qr, values);
        return sendSuccess(res, { data: data, message: "Plans list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}