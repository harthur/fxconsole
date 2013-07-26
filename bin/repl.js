#!/usr/bin/env node
var nomnom = require("nomnom"),
    FirefoxREPL = require("../index");

var options = nomnom.options({
    port: {
      help: "port to connect to",
      default: 6000
    },
    host: {
      help: "host to connect to",
      default: "localhost"
    }
  })
  .script("fxconsole")
  .parse();

var repl = new FirefoxREPL();
repl.start(options);
