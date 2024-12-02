const { sendError } = require("../utils/commonFunctions");
const { runQuery } = require("../utils/executeQuery");
const fs = require("fs");
const { verifyJWTToken } = require("../utils/jwtHandler");

// done
exports.instituteMiddleware = () => {
  return async (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== "undefined") {
      try {
        const token = bearerHeader.split(" ")[1];
        const data = await verifyJWTToken(token);

        // console.log(data.employerID);
        const dataUser = await runQuery(`select * from employer_user where employerID = ?`, [data.employerID]);
        if (dataUser.length > 0) {
          req.body.inst_id = dataUser[0].employerID;

          //console.log(dataUser[0].employerID);
          next();
        } else {
          return sendError(res, { message: "Invalid Token..." });
        }
      } catch (error) {
        if (req.file !== undefined) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(res, { message: error.message });
      }
    } else {
      if (req.file !== undefined) {
        fs.unlinkSync(req.file.path);
      }
      return sendError(res, { message: "Please provide token..." });
    }
  };
};

// //kaam baki hai
// exports.checkPlansLimit = () => {
//     return async (req, res, next) => {
//         try {
//             const { inst_id } = req.body
//             const planData = await runQuery(`select * from selected_plans where inst_id = ? order by selection_date desc limit ?`, [inst_id, 1])
//             if (planData.length == 0) return sendError(res, { message: "Please select a plan to proceed with your job posting. Reach out if you need assistance. Thank you." })
//             if (new Date(planData[0].end_date) < new Date()) {
//                 return sendError(res, { message: "Your plan has been expired..." })
//             }
//             const postApplications = await runQuery(`select count(*) as usageCount from jobs where inst_id = ? and post_date >= ?`, [inst_id, new Date(planData[0].start_date)])
//             if (postApplications[0].usageCount >= planData[0].total_applications) {
//                 return sendError(res, { message: "You have reached the maximum applications limit..." })
//             }
//             if (planData[0].activation_plan == 'processing') return sendError(res, { message: "Thank you for your patience. We're actively processing your payment and will notify you once it's complete." })
//             if (planData[0].activation_plan == 'failed') return sendError(res, { message: "Regrettably, your payment has failed. We're actively addressing the issue and will assist you in resolving it promptly. Thank you for your understanding." })
//             if (planData[0].activation_plan == 'expired') return sendError(res, { message: "Your plan has been expired..." })
//             if (planData[0].activation_plan == 'activated') next()
//         } catch (error) {
//             return sendError(res, { message: error.message })
//         }
//     }
// }

exports.checkPlansLimit = () => {
  return async (req, res, next) => {
    try {
      const { inst_id } = req.body;
      const selectedPlan = await runQuery(`SELECT * FROM employer_subscription WHERE employerID = ? AND status = ?`, [
        inst_id,
        "Active",
      ]);
      if (selectedPlan.length == 0)
        return sendError(res, {
          message:
            "Please select a plan to proceed with your job posting. Reach out if you need assistance. Thank you.",
        });
      if (selectedPlan[0]?.payment_approval == 0)
        return sendError(res, {
          message:
            "Thank you for your patience. We're actively processing your payment and will notify you once it's complete.",
        });
        const activePlan = await runQuery(`SELECT * FROM employer_subscription WHERE employerID = ? AND status = ? AND end_date > CURDATE()`, [
            inst_id,
            "Active",
          ]);
      if (activePlan?.length < 1) {
        return sendError(res, { message: "Your plan has been expired..." });
      }
      if (activePlan[0].remaining_jobs < 1) {
        return sendError(res, { message: "You have reached the maximum applications limit, Buy new plan..." });
      }
      req.body.latestPlanId = activePlan[0]?.id;
      req.body.activePlan = activePlan[0];
      next();
      // const { employerID } = req.body
      // const planData = await runQuery(`SELECT * FROM employer_subscription WHERE employerID = ? and status = ?`, [employerID, "Active"])
      // if (planData.length == 0) return sendError(res, { message: "Please select a plan to proceed with your job posting. Reach out if you need assistance. Thank you." })
      // if (new Date(planData[0].end_date) < new Date()) {
      //     return sendError(res, { message: "Your plan has been expired..." })
      // }
      // // const postApplications = await runQuery(⁠ SELECT * FROM nationalpack_opt WHERE 'id' = ? ⁠, [inst_id, new Date(planData[0].start_date)])
      // if (planData[0].remaining_jobs < 0) {
      //     return sendError(res, { message: "You have reached the maximum applications limit..." })
      // }
      // if (planData[0].status == 'processing') return sendError(res, { message: "Thank you for your patience. We're actively processing your payment and will notify you once it's complete." })
      // if (planData[0].status == 'failed') return sendError(res, { message: "Regrettably, your payment has failed. We're actively addressing the issue and will assist you in resolving it promptly. Thank you for your understanding." })
      // if (planData[0].status == 'expired') return sendError(res, { message: "Your plan has been expired..." })
      // if (planData[0].status == 'Active') next()
    } catch (error) {
      return sendError(res, { message: error.message });
    }
  };
};
