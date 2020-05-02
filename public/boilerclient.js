// Initializing client
var client = Client({
    keyToConstructor: null,
    loopUpdateCall: true,
    FPS: 60, // default also 60, just wanted to brag that there is this feature
    pureLocalClient: true // tell the client that there isn't any server that will do the calculations
})

// Player object needs to be defined always because it is used by the server
// Player's ID is indentical to the id of the socket that the connection is based on 
// Player is not just the thing you see on the screen, it is a object used to communicate with client via client.clientObject
var Player = (initPack = {}) => {
    // In spool constructors always construct this self object and serve it on the end via return
    // reason is again history of the project, but we have yet failed to find some problem with this system (overriding is little tidious)
    // You can submit second function for dynamic inheritance, this inheritance can be changed on runtime 
    // In this case we want our SpoolEngine entity to inherit the functionality of the ClientEntity
    // The reason why we don't do it the other way around is because ClientEntity overrides update function
    var self = Entity({
        maxAcc: 10,

        x: 0,
        y: 0,
        width: 40,
        height: 40,

        // You always need to set the objectType
        // objectType is the key used in handler to differentiate the different types of objects
        // ServerHandler has objects dictionary that contains all the objects
        // they are arranged by objectType and theirId, you can play with console to see what is up
        // If you don't care about the objectType and want your object just via ID use SpoolServer.objectsById
        objectType: 'PLAYER',

        rotation: Math.PI / 2,
        color: SpoolMath.randomHsvColor(0.5, 0.8),

        ...initPack
    }, ClientEntity);


    // Creating superself for overriding
    var superSelf = {
        update: self.update,
        updatePack: self.updatePack
    }

    /**
     * Updates velocities from keyboard input
     */
    self.updateInputVel = () => {
        // setting the basic values
        if (!self.standStill) {
            xVelocity = 0;
            yVelocity = 0;


            // These parameters are created every time and if the KeyListener is present on the client side, should work
            if (self.pressedLeft || self.pressedRight || self.pressedUp || self.pressedDown) {
                if (self.pressedLeft) {
                    xVelocity -= self.maxAcc;
                }
                if (self.pressedRight) {
                    xVelocity += self.maxAcc;
                }
                if (self.pressedUp) {
                    yVelocity += self.maxAcc;
                }
                if (self.pressedDown) {
                    yVelocity -= self.maxAcc;
                }
            }

            // Spool is mainly based on vectors that are created from angle and size but can take normal vectors
            // the reason why our system is based on angles is that the game that spool is based on was based on angles heavily, could change in future
            // If you set velocity vector on object it acts on the object every update and can be removed or set to zero (see below)
            // Spool supports velocities, accelerations but also .velX and .velY for more simple implementations
            self.setVelVector('movement', [xVelocity, yVelocity]);
        } else {
            self.setVelVector('movement', [0, 0]);
        }
    }

    self.mouseEventInWorld = (x, y) => {
        console.log(x, y);

        client.handler.add(Fruit({
            x,
            y,
            width: 20,
            height: 20,
        }));
    }

    // Overriding the entity update function
    self.update = () => {
        self.updateInputVel();
        superSelf.update();
    }


    return self;
}

var Fruit = (initPack = {}) => {
    // In Spool we use initObjects in constructor, they are objects that are medged with Entity
    var self = Entity({
        maxAcc: 10,

        width: 1000, // are overriden by objectSpawner to 20
        height: 1000, // are overriden by objectSpawner to 20

        objectType: 'FRUIT',
        rotation: Math.PI / 2,
        color: SpoolMath.randomHsvColor(0.5, 0.8),

        // Notice that ...initPack is at the end so we can override the values set above (width, height)
        ...initPack
    }, ClientEntity);

    return self;
}

// Object spawner is used to create objects quickly, it uses key to constructor list 
keysToConstructors = {
    // You would never do this (player is spawned by server not by spawner, nor you)
    'player': {
        const: Player
    },
    // const is the constructor function, defs is a object that contains all the information that we want to write to our object via initObject in constructor
    'fruit': {
        const: Fruit,
        defs: {
            width: 20,
            height: 20
        }
    }
}

// Object spawner
var objectSpawner = ObjectSpawner(client.handler, keysToConstructors)

objectSpawner.gx = 100
objectSpawner.gy = 100
objectSpawner.spawnFromImageMap('./maps/map.png', {
    'ffffff': 'fruit'
})

var player = Player({
    x: 0,
    y: 0,
})

client.handler.add(player);
client.clientObject = player;
client.camera.followObject = client.clientObject;

// Collision manager is also defined with the initObject system
// Collision manager is based on colPairs - pairs of objectTypes that collide

var collisionManager = CollisionManager({
        // a: array of A objects, A object is the object that the collision is acted on (if you have solid collision this object is stopped)
        // b: array of B objects, B object is the object that is checked -> in most cases some sort of wall or stuff like that
        // solid: defines if the collision is sollid if yes, a object can't get through the b object, if not it can go through but the collision is active
        // func: define function that takes the a and b object and their collision point -> used for bullets to remove them and more
        colPairs: [{
            a: ['PLAYER'],
            b: ['FRUIT'],
            solid: false,
            func: (a, b, col) => {
                // adding the size of the fruit to the size of the player
                var size = b.width * b.height + a.width * a.height;
                a.width = Math.sqrt(size);
                a.height = Math.sqrt(size)

                // Handler can remove objects via objectType and ID or by Object
                client.handler.remove(b);
            }
        }]
    },
    client.handler);
client.handler.addManager(collisionManager);

// Setting up the camera, you can enable lerp for more smooth camera following 
client.camera.lerp = true;

// For the basic movement described in the boilerserver this is enough, you can set your own events if you want 
keyListener = KeyboardListener(client)
keyListener.initListener()
keyListener.onKeyDown = (e) => {
    console.log(e);
}



mouseListener = MouseListener(client)
mouseListener.mouseCoordTransformation = client.camera.inverseTransformPoint
mouseListener.initListener()
mouseListener.onMouseEvent = (e) => {
    console.log(e);
}

// You need to start your gameloop manually, with simple game this may seem dumb, but for game with textures that need to load first it makes sense i guess
client.startGameLoop()