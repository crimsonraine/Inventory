const express = require("express");
const db = require('../db/db_pool');
const path = require("path");
const fs = require("fs");
const { requiresAuth } = require('express-openid-connect');

let inventoryRouter = express.Router();

const read_crafters_all_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_crafters_all.sql"),
    {encoding : "UTF-8"});

// define a route for the wand inventory page
const read_inventory_all_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_inventory_all.sql"),
    {encoding : "UTF-8"});

// define a route for the stuff inventory page
inventoryRouter.get("/", requiresAuth(), (req, res) => {
    console.log('going to inventory');
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
const read_item_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_item.sql"),
    {encoding : "UTF-8"});

// define a route for the item detail page
inventoryRouter.get("/det/:id", requiresAuth(), (req, res) => {
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
const delete_item_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "delete_item.sql"),
    {encoding : "UTF-8"});

inventoryRouter.get("/det/:id/delete", requiresAuth(), (req, res) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/inventory");
        }
    });
})

// define a route for item Create
const create_item_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "create_item.sql"),
    {encoding : "UTF-8"});

inventoryRouter.post("/", requiresAuth(), (req, res) => {
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
const update_item_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "update_item.sql"),
    {encoding : "UTF-8"});

inventoryRouter.post("/det/:id", requiresAuth(), (req, res) => {
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

module.exports = inventoryRouter;