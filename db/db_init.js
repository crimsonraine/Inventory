// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/

const drop_stuff_table_sql = "DROP TABLE IF EXISTS `wands`;"

db.execute(drop_stuff_table_sql);

/**** Create "stuff" table (again)  ****/

const create_stuff_table_sql = `
    CREATE TABLE wands (
        id INT NOT NULL AUTO_INCREMENT,
        core VARCHAR(45) NOT NULL,
        wood VARCHAR(150) NOT NULL,
        length DOUBLE NULL,
        flexibility VARCHAR(150) NULL,
        notes VARCHAR(150) NULL,
        PRIMARY KEY (id)
    );
`
db.execute(create_stuff_table_sql);

/**** Create some sample items ****/

const insert_stuff_table_sql = `
    INSERT INTO wands 
        (core, wood, length, flexibility, notes)
    VALUES 
        (?, ?, ?, ?, ?);
`
db.execute(insert_stuff_table_sql, ['Dragon Heartstring', 'Black Walnut', '9', 'Surprisingly swishy', 'Not a fit for many of the past clients so far. Fitting for a fuller personality. - G.O.']);

db.execute(insert_stuff_table_sql, ['Phoenix Feather', 'Sandalwood', '11.5', 'Brittle', "It's a classic, although quite hard to tame and personalise. A very rare core type. - G.O."]);

db.execute(insert_stuff_table_sql, ['Unicorn Hair', 'Rowan', '11.5', 'Brittle', "Renders most defensive charms strong and difficult to break by way of the wood. - G.O."]);

const read_stuff_table_sql = "SELECT * FROM wands";

db.execute(read_stuff_table_sql,
    (error, results) => {
        if (error)
        throw error;

        console.log("Table 'wands' initialized with:")
        console.log(results);
    });

db.end();