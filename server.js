const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages")
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const app = express();
const server = http.createServer(app)
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname,"public")));

let bot = "Chat Bot "

// run when client connects
io.on("connection", socket =>{
  // console.log("New Web Socket connection")

  socket.on("joinRoom",({username,room}) =>{

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //Welcome Current User
      socket.emit("message", formatMessage(bot," Welcome to the Chat App!")) //Msg for single client loggining IN

      //BroadCast when  a user connects
        socket.broadcast.to(user.room).emit("message",formatMessage(bot, `${user.username} has Joined the Chat`)); // for all clients except the user logging IN


        // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // io.emmit(); for all clients

  //listen for chat message
  socket.on("chatMessage", msg =>{
    
    const user = getCurrentUser(socket.id);

     io.to(user.room).emit("message", formatMessage(user.username, msg));
  })

  //Runs when client disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(bot, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});




server.listen(3000 || process.env.PORT, () => console.log(`the server running on port ${3000 || process.env.PORT}`))