var util = require("util"),
    url = require("url"),
    path = require("path"),
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

      console.log(tab.url.yellow);

      this.setTab(tab)

      this.repl = repl.start({
        prompt: this.getPrompt(),
        eval: this.eval.bind(this),
        input: process.stdin,
        output: process.stdout,
        writer: this.writer.bind(this)
      });

      this.defineCommands();
    }.bind(this))
  },

  connect: function(options, cb) {
    var client = new FirefoxClient();
    client.connect(options.port, options.host, function() {
      client.selectedTab(cb);
    })
    client.on("error", function(error) {
      if (error.code == "ECONNREFUSED") {
          throw new Error(error.code
          + ": Firefox isn't listening for connections");
      }
      throw error;
    })
    client.on("end", this.quit);

    this.client = client;
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

    // write out a few properties and their values
    var strs = [];
    for (name in props) {
      var value = props[name].value;
      value = this.transformResult(value);

      if (value && value.type == "object") {
        value = ("[object " + value.class + "]").cyan;
      }
      else {
        value = util.inspect(props[name].value, { colors: true });
      }
      strs.push(name.magenta + ": " + value);
    }
    str += strs.join(", ");

    // write the number of remaining properties
    var total = Object.keys(getters).length + Object.keys(ownProps).length;
    var more = total - PROP_SHOW_COUNT;
    if (more > 0) {
      str += ", ..." + (more + " more").grey
    }
    str += " } ";

    return str;
  },

  write: function(str, cb) {
    this.repl.outputStream.write(str, cb);
  },

  setTab: function(tab) {
    this.tab = tab;

    if (this.repl) {
      // repl.prompt not documented in REPL module
      this.repl.prompt = this.getPrompt();
    }
  },

  getPrompt: function() {
    var parts = url.parse(this.tab.url);

    var name = parts.hostname;
    if (!name) {
      name = path.basename(parts.path);
    }
    return name + "> ";
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
          if (err) return cb(err);

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

    this.repl.defineCommand('quit', {
      help: 'quit fxconsole',
      action: this.quit
    })

    this.repl.defineCommand('switch', {
      help: 'switch to evaluating in another tab by index',
      action: this.switchTab.bind(this)
    })
  },

  switchTab: function(index) {
    this.client.listTabs(function(err, tabs) {
      if (err) throw err;
      var tab = tabs[index];

      if (!tab) {
        this.write("no tab at index " + index + "\n");
      }
      else {
        this.setTab(tab);
        this.write((this.tab.url + "\n").yellow);
      }

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

      // displayPrompt() not listed in REPL module docs <.<
      this.repl.displayPrompt();
    }.bind(this));
  },

  quit: function() {
    process.exit(0);
  }
}
