const { sendError, sendSuccess } = require("../../utils/commonFunctions");
const { runQuery } = require("../../utils/executeQuery");

exports.addInstituteType = async (req, res) => {
    try {
        const { institute_type } = req.body
        if (!institute_type) {
            return sendError(res, { message: "Please enter the institute type name..." })
        }
        await runQuery(`insert into institution_type set nt_name = ?`, [institute_type])
        return sendSuccess(res, { message: "Added succesfully..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.instituteTypeList = async (req, res) => {
    try {
        const { status = 1 } = req.query
        const values = [status]
        const data = await runQuery(`select * from institution_type where nt_active = ?`, values)
        return sendSuccess(res, { data: data, message: "Institute type list..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}

exports.addBoardLevel = async ({ body: { name } }, res) => {
    try {
        if (!name) return sendError(res, { message: "Please enter the board level name..." })
        await runQuery(`insert into board_level(bl_name) values(?)`, [name])
        return sendSuccess(res, { message: "Board level has been added successfully..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


// test working  

exports.addBoardLeveltest = async ({ body: { BoardLevelname } }, res) => {
    try {
        if (!BoardLevelname) return sendError(res, { message: "Please enter the board level name..." })
        await runQuery(`insert into board_level(bl_name) values(?)`, [BoardLevelname])
        return sendSuccess(res, { message: "Board level has been added successfully..." })
    } catch (error) {
        return sendError(res, { message: error.message })
    }
}


exports.updateBoardLevelupdate = async ({ body: { id, name } }, res) => {
    try {
        if (!id) return sendError(res, { message: "Please provide the board level ID..." });
        if (!name) return sendError(res, { message: "Please enter the updated board level name..." });

        await runQuery(`update board_level set bl_name = ? where bl_id = ?`, [name, id]);

        return sendSuccess(res, { message: "Board level name has been updated successfully..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}

exports.deleteBoardLeveltest = async ({ body: { id } }, res) => {
    try {
        if (!id) return sendError(res, { message: "Please provide the board level ID..." });
        await runQuery(`delete from board_level where bl_id = ?`, [id]);

        return sendSuccess(res, { message: "Board level has been deleted successfully..." });
    } catch (error) {
        return sendError(res, { message: error.message });
    }
}

