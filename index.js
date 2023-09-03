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

        const found = database.users.find(user => user.email === email);

        if(!found) {
            return res.json({
                success:false,
                message: "Incorrect credentials"
            })
        }

        bcrypt.compare(password, found.password, function(err, answer) {
            if(!answer){
                return res.json({
                    success:false,
                    message: "Incorrect credentials"
                })
            }

            //before returning the user increase the entries
            found.entries++

            return res.json({
                user: found,
                success:true
            });
        });

    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
})

app.post("/register", async(req, res) => {

    try {

        if(!req.body || !req.body.email || !req.body.password || !req.body.name ){
            return res.json({
                success: false,
                message: "Incorrect parameters"
            });
        }
    
        const { email, name, password } = req.body;
    
        let exists = false
        let reason = "";
        for(const user of database.users) {
            if(name === user.name) {
                exists = true;
                reason = "name already in use"
                break;
            }

            if(email === user.email) {
                exists = true;
                reason = "email already in use"
                break;
            }
        }
    
        if(exists) {
            return res.json({
                success: false,
                message: reason
            })
        }
    
        if(!exists){

            const hashedPassword = await hashPassword(password);
            if(!hashedPassword) {
                throw new Error("Password hashing failed");
            }

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
            console.log(newUser)

            return res.json({
                success: true,
                user: newUser
            })
        }
        
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
})

app.put("/image", (req, res) => {

    const { id, score } = req.body;

    let found = false;

    database.users.forEach(user => {
        if(user.id === id){
            found = true;
            
            const newScore = user.score + score;
            user.score = newScore

            return res.json({
                success: true,
                score: newScore
            })
        }
    })

    if(!found) {
        res.status(400).json('not found');
    }
})

app.post("/user/:id", (req, res) => {

    try {
        const { id } = req.params;

        let foundIndex = -1;
        
        // Find the index of the user with the given ID
        for (let i = 0; i < database.users.length; i++) {
            if (database.users[i].id === id) {
                console.log(database.users[i], i, "found")
                foundIndex = i;
                break;
            }
        }
    
        if (foundIndex === -1) {
            return res.status(404).json("User not found");
        }
    
        // Remove the user from the array using the found index
        database.users.splice(foundIndex, 1);
    
        return res.json({ success: true });
        
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
});

function hashPassword(password) {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, null, null, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
}

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