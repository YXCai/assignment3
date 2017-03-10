var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

http.listen(port, function() {
    console.log('listening on port', port);
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var usernames = [];
var connectedUsers = {};
var uniqueID = 0;
var usernameToColor = {};
var alreadySentMessages = [];

// listen to 'chat' messages
io.on('connection', function(socket) {
    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {
        var uniqueName = "guest" + uniqueID;
        connectedUsers[uniqueName] = uniqueName;
        usernameToColor[uniqueName] = "#000000";
        // we store the username in the socket session for this client
        socket.username = uniqueName;
        // add the client's username to the global list
        usernames[uniqueID] = uniqueName;
        socket.emit('your name', uniqueName);
        uniqueID += 1;
        var connectedUserString = "";
        var historyMessages = "";
        for (var key in connectedUsers)
        {
          connectedUserString += connectedUsers[key] + "<br />";
        }
        for (var i = 0; i < alreadySentMessages.length; i++)
        {
          historyMessages += alreadySentMessages[i] + "<br />";
        }
        socket.emit("history messages", historyMessages);
        socket.emit('online users', connectedUserString);
        socket.broadcast.emit('online users', connectedUserString);
        // echo to client they've connected
        //socket.emit('updatechat', 'SERVER', 'you have connected');
        // echo globally (all clients) that a person has connected
        //socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
        // update the list of users in chat, client-side
        //io.sockets.emit('updateusers', usernames);
    });

    socket.on('changecolor', function(color) {
      usernameToColor[socket.username] = color;
    })

    socket.on('name change', function(msg) {
      if (!(msg in connectedUsers))
      {
        var oldColor = usernameToColor[socket.username];
        usernameToColor[socket.username] = "#000000";
        delete connectedUsers[socket.username];
        socket.username = msg;
        connectedUsers[socket.username] = socket.username;
        var connectedUserString = "";
        for (var key in connectedUsers)
        {
          connectedUserString += connectedUsers[key] + "<br />";
        }
        socket.emit('online users', connectedUserString);
        socket.broadcast.emit('online users', connectedUserString);
        usernameToColor[socket.username] = oldColor;
        socket.emit('name change server', msg);
      }
      else {
        socket.emit('name change failed', "Name was already taken");
      }
    });
    socket.on("from client", function(data) {
        var dateVar = new Date();
        var currentHours = "";
        var currentMinutes = "";
        if (dateVar.getHours() < 10)
          currentHours = "0" + String(dateVar.getHours());
        else{
          currentHours = String(dateVar.getHours());
        }

        if (dateVar.getMinutes() < 10)
          currentMinutes = "0" + String(dateVar.getMinutes());
        else{
          currentMinutes = String(dateVar.getMinutes());
        }
        var currentTime = currentHours+ ":" + currentMinutes;
        console.log("received: ", data, " from ", socket.id);
        if (data.message) {
            console.log("Inside data.message \n");
            var coloredName = String(socket.username);
            coloredName = coloredName.fontcolor(usernameToColor[socket.username])
            var realMessage = currentTime + " " + " " + coloredName + ": " + data.message;
            alreadySentMessages.push(realMessage);
            socket.broadcast.emit('from server', realMessage);
            console.log("second emit");
            socket.emit('to user', realMessage);
        }

    });
    socket.on("disconnect", function() {

      console.log(socket.username + " disconnected");
      delete connectedUsers[socket.username];
      var connectedUserString = "";
      for (var key in connectedUsers)
      {
        connectedUserString += connectedUsers[key] + "<br />";
      }
      socket.broadcast.emit('online users', connectedUserString);

    });

});
