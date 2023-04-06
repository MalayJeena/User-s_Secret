const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


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






app.listen(5000, () => {
    console.log("Server is running on port 5000");
});