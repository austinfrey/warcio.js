#!/usr/bin/env node

const Indexer = require('./src/indexer').Indexer;
const CDXIndexer = require('./src/indexer').CDXIndexer;

const BUFF_SIZE = 1024 * 128;


// ===========================================================================
function main(args, out) {
  let promise = Promise.resolve(true);

  require('yargs').
  usage('$0 [command]').

  // Basic Indexer
  command('index <filename..>', 'Index WARC(s)', (yargs) => {
    yargs.
    positional('filename', {
      'describe': 'WARC file(s) to index',
      'type': 'string'
    }).
    option('f', {
      'alias': 'fields',
      'describe': 'fields to include in index',
      'type': 'string'
    })
  }, async (args) => {
    promise = new Indexer(args, out).run(loadStreams(args.filename));
  }).

  // CDX Indexer
  command('cdx-index <filename..>', 'CDX(J) Index of WARC(s)', (yargs) => {
    yargs.
    positional('filename', {
      'describe': 'WARC file(s) to index',
      'type': 'string'
    }).
    option('a', {
      'alias': 'all',
      'describe': 'index all WARC records',
      'type': 'boolean'
    }).
    option('format', {
      'describe': 'output format',
      'choices': ['json', 'cdxj', 'cdx'],
      'default': 'cdxj'
    })
  }, async (args) => {
    promise = new CDXIndexer(args, out).run(loadStreams(args.filename));
  }).

  demandCommand(1, 'Please specify a command').
  strictCommands().
  help().
  parse(args);

  return promise;
}


function loadStreams(filenames) {
  global.Headers = require('node-fetch').Headers;

  const path = require('path');

  return filenames.map((filename) => {   
    const stream = new FileReader(filename);
    //const fs = require('fs');
    //const stream = fs.createReadStream(filename, {highWaterMark: BUFF_SIZE});
    filename = path.basename(filename);
    return {filename, stream};
  });
}


// ===========================================================================
class FileReader
{
  constructor(filename) {
    const fs = require('fs');
    const rawStream = fs.createReadStream(filename, {highWaterMark: BUFF_SIZE});
    this.iter = rawStream[Symbol.asyncIterator]();
  }

  async read() {
    return await this.iter.next();
  }
}


/* istanbul ignore if */
if (require.main === module) {
  main();
}

exports.main = main

