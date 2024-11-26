require('dotenv').config()
const mysql2 = require('mysql2');
module.exports =
{
  "development": {
    "username": "root",
    "password": null,
    "database": "sales-admin",
    "host": "localhost",
    "dialect": "mysql",
    "dialectModule" : mysql2
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mysql",
    "dialectModule" : mysql2,
    "port": 19057
  }
}
