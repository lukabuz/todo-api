const benchmark = require('nodemark');
const PostgresInterface = require('./PostgresInterface');

function makeRandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const seedTodos = async () => {
    const pg = new PostgresInterface();
    const userIdCap = 1197048;
    // add a million todos to the database
    for (let j = 0; j < 10; j++) {
        let todos = [];
        console.time(`Adding chunk ${j + 1} of ${10}`);
        for (let i = 0; i < 1000000; i++) {
            // get a random number between 0 and userIdCap
            const userId = Math.floor(Math.random() * userIdCap);
            const task = makeRandomString(10);
            todos.push({ userId, task, completed: Math.random() >= 0.5 });
        }
        await pg.createBatchOfTodos(todos);
        console.timeEnd(`Adding chunk ${j + 1} of ${10}`);
    }
}

const seedUsers = async () => {
    const pg = new PostgresInterface();
    // add a million users to the database
    const users = [];
    for (let i = 0; i < 1000000; i++) {
        const username = makeRandomString(25);
        const password = makeRandomString(25);
        users.push({ username, password });
    }
    let chunks = chunkArray(users, 1000);
    for (let i = 0; i < chunks.length; i++) {
        console.time(`Adding chunk ${i + 1} of ${chunks.length}`);
        await pg.createBatchOfUsers(chunks[i]);
        console.timeEnd(`Adding chunk ${i + 1} of ${chunks.length}`);
    }

}

const chunkArray = (array, chunkSize) => {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunkedArray.push(array.slice(i, i + chunkSize));
    }
    return chunkedArray;
}

seedTodos()

