process.setMaxListeners(0);

const Database = require('./database');
const http = require('http');
const cronjob = require('node-cron');
const shell = require('shelljs');

global.database = new Database("/home/private/data.db");

(async function () {
    await database.open();

    global.settings = database.get('settings') || database.temp;

    const router = require('./router');
    const bot = require('./bot');

    void bot();

    cronjob.schedule('*/35 * * * *', () => {
        shell.exec('pm2 restart 0');
        console.log('running this task every 35 minutes');
    });

    http.createServer(router).listen(8080);
})();
