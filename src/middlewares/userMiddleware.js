const { sendError } = require("../utils/commonFunctions")
const { runQuery } = require("../utils/executeQuery")
const fs = require('fs')
const { verifyJWTToken } = require("../utils/jwtHandler")

// exports.userMiddleware = () => {
//     return async (req, res, next) => {
//         const bearerHeader = req.headers["authorization"]

//         if (typeof bearerHeader !== 'undefined') {
//             try {
//                 const token = bearerHeader.split(" ")[1]
//                 const data = await verifyJWTToken(token)
//                 const dataUser = await runQuery(`select * from users where u_id = ?`, [data.u_id])
//                 if (dataUser.length > 0) {
//                     if (dataUser[0].is_employer == 1) {
//                         req.body.u_id = data.u_id
//                         next()
//                     } else {
//                         return sendError(res, { message: "You'r account has been deactivated..." })
//                     }

//                 } else {
//                     return sendError(res, { message: "Invalid Token..." })
//                 }

//             } catch (error) {
//                 if(req.file !== undefined){
//                     fs.unlinkSync(req.file.path)
//                 }
//                 return sendError(res, { message: error.message })
//             }
//         } else {
//             if(req.file !== undefined){
//                 fs.unlinkSync(req.file.path)
//             }
//             return sendError(res, { message: "Please provide token..." })
//         }
//     }
// }

exports.userMiddleware = () => {
    return async (req, res, next) => {
        const bearerHeader = req.headers["authorization"];

        if (!bearerHeader) {
            return sendError(res, { message: "Please Provide Token..." });
        }

        const token = bearerHeader.split(" ")[1];

        if (!token) {
            return sendError(res, { message: "Invalid Token Format..." });
        }

        try {
            const dataUser = await runQuery(`SELECT 1 FROM faculity_users WHERE login_token = ?`, [token]);
            if (dataUser.length > 0) {
                return next();
            } else {
                return sendError(res, { message: "Invalid Token..." });
            }
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    };
};

// exports.userMiddleware = () => {
//     return async (req, res, next) => {
//         const bearerHeader = req.headers["authorization"];

//         if (typeof bearerHeader === "undefined") {
//             return sendError(res, { message: "Please provide token..." });
//         }

//         try {
//             const token = bearerHeader.split(" ")[1];
//             const data = await verifyJWTToken(token); 
//             const dataUser = await runQuery(`SELECT * FROM faculity_users WHERE faculityID = ?`, [data.faculityID]);

//             if (dataUser.length > 0) {
//                 req.body.faculityID = dataUser[0].faculityID;
//                 next();
//             } else {
//                 return sendError(res, { message: "Invalid Token..." });
//             }
//         } catch (error) {
//             if (req.file !== undefined) {
//                 fs.unlinkSync(req.file.path);
//             }
//             return sendError(res, { message: error.message });
//         }
//     };
// };
