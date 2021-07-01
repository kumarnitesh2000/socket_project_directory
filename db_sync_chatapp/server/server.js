const mongo = require("mongodb").MongoClient;
const express = require('express');
const app = express();
const port = 4000;
const server =  app.listen(port);
const client_ = require('socket.io').listen(server);
const uri = "mongodb://localhost:27017";

app.get('/health',(req,res)=>{
    res.json({'msg':'server is up and running'});
})
//connect to mongodb
mongo.connect(uri, { useUnifiedTopology: true }, function (err, client) {
  if (err) throw err;
  console.log('connected to mongodb');
  //connect to socket io
  client_.on("connection", (socket) => {
    let db = client.db("chatDb");
    let collection = db.collection("chatCollection");
    console.log('client connected to socket server');
    //Info of the database
    // console.log(
    //   `DataBase is ${db.databaseName} and Collection is ${collection.collectionName}`
    // );
    //send status
    sendStatus = function (s) {
      socket.emit("status", s);
    };

    //get chats from mongo collection
    collection
      .find()
      .limit(100)
      .toArray(function (err, res) {
        if (err) throw err;
        //emit the message
        socket.emit("output", res);
      });

    //handle the input event
    socket.on("input", function (data) {
      let { name, message } = data;

      //check for name and message
      if (name == "" || message == "") sendStatus("Body is Empty .");
      else
        collection.insertOne(data, function () {
          client_.emit("output", [data]);

          //sendStatus object
          sendStatus({
            message: "Message Sent .",
            clear: true,
          });
        });
    });
    //handle disconnect event
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
    //handle clear
    socket.on("clear", function (data) {
      collection.remove({}, function () {
        //emit clear
        socket.emit("cleared");
      });
    });
  });
});
