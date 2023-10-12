const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const salting = 12;

const prisma = new PrismaClient();

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');



app.use(session({
    secret: "Our secret key.",
    resave: false,
    saveUninitialized: false,
  }));



app.use(passport.initialize());
app.use(passport.session());




passport.use(new LocalStrategy({

    usernameField: "username",
    passwordField: "password"

}, async (username, password, done) => {
    try {
        
        const user = await prisma.User.findUnique({
            where: {
                email: username
            }
        });

        if (!user) {
            return done(null, false, { message: "User not found" });
          }

        // compare the stored hashed password with the user's input password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            console.log("whyyyyyyyyyyyyyy")
            return done(null, user);
        } else {
            console.log("incorrect message");
            return done(null, false, {message: "incorrect password"});
        }

    } catch (error) {
        
        console.error(error);
        
        return done(error);
    }
}));


// serializing the cookies
passport.serializeUser((user, done) => {
    console.log("User serialized: ", user);
    done(null, user.user_id);
})


// deserializing the cookies
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.User.findUnique({
            where : {
                user_id: id
            }
        });

        console.log("User deserialized: ", user);
        done(null, user);

    } catch (error) {
        
        console.error(error);
        
        done(error);
    }
});






// render our home page
app.get("/", (req, res) => {
    res.render("home");
});

// render our login page
app.get("/login", (req, res) => {
    res.render("login");
});

// render our register page
app.get("/register", (req, res) => {
    res.render("register");
});


// render our secrets page
app.get("/secrets", (req, res) => {
    console.log('Is authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
        res.render("secrets");
    }else {
        res.redirect("/login");
    }
});


// post register
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, salting); // hashing and salting user's password
  
      const existingUser = await prisma.User.findUnique({
        where: {
          email: username
        }
      });
  
      if (existingUser) {
        // If a user with the same email already exists, send an error response
        res.status(400).json({ message: "User already exists" });
        return;
      }
  
      const newUser = await prisma.User.create({
        data: {
          email: username,
          password: hashedPassword, // replaces user's password with hashed password
        },
      });

      req.login(newUser, function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error occurred while creating the user" });
        }
        return res.status(200).redirect("/secrets");
      });

  
    //   res.status(200).redirect("/secrets");
    
    } catch (error) {
      if (error.code === "InvalidInputError") {
        res.status(400).json({ message: "Invalid input" + error.message });
      } else {
        console.log(error);
        res.status(500).json({ message: "Error occurred while creating the user" });
        // res.redirect("/register");  // redirecting the user to the register page
      }
    }
  });

app.get("/logout", (req, res) => {
    req.logout(function(err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error occurred while logging out" });
      }
    });
    res.redirect("/");
});



// post login
app.post("/login", passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  }));




app.listen(5000, () => {
    console.log("Server is running on port 5000");
});