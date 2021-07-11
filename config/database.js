const connStr =
    process.env.MONGO_CONN_STR || "mongodb://localhost:27017/MENapp";

module.exports = {
    database: connStr,
    secret: "secrets",
};
