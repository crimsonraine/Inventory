const db = require('./db/db_pool');
const logger = require("morgan");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');

//set up the server
const express = require("express");
const helmet = require("helmet");
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

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

const port = process.env.PORT || 8080;

// Configure Express to use EJS
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// define middleware that logs all incoming requests
// express applies middleware and handlers 
app.use(logger("dev"));
// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));
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

// define a route for the stuff inventory page
const read_stuff_all_sql = `
    SELECT 
        id, core, wood, length, flexibility, notes
    FROM
        wands
`
// define a route for the stuff inventory page
app.get("/inventory", (req, res) => {
    db.execute(read_stuff_all_sql, (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.render('inventory', { results });
        }
    });
});

// define a route for the item detail page
const read_item_sql = `
    SELECT 
    core, wood, length, flexibility, notes
    FROM
        wands
    WHERE
        id = ?
`
// define a route for the item detail page
app.get("/inventory/det/:id", (req, res) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No item found with id = "${req.params.id}"`); // NOT FOUND
        else {
            let data = results[0]; // results is still an array
            data['id'] = req.params.id; // for some reason, my id would've been undefined otherwise; this solves it - Kim
            // data's object structure: 
            //  { item: ___ , quantity:___ , description: ____ } - figured out above line of code form this dict
            res.render('det', data);
        }
    });
});

// define a route for item DELETE
const delete_item_sql = `
    DELETE 
    FROM
        wands
    WHERE
        id = ?
`
app.get("/inventory/det/:id/delete", (req, res) => {
    db.execute(delete_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/inventory");
        }
    });
})

// define a route for item Create
const create_item_sql = `
INSERT INTO wands 
    (core, wood, length, flexibility, notes)
VALUES 
    (?, ?, ?, ?, ?);
`
app.post("/inventory", (req, res) => {
    db.execute(create_item_sql, [req.body.core, req.body.wood, req.body.length, req.body.flex, req.body.notes], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/inventory/det/${results.insertId}`);
        }
    });
})

// define a route for item UPDATE
const update_item_sql = `
    UPDATE
        wands
    SET
        core = ?,
        wood = ?,
        length = ?,
        flexibility = ?,
        notes = ?
    WHERE
        id = ?
`
app.post("/inventory/det/:id", (req, res) => {
    db.execute(update_item_sql, [req.body.core, req.body.wood, req.body.length, req.body.flex, req.body.notes, req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/det/${req.params.id}`);
        }
    });
})

// start the server
app.listen(port, () => {
    console.log(`App server listening on ${port}. (Go to http://localhost:${port})`);
});