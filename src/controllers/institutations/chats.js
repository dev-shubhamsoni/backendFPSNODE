const { runQuery } = require("../../utils/executeQuery")

exports.saveJobMsg = async (sender_id, message, sender_type, chat_id) => {
    try {
        const senderColumn = sender_type === "user" ? "u_id" : "inst_id";
        const query = `INSERT INTO job_chat_messages SET job_chat_id=?, ${senderColumn}=?, sender_type=?, msg=?`;
        await runQuery(query, [chat_id, sender_id, sender_type, message]);
    } catch (error) {
        console.error("Error saving job message:", error);
        return error;
    }
};