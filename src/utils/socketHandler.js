const socketIo = require("socket.io");
const { saveJobMsg } = require("../controllers/institutations/chats");

const setupSocket = (server) => {
    const io = socketIo(server)
    io.on('connection', (socket) => {
        console.log("User is connected...");

        socket.on('start-chat', (chatId) => {
            socket.join(chatId)
            console.log("user has been join to room ---");
        })

        socket.on("send-message", ({ sender_id, chat_id, sender_type, message }) => {
            saveJobMsg(sender_id, message, sender_type, chat_id)
            io.to(chat_id).emit('message-receive', { message, sender_type })
        })

        socket.on("disconnect", () => {
            console.log("User is disconnected...");
        })
    })
    return io
}

module.exports = { setupSocket }