const db = require("./db_connection");

/**** CLEANUP ****/
const drop_stuff_table_sql = "DROP TABLE IF EXISTS `wands`;"
db.execute(drop_stuff_table_sql);
db.execute("DROP TABLE IF EXISTS `crafters`;");
db.execute("DROP TABLE IF EXISTS `countries`;");

/**** TABLES  ****/

// COUNTRIES
const create_country_table_sql = `
    CREATE TABLE countries (
        country_id INT NOT NULL AUTO_INCREMENT,
        country_name VARCHAR(45) NOT NULL,
        PRIMARY KEY (country_id)
    );
`
db.execute(create_country_table_sql);

const insert_countries_table_sql = `
    INSERT INTO countries 
        (country_name)
    VALUES 
        (?);
`
db.execute(insert_countries_table_sql, ['England']);
db.execute(insert_countries_table_sql, ['Ireland']);
db.execute(insert_countries_table_sql, ['United States of America']);

const read_countries_table_sql = "SELECT * FROM countries";

db.execute(read_countries_table_sql,
    (error, results) => {
        if (error)
        throw error;

        console.log("Table 'countries' initialized with:")
        console.log(results);
    });

// CRAFTERS
const create_crafters_table_sql = `
    CREATE TABLE crafters (
        crafter_id INT NOT NULL AUTO_INCREMENT,
        crafter_first_name VARCHAR(45) NULL,
        crafter_last_name VARCHAR(45) NOT NULL,
        country_id INT NULL,
        userid VARCHAR(50) NULL,
        PRIMARY KEY (crafter_id),
        INDEX country_id_idx (country_id ASC),
        CONSTRAINT country_id
            FOREIGN KEY (country_id)
            REFERENCES countries (country_id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
    );
`
db.execute(create_crafters_table_sql);

const insert_crafters_table_sql = `
    INSERT INTO crafters 
        (crafter_first_name, crafter_last_name, country_id)
    VALUES 
        (?, ?, ?);
`

db.execute(insert_crafters_table_sql, ['Garrick', 'Ollivander', '1']);
db.execute(insert_crafters_table_sql, ['Mykew', 'Gregorovitch', '1']);
db.execute(insert_crafters_table_sql, ['Jimmy', 'Kiddell', '1']);
db.execute(insert_crafters_table_sql, ['Isolt', 'Sayre', '2']);
db.execute(insert_crafters_table_sql, ['Violetta', 'Beauvais', '3']);
db.execute(insert_crafters_table_sql, ['Johannes', 'Jonker', '3']);
db.execute(insert_crafters_table_sql, ['Thiago', 'Quintana', '3']);
db.execute(insert_crafters_table_sql, ['Shikoba', 'Wolfe', '3']);
db.execute(`
    INSERT INTO crafters 
        (crafter_first_name, crafter_last_name)
    VALUES 
        (?, ?);
` , ['Antioch', 'Peverell']);

const read_crafters_table_sql = "SELECT * FROM crafters";

db.execute(read_crafters_table_sql,
    (error, results) => {
        if (error)
        throw error;

        console.log("Table 'crafters' initialized with:")
        console.log(results);
    });

// WANDS
const create_stuff_table_sql = `
    CREATE TABLE wands (
        id INT NOT NULL AUTO_INCREMENT,
        core VARCHAR(45) NOT NULL,
        wood VARCHAR(150) NOT NULL,
        length DOUBLE NULL,
        flexibility VARCHAR(150) NULL,
        notes VARCHAR(150) NULL,
        crafter_id INT NULL,
        userid VARCHAR(50) NULL,
        PRIMARY KEY (id),
        INDEX crafter_id_idx (crafter_id ASC),
        CONSTRAINT crafter_id
            FOREIGN KEY (crafter_id)
            REFERENCES crafters (crafter_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );
`
db.execute(create_stuff_table_sql);

/**** Create some sample items ****/

const insert_stuff_table_sql = `
    INSERT INTO wands 
        (core, wood, length, flexibility, notes, crafter_id, userid)
    VALUES 
        (?, ?, ?, ?, ?, ?, ?);
`
db.execute(insert_stuff_table_sql, ['Dragon Heartstring', 'Black Walnut', '9', 'Surprisingly swishy', 'Not a fit for many of the past clients so far. Fitting for a fuller personality. - G.O.', 1, 'kimni25@bergen.org']);

db.execute(insert_stuff_table_sql, ['Phoenix Feather', 'Sandalwood', '11.5', 'Brittle', "It's a classic, although quite hard to tame and personalise. A very rare core type. - G.O.", 2, 'kimni25@bergen.org']);

db.execute(insert_stuff_table_sql, ['Unicorn Hair', 'Rowan', '11.5', 'Brittle', "Renders most defensive charms strong and difficult to break by way of the wood. - G.O.", 3, 'kimni25@bergen.org']);

const read_stuff_table_sql = "SELECT * FROM wands";

db.execute(read_stuff_table_sql,
    (error, results) => {
        if (error)
        throw error;

        console.log("Table 'wands' initialized with:")
        console.log(results);
    });

db.end();