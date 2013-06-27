/**
 * Player instance
 *
 * @constructor
 * @param {Position} _position The starting position of this player
 * @param {Environment} _env The environment this player exists in
 * @property {Position} position The starting position of this player
 * @property {Environment} env The environment this player exists in
 * @property {QLearner} qlearner The associated lerner
 * @property {Boolean} goalReached Set to `true` if the players's goal is reached
 * @author Christian Vogt <mail@christianvogt.de>
 * @todo document methods and properties
 */
function Player(_position, _env) {
    checkInstance(_position, Position);
    checkInstance(_env, Environment);

    this.position = _position;
    this.startPosition = JSON.stringify(_position);
    this.env = _env;
    this.qlearner = new QLearner(this);
    this.goalReached = false;

    /**
     * Move the Player with help of the learner
     *
     */
    this.move = function(_cb) {
        this.qlearner.move(_cb);
    };

    /**
     * Moves this Player up
     * 
     * @returns {Player} Me
     */
    this.moveUp = function() {
        this.position = this.env.getResultingPosition(this.position, this.position.up());
        return this;
    };

    /**
     * Moves this Player right
     * 
     * @returns {Player} Me
     */
    this.moveRight = function() {
        this.position = this.env.getResultingPosition(this.position, this.position.right());
        return this;
    };

    /**
     * Moves this Player down
     * 
     * @returns {Player} Me
     */
    this.moveDown = function() {
        this.position = this.env.getResultingPosition(this.position, this.position.down());
        return this;
    };

    /**
     * Moves this Player left
     * 
     * @returns {Player} Me
     */
    this.moveLeft = function() {
        this.position = this.env.getResultingPosition(this.position, this.position.left());
        return this;
    };

    /**
     * Doesnt do anything
     * 
     * @returns {Player} Me
     */
    this.stay = function() {
        return this;
    };

    /**
     * Performs the given action, and returns the resulting Position.
     *
     * @param {ACTIONS} _action The Action to perform 
     * @returns {Position} The resulting position
     * @todo why do we call `reward()` here?
     */
    this.performAction = function(_action) {
        switch (_action) {
            case ACTIONS.up: this.moveUp(); break;
            case ACTIONS.right: this.moveRight(); break;
            case ACTIONS.down: this.moveDown(); break;
            case ACTIONS.left: this.moveLeft(); break;
        }
        this.reward();
        return this.position;
    };

    /**
     * Determine if the player is stuck, i.e. cannot move anywhere
     * 
     * @returns {Boolean} `true` if the player is stuck
     */
    this.amIStuck = function() {
        var pos;
        pos = this.env.getResultingPosition(this.position, this.position.up());
        if (!pos.equals(this.position)) return false;
        pos = this.env.getResultingPosition(this.position, this.position.right());
        if (!pos.equals(this.position)) return false;
        pos = this.env.getResultingPosition(this.position, this.position.down());
        if (!pos.equals(this.position)) return false;
        pos = this.env.getResultingPosition(this.position, this.position.left());
        if (!pos.equals(this.position)) return false;
        return true;
    };

    /** 
     * Identifies the player in the environment. This is used by the learner to build the `ACTIONS` table.
     * Can be overridden by agents that shall perform differently.
     *
     * @returns {String} the hash of this player
     */
    this.hash = function() {
        var hash = this.position.hash();
        return hash;
    };

    /**
     * Reward function that helps the learner to determine if a actions has been a good or bad choice.
     * Should be overriden by agents that shall perform differently.
     *
     * @returns {number} the given reward
     */
    this.reward = function() {
        return 0;
    };


    /**
     * Shuffle this players position.
     * 
     * @returns {Position} The resulting Position
     */
    this.shufflePosition = function() {
        var x = Math.floor(Math.random() * this.env.width);
        var y = Math.floor(Math.random() * this.env.height);
        this.position = this.env.getResultingPosition(this.position, new Position(x, y));
        //return this.position;
    };
}

/**
 * Standard hunter. Gets rewarded when the distance to a victim is down to 1.
 *
 * @namespace Player.Hunter
 * @constructor
 * @extends Player
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function Hunter(_position, _env) {
    Player.call(this, _position, _env);
    this.reward = function() {
        for(var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof Victim) {
                // find victims
                var victim = this.env.players[i];
                if ( this.position.distance(victim.position) <= 1 ) { // distance to victim <1? then win!
                    this.goalReached = true;
                    return 100;
                }
            }
        }
        this.goalReached = false;
        return -1;
    };
}
Hunter.prototype = Object.create(Player.prototype);
Hunter.prototype.constructor = Hunter;

/**
 * Senses victims in the area that are in sight (determined by the `sight` value that is the maximum distance as of `Position.distance()`)
 *
 * @namespace Player.SensingHunter
 * @constructor
 * @extends Hunter
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function SensingHunter(_position, _env) {
    Hunter.call(this, _position, _env);
    this.sight = 10;
    this.hash = function() {
        var hash = this.position.hash();
        for (var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof Victim && this.sense(this.env.players[i]) !== false) {
                hash += this.sense(this.env.players[i]);
            }
        }
        return hash;
    };
    this.sense = function(_player) {
        if (this.position.distance(_player.position) <= this.sight) {
            return this.position.directionTo(_player.position);
        } else {
            return false;
        }
    };
}
SensingHunter.prototype = Object.create(Hunter.prototype);
SensingHunter.prototype.constructor = SensingHunter;

/**
 * Randomly moving victim.
 *
 * @namespace Player.Victim
 * @constructor
 * @extends Player
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function Victim(_position, _env) {
    Player.call(this, _position, _env);
    this.move = function() {
        this.performAction(Math.floor(Math.random()*Object.keys(ACTIONS).length));
    };
}
Victim.prototype = Object.create(Player.prototype);
Victim.prototype.constructor = Victim;

/**
 * This player does not move at all but maps all action to "stay".
 *
 * @namespace Player.StillVictim 
 * @constructor
 * @extends Victim 
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function StillVictim(_position, _env) {
    Victim.call(this, _position, _env);
    this.performAction = function(_action) {
        // this.stay();
        return new Position(this.position.posx, this.position.posy);
    };
}
StillVictim.prototype = Object.create(Victim.prototype);
StillVictim.prototype.constructor = StillVictim;

/**
 * Bad ass hunter! Knows about the distance and direction to the victim
 *
 * @namespace Player.OptimizedSensingHunter
 * @constructor
 * @extends SensingHunter 
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function OptimizedSensingHunter(_position, _env) {
    SensingHunter.call(this, _position, _env);
    this.currentDistanceToTarget = 0;
    this.hash = function() {
        var hash = this.position.hash();
        for (var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof Victim && this.sense(this.env.players[i]) !== false) {
                hash += this.sense(this.env.players[i]);
                hash += this.position.distance(this.env.players[i].position);
            }
        }
        return hash;
    };
/*    this.reward = function() {
        for(var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof Victim) {
                // find victims
                var victim = this.env.players[i];
                if ( this.position.distance(victim.position) <= 1 ) { // distance to victim <1? then win!
                    this.goalReached = true;
                    return 100;
                } else if ( this.position.distance(victim.position) < this.currentDistanceToTarget) {
                    this.currentDistanceToTarget = this.position.distance(victim.position);
                    this.goalReached = false;
                    // the distance got lesser, give reward
                    return 1;
                } else if ( this.position.distance(victim.position) >= this.currentDistanceToTarget) {
                    this.currentDistanceToTarget = this.position.distance(victim.position);
                    // this distance got greater, punish
                    this.goalReached = false;
                    return -2;
                }
            }
        }
    };*/
}
OptimizedSensingHunter.prototype = Object.create(SensingHunter.prototype);
OptimizedSensingHunter.prototype.constructor = OptimizedSensingHunter;

/**
 * Senses victims and other hunters, sends directions to other TeamHunters
 *
 * @namespace Player.TeamHunter
 * @constructor
 * @extends SensingHunter 
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
 function TeamHunter(_position, _env) {
    SensingHunter.call(this, _position, _env);
    this.askOtherTeamHunter = function(_victim) {
        for (var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof TeamHunter && this.env.players[i] !== this) {
                return this.env.players[i].sense(_victim);
            }
        }
    };
    this.hash = function() {
        var hash = this.position.hash();
        for (var i=0; i<this.env.players.length; i++) {
            if (this.env.players[i] instanceof Victim && this.sense(this.env.players[i]) !== false) {
                hash += this.sense(this.env.players[i]);
                hash += this.askOtherTeamHunter(this.env.players[i]);
            }
        }
        return hash;
    };
 }
 TeamHunter.prototype = Object.create(SensingHunter.prototype);
 TeamHunter.prototype.constructor = TeamHunter;

/**
 * Controllable by keyboard
 *
 * @namespace Player.ManualVictim
 * @constructor
 * @extends StillVictim 
 * @param {Position} _position the starting position of this player
 * @param {Environment} _env the environment this player exists in 
 */
function ManualVictim(_position, _env) {
    StillVictim.call(this, _position, _env);
    this.shufflePosition = function() {

    };
    var self = this;
    window.addEventListener("keydown", function(evt){
        if (evt.keyIdentifier === 'Up') {
            evt.preventDefault();
            self.moveUp();
        } else if (evt.keyIdentifier === 'Right') {
            evt.preventDefault();
            self.moveRight();
        } else if (evt.keyIdentifier === 'Down') {
            evt.preventDefault();
            self.moveDown();
        } else if (evt.keyIdentifier === 'Left') {
            evt.preventDefault();
            self.moveLeft();
        }
    }, false);
}
ManualVictim.prototype = Object.create(Victim.prototype);
ManualVictim.prototype.constructor = ManualVictim;
