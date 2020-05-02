////// BASICS //////

// we need to include all the important spool elements 
var {
    Server, // Server is the basic object, and contains the whole server said applicatoin
    Entity, // Entity is absctract representation of object
    SpoolMath, // SpoolMath is library that contains additional math function
    ObjectSpawner, // ObjectSpawner is object that makes spawning objects easier (more useful in more complex situations like zoning)
    CollisionManager, // CollisionManager creates basic collsion system
    SpoolUtils // Like SpoolMath but for not math related problems
} = require('./spool/spoolserver.js');

//// Fist we need to initialize the spool server instance ////

// all the directories that contain public data like sprites or client side scripts, html or css
var publicDirectiories = ['/exampleserver', '/public', '/textures']

// Server object is made up of initObject (object assigned to self on creation) that is the first argument
// Second is the position of the root folder, and then public directories relative to this root folder
var server = Server({
    port: 2000, // if not defined 2000
    TPS: 65, // if not defined 60
}, __dirname, publicDirectiories)

// Check your console to see if express initialized correctly and your folders are served correctly

// Player object needs to be defined always because it is used by the server
// Player's ID is indentical to the id of the socket that the connection is based on 
// Player is not just the thing you see on the screen, it is a object used to communicate with client via client.clientObject
var Player = (initPack = {}) => {
    // In spool constructors always construct this self object and serve it on the end via return
    // reason is again history of the project, but we have yet failed to find some problem with this system (overriding is little tidious)
    var self = Entity({
        maxAcc: 10,

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
    });


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

    // Overriding the entity update function
    self.update = () => {
        self.updateInputVel();
        superSelf.update();
    }


    // Spool works on the system of updatePackages
    // Each time server calls update this package is sent to the user
    // Every objects (not really) sends his package to the server
    // There is also initPack used for initialization package
    // Try to keep this updatePack as light as possible, it has a long way to travel
    self.updatePack = () => {
        return {
            width: self.width, // we update them in collsion
            height: self.height, // we update them in collsion
            ...superSelf.updatePack() // don't forget to call the super update package
        }
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
    });

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

////// END OF THE BASICS ///////

////// ADDITIONAL STUFF ///////

var objectSpawner = ObjectSpawner(server.handler, keysToConstructors)

// Spawns 20 objects with key (from earlier) in radius 1000 with center 0 0 
objectSpawner.spawnInRadius('fruit', 1000, 20, 0, 0);

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
                server.handler.remove(b);
            }
        }]
    },
    server.handler);
server.handler.addManager(collisionManager);

////// END OF ADDITIONAL STUFF //////

////// STARTING THE SERVER //////

// Now we need to start the server, after this call, server should be "online"
// full start contains:
// start() -> starting the whole web server thingy and setting up express, and it's static public folders
// startSocket() -> defines what happens on socket connections and disconnections (and more ofc)
// startGameLoop() -> starts the game loop
// all the functions above can be called separately but are bundled for convinience because in majority of cases you don't need to change the system
server.fullStart(Player);

////// FIN ///////