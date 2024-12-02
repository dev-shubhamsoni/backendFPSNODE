const axios = require('axios')
const crypto = require('crypto')
const saltKey = `099eb0cd-02cf-4e2a-8aca-3e6c6aff0399`
const saltIndex = 1


const payApi = async (data) => {
    try {
        const payload = JSON.stringify(data)
        const mainPayload = Buffer.from(payload).toString('base64')
        const concatenatedString = mainPayload + `/pg/v1/pay` + saltKey
        const sha256Hash = convertSHA256(concatenatedString)
        const checkSum = sha256Hash + "###" + saltIndex

        const option = {
            method: 'POST',
            url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checkSum
            },
            data: {
                request: mainPayload
            }
        }
        const response = await axios.request(option)
        return response.data
    } catch (error) {
        throw new Error(error)
    }
}

const convertSHA256 = (input) => {
    return crypto.createHash('sha256').update(input).digest('hex')
}


const checkPhonePayTransactionStatus = (mtId, mId) => {
    try {
        const string = `/pg/v1/status/${mId}/${mtId}` + saltKey
        const convertSHA256Value = convertSHA256(string)
        const checkSum = convertSHA256Value + '###' + saltIndex
        
    } catch (error) {
        throw error
    } 
}

module.exports = {
    payApi
}