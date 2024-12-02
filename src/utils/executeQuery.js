const db = require('../db/db')
const adminDB = require('../db/adminDB')

exports.runQuery = async (q, params = []) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(q, params, (err, result) => {
                if (!err) {
                    resolve(result)
                } else {
                    reject(err)
                }
            })
        })
    } catch (error) {
        throw new Error(err);
    }
}


exports.runAdminQuery = async(q,params=[])=>{
    try {
        return new Promise((resolve, reject) => {
            adminDB.query(q, params, (err, result) => {
                if (!err) {
                    resolve(result)
                } else {
                    reject(err)
                }
            })
        })
    } catch (error) {
        throw new Error(err);
    }
}