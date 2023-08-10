const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

//Init Database
const database = {
    users: [
        {
            id: "1",
            name: "superadmin",
            email: "superadmin@gmail.com",
            password: "superadmin",
            entries: 0,
            score: 0,
            joined: new Date()
        },
        {
            id: "2",
            name: "admin",
            email: "admin@gmail.com",
            password: "admin",
            entries: 0,
            score: 0,
            joined: new Date()
        },
        {
            id: "3",
            name: "test-user1",
            email: "test-user1@gmail.com",
            password: "test-user1",
            entries: 0,
            score: 0,
            joined: new Date()
        },
    ]
}

//Init Server
app.listen(5000, () => {
    console.log("Server online on port 5000")
})

//Get requests
app.get("/", (req, res) => {
    res.send("Server is running on port 5000");
});

app.get("/users", (req, res) => {
    res.send(database.users);
})

app.get("/user/:id", (req, res) => {
    const { id } = req.params;

    let found = false;
    
    database.users.forEach(user => {
        if(user.id === id) {
            found = true;
            return res.json(user);
        }
    })

    if(!found){
        res.status(404).json("not found");
    }
})

//Post requests
app.post("/signin", (req, res) => {
    try {

        if(!req.body || !req.body.email || !req.body.password) {
            throw new Error("Request parameters are missing");
        }

        const email = req.body.email;
        const password = req.body.password;

        const found = database.users.find(user => user.email === email)

        if(!found) {
            return res.json({
                success:false,
                message: "Incorrect credentials"
            })
        }

        console.log("found user:", found)

        if(password === found.password) {
            return res.json({
                user: found,
                success:true
            });
        }

        bcrypt.compare(password, found.password, function(err, answer) {
            if(!answer){
                return res.json({
                    success:false,
                    message: "Incorrect credentials"
                })
            }

            return res.json(found)
        });

    } catch (error) {
        console.log({
            success: false,
            route:"/signin",
            message: error,
            error: error,
        })
        return res.send({success: false});
    }
})

app.post("/register", async(req, res) => {

    try {

        if(!req.body || !req.body.email || !req.body.password || !req.body.name ){
            res.json({
                success: false,
                message: "Incorrect parameters"
            });
        }
    
        const { email, name, password } = req.body;
    
        let hashedPassword = password;
        bcrypt.hash(password, null, null, function(err, hash) {
            console.log("hash",hash)
            hashedPassword = hash;
        });
    
        console.log("hashed password",hashedPassword)
    
        let exists = false
        let reason = "";
        for(const user of database.users) {
            if(email === user.email) {
                exists = true;
                reason = "email already in use"
            }
    
            if(name === user.name) {
                exists = true;
                reason = "name already in use"
            }
        }
    
        if(exists) {
            return res.json({
                success: false,
                message: reason
            })
        }
    
        if(!exists){
            const counter = database.users?.length || 0; 
    
            const newUser = {
                id: `${counter+1}`,
                name: name,
                password: hashedPassword,
                email: email,
                entries: 0,
                score: 0,
                joined: new Date()
            }
    
            database.users.push(newUser);
    
            return res.json({
                success: true,
                user: newUser
            })
        }
        
    } catch (error) {
        console.log({
            success: false,
            route:"/register",
            message: error,
            error: error,
        })
        return res.send({success: false});
    }
})

app.post("/image", (req, res) => {

    const { id } = req.body;

    let found = false;

    database.users.forEach(user => {
        if(user.id === id){
            found = true;
            user.entries++
            return res.json(user.entries);
        }
    })

    if(!found) {
        res.status(400).json('not found');
    }
})

// //---------------------------------------------------------
// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });