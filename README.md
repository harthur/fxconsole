# fxconsole
`fxconsole` is a remote Javascript console for Firefox that runs in your terminal:

![fxconsole in Terminal](http://i.imgur.com/iKXwCsD.png)

## Install
With [node.js](http://nodejs.org/) and the npm package manager:

	npm install fxconsole -g

You can now use `fxconsole` from the command line.

## Connecting

### Desktop Firefox
1. Enable remote debugging (You'll only have to do this once)
 1. Open the DevTools. **Web Developer** > **Toggle Tools**
 2. Visit the settings panel (gear icon)
 3. Check "Enable remote debugging" under Advanced Settings

2. Listen for a connection
 1. Open the Firefox command line with **Tools** > **Web Developer** > **Developer Toolbar**.
 2. Start a server by entering this command: `listen 6000` (where `6000` is the port number)

### Firefox for Android
Follow the instructions in this short [Hacks video](https://www.youtube.com/watch?v=Znj_8IFeTVs)

### FirefoxOS Simulator
This one is a bit hacky right now, and object inspection doesn't work yet, but feel free to try. The `.tabs` command lists the currently open apps in the simulator.

1. Install [FirefoxOS Simulator](https://addons.mozilla.org/en-us/firefox/addon/firefox-os-simulator/) in Firefox
2. Start the Simulator with **Tools** > **Web Developer** > **Firefox OS Simulator**
3. Get the port the Simulator is listening on with this terminal command: `lsof -i -P | grep -i "b2g"` in Linux/Mac, or using [fx-ports](https://github.com/nicola/fx-ports).
4. Start `fxconsole` and with the `--port` argument.

## Usage

```
fxconsole --port 6000 --host 10.251.34.157
```

## Commands

There are two extra REPL commands available beyond the standard node.js commands. `.tabs` lists the open tabs in Firefox. `.switch 2` switches to evaluating in a tab. The argument is the index of the tab to switch to.
