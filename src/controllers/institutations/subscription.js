const { sendError, sendSuccess, generateUniqueString, getEmployerIdByEnyId } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { BankPlanPurchaseTemplate, PlanPurchaseTemplate, sendMail } = require("../../utils/mailHandler");
const { payApi } = require("../../utils/phonepeHandler");
const { createOrderRazorPay, fetchPaymentDetail } = require("../../utils/razorPayHandler");
const crypto = require("crypto");

//done

// exports.plansList = async (req, res) => {
//     try {
//     // Fetch categories associated with the employer
//         const employerCategories = await runQuery(`
//             SELECT category FROM employer_user WHERE employerID = ?
//         `, [req.body.inst_id]);

//         // Check if categories were found
//         if (!employerCategories || employerCategories.length === 0) {
//             return sendError(res, { message: "No categories found for the employer" });
//         }

//         // Extract categories from the result
//         const categories = employerCategories[0].categories;

//         // Fetch plans from emp_packages table based on the categories
//         const plans = await runQuery(`
//             SELECT emp_packages.id, emp_packages.name, emp_packages.description,
//                    emp_packages.type AS emp_type, emp_packages.status, emp_packages.session,
//                    emp_packages.validfor, emp_packages.no_of_jobs, emp_packages.priority,
//                    emp_packages.testportal, emp_packages.categories, emp_packages.is_delete,
//                    emp_packages.created_at, emp_packages.updated_at,
//                    COALESCE(nationalpack_opt.price, '') AS national_price,
//                    COALESCE(statepack_opt.price, '') AS state_price
//             FROM emp_packages
//             LEFT JOIN nationalpack_opt ON emp_packages.id = nationalpack_opt.id
//             LEFT JOIN statepack_opt ON emp_packages.id = statepack_opt.id
//             WHERE emp_packages.type IN ('national', 'state')
//             AND (
//                 FIND_IN_SET('1', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('2', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('5', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('9', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('14', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('15', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('17', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('20', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('21', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('22', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('26', emp_packages.categories) > 0
//             )
//         `);

//         // Separate national and state plans
//         const nationalPlans = plans.filter(plan => plan.emp_type === 'national');
//         const statePlans = plans.filter(plan => plan.emp_type === 'state');

//         // Prepare response
//         const responseData = {
//             nationalPlans,
//             statePlans
//         };

//         return sendSuccess(res, { data: responseData, message: "Plans list..." });

//     } catch (error) {
//         fs.unlinkSync(req.file.path)
//         return sendError(res, { message: error.message })
//     }
// }

// exports.plansList = async (res,req) => {
//     try {
//         // Fetch categories associated with the employer
//         const employerCategories = await runQuery(`
//             SELECT category FROM employer_user WHERE employerID = ?
//         `, [employerID]);

//         // Check if categories were found
//         if (!employerCategories || employerCategories.length === 0) {
//             return sendError(res, { message: "No categories found for the employer" });
//         }

//         // Extract categories from the result
//         const categories = employerCategories[0].categories;

//         // Fetch plans from emp_packages table based on the categories
//         const plans = await runQuery(`
//             SELECT emp_packages.id, emp_packages.name, emp_packages.description,
//                    emp_packages.type AS emp_type, emp_packages.status, emp_packages.session,
//                    emp_packages.validfor, emp_packages.no_of_jobs, emp_packages.priority,
//                    emp_packages.testportal, emp_packages.categories, emp_packages.is_delete,
//                    emp_packages.created_at, emp_packages.updated_at,
//                    COALESCE(nationalpack_opt.price, '') AS national_price,
//                    COALESCE(statepack_opt.price, '') AS state_price
//             FROM emp_packages
//             LEFT JOIN nationalpack_opt ON emp_packages.id = nationalpack_opt.id
//             LEFT JOIN statepack_opt ON emp_packages.id = statepack_opt.id
//             WHERE emp_packages.type IN ('national', 'state')
//             AND (
//                 FIND_IN_SET('1', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('2', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('5', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('9', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('14', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('15', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('17', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('20', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('21', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('22', emp_packages.categories) > 0 OR
//                 FIND_IN_SET('26', emp_packages.categories) > 0
//             )
//         `);

//         // Separate national and state plans
//         const nationalPlans = plans.filter(plan => plan.emp_type === 'national');
//         const statePlans = plans.filter(plan => plan.emp_type === 'state');

//         // Prepare response
//         const responseData = {
//             nationalPlans,
//             statePlans
//         };

//         return sendSuccess(res, { data: responseData, message: "Plans list..." });
//     } catch (error) {
//         return sendError(res, { message: error.message });
//     }
// }

exports.plansList = async (req, res) => {
  try {

    if (!req.body.inst_id) return sendError(res, { message: 'Please provide institute Id' })
    const inst_id = await getEmployerIdByEnyId(req.body.inst_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    const query = `SELECT category FROM employer_user WHERE employerID = ?;`;
    const data = await runQuery(query, [inst_id]);
    // Fetch data from emp_packages table
    const nPlans = await runQuery(
      `
        SELECT 
        emp_packages.id, 
        emp_packages.name, 
        emp_packages.description,
        emp_packages.type AS emp_type, 
        emp_packages.status, 
        emp_packages.session,
        emp_packages.validfor, 
        emp_packages.no_of_jobs, 
        emp_packages.priority,
        emp_packages.testportal, 
        emp_packages.categories, 
        emp_packages.is_delete,
        emp_packages.created_at, 
        emp_packages.updated_at,
        COALESCE(
          CONCAT(
              '[',
              GROUP_CONCAT(
                  DISTINCT CONCAT(
                      '{"id": ', nationalpack_opt.id, ', "price": "', nationalpack_opt.price, '", "jobs": ', nationalpack_opt.jobs, ', "days": ', nationalpack_opt.days, ', "packid": ', nationalpack_opt.packid, '}'
                  ) SEPARATOR ','
              ),
              ']'
          ),
          '[]'
      ) AS national_package FROM 
        emp_packages
    LEFT JOIN 
        nationalpack_opt ON emp_packages.id = nationalpack_opt.packid
    WHERE 
        emp_packages.type = 'national' AND emp_packages.status = 1 AND emp_packages.is_delete = 0 GROUP BY emp_packages.id
        ;
        `,
      []
    );
    const sPlans = await runQuery(
      `
        SELECT 
        emp_packages.id, 
        emp_packages.name, 
        emp_packages.description,
        emp_packages.type AS emp_type, 
        emp_packages.status, 
        emp_packages.session,
        emp_packages.validfor, 
        emp_packages.no_of_jobs, 
        emp_packages.priority,
        emp_packages.testportal, 
        emp_packages.categories, 
        emp_packages.is_delete,
        emp_packages.created_at, 
        emp_packages.updated_at,
        COALESCE(
          CONCAT(
              '[',
              GROUP_CONCAT(
                DISTINCT CONCAT(
                  '{"id": ', statepack_opt.id, ', "price": "', statepack_opt.price, '", "jobs": ', statepack_opt.jobs, ', "subject": ', statepack_opt.subject, ', "days": ', statepack_opt.days, ', "packid": ', statepack_opt.packid, '}'
                  ) SEPARATOR ','
              ),
              ']'
          ),
          '[]'
      ) AS state_package
    FROM 
        emp_packages
    LEFT JOIN 
        statepack_opt ON emp_packages.id = statepack_opt.packid
    WHERE 
        emp_packages.type = 'state' AND emp_packages.status = 1 AND emp_packages.is_delete = 0 GROUP BY emp_packages.id
        ;
        `,
      []
    );
    const nationalPlans = nPlans
      .filter((plan) => plan.emp_type === "national" && plan?.categories.includes(data?.[0]?.category))
      .map((ele) => {
        return { ...ele, national_package: JSON.parse(ele?.national_package) };
      });

    
    for (const value of nationalPlans) {
      value.currentBenefits = await runQuery(
          `SELECT allowed,benefit  FROM employer_packages_benefits WHERE packId = ?`,
          [value.id]
      ); 
      // console.log(value.id)

    }
    const statePlans = sPlans
      .filter((plan) => plan.emp_type === "state" && plan?.categories.includes(data?.[0]?.category))
      .map((ele) => {
        return { ...ele, state_package: JSON.parse(ele?.state_package) };
      });
    // Prepare response
    const responseData = {
      data,
      nationalPlans,
      statePlans,
    };

    return sendSuccess(res, { data: responseData, message: "Plans list..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

//kaam baki hai

exports.createOrder = async ({ body: { amount, currency_type, inst_id:emp_id } }, res) => {
  try {

    if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    if (amount < 1000) {
      return sendError(res, { message: "Please provide the valid amount..." });
    }
    // const plans = await runQuery(`select * from selected_plans where inst_id = ? and activation_plan in (?,?) order by selection_date `, [inst_id, 'processing', 'activated'])
    //         const plans = await runQuery(`SELECT emp_packages.id, emp_packages.name, emp_packages.description,
    //         emp_packages.type AS emp_type, emp_packages.status, emp_packages.session,
    //         emp_packages.validfor, emp_packages.no_of_jobs, emp_packages.priority,
    //         emp_packages.testportal, emp_packages.categories, emp_packages.is_delete,
    //         emp_packages.created_at, emp_packages.updated_at,
    //         COALESCE(nationalpack_opt.price, '') AS national_price,
    //         COALESCE(statepack_opt.price, '') AS state_price
    //  FROM emp_packages
    //  LEFT JOIN nationalpack_opt ON emp_packages.id = nationalpack_opt.id
    //  LEFT JOIN statepack_opt ON emp_packages.id = statepack_opt.id
    //  WHERE emp_packages.type IN ('national', 'state')`, [inst_id])

    const result = await createOrderRazorPay(amount, currency_type);
    const data = {
      order_id: result.id,
      amount: result.amount,
    };

    return sendSuccess(res, { data: [data], message: "Order has been initiated..." });

    if (plans.length > 0)
      return sendError(res, {
        message:
          "Your current plan selection is active, preventing the purchase of a new plan at this time. If you have any questions or need assistance, please feel free to contact our support team.",
      });

    // const result = await createOrderRazorPay(amount, currency_type)
    // const data = {
    //     order_id: result.id,
    //     amount: result.amount
    // }
    return sendSuccess(res, { data: [data], message: "Order has been initiated..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.validatePayment = async (
  { body: { razorpay_order_id, razorpay_signature, razorpay_payment_id, inst_id:emp_id, pack_id, option_id } },
  res
) => {
  // plan_id is main pack id and option_id is inner pack id
  try {
    if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
    const inst_id = await getEmployerIdByEnyId(emp_id)
    if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

    if (!razorpay_order_id) {
      return sendError(res, { message: "Please enter razorpay_order_id..." });
    } else if (!razorpay_signature) {
      return sendError(res, { message: "Please enter razorpay_signature..." });
    } else if (!razorpay_payment_id) {
      return sendError(res, { message: "Please enter razorpay_payment_id..." });
    } else if (!pack_id) {
      return sendError(res, { message: "Please enter pack_id..." });
    } else if (!option_id) {
      return sendError(res, { message: "Please enter option_id..." });
    }
    const excptedSign = crypto
      .createHmac("sha256", process.env.TESTING_RAZOR_KEY_SCRETE)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (razorpay_signature === excptedSign) {
      const data = await fetchPaymentDetail(razorpay_payment_id);
      if (!data) {
        return sendError(res, { message: "Failed to fetch payment details..." });
      }
      const paymentId = generateUniqueString(25);
      const selectPlan = await runQuery(`select * from emp_packages where id = ? and status = ? and is_delete = ?`, [
        pack_id,
        1,
        0,
      ]);
      if (selectPlan.length == 0) return sendError(res, { message: "pack_id not exist..." });
      let selectPack = [];
      if (selectPlan[0]?.type == "national") {
        selectPack = await runQuery(`select * from nationalpack_opt where id = ? and packid = ?`, [option_id, pack_id]);
      } else {
        selectPack = await runQuery(`select * from statepack_opt where id = ? and packid = ?`, [option_id, pack_id]);
      }
      if (selectPack.length == 0) return sendError(res, { message: "pack not exist..." });
      /* const paymentQuery = `insert into subscription_payment (
                subs_pa_id,
                payment_id,
                entity,
                amount,
                currenty_type,
                payment_status,
                payment_method,
                order_id,
                description,
                international,
                refund_status,
                refund_amount,
                payment_captured,
                email_id,
                contact_number,
                fee,
                tax,
                error_code,
                error_description,
                error_source,
                error_step,
                error_reason,
                payment_at,
                card_id,
                card,
                upi,
                bank,
                vpa,
                wallet,
                acquirer_data) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const planStatus =
        data.status === "created" || data.status === "authorized"
          ? "processing"
          : data.status === "captured"
          ? "activated"
          : "failed"; */
      /* await runQuery(paymentQuery, [
        paymentId,
        data.id,
        data.entity,
        data.amount,
        data.currency,
        data.status,
        data.method,
        data.order_id,
        data.description,
        data.international,
        data.refund_status,
        data.amount_refunded,
        data.captured,
        data.email,
        data.contact,
        data.fee,
        data.tax,
        data.error_code,
        data.error_description,
        data.error_source,
        data.error_step,
        data.error_reason,
        data.created_at,
        data.card_id,
        data.card == null ? data.card : JSON.stringify(data.card),
        data.upi == null ? data.upi : JSON.stringify(data.upi),
        data.bank,
        data.vpa,
        data.wallet,
        JSON.stringify(data.acquirer_data),
      ]), */
      const selectedPlanQuery = `
                INSERT INTO employer_subscription 
                (employerID , packID, amount, type, remaining_jobs, transaction_id, payment_type, payment_status, jobs, status, start_date, end_date, subscription_day, optionid, optionjob, subject, testportal, payment_approval ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?)`;
      const nData = await runQuery(selectedPlanQuery, [
        inst_id,
        pack_id,
        data.amount,
        selectPlan[0].type,
        Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
        paymentId,
        "RAZORPAY",
        data.status,
        Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
        "Active",
        selectPack[0].days || 0,
        selectPack[0].days || 0,
        option_id || 0,
        Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
        selectPack[0].subject || "",
        selectPlan[0].testportal || 0,
        1,
      ]);
      nData?.insertId &&
        (await runQuery("Update employer_subscription SET status = ? WHERE employerID = ? AND id != ?", [
          "Inactive",
          inst_id,
          nData.insertId,
        ]));
      const employee = await runQuery(`select * from employer_user where employerID = ? `, [inst_id]);
      const htmlBody = PlanPurchaseTemplate(selectPlan[0]?.name);
      await sendMail(employee[0]?.email, "New Plan Purchase", htmlBody);
      return sendSuccess(res, { data: data, message: "Payment verified successfully..." });
    } else {
      return sendError(res, { message: "Invalid signature sent !..." });
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, { message: "Payment already has been verified..." });
    }
    return sendError(res, { message: error.message });
  }
};

exports.validateBankPayment = async (
  { body: { transaction_id, payment_type, amount, inst_id:emp_id, pack_id, option_id } },
  res
) => {
  if (!emp_id) return sendError(res, { message: 'Please provide institute Id' })
  const inst_id = await getEmployerIdByEnyId(emp_id)
  if (!inst_id) return sendError(res, { message: 'Invalid Institute ID' })

  try {
    if (!transaction_id) {
      return sendError(res, { message: "Please enter transaction_id..." });
    } else if (!payment_type) {
      return sendError(res, { message: "Please enter payment_type..." });
    } else if (!amount) {
      return sendError(res, { message: "Please enter amount..." });
    } else if (!pack_id) {
      return sendError(res, { message: "Please enter pack_id..." });
    } else if (!option_id) {
      return sendError(res, { message: "Please enter option_id..." });
    }
    const selectPlan = await runQuery(`select * from emp_packages where id = ? and status = ? AND is_delete = ?`, [
      pack_id,
      1,
      0,
    ]);
    if (selectPlan.length == 0) return sendError(res, { message: "pack_id not exist..." });
    let selectPack = [];
    if (selectPlan[0]?.type == "national") {
      selectPack = await runQuery(`select * from nationalpack_opt where id = ? and packid = ?`, [option_id, pack_id]);
    } else {
      selectPack = await runQuery(`select * from statepack_opt where id = ? and packid = ?`, [option_id, pack_id]);
    }
    if (selectPack.length == 0) return sendError(res, { message: "pack not exist..." });
    const alreadyExist = await runQuery(`SELECT 1 FROM employer_subscription WHERE transaction_id = ?`, [
      transaction_id,
    ]);
    if (alreadyExist?.length > 0) {
      return sendError(res, { message: "transaction_id already exist..." });
    }
    const currentActivePlan = await runQuery(
      `SELECT remaining_jobs FROM employer_subscription WHERE employerID = ? AND status = ? AND end_date > CURDATE()`,
      [inst_id, "Active"]
    );
    const selectedPlanQuery = `
                INSERT INTO employer_subscription 
                (employerID , packID, amount, type, remaining_jobs, transaction_id, payment_type, payment_status, jobs, status, start_date, end_date, subscription_day, optionid, optionjob, subject, testportal, payment_approval) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?)`;
    const nData = await runQuery(selectedPlanQuery, [
      inst_id,
      pack_id,
      amount,
      selectPlan[0].type,
      Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
      transaction_id,
      payment_type,
      "success",
      Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
      "Active",
      selectPack[0].days || 0,
      selectPack[0].days || 0,
      option_id || 0,
      Number(selectPack[0].jobs || 0) + Number(currentActivePlan[0]?.remaining_jobs || 0) || 0,
      selectPack[0].subject || "",
      selectPlan[0].testportal || 0,
      0,
    ]);
    nData?.insertId &&
      (await runQuery("Update employer_subscription SET status = ? WHERE employerID = ? AND id != ?", [
        "Inactive",
        inst_id,
        nData.insertId,
      ]));
    const employee = await runQuery(`select * from employer_user where employerID = ? `, [inst_id]);
    const htmlBody = BankPlanPurchaseTemplate(selectPlan[0]?.name);
    await sendMail(employee[0]?.email, "New Plan Purchase", htmlBody);
    return sendSuccess(res, {
      message: "Payment Done, We're actively processing your payment and will notify you once it's complete.",
    });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
exports.createPhonePeOrder = async (req, res) => {
  try {
    const tid = `T${Date.now()}`;
    const data = {
      merchantId: "PGTESTPAYUAT",
      merchantTransactionId: tid,
      merchantUserId: `MUID${Date.now()}`,
      amount: 10000,
      redirectUrl: `http://localhost:3000/subscription-plan/phone-pe/transaction/${tid}`,
      redirectMode: "POST",
      mobileNumber: "9999999990",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    const payData = await payApi(data);
    return sendSuccess(res, { data: payData, message: "Payment successfull..." });
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};

exports.phonePeTransactionDetail = async (req, res) => {
  try {
    const merchantTransactionId = res.req.body.transactionId;
    const merchantId = res.req.body.merchantId;
  } catch (error) {
    return sendError(res, { message: error.message });
  }
};
