const express = require("express");
const db = require('../db/db_pool'); // require('../db/db_pool_promise');
const path = require("path");
const fs = require("fs");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const mysql = require("mysql2/promise");

let craftersRouter = express.Router();

const read_countries_all_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_countries_all.sql"),
    {encoding : "UTF-8"});

// define a route for the wand inventory page
const read_crafters_page_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_crafters_page.sql"),
    {encoding : "UTF-8"});

craftersRouter.get("/", requiresAuth(), (req, res) => {
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
const unpartner_crafter = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "unpartner_crafter.sql"),
    {encoding : "UTF-8"});

craftersRouter.get("/:id/delete", requiresAuth(), (req, res) => {
    db.execute(unpartner_crafter, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/crafters");
        }
    });
})

// define a route for item Create
const partner_crafter = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "partner_crafter.sql"),
    {encoding : "UTF-8"});

craftersRouter.post("/", requiresAuth(), (req, res) => {
    db.execute(partner_crafter, [req.body.firstNameInput, req.body.lastNameInput, req.body.countryInput, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/crafters`);
        }
    });
})

module.exports = craftersRouter;