# spool-boilerplate
basic game written for spool

## Getting started

1. You need [node.js](https://nodejs.org/en/)
2. Clone this repository 
```
git clone https://github.com/sixkey/spool-boilerplate
```
3. Make sure you pulled spool part of the repository
4. We recommend using nodemon 
```
npm install -g nodemon
```
5. Start either a "server example" or "local example"

## Examples
###### Server side (multiplayer)
This example showcases use of the engine in multiplayer scenario in which the updating part of the game is done on the server, and client io (graphics, key listeners, mouse listeners, etc.) are done on the client
```
nodemon .\boilerserver-exampleserver.js
```
###### Pure local (singleplayer)
This example showcases use of the engine in singleplayer situation. Everything is done on the clientside
```
nodemon .\boilerserver-examplelocal.js
```
