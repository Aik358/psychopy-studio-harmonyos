# To install a dev environment

Install Node.js:
https://nodejs.org/en/download/

Then, in command line, call:
```
npm install
```
and on subsequent iterations:
```
npm ci
```

# To run

In command line, call:

```
npm run electron:start
```

On your first time running, the app will take a long time to start as it's installing Python. You should get updates on this in the terminal.


# To create installer

In command line, run this ON WINDOWS: 

```
npm run build:complete
```

or run this ON MACOS: 

```
npm run electron:make
```

This will run the installer and package the app to the "out" folder. Installer will be in out/releases