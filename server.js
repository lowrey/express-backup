const express = require('express');
const cors = require('cors');
const basicAuth = require('basic-auth');
const path = require('path');
const exec = require('child_process').exec;
const config = require('config.json');

let app = express();
app.use(cors());

const auth = (req, res, next) => {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };
  let user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };
  if (user.name === 'samhyde' && user.pass === 'Kratom77') {
    return next();
  } else {
    return unauthorized(res);
  };
};

const sendFile = (req, res, filename) => {
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename= "${filename}"`);
    res.send('TEST');
};

app.get('/backup/:site', auth, (req, res) => {
    const site = req.params.site;
    const command = `date`;
    console.log('Executing', command);
    console.log('Config', config.user);
    exec(command, (...args) => res.json(args));
});

app.get('/*', (req, res) => {
  res.send('welcome to the api');
});

module.exports = {
    app: app,
};
