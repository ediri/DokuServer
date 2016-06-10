/**
 * Created by Team Cloud Number 9 on 10.05.2016.
 */
var express = require('express');
var path = require('path');
var util = require('util');
var bodyParser = require('body-parser');
var request = require('request');
var _ = require('lodash');
var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var unzip = require('unzip');
var dokustorage = path.join(__dirname, 'dokustorage');

var uploading = multer({
    dest: __dirname + '/public/uploads/',
});

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/dokustorage', express.static('dokustorage'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var port = 8080;


app.get('/dokustorage/:gav([\-\.a-zA-Z\/0-9]+)', function (req, res, next) {
    if (!_.includes(req.params.gav, 'allure-reports')) {
        var files = fs.readdirSync(path.join(dokustorage, req.params.gav));
        res.render('index', {
            paths: files
        });
    } else {
        next();
    }
});

app.get('/dokustorage', function (req, res) {
    var files = fs.readdirSync(dokustorage);
    res.render('index', {
        paths: files
    });
});

app.get('/', function (req, res) {

    res.render('index', {
        paths: ['dokustorage']
    });
});

var uploadAPI = express.Router();

uploadAPI.post('/upload', uploading.single('doku'), function (req, res, next) {
    console.log(req.file.destination);
    console.log(req.file.originalname);
    console.log(req.file.filename);
    console.log(req.file.path);

    var finalPath;
    if (_.includes(req.body.groupId, '.')) {
        var split = req.body.groupId.split('.')
        var createPath = dokustorage;
        _(split).forEach(function (value) {
            var subfolder = path.join(createPath, value)
            fse.ensureDirSync(subfolder);
            createPath = subfolder;
        });
        finalPath = path.join(createPath, req.body.artifactId, req.body.version);
    } else {
        finalPath = path.join(dokustorage, req.body.groupId, req.body.artifactId, req.body.version);
    }
    fse.ensureDirSync(finalPath);

    if (_.includes(req.file.originalname, '.zip')) {
        fs.createReadStream(req.file.path).pipe(unzip.Extract({path: finalPath}));
    }


    res.sendStatus(200);
});

app.use('/api/', uploadAPI);

app.listen(process.env.PORT || port);
console.log('Running on http://localhost:' + port);