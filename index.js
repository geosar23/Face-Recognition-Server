const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require('knex');

//Connect to DB
const DB = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'postgres5991',
      database : 'Face-Recognition-App'
    }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

//Init Server
app.listen(5000, () => {
    console.log("Server online on port 5000")
})

//Get requests
app.get("/", (req, res) => {
    res.send("Server is running on port 5000");
});

app.get("/users", async (req, res) => {
    try {        
        const users = await DB.select('*').from('users');

        if(!users){
            throw new Error("Users not found");
        }

        return res.json(users)
        
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
})

app.get("/user/:id", async (req, res) => {
    try {

        const { id } = req.params;
        
        const user = await DB.select('*').from('users').where('id', id).first();

        if(!user){
            throw new Error("User not found");
        }

        return res.json(user)
        
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
})

//Post requests
app.post("/signin", async(req, res) => {
    try {

        if(!req.body || !req.body.email || !req.body.password) {
            throw new Error("Request parameters are missing");
        }

        const email = req.body.email;
        const password = req.body.password;

        // Check if the user and login entry with the provided email exists in the database
        const user = await DB('users').where({ email }).first();
        const login = await DB('login').where({ email }).first();

        if(!user || !login) {
            return res.json({
                success:false,
                message: "Incorrect credentials1"
            })
        }

        bcrypt.compare(password, login.hash, async function(err, answer) {
            if(!answer){
                return res.json({
                    success:false,
                    message: "Incorrect credentials2"
                })
            }

            // Update the user's entries count
            const updatedUser = { ...user, entries: parseInt(user.entries) + 1 };

            // Update the user's entries count in the database
            await DB('users').where({ email }).update(updatedUser);

            return res.json({
                user: updatedUser,
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
    
        const userWithEmail = await DB('users').where({ email }).first();
        const userWithName = await DB('users').where({ name }).first();

        if (userWithEmail || userWithName) {
            return res.json({
                success: false,
                message: userWithEmail ? "Email already in use" : "Name already in use"
            });
        }
    
        const hashedPassword = await hashPassword(password);
        if(!hashedPassword) {
            throw new Error("Password hashing failed");
        }

        let newUser = {
            name: name,
            email: email,
            joined: new Date()
        }

        const newLogin = {
            hash: hashedPassword,
            email: email
        }

        //Knex transactions make sure that if one DB operation fails, 
        //others fail as well so we do not add non completed entries in our database
        await DB.transaction(trx => {

            //Insert new login entry
            trx.insert(newLogin).into('login').returning('email').then((email) => {

                //Insert new user entry
                return trx('users').returning('*').insert(newUser);
            }).then(trx.commit).catch(trx.rollback);
        })

        //Fetch new User and return;
        newUser = await DB('users').where({ email }).first();
        
        return res.json({
            success: true,
            user: newUser
        });
        
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
});

//Put requests
app.put("/image", async (req, res) => {
    try {

        const { id, score } = req.body;

        const user = await DB.select('*').from('users').where('id', id).first();

        if(!user) {
            throw new Error("User not found");
        }
        
        const updatedScore = parseInt(user.score) + score;

        const updatedUser = {...user, score:updatedScore};

        // Update the user's entries count in the database
        await DB('users').where({ id }).update(updatedUser);

        return res.json({
            success: true,
            score: updatedScore
        });
     
    } catch (error) {
        console.log(error);
        return res.send({success: false, message:error.message});
    }
})

app.delete("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the user with the given ID exists in the database
        const user = await DB('users').where({ id }).first();

        if (!user) {
            return res.status(404).json("User not found");
        }

        // Delete the user from the database
        await DB('users').where({ id }).del();

        return res.json({ success: true });

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
});


//Helper functions
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