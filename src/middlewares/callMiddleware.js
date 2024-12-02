const { sendError } = require("../utils/commonFunctions")
const { runQuery } = require("../utils/executeQuery")
const { verifyJWTToken } = require("../utils/jwtHandler")

exports.callMiddleware = () => {
    return async (req, res, next) => {
        const bearerHeader = req.headers["authorization"]
        if (typeof bearerHeader !== 'undefined') {
            try {
                const token = bearerHeader.split(" ")[1]
                const data = await verifyJWTToken(token)
                const dataUser = await runQuery(`select * from call_users where u_id = ?`, [data.u_id])
                if (dataUser.length > 0) {
                    if (dataUser[0].u_active == 'yes') {
                        req.body.u_id = dataUser[0].u_id
                        next()
                    } else {
                        return sendError(res, { message: "You'r account has been deactivated..." })
                    }

                } else {
                    return sendError(res, { message: "Invalid Token..." })
                }

            } catch (error) {
                return sendError(res, { message: error.message })
            }
        } else {
            return sendError(res, { message: "Please provide token..." })
        }
    }
}