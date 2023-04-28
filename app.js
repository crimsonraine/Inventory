const db = require('./db/db_pool');
const logger = require("morgan");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');

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

const read_countries_all_sql = `
    SELECT 
        country_id, country_name
    FROM
        countries
    ORDER BY country_name;
`

// define a route for the wand inventory page
const read_crafters_page_sql = `
    SELECT 
        crafter_id, CONCAT(crafter_first_name, ' ', crafter_last_name) AS name,
        crafters.country_id, country_name, addid
    FROM
        crafters
    JOIN countries
        ON crafters.country_id = countries.country_id
    WHERE
        addid is NULL
    OR
        addid = ?
    ORDER BY crafters.crafter_last_name;
`
app.get("/crafters", requiresAuth(), (req, res) => {
    db.execute(read_crafters_page_sql, [req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            db.execute(read_countries_all_sql, (error2, results2) => {
                if (error2)
                    res.status(500).send(error2);
                else {
                    let data = {crafter_display: results, country_list: results2, user_info: req};
                    res.render('crafters', data); 
                }
            });
        }
    });
});

// unpartner with crafter
const unpartner_crafter = `
    DELETE 
    FROM
        crafters
    WHERE
        crafter_id = ?
    AND
        (addid is NULL
    OR
        addid = ?)
`
app.get("/crafters/:id/delete", requiresAuth(), (req, res) => {
    db.execute(unpartner_crafter, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/crafters");
        }
    });
})

// define a route for item Create
const partner_crafter = `
INSERT INTO crafters
    (crafter_first_name, crafter_last_name, country_id, addid)
VALUES 
    (?, ?, ?, ?);
`
app.post("/crafters", requiresAuth(), (req, res) => {
    db.execute(partner_crafter, [req.body.firstNameInput, req.body.lastNameInput, req.body.countryInput, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/crafters`);
        }
    });
})

const read_crafters_all_sql = `
    SELECT 
        crafter_id, CONCAT(crafter_first_name, ' ', crafter_last_name) AS name, addid
    FROM
        crafters
`

// define a route for the wand inventory page
const read_inventory_all_sql = `
    SELECT 
        id, core, wood, length, flexibility, notes,
        CONCAT(crafter_first_name, ' ', crafter_last_name) AS name, wands.crafter_id
    FROM
        wands
    JOIN crafters
        ON crafters.crafter_id = wands.crafter_id
    WHERE
        userid = ?
    ORDER BY crafters.crafter_last_name;
`
// define a route for the stuff inventory page
app.get("/inventory", requiresAuth(), (req, res) => {
    db.execute(read_inventory_all_sql, [req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            // res.render('inventory', { results }); former before dropdown
            db.execute(read_crafters_all_sql, (error2, results2) => {
                if (error2)
                    res.status(500).send(error2);
                else {
                    let data = {wands_list: results, crafters_list: results2, user_info: req};
                    res.render('inventory', data); 
                }
            });
        }
    });
});

// define a route for the item detail page
const read_item_sql = `
    SELECT 
    id, core, wood, length, flexibility, notes,
    CONCAT(crafter_first_name, ' ', crafter_last_name) AS name, wands.crafter_id
    FROM
        wands
    JOIN crafters
        ON crafters.crafter_id = wands.crafter_id
    WHERE
        id = ?
    AND
        userid = ?
`
// define a route for the item detail page
app.get("/inventory/det/:id", requiresAuth(), (req, res) => {
    db.execute(read_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No item found with id = "${req.params.id}"`); // NOT FOUND
        else {
            // results[0]['id'] = req.params.id; // for some reason, my id would've been undefined otherwise; this solves it - Kim
            // data's object structure: 
            //  { item: ___ , quantity:___ , description: ____ } - figured out above line of code form this dict
            // res.render('det', data); // before drop down
            db.execute(read_crafters_all_sql, (error2, results2) => {
                if (error2)
                    res.status(500).send(error2);
                else {
                    let data = {wand_info: results[0], crafters_list: results2};
                    res.render('det', data);
                }
            });
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
    AND
        userid = ?
`
app.get("/inventory/det/:id/delete", requiresAuth(), (req, res) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
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
    (core, wood, length, flexibility, notes, crafter_id, userid)
VALUES 
    (?, ?, ?, ?, ?, ?, ?);
`
app.post("/inventory", requiresAuth(), (req, res) => {
    db.execute(create_item_sql, [req.body.core, req.body.wood, req.body.length, req.body.flex, req.body.notes, req.body.crafter, req.oidc.user.email], (error, results) => {
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
        crafter_id = ?,
        notes = ?
    WHERE
        id = ?
    AND
        userid = ?
`
app.post("/inventory/det/:id", requiresAuth(), (req, res) => {
    db.execute(update_item_sql, [req.body.core, req.body.wood, req.body.length, req.body.flex, req.body.crafter, req.body.notes, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            // db.execute(read_crafters_all_sql, (error2, results2) => {
            //     if (error2)
            //         res.status(500).send(error2);
            //     else {
            //         let data = {wands_list: results, crafters_list: results2};
            //         res.render(`/inventory/det/${req.params.id}`, data); 
            //     }
            // });
            res.redirect(`/inventory/det/${req.params.id}`);
        }
    });
})

// start the server
app.listen(port, () => {
    console.log(`App server listening on ${port}. (Go to http://localhost:${port})`);
});

// npx nodemon app.js (node package executer)