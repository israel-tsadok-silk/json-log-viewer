#!/usr/bin/env node
const minimist = require('minimist');
const blessed = require('blessed');
const _ = require('lodash');
const fs = require('fs');
const tty = require('tty');

require('./polyfills');
const ttyFd = fs.openSync('/dev/tty', 'r+')

const MainPanel = require('./widgets/MainPanel');
const StatusLine = require('./widgets/StatusLine');

const opts = minimist(process.argv.slice(2));
var logFile = opts._[0];

if (!logFile) {
  if (process.stdin.isTTY) {
    // eslint-disable-next-line no-console
    console.log('error: missing log file');
    process.exit(1);
  } else {
    logFile = '-';
  }
}

const screen = blessed.screen({
  input: tty.ReadStream(ttyFd),
  output: tty.WriteStream(ttyFd),
  smartCSR: true,
  log: opts.log,
});
screen.key(['C-c'], function(_ch, _key) {
  return process.exit(0);
});

const level = opts.l || opts.level;
const sort = opts.s || opts.sort;
const args = { screen, level, sort };

const mainPanel = new MainPanel(args);
mainPanel.loadFile(logFile);

const statusLine = new StatusLine({ screen, mainPanel });
screen.append(statusLine);
mainPanel.setCurrent();

screen.render();

process.on('SIGWINCH', function() {
  screen.emit('resize');
});
