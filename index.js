var util = require("util"),
    repl = require("repl"),
    colors = require("colors"),
    FirefoxClient = require("firefox-client");

module.exports = FirefoxREPL;

function FirefoxREPL() {}

FirefoxREPL.prototype = {
  start: function(options) {
    this.connect(options, function(err, tab) {
      if (err) throw err;

      this.tab = tab;

      repl.start({
        prompt: "firefox> ",
        eval: this.eval.bind(this),
        input: process.stdin,
        output: process.stdout,
        /*
        writer: function(output) {
          return util.inspect(output);
        } */
      });
    }.bind(this))
  },

  // compliant with node REPL module eval function reqs
  eval: function(cmd, context, filename, cb) {
    if (cmd.indexOf("(:" == 0)) {
      this.handleCommand(cmd, cb);
    }
    this.evalInTab(cmd, cb);
  },

  connect: function(options, cb) {
    var client = new FirefoxClient();
    client.connect(options.port, options.host, function() {
      client.selectedTab(cb);
    })
  },

  handleCommand: function(cmd, cb) {
    cmd = cmd.replace(/^\(\:/, "").replace(/\s\)$/, "");
    switch(cmd) {
      case "quit":
        process.exit(0);
    }
  },

  evalInTab: function(input, cb) {
    this.tab.Console.evaluateJS(input, function(err, resp) {
      if (err) throw err;

      if (resp.exception) {
        cb(resp.exceptionMessage);
        return;
      }
      var result = this.transformResult(resp.result);
      cb(null, result);
    }.bind(this))
  },

  transformResult: function(result) {
    switch (result.type) {
      case "undefined":
        return undefined;
      case "null":
        return null;
      case "object":
        return "object " + result.class;
    }
    return result;
  },
}
