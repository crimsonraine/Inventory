const db = require('./db/db_connection');
const logger = require("morgan");

//set up the server
const express = require( "express" );
const app = express();
const port = 8080;

// define middleware that logs all incoming requests
// express applies middleware and handlers 
app.use(logger("dev"));
// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.sendFile( __dirname + "/views/index.html" );
} );

// define a route for the stuff inventory page
const read_stuff_all_sql = `
    SELECT 
        id, core, wood, length, flexibility
    FROM
        wands
`
app.get( "/inventory", ( req, res ) => {
    db.execute(read_stuff_all_sql, (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else
            res.send(results);
    });
});

// define a route for the item detail page
const read_item_sql = `
    SELECT 
    core, wood, length, flexibility
    FROM
        wands
    WHERE
        id = ?
`
app.get( "/inventory/det/:id", ( req, res, next ) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else
            res.send(results[0]); // results is still an array
    });
});

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );