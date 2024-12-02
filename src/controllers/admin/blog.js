const { sendError, sendSuccess } = require("../../utils/commonFunctions")
const { runQuery } = require("../../utils/executeQuery");
const { validationResult } = require('express-validator');
const multer = require('multer');
 const upload = multer({ dest: 'uploads/' }); 
const path = require('path');
const fs = require('fs');

exports.createBlogPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        upload.single('blogimage')(req, res, async function (err) {
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

            const { title, short_description, long_description, author, meta_title, meta_description, meta_keywords, og_title, og_description, og_keywords } = req.body;

            // Get the file extension from the original filename
            const fileExtension = path.extname(req.file.originalname);

            // Generate a unique filename with the original file extension
            const newFilename = req.file.filename + fileExtension;

            // Rename the uploaded file with the original file extension
            fs.renameSync(req.file.path, path.join(req.file.destination, newFilename));

            const query = `
                INSERT INTO blog 
                (title, blogimage, short_description, long_description, author, meta_title, meta_description, meta_keywords, og_title, og_description, og_keywords, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const values = [title, newFilename, short_description, long_description, author, meta_title, meta_description, meta_keywords, og_title, og_description, og_keywords];

            await runQuery(query, values);

            return res.status(200).json({ 
                status: true,
                statusCode: 200,
                message: "Blog post has been created successfully" 
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


exports.getAllBlogs = async (req, res) => {
    try {
        let query = 'SELECT * FROM blog';
        let queryParams = [];

        const limit = parseInt(req.query.limit);
        if (limit) {
            query += ' LIMIT ?';
            queryParams.push(limit);
        }
        
        const totalBlogsCount = await runQuery('SELECT COUNT(*) AS total FROM blog');
        const totalBlogs = totalBlogsCount[0].total;

        const blogs = await runQuery(query, queryParams);
        
        const responseData = {
            status: true,
            statusCode: 200,
            total_data: totalBlogs,
            data: blogs,
            message: "Blogs retrieved successfully"
        };
        res.status(200).json(responseData);
    } catch (error) {
        return res.status(500).json({ message: error.message || "An error occurred while fetching blogs" });
    }
};


exports.updateBlogPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        upload.single('blogimage')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                console.error("Multer error:", err.message);
                return res.status(400).json({ message: "Error occurred while uploading the image" });
            } else if (err) {
                console.error("Unknown error:", err);
                return res.status(500).json({ message: "An unknown error occurred" });
            }

            const { blogid } = req.params; 
            const { title, short_description, long_description, author, meta_title, meta_description, meta_keywords, og_title, og_description, og_keywords } = req.body;

            let filename = null;
            if (req.file) {
                const originalExtension = path.extname(req.file.originalname);
                filename = req.file.filename + originalExtension.toLowerCase();
            }

            let updateValues = [title, short_description, long_description, author, meta_title, meta_description, meta_keywords, og_title, og_description, og_keywords];
            let updateQuery = `
                UPDATE blog
                SET title = ?, short_description = ?, long_description = ?, author = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, og_title = ?, og_description = ?, og_keywords = ?, updated_at = NOW()
                WHERE blogid = ?
            `;
            if (filename) {
                updateValues.splice(1, 0, filename);
                updateQuery = `
                    UPDATE blog
                    SET title = ?, blogimage = ?, short_description = ?, long_description = ?, author = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, og_title = ?, og_description = ?, og_keywords = ?, updated_at = NOW()
                    WHERE blogid = ?
                `;
            }
            updateValues.push(blogid);

            await runQuery(updateQuery, updateValues);

            return res.status(200).json({ 
                status: true,
                statusCode: 200,
                message: "Blog post has been updated successfully" 
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







