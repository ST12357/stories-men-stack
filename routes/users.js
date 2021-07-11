const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

let User = require("../models/user");

router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/register", async function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const password2 = req.body.password2;

    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("password2", "Passwords do not match").equals(
        req.body.password
    );

    let errors = req.validationErrors();
    if (errors) {
        return res.render("register", {
            errors: errors,
        });
    }

    let user = await User.findOne({ email: email });
    if (user) {
        return res.render("register", {
            errors: [{ msg: "Email Already Exists" }],
        });
    }

    user = await User.findOne({ username: username });
    if (user) {
        return res.render("register", {
            errors: [{ msg: "Username Already Exists" }],
        });
    }

    let newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
    });

    try {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(newUser.password, salt);
        newUser.password = hash;
        await newUser.save();
        req.flash("success", "You are now registered and can log in");
        res.redirect("/users/login");
    } catch (err) {
        console.log(err);
    }
});

router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", function (req, res, next) {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/users/login",
        failureFlash: true,
    })(req, res, next);
});

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "You are Logged Out");
    res.redirect("login");
});

module.exports = router;
