const express = require('express')
const bodyParser = require('body-parser');


const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static('public'))
var server = app.listen(3000);

var http = require('http').createServer(app);
var io = require('socket.io').listen(server);
app.set('socketio', io);
var EventEmitter = require('events')

var superman = '';
var ee = new EventEmitter()

//we define the variables
var sendResponse = function () {
};

io.on('connection', function (socket) {
    console.log('a user connected X');

    ee.on('message', function (text) {
        console.log('EventEmitter ', text)
        superman = text;
        let foo = superman
        for (var i in foo) {
            //alert(i); // alerts key
            //alert(foo[i]); //alerts key's value
        }
        socket.emit('chat message', text)
    })

    io.on('connection',function(socket) {
        console.log('made socket connection');
        socket.on('chat', function(data){
            // io.sockets.emit('chat',data);
            console.log(data);
        });
    });

    // socket.on('connection', function (client) {
    //     client.on('chat message', this.onSocketMessage);
    //     // client.on('disconnect', this.onSocketDisconnect);
    // }.bind(this));


    // socket.on('chat message', function (d) {
    //     console.log('send the message to everyone, including the sender. : ' + d);
    //     io.emit('chat message', d);
    // });

});



app.post('/', async function (req, res) {
    console.log('request', req.body.latitude);
    console.log('request', req.body.longitude);
    var io = req.app.get('socketio');

    io.to('message').emit('chat message', JSON.stringify(req.body.latitude));
    //res.send('Hello World EventEmitter')
    ee.emit('message', req.body.latitude+', '+req.body.latitude);
    res.json(req.body)
});

app.get('/sock', function (req, res) {
    res.sendFile(__dirname + '/sockets.html');
});
