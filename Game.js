/**
 * Creates a new game
 *
 * @constructor
 * @param {Object} _options the object that holds various parameter
 * @property {Object} options the object that holds various parameter
 * @property {Environment} env the environment this game uses 
 * @property {int} stepsPlayed total number of steps in this game
 * @property {int} gamesPlayed how many games have been played with this instance
 * @property {int} activePlayer the currently active players index in this game 
 * @property {Boolean} gameDebug actives some debug
 * @property {Boolean} gameHalted halts the game if set to true
 * @property {Array} results holds the results of this game
 * @property {Array} chartArray holds cumulative results for charting
 * @author Christian Vogt <mail@christianvogt.de>
 * @todo check for default and mandatory parameter
 * @todo more options for player and its learner instance
 */
function Game(_options) {
    this.options = _options;
    this.env = new Environment(this.options.height, this.options.width);
    this.env.draw(document.getElementById(this.options.canvasId), this.options.draw.fps, this.options.draw.scale);
    this.stepsPlayed = 0;
    this.gamesPlayed = 0;
    this.stepsAverage = 0;
    this.activePlayer = 0;
    this.gameDebug = false;
    this.results = [];

    this.saveResult = function() {
        this.stepsAverage = this.stepsAverage+(this.stepsPlayed-this.stepsAverage)/this.gamesPlayed;

        if (this.gamesPlayed < 100) {
            this.results.push([this.gamesPlayed, Math.ceil(this.stepsAverage), Object.keys(this.env.players[1].qlearner.stateTable).length]);
        } else if (this.gamesPlayed < 1000 && this.gamesPlayed%10 === 0) {
            this.results.push([this.gamesPlayed, Math.ceil(this.stepsAverage), Object.keys(this.env.players[1].qlearner.stateTable).length]);
        } else if (this.gamesPlayed >= 1000 && this.gamesPlayed%100 === 0) {
            this.results.push([this.gamesPlayed, Math.ceil(this.stepsAverage), Object.keys(this.env.players[1].qlearner.stateTable).length]);
        } else {
            return;
        }
        this.drawGameChart();
    };

    /**
     * Add a Hunter to the game
     *
     * @param {Position} _position
     * @param {Player} _Player constructor for the player to add
     */
    this.addPlayer = function(_position, _Player) {
        checkInstance(_position, Position);
        var player = new _Player(_position, this.env);
        checkInstance(player, Player);
        this.env.players.push(player);
        return player;
    };

    /**
     * Add an Obstacle to the game
     *
     * @param {Position} _position
     */
    this.addObstacle = function(_position) {
        checkInstance(_position, Position);
        this.env.obstacles.push(new Obstacle(_position));
    };

    /**
     * Let the computer play a whole game
     *
     * @param {fuction} _cb the callback function that executes when the game finishes
     */
    this.play = function(_cb) {
        var self = this;

        // if game is over, return
        if (this.step()) {
            this.restart();
            if (_cb) _cb();
        } else { // else play again
            setTimeout(function(){
                self.play(_cb);
            }, this.options.delayBetweenSteps);
        }
    };

    /**
     * Perform a step in the game, meaning that the active player moves once. 
     * Check if the game is over after one complete move
     *
     * @returns {Boolean} whether the game is over
     */
    this.step = function () {
        this.stepsPlayed++;
        this.activePlayer = (++this.activePlayer)%this.env.players.length;
        if (this.gameDebug) console.log('Game:\t\t Active Player: #' + this.activePlayer);

        var player = this.env.players[this.activePlayer];
        player.move();

        if(this.isGameOver()) {
            // let the other players make a last move to get their rewards for the game
            var currentPlayer = this.activePlayer;
            for (var i=0; i<this.env.players.length; i++) {
                if (i !== currentPlayer) this.env.players[i].move();
            }
            return true;
        } else {
            return false;
        }
    };

    /**
     * Reset all players to their starting positions and set steps to zero and increment game counter
     *
     */
    this.restart = function() {
        this.gamesPlayed++;
        this.saveResult();

        this.stepsPlayed = 0;
        this.env.players.forEach(function(player){
            player.shufflePosition();
            player.goalReached = false;
        });
    };

    /** 
     * Delete all results, flush players qLearner
     *
     */
     this.reset = function() {
        this.env.players.forEach(function(player){
            player.qlearner = new QLearner(player);
        });
        this.gamesPlayed = 0;
        this.results = [];
        this.chartArray = [];
        this.drawGameChart(true);
        this.restart();
     };

    /**
     * Run a number of games in sync, i.e. wait for the game to stop before starting the next one.
     *
     */
    this.autoRunGame = function (_times) {
        var timesToRun = _times;
        var self = this;
        var gameRunCallback = function() {
            if(--timesToRun) {
                setTimeout(function(){
                    self.play(gameRunCallback);
                }, 0);
            }
        };
        this.play(gameRunCallback);
    };

    /**
     * Determine if the game's goal is reached
     *
     * @returns {Boolean} whether the game is finished (true) or not (false)
     */
    this.isGameOver = function() {
        for (var i=0; i<this.env.players.length; i++) {
            if(this.env.players[i].goalReached) {
                return true;
            }
        }
        return false;
     };

    /**
     * Draw chart from results, prepend labels
     *
     */
    this.drawGameChart = function() {
        // check the size of the result array and push the average if reasonable
        var resultCount = this.results.length;
        var data = [['games run', 'steps average', 'stateTable size 1st hunter']].concat(this.results);
        drawChart(document.getElementById(this.options.chartDivId), data);
    };

    /**
     * Export the current games state. Can be imported via `importState()`. This will only work on HTML5 capable browsers.
     *
     * @param {String} _divName The name of the dom element that will hold the link to export.
     */
    this.exportState = function(_divName) {
        var a = document.getElementById(_divName);
        var state = {
            options: this.options,
            players: [],
            results: this.results,
            stepsAverage: this.stepsAverage,
            gamesPlayed: this.gamesPlayed
        };
        this.env.players.forEach(function(player){
            state.players.push({
                playerType: player.constructor.name,
                stateTable: player.qlearner.stateTable,
                position: player.position
            });
        });

        var blob = new Blob([JSON.stringify(state)], {type: "application/json"});
        var url = URL.createObjectURL(blob);
        a.href = url;
        a.download = _divName + '.json';
    };

    /**
     * Import a saved state into the game
     *
     * @param {Event} _evt Event from the filepicker.
     */
    this.importState = function(_evt) {
        var self = this;
        var reader = new FileReader();
        reader.readAsText(_evt.target.files[0]);

        reader.onloadend = function(file){
            var state = JSON.parse(file.target.result);

            // load players
            self.env.players = [];
            state.players.forEach(function(playerDescription){
                var player = new window[playerDescription.playerType](new Position(playerDescription.position.posx, playerDescription.position.posy), self.env);
                //player.shufflePosition();
                player.qlearner.stateTable = playerDescription.stateTable;
                self.env.players.push(player);
            });

            // load results
            self.results = state.results;
            self.stepsAverage = state.stepsAverage;
            self.gamesPlayed = state.gamesPlayed;

            // render results
            self.drawGameChart();
        };
    };
}