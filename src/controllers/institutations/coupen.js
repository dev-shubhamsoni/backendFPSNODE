const { sendError } = require("../../utils/commonFunctions")

exports.createCoupen= async(req,res)=>{
    try {
        const {expiration_date,max_uses,is_active = 'no'} = req.body
        
    } catch (error) {
        return sendError(res,{message:error.message})
    }
}