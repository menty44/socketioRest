const express = require('express')
const app = express()
const Swal = require('sweetalert2')
var server = app.listen(3000);

var http = require('http').createServer(app);
var io = require('socket.io').listen(server);
var EventEmitter = require('events')

var superman = '';
var ee = new EventEmitter()

//we define the variables
var sendResponse = function () {};

io.on('connection', function(socket){
    console.log('a user connected X');

    ee.on('message', function (text) {
        console.log('EventEmitter ', text)
        superman = text;
        let foo = superman
        for(var i in foo){
            //alert(i); // alerts key
            //alert(foo[i]); //alerts key's value
        }
        socket.emit('chat message', foo[i])
    })


    socket.on('chat message', function(text){
        console.log('send the message to everyone, including the sender. HHHH : ' + superman);
        io.emit('chat message', superman);
    });

    socket.on('taskResponse', data => {
        //calling a function which is inside the router so we can send a res back
        sendResponse(data);
    })

    socket.on('connection', function(client) {
        client.on('chat message', this.onSocketMessage);
        client.on('disconnect', this.onSocketDisconnect);
    }.bind(this));

    socket.on('chat message', function(d){
        console.log('message: ' + d);

      });
      socket.on('chat message', function(d){
        console.log('send the message to everyone, including the sender. : ' + d);
        io.emit('chat message', d);
      });

  });

app.set('socketio', io);

app.post('/', function (req, res, next) {

    var io = req.app.get('socketio');

    io.to('chat message').emit('chat message', req.query);
  res.send('Hello World EventEmitter')
  console.log('request', req.query);
  ee.emit('message', req.query)
})

app.get('/sock', function(req, res){
    res.sendFile(__dirname +'/sockets.html');
  });
