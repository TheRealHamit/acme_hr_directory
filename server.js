const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory_db')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))

app.get("/api/employees", async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees ORDER BY name ASC;
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (err) {
        next(err)
    }
})

app.get("/api/departments", async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM departments ORDER BY name ASC;
        `
        const response = await client.query(SQL)
        res.send(response.rows)

    } catch (err) {
        next(err)
    }
})

app.post("/api/employees", async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO employees(name, department_id) VALUES($1, $2)
        RETURNING *;
        `
        const response = await client.query(SQL, [req.body.name, req.body.department_id])
        res.send(response.rows)
    } catch (err) {
        next(err)
    }
})

app.delete("/api/employees/:id", async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM employees
        WHERE id=$1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (err) {
        next(err)
    }
})

app.put("/api/employees/:id", async (req, res, next) => {
    try {
        const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id=$3
        RETURNING *;
        `
        const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id])
        res.send(response.rows[0])
    } catch (err) {
        next(err)
    }
})

async function init() {
    await client.connect()
    console.log("Connected to database.")
    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `
    await client.query(SQL)
    console.log("Tables created.")
    SQL = `
    INSERT INTO departments(name) VALUES('sports');
    INSERT INTO departments(name) VALUES('grocery');
    INSERT INTO departments(name) VALUES('electronics');
    INSERT INTO employees(name, department_id) VALUES ('Bob', (
        SELECT id FROM departments WHERE name='sports'
    ));
    INSERT INTO employees(name, department_id) VALUES ('Joe', (
        SELECT id FROM departments WHERE name='grocery'
    ));
    INSERT INTO employees(name, department_id) VALUES ('Mary', (
        SELECT id FROM departments WHERE name='electronics'
    ));
    `
    await client.query(SQL)
    console.log("tables seeded")
    const port = process.env.PORT || 3000
    app.listen(port), () => console.log(`listening on port ${port}`)
}

init()