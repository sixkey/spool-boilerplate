// You need to let the SpoolClient now what you want to do with objects with a certain objectType
var constructors = {
    'PLAYER': {
        const: ClientEntity
    },
    'FRUIT': {
        const: ClientEntity
    }
}

// Initializing client
var client = Client({
    keyToConstructor: constructors,
    FPS: 60, // default also 60, just wanted to brag that there is this feature
})

// Setting up the camera, you can enable lerp for more smooth camera following 
client.camera.lerp = true;

// You need to start the sockets
client.socketInit()

// For the basic movement described in the boilerserver this is enough, you can set your own events if you want 
keyListener = KeyboardListener(client)
keyListener.initListener()
keyListener.onKeyDown = (e) => {
    console.log(e);
}

// You need to start your gameloop manually, with simple game this may seem dumb, but for game with textures that need to load first it makes sense i guess
client.startGameLoop()