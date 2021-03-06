var bodyParser = require('body-parser');
var colors = require('colors');
var fs = require('fs');
var http = require('http');
var path = require('path');
var express = require('express');

var program = require('commander')
  .version('0.2.3')
  .option('-p, --port <port>', 'specify the port, defaults to 3030', Number, 3030)
  .option('-n, --hostname <hostname>', 'specify the hostname, defaults to 0.0.0.0 (INADDR_ANY)', String, '0.0.0.0')
  .option('-i, --indexPath <indexPath>', 'specify the name of the index directory, defaults to norch-index', String, 'norch-index')
  .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, 'info')
  .option('-s, --logSilent <logSilent>', 'silent mode', String, 'false')
  .parse(process.argv);


var siOptions = {};
siOptions['logSilent'] = program.logSilent;
siOptions['indexPath'] = program.indexPath;
siOptions['logLevel'] = program.logLevel;
//so that you can do var norch = require(norch)({'indexPath':'my-path'})

module.exports = function(options) {
  var norchOptions = {}
  norchOptions['port'] = program.port;
  norchOptions['hostname'] = program.hostname;
  for (var k in options) {
    siOptions[k] = options[k];
    norchOptions[k] = options[k];
  }

  var si = require('search-index')(siOptions);
  var morgan = require('morgan');
  var app = express();
  app.listen(norchOptions.port);
  app.use(morgan('tiny'));
  app.use(express.static(path.join(__dirname,
                                   '../node_modules/norch-bootstrap')));


  var multer = require('multer');
  //to save uploaded files do "app.use(multer({ dest: './tmp/'}));"
  app.use(multer());
  app.use(bodyParser.json());


  //curl --form document=@testdata.json http://localhost:3030/indexer
  //--form facetOn=topics
  app.post('/indexer', function (req, res) {
    var filters = [],
    options = {},
    jsonBatch;
    options.filters = [];
    if (req.body.filterOn)
      options.filters = req.body.filterOn.split(',');
    options.batchName = 'batch' + Date.now();
    if (req.files.document) {
      fs.readFile(req.files.document.path, {'encoding': 'utf8'},
                  function (err, batch) {
                    if (err) {
                      res.status(500).send('Error reading file');
                      return;
                    }
                    options.batchName = req.files.document.name;
                    try {
                      jsonBatch = JSON.parse(batch);
                    } catch (e) {
                      res.status(500).send("Failed parsing document to JSON.\n" + e);
                      return;
                    }
                    si.add(options, jsonBatch, function (err) {
                      if (err) {
                        res.send(err);
                      } else {
                        res.send('Batch indexed');
                      }
                    });
                  });
    } else {
      if (typeof req.body.document !== 'object') {
        try {
          jsonBatch = JSON.parse(req.body.document);
        } catch (e) {
          res.status(500).send("Failed parsing document to JSON.\n" + e);
          return;
        }
      } else {
        jsonBatch = req.body.document;
      }
      si.add(options, jsonBatch, function (err) {
        if (err) {
          res.send(err);
        } else {
          res.send('Batch indexed');
        }
      });

    }

  });

  if (process.argv.indexOf('-h') == -1) {
    http.createServer(app).listen(app.get('port'), app.get('hostname'), function(){
      console.log();
      console.log('      ___           ___           ___           ___           ___      '.red);
      console.log('     /\\'.white + '__\\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '__\\     '.red);
      console.log('    /::|'.white + '  |'.red + '       /::\\'.white + '  \\'.red + '       /::\\'.white + '  \\'.red + '       /::\\'.white + '  \\'.red + '       /:/'.white + '  /     '.red);
      console.log('   /:|:|'.white + '  |'.red + '      /:/\\:\\'.white + '  \\'.red + '     /:/\\:\\'.white + '  \\'.red + '     /:/\\:\\'.white + '  \\'.red + '     /:/'.white + '__/      '.red);
      console.log('  /:/|:|'.white + '  |__'.red + '   /:/  \\:\\'.white + '  \\'.red + '   /::\\'.white + '~'.red + '\\:\\'.white + '  \\'.red + '   /:/  \\:\\'.white + '  \\'.red + '   /::\\'.white + '  \\ ___  '.red);
      console.log(' /:/ |:| /\\'.white + '__\\'.red + ' /:/'.white + '__/'.red + ' \\:\\'.white + '__\\'.red + ' /:/\\:\\ \\:\\'.white + '__\\'.red + ' /:/'.white + '__/'.red + ' \\:\\'.white + '__\\'.red + ' /:/\\:\\  /\\'.white + '__\\ '.red);
      console.log(' \\/'.white + '__'.red + '|:|/:/'.white + '  /'.red + ' \\:\\'.white + '  \\'.red + ' /:/'.white + '  /'.red + ' \\/'.white + '_'.red + '|::\\/:/'.white + '  /'.red + ' \\:\\'.white + '  \\'.red + '  \\/'.white + '__/'.red + ' \\/'.white + '__'.red + '\\:\\/:/'.white + '  / '.red);
      console.log('     |:/:/'.white + '  /'.red + '   \\:\\  /:/'.white + '  /'.red + '     |:|::/'.white + '  /'.red + '   \\:\\'.white + '  \\'.red + '            \\::/'.white + '  /  '.red);
      console.log('     |::/'.white + '  /'.red + '     \\:\\/:/'.white + '  /'.red + '      |:|\\/'.white + '__/'.red + '     \\:\\'.white + '  \\'.red + '           /:/'.white + '  /   '.red);
      console.log('     /:/'.white + '  /'.red + '       \\::/'.white + '  /'.red + '       |:|'.white + '  |'.red + '        \\:\\'.white + '__\\'.red + '         /:/'.white + '  /    '.red);
      console.log('     \\/'.white + '__/'.red + '         \\/'.white + '__/'.red + '         \\|'.white + '__|'.red + '         \\/'.white + '__/'.red + '         \\/'.white + '__/     '.red);
      console.log();
      console.log('MIT license, 2013-2014'.red);
      console.log('http://fergiemcdowall.github.io/Norch'.red);
      console.log();
      console.log('Norch server listening on hostname ' + program.hostname + ' on port ' + program.port);
      console.log();
    });  
  }


  function getQuery(req) {
    //default values
    var offsetDefault = 0,
    pagesizeDefault = 10,
    q = {};
    if (req.query['q']) {
      q['query'] = {};
      if( Object.prototype.toString.call(req.query['q']) === '[object Object]' ) {
        var queryObject = req.query['q'];
        for (var k in queryObject) {
          q['query'][k] = queryObject[k].toLowerCase().split(/\s+/);
        }
      }
      else {
        q['query']['*'] = req.query['q'].toLowerCase().split(/\s+/);
      }
    }
    if (req.query['fieldedQuery'])
      q['fieldedQuery'] = req.query.fieldedQuery;

    if (req.query['offset'])
      q['offset'] = req.query['offset'];
    else
      q['offset'] = offsetDefault;

    if (req.query['pagesize'])
      q['pageSize'] = req.query['pagesize'];
    else
      q['pageSize'] = pagesizeDefault;

    if (req.query['facets'])
      q['facets'] = req.query['facets'].toLowerCase().split(',');
    if (req.query['facetSort'])
      q['facetSort'] = req.query.facetSort;
    if (req.query['weight'])
      q['weight'] = req.query.weight;
    if (req.query['teaser'])
      q['teaser'] = req.query.teaser;
    //&filter[topics][]=cocoa&filter[places][]=usa
    if (req.query['filter'])
      q['filter'] = req.query.filter;
    console.log(q);
    return q;
  }

  app.get('/matcher', function(req, res) {
    si.match(req.query['beginsWith'], function(err, matches) {
      res.send(matches);
    });
  });


  app.get('/getDoc', function(req, res) {
    si.get(req.query['docID'], function(err, msg) {
      res.send(msg);
    });
  });


  app.get('/empty', function(req, res) {
    si.empty(function(err) {
      if (!err) res.send({'success':true, 'message':'index emptied'});
      else res.send(
        {'success':false,
         'message':'there was a problem- try manually deleting ' + options.indexPath}
      );
    });
  });


  //curl http://localhost:3030/snapshot -o snapshot.gz
  app.get('/snapShot', function(req, res) {
    si.snapShot(function(readStream) {
      readStream.pipe(res);
    });
  });


  //curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
  app.post('/replicate', function(req, res) {
    si.replicate(req, function(msg){
      res.send('completed');
    });
  });


  app.get('/indexPeek', function(req, res) {
    si.indexPeek(req.query['start'], req.query['stop'], function(msg) {
      res.send(msg);
    });
  });


  app.get('/tellMeAboutMyNorch', function(req, res) {
    si.tellMeAboutMySearchIndex(function(msg) {
      res.send(msg);
    });
  });


  app.post('/delete', function(req, res) {
    si.del(req.body.docID, function(msg) {
      res.send(msg);
    });
  });

  //curl localhost:3030/search?q=aberdeen\&weight=%22category%22:10
  app.get('/search', function(req, res) {
    var q = getQuery(req);
    si.search(q, function(err, result) {
      res.send(result);
    });
  });
}
