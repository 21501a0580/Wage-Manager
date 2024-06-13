const express = require("express")
const app = express();
const userApp=require('./APIs/userapi')
const mongoClient= require('mongodb').MongoClient;
const cors =require('cors')

app.use(cors())
const dbUrl="mongodb+srv://21501a0580:bharath+8510@cluster0.sxwaaj9.mongodb.net/";
mongoClient.connect(dbUrl)
.then((client)=>{
    const dbObj = client.db('work-helper');
    const usersCollection = dbObj.collection('users');
    app.set('userCollection',usersCollection);
    console.log('Connected toDataBase Successfully')
})
app.use('/userapi',userApp);

app.use((err,req,res,next)=>{
    res.send({message:"ERROR Caught",payload:err});
})


const port=4000;
app.listen(port,console.log(`http://localhost:${port}`))