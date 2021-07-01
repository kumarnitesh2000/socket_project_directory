const mongo = require('mongodb').MongoClient;
const client_ = require('socket.io').listen(4000).sockets;
const uri = 'mongodb://localhost:27017';

//connect to mongodb
mongo.connect(uri,{ useUnifiedTopology: true } , function(err,client){

    if(err)
    throw err;

    console.log('connect to Mongo .');
    //db is test db

    //connect to socket io
    client_.on("connection", (socket)=>{
        
    let db = client.db('chatDb')
    let collection = db.collection('chatCollection');
        //Info of the database 
        console.log(`DataBase is ${db.databaseName} and Collection is ${collection.collectionName}`);
        //send status 
        sendStatus =  function(s){
            socket.emit('status',s);
        }
        
        //get chats from mongo collection 
        collection.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err)
            throw err;
            //emit the message
            socket.emit("output", res);
        })


        //handle the input event
        socket.on('input',function(data){
            let { name ,message} = data;

            //check for name and message
            if(name == '' || message =='')
            sendStatus('Body is Empty .')
            else
            collection.insertOne(data, function(){
                client_.emit("output",[data]);

                //sendStatus object
                sendStatus({
                    message:"Message Sent .",
                    clear: true

                })

            })
        })

        //handle clear 
        socket.on("clear",function(data){
            collection.remove({},function(){
                    //emit clear
                    socket.emit('cleared');
            })
            
            
        })


    })

})
