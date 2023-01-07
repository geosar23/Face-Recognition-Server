const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

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
app.listen(3003, () => {
    console.log("Server online on port 3003")
})

//Get requests
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
        res.status(400).json("not found");
    }
})

//Post requests
app.post("/signin", (req, res) => {
    try {

        console.log(req.body)

        if(!req.body || !req.body.email || !req.body.password) {
            throw new Error("Request parameters are missing");
        }

        const email = req.body.email;
        const password = req.body.password;

        let exists = false;
        for(const user of database.users) {
            if( (email === user.email) && (password === user.password) ) {
                exists = true;
                res.json({
                        user,
                    success: true
                });
            }
        }

        if(!exists) {
            res.json({
                success:false,
                message: "Incorrect credentials"
            })
        }
        
    } catch (error) {
        console.log({
            success: false,
            route:"/signin",
            message: error,
            error: error,
        })
        res.send({success: false});
    }
})

app.post("/register", (req, res) => {
    
    if(!req.body || !req.body.email || !req.body.password || !req.body.name ){
        res.json({
            success: false,
            message: "Incorrect parameters"
        });
    }

    const { email, name, password } = req.body;

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
        res.json({
            success: false,
            message: reason
        })
    }

    if(!exists){
        const counter = database.users?.length || 0; 
        database.users.push({
            id: `${counter+1}`,
            name: name,
            password: password,
            email: email,
            entries: 0,
            score: 0,
            joined: new Date()
        })
        res.json({
            success: true,
        })
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