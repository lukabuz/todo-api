const { Client } = require('pg');

module.exports = class PostgresInterface {
    constructor() {
        this.client = new Client({
            user: 'todo',
            host: 'localhost',
            database: 'todo',
            password: 'todo',
            port: 5432,
        });
        this.connect();
        this.client.addListener('connect', () => {
            console.log('Connected to Postgres');
            this.createTodoTable()
            this.createUsersTable();
        });
    }

    makeQuery(query, params) {
        return new Promise(async (resolve, reject) => {
            this.client.query(query, params, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    getAllTodosForuser(userId) {
        return this.makeQuery('SELECT * FROM todos where user_id = $1', [userId]);
    }

    addTodoForUser(userId, task) {
        return this.makeQuery('INSERT INTO todos (user_id, task, completed) VALUES ($1, $2, $3) RETURNING id', [userId, task, false]);
    }

    createTodoTable() {
        return this.makeQuery(
            `CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                task VARCHAR(255) NOT NULL,
                completed BOOLEAN NOT NULL
            )`
        );
    }

    createUsersTable() {
        return this.makeQuery(
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )`
        );
    }

    deleteTodoForUser(userId, id) {
        return this.makeQuery('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, userId]);
    }

    updateTodoForUser(userId, id, completed) {
        return this.makeQuery('UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING id', [completed, id, userId]);
    }

    addUser(username, password) {
        return this.makeQuery('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', [username, password]);
    }

    dropTables() {
        return this.makeQuery('DROP TABLE todos; DROP TABLE users;');
    }

    createBatchOfUsers(users) {
        return this.makeQuery('INSERT INTO users (username, password) VALUES ' + users.map(user => `('${user.username}', '${user.password}')`).join(', ') + ";", []);
    }

    createBatchOfTodos(todos) {
        return this.makeQuery('INSERT INTO todos (user_id, task, completed) VALUES ' + todos.map(todo => `(${todo.userId}, '${todo.task}', ${todo.completed})`).join(', ') + ";", []);
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.end();
    }
}