const db = require('./db/db_pool');
const logger = require("morgan");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const mysql = require("mysql2/promise");

//set up the server
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const app = express();

const dotenv = require('dotenv');
dotenv.config();

//Configure Express to use certain HTTP headers for security
//Explicitly set the CSP to allow certain sources
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdnjs.cloudflare.com', 'cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js', "/autoinit.js"],
            styleSrc: ["'self'", 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com',
                'fonts.googleapis.com/css2?family=Moon+Dance&display=swap', 'fonts.googleapis.com/css2?family=Passions+Conflict&display=swap'],
            fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com',
                'fonts.googleapis.com/css2?family=Moon+Dance&display=swap', 'fonts.googleapis.com/css2?family=Passions+Conflict&display=swap']
        }
    }
}));

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})
// use the user's email (req.oidc.user.email) as a unique identifier

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

const port = process.env.PORT || 8080;

// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// define middleware that logs all incoming requests
// express applies middleware and handlers 
app.use(logger("dev"));
// define middleware that serves static resources in the public directory
app.use(express.static(path.join(__dirname, 'public'))); // can be janky
// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use(express.urlencoded({ extended: false }));

// req.isAuthenticated is provided from the auth router
app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// define a route for the default home page
app.get("/", (req, res) => {
    res.render('index');
});

let craftersRouter = require("./routes/crafters.js");
app.use("/crafters", requiresAuth(), craftersRouter);

let inventoryRouter = require("./routes/inventory.js");
app.use("/inventory", requiresAuth(), inventoryRouter);

// start the server
app.listen(port, () => {
    console.log(`App server listening on ${port}. (Go to http://localhost:${port})`);
});

// npx nodemon app.js (node package executer)