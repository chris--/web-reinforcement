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
    this.activePlayer = 0;
    this.gameDebug = false;
    this.gameHalted = false;
    this.results = [];
    this.chartArray = [];
    this.chartArray.push(['games run', 'steps average', 'steps median']);

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
        if (this.gameHalted) {
            if (this.gameDebug) console.log('Game:\t\t Halted. Wont move until flag is false');
            return true;
        }
        this.stepsPlayed++;
        this.activePlayer = (++this.activePlayer)%this.env.players.length;
        if (this.gameDebug) console.log('Game:\t\t Active Player: #' + this.activePlayer);

        var player = this.env.players[this.activePlayer];
        if(!(player instanceof ManualVictim)) player.move();

        if(this.isGameOver()) {
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
        this.stepsPlayed = 0;
        this.gamesPlayed++;
        this.env.players.forEach(function(player){
            player.shufflePosition();
            player.goalReached = false;
        });
        this.gameHalted = false;
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
                // console.log('Game finished in ' + Math.floor(this.stepsPlayed/this.env.players.length) + ' rounds. We played ' + this.gamesPlayed + ' games so far');
                this.results.push({gamesPlayed:this.gamesPlayed+1, stepsNeeded:Math.ceil(this.stepsPlayed/this.env.players.length)});
                this.chartArray.push([this.gamesPlayed, this.printResults().stepsNeeded.average, this.printResults().stepsNeeded.median]);
                this.drawGameChart();
                this.gameHalted = true;
                return true;
            }
        }
        return false;
     };

    /**
     * Calculate results.
     *
     * @returns {Object} containing the number of played games, steps needed in avg. and median and the player count 
     */
    this.printResults = function() {
        var totalAverageSteps = 0;
        var totalResultsArray = [];
        this.results.forEach(function(result){
            totalResultsArray.push(result.stepsNeeded);
            totalAverageSteps += result.stepsNeeded;
        });
        // var last10Results = this.results.slice(this.results.length-10,this.results.length);
        return {    gamesPlayed: this.gamesPlayed,
                    stepsNeeded: {
                        average: Math.ceil(totalAverageSteps/this.gamesPlayed),
                        median: Math.ceil(median(totalResultsArray))
                    },
                    playerCount: this.env.players.length
                };
    };

    /**
     * Draw chart from results
     *
     * @param {Boolean} _force Force the chart draw. If set to false only draws every 10/100/1000 
     * results depending on the result set size.
     */
    this.drawGameChart = function(_force) {
        // check the size of the result array and push the average if reasonable
        var resultCount = this.chartArray.length;
        if (_force) {
            drawChart(document.getElementById(this.options.chartDivId), this.chartArray);
        } else if (resultCount > 10 && resultCount <= 100) {
            drawChart(document.getElementById(this.options.chartDivId), this.chartArray);
        } else if (resultCount > 100 && resultCount <= 1000) {
            if (this.gamesPlayed%10 === 0) drawChart(document.getElementById(this.options.chartDivId), this.chartArray);
        } else if (resultCount > 1000) {
            if (this.gamesPlayed%100 === 0) drawChart(document.getElementById(this.options.chartDivId), this.chartArray);
        }
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
            chartArray: this.chartArray,
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
            self.chartArray = state.chartArray;
            self.gamesPlayed = state.gamesPlayed;

            // render results
            self.drawGameChart(true);
            self.gameHalted = false;
        };
    };
}