const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const expressValidator = require("express-validator");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/database");

mongoose.connect(config.database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
let db = mongoose.connection;

db.once("open", function () {
    console.log("Connected to MongoDB");
});

db.on("error", function (err) {
    console.log(err);
});

const app = express();

let Article = require("./models/article");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: "keyboard cat",
        resave: true,
        saveUninitialized: true,
    })
);

app.use(require("connect-flash")());
app.use(function (req, res, next) {
    res.locals.messages = require("express-messages")(req, res);
    next();
});

app.use(
    expressValidator({
        errorFormatter: function (param, msg, value) {
            var namespace = param.split("."),
                root = namespace.shift(),
                formParam = root;

            while (namespace.length) {
                formParam += "[" + namespace.shift() + "]";
            }
            return {
                param: formParam,
                msg: msg,
                value: value,
            };
        },
    })
);

require("./config/passport")(passport);

app.use(passport.initialize());
app.use(passport.session());

app.get("*", function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

app.get("/", async function (req, res) {
    try {
        let articles = [];
        
        if (req.query.search) {
            let articlesByBody = await Article.find({ body: new RegExp(req.query.search, 'i')});
            let articlesByTitle = await Article.find({ title: new RegExp(req.query.search, 'i')});

            const uniqueIds = new Set();
            articles = [...articlesByBody, ...articlesByTitle].filter((article, index, all) => {
                const result = !uniqueIds.has(article._id.toString());
                uniqueIds.add(article._id.toString());
                return result;
            });
        } else {
            articles = await Article.find({});
        }
        
        res.render("index", {
            title: "Articles",
            articles: articles,
        });
    } catch (e) {
        console.log(e);
    }
});

let articles = require("./routes/articles");
let users = require("./routes/users");
const article = require("./models/article");
app.use("/articles", articles);
app.use("/users", users);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server started at " + PORT);
});
