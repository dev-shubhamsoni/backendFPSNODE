const Razorpay = require('razorpay');
const { generateUniqueString } = require('./commonFunctions');
const instance = new Razorpay({ key_id: process.env.TESTING_RAZOR_KEY_ID, key_secret: process.env.TESTING_RAZOR_KEY_SCRETE })

const createOrderRazorPay = async (amount, currency_type) => {
    try {
        const option = {
            amount: amount,
            currency: currency_type,
            receipt: generateUniqueString(40)
        }
        return await instance.orders.create(option)
    } catch (error) {
        if (typeof error == 'object') {
            throw { message: error.error.description }
        }
        throw error
    }
}

const fetchPaymentDetail = async (paymentId) => {
    try {
        return await instance.payments.fetch(paymentId)
    } catch (error) {
        if (typeof error == 'object') {
            throw { message: error.error.description }
        }
        throw error
    }
}


module.exports = { createOrderRazorPay, fetchPaymentDetail }