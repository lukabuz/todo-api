const express = require('express')
const app = express()
const port = 3000
const { body, validationResult } = require('express-validator');
const PostgresInterface = require('./PostgresInterface');
const jwt = require('jsonwebtoken');


app.use(express.json());

const pg = new PostgresInterface()

const jwtSecret = 'secret';
const jwtExpiration = '1h';

function createJWT(id) {
    return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiration });
}

// jwt validation middleware
function validateJWT(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userId = decoded.id;
        next();
    });
}

// get todos for user
app.get('/todos', validateJWT, async (req, res) => {
    const userId = req.userId;
    const todos = await pg.getAllTodosForuser(userId);
    res.json(todos.rows);
});

// registration rout
app.post('/register', [
    body('username').isLength({ min: 1 }),
    body('password').isLength({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    try {
        const result = await pg.addUser(username, password);
        const token = createJWT(result.rows[0].id);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// login route
app.post('/login', [
    body('username').isLength({ min: 1 }),
    body('password').isLength({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    try {
        const result = await pg.getUser(username, password);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = createJWT(result.rows[0].id);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(
    '/todo',
    [body('task').isString().isLength({ min: 1, max: 255 }), validateJWT],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { task } = req.body;
        pg.addTodoForUser(req.userId, task)
            .then(result => {
                res.json({ id: result.rows[0].id });
            }
            )
            .catch(err => {
                res.status(500).json({ error: err.message });
            }
            );
    })

app.put(
    '/todo/:id',
    [body('completed').isBoolean(),
        validateJWT],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { id } = req.params;
        const { completed } = req.body;
        pg.updateTodoForUser(req.userId, id, completed)
            .then(result => {
                res.json({ id: result.rows[0].id });
            }
            )
            .catch(err => {
                res.status(500).json({ error: err.message });
            }
            );
    })



app.delete('/todo/:id', [validateJWT], (req, res) => {
    const { id } = req.params;
    pg.deleteTodoForUser(req.userId, id)
        .then(result => {
            res.json({ id: result.rows[0].id });
        }
        )
        .catch(err => {
            res.status(500).json({ error: err.message });
        }
        );
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
