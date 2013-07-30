var util = require("util"),
    repl = require("repl"),
    colors = require("colors"),
    FirefoxClient = require("firefox-client");

const PROP_SHOW_COUNT = 5;

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
        writer: this.writer.bind(this)
      });

      this.defineCommands();
    }.bind(this))
  },

  writer: function(output) {
    if (output.type != "object") {
      return util.inspect(output, { colors: true });
    }
    var str = "";
    str += output.class.yellow + " { ";

    var props = output.safeGetterValues;
    var names = Object.keys(props).slice(0, PROP_SHOW_COUNT);

    var remaining = PROP_SHOW_COUNT - names.length;
    if (remaining) {
      var ownProps = output.ownProperties.slice(0, remaining);
      names = names.concat(ownProps);
    }

    for (i in names) {
      var name = names[i];

      var value = props[name].value;
      value = this.transformResult(value);
      if (value.type == "object") {
        value = ("[object " + value.class + "]").cyan;
      }
      else {
        value = util.inspect(props[name].value, { colors: true });
      }
      str += name.magenta + ": " + value + ", ";
    }
    str += "... }";

    return str;
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
  },

  quit: function() {
    process.exit(0);
  },

  // compliant with node REPL module eval function reqs
  eval: function(cmd, context, filename, cb) {
    this.evalInTab(cmd, cb);
  },

  evalInTab: function(input, cb) {
    this.tab.Console.evaluateJS(input, function(err, resp) {
      if (err) throw err;

      if (resp.exception) {
        cb(resp.exceptionMessage);
        return;
      }

      var result = this.transformResult(resp.result);

      if (result.type == "object") {
        result.ownPropertiesAndPrototype(function(err, resp) {
          if (err) throw err;
          result.safeGetterValues = resp.safeGetterValues;

          cb(null, result);
        })
      }
      else {
        cb(null, result);
      }
    }.bind(this))
  },

  transformResult: function(result) {
    switch (result.type) {
      case "undefined":
        return undefined;
      case "null":
        return null;
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
      action: this.switchTab.bind(this)
    })
  },

  switchTab: function(index) {
    this.client.listTabs(function(err, tabs) {
      if (err) throw err;
      this.tab = tabs[index];

      this.write((this.tab.url + "\n").yellow);

      this.repl.displayPrompt();
    }.bind(this));
  },

  listTabs: function() {
    this.client.listTabs(function(err, tabs) {
      if (err) throw err;

      var strs = "";
      for (var i in tabs) {
        strs += "[" + i + "] " + tabs[i].url + "\n";
      }

      this.write(strs);

      // this isn't listed in repl docs <.<
      this.repl.displayPrompt();
    }.bind(this));
  }
}
