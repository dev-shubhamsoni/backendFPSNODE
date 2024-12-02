const jwt = require('jsonwebtoken')


exports.createJWTToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '30d' })
}

exports.verifyJWTToken = async (token) => {
    try {
        return jwt.verify(token, process.env.JWT_KEY)
    } catch (error) {
        throw new Error(error)
    }
}

exports.createTokenResetPassword = (payload) => {
    return jwt.sign(payload, process.env.OTP_MESSAGE_SEC_KEY, { expiresIn: '1h' })
}

exports.verifyResetPasswordToken = async (token) => {
    try {
        return jwt.verify(token, process.env.OTP_MESSAGE_SEC_KEY)
    } catch (error) {
        throw new Error(error)
    }
}

exports.createTokenEmailVerify = (payload) => {
    return jwt.sign(payload, process.env.EMAIL_VERIFY_SEC_KEY, { expiresIn: '1h' })
}

exports.verifyEmailVerifyToken = async (token) => {
    try {
        return jwt.verify(token, process.env.EMAIL_VERIFY_SEC_KEY)
    } catch (error) {
        throw new Error(error)
    }
}