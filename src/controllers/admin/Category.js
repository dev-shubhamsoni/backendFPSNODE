const { sendError, sendSuccess } = require("../../utils/commonFunctions")
const { runQuery } = require("../../utils/executeQuery");
const { validationResult } = require('express-validator');
const multer = require('multer');
 const upload = multer({ dest: 'uploads/' }); 
const path = require('path');
const fs = require('fs');
const { log } = require("console");
const axios = require('axios');


// const apiUrl = 'https://admin.fpsjob.com/api/v2/employer_user';


// axios.get(apiUrl)
//   .then(response => {
//     // Handle successful response
//     console.log('Response data:', response.data);
//   })
//   .catch(error => {
//     // Handle error
//     console.error('Error:', error);
//   });

exports.addCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        upload.single('image')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                console.error("Multer error:", err.message);
                return res.status(400).json({ message: "Error occurred while uploading the image" });
            } else if (err) {
                console.error("Unknown error:", err);
                return res.status(500).json({ message: "An unknown error occurred" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Please upload an image" });
            }

            const { category, color, status, meta_title, meta_description, description, meta_keywords, og_title, og_keywords, og_description, type } = req.body;

            // Get the file extension from the original filename
            const fileExtension = path.extname(req.file.originalname);

            // Generate a unique filename with the original file extension
            const newFilename = req.file.filename + fileExtension;

            // Rename the uploaded file with the original file extension
            fs.renameSync(req.file.path, path.join(req.file.destination, newFilename));

            // Prepare the SQL query with placeholders
            const query = `
                INSERT INTO tbl_categories (category, color, image, status, meta_title, meta_description, description, meta_keywords, og_title, og_keywords, og_description, type) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Execute the query with values
            const values = [category, color, newFilename, status, meta_title, meta_description, description, meta_keywords, og_title, og_keywords, og_description, type];
            await runQuery(query, values);

            return res.status(200).json({ 
                status: true,
                statusCode: 200,
                message: "Category has been created successfully" 
            });
        });
    } catch (error) {
        console.error("Error occurred:", error.message);
        return res.status(500).json({ 
            status: false,
            statusCode: 500,
            message: error.message 
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        upload.single('image')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                console.error("Multer error:", err.message);
                return res.status(400).json({ message: "Error occurred while uploading the image" });
            } else if (err) {
                console.error("Unknown error:", err);
                return res.status(500).json({ message: "An unknown error occurred" });
            }

            const categoryId = req.params.id; // Assuming category ID is passed in the URL params

            const { category, color, status, meta_title, meta_description, description, meta_keywords, og_title, og_keywords, og_description, type } = req.body;

            let image = req.body.image; // If image is not uploaded, use existing image URL
            if (req.file) {
                const fileExtension = path.extname(req.file.originalname);
                const newFilename = req.file.filename + fileExtension;
                fs.renameSync(req.file.path, path.join(req.file.destination, newFilename));
                image = newFilename;
            }

            const query = `
                UPDATE tbl_categories 
                SET category=?, color=?, image=?, status=?, meta_title=?, meta_description=?, description=?, meta_keywords=?, og_title=?, og_keywords=?, og_description=?, type=?
                WHERE ID=?
            `;

            const values = [category, color, image, status, meta_title, meta_description, description, meta_keywords, og_title, og_keywords, og_description, type, categoryId];
            
            // Assuming runQuery is a function that executes the query
            await runQuery(query, values);

            return res.status(200).json({ 
                status: true,
                statusCode: 200,
                message: "Category has been updated successfully" 
            });
        });
    } catch (error) {
        console.error("Error occurred:", error.message);
        return res.status(500).json({ 
            status: false,
            statusCode: 500,
            message: error.message 
        });
    }
};






exports.getCategories = async (req, res) => {
    try {
        const categories = await runQuery(`select * from tbl_categories`)
        const totaldataCount = await runQuery('SELECT COUNT(*) AS total FROM tbl_categories');
        const totaldata = totaldataCount[0].total;

    const responseData = {
        status: true,
        statusCode: 200,
        total_data: totaldata,
        data: categories,
        message: "categories list..."
    };
    res.status(200).json(responseData);
        //return sendSuccess(res, {  data: categories, message: "categories list..." })
    } catch (error) {
        return sendError(res, {   message: error.message })
    }
}

exports.getSubCategories = async (req, res) => {
    try {
        const { CID } = req.query;
        const categories = await runQuery(`SELECT * FROM tbl_functions WHERE CID = ?`, [CID]);
        const totaldataCount = await runQuery('SELECT COUNT(*) AS total FROM tbl_functions WHERE CID = ?', [CID]);
        const totaldata = totaldataCount[0].total;

        const responseData = {
            status: true,
            statusCode: 200,
            total_data: totaldata,
            data: categories,
            message: "Categories list..."
        };
        res.status(200).json(responseData);
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}





