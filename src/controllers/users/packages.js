const { sendError, sendSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");
const { isValidJson } = require("../../utils/validator");
const WORK_PLACE_TYPE = ["On-Site", "Hybrid", "Remote"]
const JOBS_TYPE = ["Full Time", "Part Time", "Contract", "Hourly Basis", "Internship"]
const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment');

exports.packagesList = async (req, res) => {
    try {
        const { facultyID } = req.query;

        let packages = [];
        if (!facultyID) {
            packages = await runQuery(
                `SELECT * FROM users_packages 
                 WHERE status = 1
                 ORDER BY priority ASC`
            );
            for (const value of packages) {
                value.sid = "";
                value.pack_cancel = 0;
                value.categories = value.categories.split(',');

                value.currentBenefits = await runQuery(
                    `SELECT allowed,benefit  FROM users_packages_benefits WHERE packId = ?`,
                    [value.packID]
                ); 

                if(value.type === "Prepaid"){
                    value.gst = (value.price * 18) / 100
                    value.non_gst_price = value.price - value.gst

                    
                    value.price_label = (value.price).toLocaleString('en-IN')
                    value.gst_label = (value.gst).toLocaleString('en-IN')
                    value.non_gst_price_label = (value.non_gst_price).toLocaleString('en-IN')
                }


            }
            return sendSuccess(res, { data: packages, message: "Packages data..." });
        }

        const userSalar = await runQuery(`SELECT expected_salary, salary, industry_type FROM faculity_users WHERE faculityID = ?`, [facultyID]);

        if (userSalar.length > 0 && userSalar[0].salary) {
            packages = await runQuery(
                `SELECT * FROM users_packages 
                 WHERE (? BETWEEN range_min AND range_max OR range_min >= ? AND ? <= range_max OR type = 'Postpaid') ANd FIND_IN_SET(?,categories)
                 AND status = 1
                 ORDER BY price DESC`,
                [userSalar[0].salary, userSalar[0].salary, userSalar[0].salary, userSalar[0].industry_type]
            );
        } else {
            packages = await runQuery(`SELECT * FROM users_packages WHERE status = 1 ORDER BY price DESC`);
        }

        for (const value of packages) {
            const currentPack = await runQuery(
                `SELECT *
                 FROM pack_subscription
                 WHERE faculityID = ?
                 AND packID = ?
                 AND status = 1`,
                [facultyID, value.packID]
            );
            if (currentPack.length > 0) {
                value.sid = currentPack[0].SID;
                const date1 = new Date().toISOString().split('T')[0];
                const date2 = new Date(currentPack[0].expire_date).toISOString().split('T')[0];

                const dateTimestamp1 = new Date(date1).getTime() / 1000;
                const dateTimestamp2 = new Date(date2).getTime() / 1000;
                if (dateTimestamp1 > dateTimestamp2) {
                    value.sid = '';
                    value.pack_cancel = 0;
                } else {
                    value.pack_cancel = 1;
                }
            } else {
                value.sid = "";
                value.pack_cancel = 0;
            }
            value.categories = value.categories.split(',');

            value.currentBenefits = await runQuery(
                `SELECT allowed,benefit  FROM users_packages_benefits WHERE packId = ?`,
                [value.packID]
            ); 
            

            if(value.type === "Prepaid"){
                // value.gst = (value.price * 18) / 100
                // value.non_gst_price = value.price - value.gst

                // value.price_label = (parseFloat(value.price)).toLocaleString('en-IN')
                // value.gst_label = (value.gst).toLocaleString('en-IN')
                // value.non_gst_price_label = (value.non_gst_price).toLocaleString('en-IN')
                
                
                value.gst = (value.discounted_price * 18) / 100
                value.non_gst_price = value.discounted_price - value.gst

                value.price_label = (parseFloat(value.discounted_price)).toLocaleString('en-IN')
                value.gst_label = (value.gst).toLocaleString('en-IN')
                value.non_gst_price_label = (value.non_gst_price).toLocaleString('en-IN')
            }
            
        } 
        const responseData = {
            catID: userSalar[0].industry_type,
            packages: packages,           
        };

        return sendSuccess(res, { data: responseData, message: "Pack data..." });

    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.generateOrderId = async (req, res) => {
    try {
        const { facultyID, amount, type } = req.body;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user id..." })
        } else if (!amount) {
            return sendError(res, { message: "Please enter valid amount..." })
        } else if (!type) {
            return sendError(res, { message: "Please enter valid type..." })
        } else {

            const orderData = {
                amount: amount, // Amount in paise (100 paise = 1 INR)
                currency: type,
                receipt: crypto.randomBytes(40 / 2).toString('hex')
            };

            // Make a POST request to Razorpay API
            axios.post('https://api.razorpay.com/v1/orders', orderData, {
                auth: {
                    username: process.env.TESTING_RAZOR_KEY_ID,
                    password: process.env.TESTING_RAZOR_KEY_SCRETE
                },
                headers: {
                'Content-Type': 'application/json'
                }
            })

            .then(response => {
                if(response.data.id){
                    runQuery(`insert into user_payment_log set user_id = ?, order_id = ?, status = "pending"`, [facultyID, response.data.id])
    
                    const responseData = {
                        order_id: response.data.id
                    };
                    return sendSuccess(res, { data: responseData, message: "Order id geneate Successfully..." });
                }
            })
            .catch(error => {
                return sendError(res, { message: "Something went wrong..." })
            })
            
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};


exports.packUpdate = async (req, res) => {
    try {
        const { facultyID, packID } = req.body;

        if (!facultyID) {
            return sendError(res, { message: "Please enter your user id..." })
        } else if (!packID) {
            return sendError(res, { message: "Please enter valid pack id..." })
        } else {

            const currentDate = moment().format('YYYY-DD-MM HH:mm:ss')
            const startDate = moment().format('YYYY-MM-DD')
            const endDate = moment().add(365, 'days').format('YYYY-MM-DD');
            const transaction_id = (req.body.transaction_id) ? req.body.transaction_id : null

            const packData = await runQuery(
                `SELECT *
                 FROM users_packages
                 WHERE packID =?
                 AND status = 1`,
                [packID]
            );

            let payment_approval = 1;
            let status = 1;
            if(req.body.payment_type  === "bank" || req.body.payment_type === "upi"){
                payment_approval = 0;
                status = 0;
            }


            var updateQuery = `UPDATE pack_subscription SET status = '0' WHERE faculityID = ?`;
            await runQuery(updateQuery, [facultyID]);

            const query = `INSERT INTO pack_subscription (
                packID, 
                faculityID, 
                amount, 
                subscription_day, 
                type, 
                transaction_id, 
                transaction_order_id, 
                transaction_signature, 
                payment_type,
                payment_status,
                status,
                payment_approval,
                start_date,
                expire_date,
                end_date,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            let queryStatus = await runQuery(query, [
                packID, 
                facultyID, 
                (req.body.amount) ? req.body.amount : 0, 
                packData[0].days, 
                // (req.body.type) ? "Prepaid" : "Postpaid", 
                packData[0].type, 
                (req.body.transaction_id) ? req.body.transaction_id : "",
                (req.body.transaction_order_id) ? req.body.transaction_order_id : null,
                (req.body.transaction_signature) ? req.body.transaction_signature : null,
                (req.body.payment_type) ? req.body.payment_type : "",
                (req.body.payment_status) ? req.body.payment_status : "",
                status,
                payment_approval,
                startDate,
                endDate,
                endDate,
                moment().format('YYYY-MM-DD HH:mm:ss')
            ]);

            premium = (req.body.type === 'prepaid') ? 1 : 0
            var updateQuery = `UPDATE faculity_users SET packid=?, packsubid=?, premium=? WHERE faculityID = ?`;
            await runQuery(updateQuery, [packID, queryStatus.insertId, premium, facultyID]);
            return sendSuccess(res, { data: {packID:packID}, message: "Package Updated Successfully..." });
        }
    } catch (error) {
        return sendError(res, { message: error.message });
    }
};
