const mysql = require('mysql');

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sales-admin"
});

// conn.connect((err) => {
//     if (err) throw new Error("could not connect database");
//     console.log('database connected succssfully')
// })
conn = 1
module.exports = conn