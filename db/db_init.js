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
        PRIMARY KEY (id)
    );
`
db.execute(create_stuff_table_sql);

/**** Create some sample items ****/

const insert_stuff_table_sql = `
    INSERT INTO wands 
        (core, wood, length, flexibility) 
    VALUES 
        (?, ?, ?, ?);
`
db.execute(insert_stuff_table_sql, ['Dragon Heartstring', 'Black Walnut', '9', 'Surprisingly swishy']);

db.execute(insert_stuff_table_sql, ['Phoenix Feather', 'Sandalwood', '11.5', 'Brittle']);

const read_stuff_table_sql = "SELECT * FROM wands";

db.execute(read_stuff_table_sql,
    (error, results) => {
        if (error)
        throw error;

        console.log("Table 'wands' initialized with:")
        console.log(results);
    });

db.end();