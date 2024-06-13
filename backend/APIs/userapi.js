const express = require('express');
const userApp = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const jwt =require('jsonwebtoken');
const bcryptjs = require('bcryptjs')
const { ReturnDocument } = require('mongodb');


userApp.use(bodyParser.json()); 
let userCollection;
userApp.use((req,res,next)=>{
    userCollection = req.app.get('userCollection')
    // console.log(userCollection)
    next();
});

userApp.post('/register',async(req,res)=>{
    let newUser=req.body;
    // console.log(newUser)
    let dbUser = await userCollection.findOne({username:newUser.username})
    if (dbUser !== null)
    {
        return res.send("Username Already Exists")
    }
    // let hashedPassword=await bcryptjs.hash(newUser.password,6);
    // newUser.password=hashedPassword;
    newUser.groups=[];
    await userCollection.insertOne(newUser);
    res.send("SignUp Successfull")
})

userApp.put('/add-group', async (req, res) => {
    let userNewGroup = req.body;
    let groupObj = {};
    await userCollection.findOneAndUpdate(
        { username: userNewGroup.username },
        { $push: { groups: { name: userNewGroup.groupname, ...groupObj } } },
        { returnDocument: "after" }
    );
    res.send({ message: "Group Added", payload: userNewGroup.groupname });
});


userApp.put('/add-member', async (req, res) => {
    let newMember = req.body;
    const { username, groupname, name } = newMember;
    await userCollection.findOneAndUpdate(
        { username: username },
        { $set: { [`groups.$[group].${name}`]: {
            dayCount: 0,
            moneyGiven: {}
        } } },
        { arrayFilters: [{ 'group.name': groupname }],
            returnDocument: "after"
        }
    );
    res.send({ message: "Member Added", payload: newMember });
});



// Add money to a member in a group
userApp.put('/add-money', async (req, res) => {
    let newDetails = req.body;
    let amount = Number(newDetails.amount);
    let time = String(moment().format('DD-MM-YYYY'));
    
    const updateObj = {};
    updateObj[`groups.$[group].${newDetails.name}.moneyGiven.${time}`] = amount;

    await userCollection.findOneAndUpdate(
        { 
            username: newDetails.username,
            'groups.name': newDetails.groupname
        },
        { $set: updateObj },
        {
            arrayFilters: [
                { 'group.name': newDetails.groupname }
            ],
            returnDocument: "after"
        }
    );

    res.send({ message: "Updated Successfully", payload: newDetails });
});



userApp.put('/add-attendance', async (req, res) => {
    let newDetails = req.body;
    let membersArray = newDetails.members;
    
    let updateObject = {};
    membersArray.forEach(member => {
        updateObject[`groups.$[group].${member}.dayCount`] = 1;
    });
    
    await userCollection.findOneAndUpdate(
        { username: newDetails.username },
        { $inc: updateObject },
        {
            arrayFilters: [
                { 'group.name': newDetails.groupname }
            ],
            returnDocument: "after"
        }
    );

    res.send(`Added a Day to members: ${membersArray.join(', ')}`);
});



userApp.post('/login',async(req,res)=>{
    const credObj = req.body;
    let dbuser = await userCollection.findOne({username:credObj.username})
    if(dbuser === null){
        res.send({message:"Invalid Username"})
    }
    else
    {
        let result = (credObj.password === dbuser.password)
        if(result === false)
        {
            res.send({message:"Invalid Password"})
        }
        else
        {
            let signedToken=jwt.sign({username:dbuser.username},'abcdef',{expiresIn:30});
            res.send({message:"Login Successfull",token:signedToken,user:dbuser});
        }
    }
});

userApp.get('/userdashboard',async(req,res)=>{
    let user = await userCollection.findOne({username:req.session.username});
    res.render('userdashboard',{user:user});
})

module.exports=userApp;