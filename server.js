const express = require('express');
const cors = require('cors');
const basicAuth = require('basic-auth');
const path = require('path');
const fs = require('fs');
// const exec = require('child_process').exec;
const config = require('./config.json');
const mysqldump = require('mysqldump');
const tar = require('tar');

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

/*
const sendFile = (req, res, filename) => {
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename= "${filename}"`);
  res.send('TEST');
};
*/

function mkdir(dir, mode) {
  try{
    fs.mkdirSync(dir, mode);
  } catch(e) {
    if(e.errno === 34) {
      mkdir(path.dirname(dir), mode);
      mkdir(dir, mode);
    }
  }
}

const compress = (sitename, sql, dest) => {
  const siteDir = config.defaults.path.sites + sitename + '/';
  const pubDir = siteDir + config.defaults.path.public + '/';
    // const logDir = siteDir + config.defaults.path.logs + '/';
  return tar.c({
    gzip: true,
  }, [pubDir, sql]);
};

const cleanup = (sitename) => {
  console.log('cleanup:', sitename);
  const destDir = config.defaults.path.backup + sitename + '/';
  const sqlFile = destDir + sitename + '.sql';
  return fs.unlinkSync(sqlFile);
};

// TODO error handling
app.get('/backup/:site', auth, (req, res) => {
  const sitename = req.params.site;
  const site = config.sites[sitename];
  const destDir = config.defaults.path.backup + sitename + '/';
  // const timestamp = Date.now();
  const sqlFile = destDir + sitename + '.sql';
  mkdir(destDir);
  // res.json(args))
  console.log('sql:', sqlFile);
  mysqldump({
    host: config.host,
    user: config.user,
    password: config.password,
    database: site.db,
    dest: sqlFile,
  }, (err) => {
    console.log('mysql done:', sqlFile);
    if (err !== null) {
      res.json(err);
    } else {
      const tarfile = destDir + sitename + '.tar.gz';
      console.log('tar:', tarfile);
      const task = compress(sitename, sqlFile, tarfile).pipe(res);
      task.on('finish', () => cleanup(sitename));
    }
  });
});

app.get('/*', (req, res) => {
  res.send('welcome to the api');
});

module.exports = {
  app: app,
};
