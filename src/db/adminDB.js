const mysql = require('mysql2')
const adminDB = mysql.createPool({
    host: process.env.DB_HOST,
	user: process.env.SUPER_DB_USER,
	password: process.env.SUPER_DB_PASS,
	database: process.env.ADMIN_DB,
	multipleStatements: true,
})

module.exports = adminDB