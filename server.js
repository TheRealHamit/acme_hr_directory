const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory_db')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))