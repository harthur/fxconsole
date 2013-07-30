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

      this.repl = repl.start({
        prompt: "firefox> ",
        eval: this.eval.bind(this),
        input: process.stdin,
        output: process.stdout,
        writer: function(output) {
          return util.inspect(output, { colors: true });
        }
      });

      this.defineCommands();
    }.bind(this))
  },

  connect: function(options, cb) {
    var client = new FirefoxClient();
    client.connect(options.port, options.host, function() {
      client.selectedTab(cb);
    })
    client.on("end", this.quit);

    this.client = client;
  },

  write: function(str, cb) {
    this.repl.outputStream.write(str, cb);
    console.log("");
  },

  quit: function() {
    process.exit(0);
  },

  // compliant with node REPL module eval function reqs
  eval: function(cmd, context, filename, cb) {
    if (cmd.indexOf("(:") == 0) {
      this.handleCommand(cmd, cb);
    }
    else {
      this.evalInTab(cmd, cb);
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

  defineCommands: function() {
    this.repl.defineCommand('tabs', {
      help: 'list currently open tabs',
      action: this.listTabs.bind(this)
    })

    this.repl.defineCommand('quit', {
      help: 'quit fxconsole',
      action: function() {
        process.exit(0);
      }
    })

    this.repl.defineCommand('switch', {
      help: 'switch to evaluating in another tab by index',
      action: function(index) {
        this.client.listTabs(function(err, tabs) {
          if (err) throw err;
          this.tab = tabs[index];

          this.repl.displayPrompt();
        }.bind(this));
      }.bind(this)
    })
  },

  listTabs: function() {
    this.client.listTabs(function(err, tabs) {
      if (err) throw err;

      var strs = [];
      for (var i in tabs) {
        strs.push("[" + i + "] " + tabs[i].url);
      }

      this.write(strs.join("\n"))

      // this isn't listed in repl docs <.<
      this.repl.displayPrompt();
    }.bind(this));
  },

  handleCommand: function(cmd, cb) {
    cmd = cmd.replace(/^\(\:/, "").replace(/\s\)$/, "");
    switch(cmd) {
      case "quit":
        process.exit(0);
    }
  }
}
