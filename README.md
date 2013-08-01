# fxconsole
`fxconsole` is a remote Javascript console for Firefox that runs in your terminal.

# Install
With [node.js](http://nodejs.org/) and [npm](http://github.com/isaacs/npm):

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
This one is a bit hacky right now.

1. Install [FirefoxOS Simulator](https://addons.mozilla.org/en-us/firefox/addon/firefox-os-simulator/) in Firefox
2. Start the Simulator with **Tools** > **Web Developer** > **Firefox OS Simulator**
3. Get the port the Simulator is listening on with this terminal command: `lsof -i -P | grep -i "b2g"`
4. Start `fxconsole` and give it a `--port` argument.

## Usage

```
fxconsole --port 6000 --host 10.251.34.157
```

## What it looks like

