const mysql = require('mysql2')
const db = mysql.createPool({
    host: process.env.DB_TESTING_HOST ,
	user: process.env.DB_TESTING_USER ,
	password: process.env.DB_TESTING_PWD ,
	database: process.env.DB_TESTING_NAME,
	multipleStatements: true,
})

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    
    console.log('Connected to the database successfully!');
    
    // Release the connection
    connection.release();
});

module.exports = db