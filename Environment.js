/**
 * Enum for possible Actions
 *
 * @readonly
 * @enum {int}
 * @author Christian Vogt <mail@christianvogt.de>
 */
var ACTIONS = {
    up:     0,
    right:  1,
    down:   2,
    left:   3
};

/**
 * Defines the "randbedingungen"
 *
 * @constructor
 * @param {int} _height The height of the environment (in pixel-like values)
 * @param {int} _width The width of the environment (in pixel-like values)
 * @property {int} height The height of the environment (in pixel-like values)
 * @property {int} width The width of the environment (in pixel-like values)
 * @property {Array} obstacles Array containing the obstacles of this environment
 * @property {Array} players Array containing the players in this environment
 * @author Christian Vogt <mail@christianvogt.de>
 */
function Environment(_height, _width) {
    this.height = _height;
    this.width = _width;
    this.obstacles = [];
    this.players = [];

    /**
     * Determine the resulting Position if moved from one position to another and return it.
     *
     * @param {Position} _currentPosition the current Position
     * @param {Position} _desiredPosition the desired Position of the Player
     * @returns {Position} the Position actually reached
     */
    this.getResultingPosition = function (_currentPosition, _desiredPosition) {
        checkInstance(_currentPosition, Position);
        checkInstance(_desiredPosition, Position);

        // out of bounds check
        if (_desiredPosition.posx < 0 || _desiredPosition.posy < 0 || _desiredPosition.posx >= this.width || _desiredPosition.posy >= this.height) {
            // console.log('out of bound');
            return _currentPosition;
        }

        // obstacle check
        for (var i=0; i<this.obstacles.length; i++) {
            if (this.obstacles[i].position.equals(_desiredPosition)) return _currentPosition;
        }

        // other player check
        for (var j=0; j<this.players.length; j++) {
           if (this.players[j].position.equals(_desiredPosition)) return _currentPosition;
        }

        // all right, go for it
        return _desiredPosition;
    };

    /**
     * Draws the current environment in the specified `canvas` with a framerate of `framesPerSecond` and a scaling factor `scale`.
     *
     * @param {window.canvas} _canvas The DomElement this environment shall be drawed into
     * @param {int} _framesPerSecond Times to draw per second (fps)
     * @param {int} _scale Factor this canvas scales the pixel-like size of the environment
     */
    this.draw = function(_canvas, _framesPerSecond, _scale) {
        var self = this;
        var canvas = _canvas;
        var framesPerSecond = _framesPerSecond;
        var scale = _scale;
        var color = {
            background: "#000",
            hunter: "#fff",
            obstacle: "#FA5858",
            victim: "#D7DF01"
        };
        if (!scale) {
            scale = 50;
        }
        if (!framesPerSecond) {
            framesPerSecond = 10;
        }
        canvas.width = this.width*scale;
        canvas.height = this.height*scale;

        // draw ground layer
        ctx = canvas.getContext("2d");
        ctx.fillStyle = color.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // get hurdle position and draw
        this.obstacles.forEach(function(obstacle) {
            ctx.fillStyle = color.obstacle; //red
            ctx.fillRect(obstacle.position.posx*scale, obstacle.position.posy*scale, scale, scale);
        });

        // get player position and draw
        this.players.forEach(function(player) {
            if (player instanceof Hunter) {
                ctx.fillStyle = color.hunter; // Hunter
            } else if (player instanceof Victim) {
                ctx.fillStyle = color.victim; // Victim
            }
            ctx.fillRect(player.position.posx*scale, player.position.posy*scale, scale, scale);
        });

        setTimeout(function(){
            self.draw(canvas, framesPerSecond, scale);
        }, Math.floor(1000/framesPerSecond));
    };
}

/**
 * Position 
 *
 * @constructor
 * @param {int} _posx the x-coordinate
 * @param {int} _posy the y-coordinate
 * @property {int} posx the x-coordinate
 * @property {int} posy the y-coordinate
 */
function Position(_posx, _posy) {
    this.posx = _posx;
    this.posy = _posy;

    /**
     * Moves up (y+1)
     *
     * @returns {Position} The resulting position
     */
    this.up = function() {
        return new Position(this.posx, this.posy-1);
    };

    /**
     * Moves right (x+1)
     *
     * @returns {Position} The resulting position
     */
    this.right = function() {
        return new Position(this.posx+1, this.posy);
    };

    /**
     * Moves down (y+1)
     *
     * @returns {Position} The resulting position
     */
    this.down = function() {
        return new Position(this.posx, this.posy+1);
    };

    /**
     * Moves left (x-1)
     *
     * @returns {Position} The resulting position
     */
    this.left = function() {
        return new Position(this.posx-1, this.posy);
    };

    /**
     * Determine if `otherposition` is the same as this position
     *
     * @param {Position} _otherposition The other Position
     * @returns {Boolean} If this position equals the `otherposition`
     */
    this.equals = function(_otherposition) {
        if (!_otherposition instanceof Position) {
            return false;
        } else if (_otherposition.posx != this.posx) {
            return false;
        } else if (_otherposition.posy != this.posy) {
            return false;
        }
        return true;
    };

    /**
     * Hash this Position to string
     *
     * @returns {String}
     */
    this.hash = function() {
        return (btoa(this.posx) + btoa(this.posy));
    };

    /**
     * Determine the distance to another Position
     * 
     * @param {Position} _otherposition The other Position
     * @returns {int} The distance to the other Position
     */
    this.distance = function(_otherposition) {
        checkInstance(_otherposition, Position);
        return Math.abs(_otherposition.posx-this.posx)+Math.abs(_otherposition.posy-this.posy);
    };

    /**
     * Determine the direction to another Position with a max. sight range of `maxDistance`
     *
     * @param {Position} _otherposition The position to get the direction to
     * @param {int} maxDistance The max. distance that is allowed to be seen
     */
    this.directionTo = function(_otherposition, maxDistance) {
        checkInstance(_otherposition, Position);
        if (maxDistance && this.distance(_otherposition) > maxDistance) {
            return null;
        }
        if (this.equals(_otherposition)) {
            return null;
        }
        var candidates = [];
        if (this.posx < _otherposition.posx) { // ich bin weiter links
            candidates.push(ACTIONS.right);
        } else if (this.posx > _otherposition.posx) {
            candidates.push(ACTIONS.left);
        }
        if (this.posy < _otherposition.posy) { // ich bin weiter oben
            candidates.push(ACTIONS.down);
        } else if (this.posy > _otherposition.posy) {
            candidates.push(ACTIONS.up);
        }
        // choose random from candidates
        return candidates[Math.floor(Math.random()*candidates.length)];
    };

    /**
     * Returns a string of this position
     *
     * @returns {String} The string value
     */
    this.toString = function() {
        return JSON.stringify(this);
    };
}

/**
 * Obstacle
 *
 * Obstacle that cannot be crossed by a player
 *
 * @constructor
 * @param {Position} _position The Position this obstacle uses
 * @property {Position} position The Position this obstacle uses
 */
function Obstacle(_position) {
    checkInstance(_position, Position);
    this.position = _position;
}