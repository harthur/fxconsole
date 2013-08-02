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
    if (!output || output.type != "object") {
      // let inspect do its thing if it's a literal
      return util.inspect(output, { colors: true });
    }
    // do our own object summary
    var str = "";
    str += output.class.yellow + " { ";

    var props = {};

    // show first N properties of an object, starting with getters
    var getters = output.safeGetterValues;
    var names = Object.keys(getters).slice(0, PROP_SHOW_COUNT);
    names.map(function(name) {
      props[name] = getters[name];
    })

    // then the own properties
    var ownProps = output.ownProps;
    var remaining = PROP_SHOW_COUNT - names.length;
    if (remaining) {
      names = Object.keys(ownProps).slice(0, remaining);
      names.map(function(name) {
        props[name] = ownProps[name];
      });
    }

    var strs = [];
    for (name in props) {
      var value = props[name].value;
      value = this.transformResult(value);
      if (value.type == "object") {
        value = ("[object " + value.class + "]").cyan;
      }
      else {
        value = util.inspect(props[name].value, { colors: true });
      }
      strs.push(name.magenta + ": " + value);
    }
    str += strs.join(", ");

    var total = Object.keys(getters).length + Object.keys(ownProps).length;
    var more = total - PROP_SHOW_COUNT;
    if (more > 0) {
      str += ", ..." + (more + " more").grey
    } 
    str += " } ";

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

      var result = resp.result;

      if (result.type == "object") {
        result.ownPropertiesAndPrototype(function(err, resp) {
          if (err) throw err;
          result.safeGetterValues = resp.safeGetterValues;
          result.ownProps = resp.ownProperties;

          cb(null, result);
        })
      }
      else {
        cb(null, this.transformResult(resp.result));
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

    this.repl.defineCommand('apps', {
      help: 'list currently open apps',
      action: this.listApps.bind(this)
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

  writeTabs: function(tabs) {
    var strs = "";
    for (var i in tabs) {
      strs += "[" + i + "] " + tabs[i].url + "\n";
    }

    this.write(strs);

    // this isn't listed in repl docs <.<
    this.repl.displayPrompt();
  },

  listTabs: function() {
    this.client.listTabs(function(err, tabs) {
      if (err) throw err;

      this.writeTabs(tabs);
    }.bind(this));
  },

  listApps: function() {
    this.client.listApps(function(err, apps) {
      if (err) throw err;

      this.writeTabs(apps);
    }.bind(this))
  }
}
