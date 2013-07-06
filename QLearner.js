/**
 * Creates a new qlearner
 *
 * @constructor
 * @param {Player} _player the Player this QLearner is associated to
 * @todo wire up options
 * @author Christian Vogt <mail@christianvogt.de>
 */
function QLearner(_player) {
    checkInstance(_player, Player);

    this.player = _player;
    this.stateTable = {};
    this.alpha = 0.1; // learning rate 0:dont learn anything
    this.gamma = 0.9; // discount factor
    this.epsilon = 0.1; // exploration rate

    /**
     * Move player based on the current stateTable and the rewards for the next actions
     *
     */
    this.move = function() {
        var moveDebug = false;
        var currentPosition = new Position(this.player.position.posx, this.player.position.posy);
        var currentHash = this.player.hash();//stateHash(_player, this.env);
        if(moveDebug) console.log('QLearner:\t\t current Position: ' + currentPosition.toString());

        // determine action to perform
        this.stateTable[currentHash] = this.initState(currentHash);
        if(moveDebug) console.log('QLearner:\t\t current ActionTable: ' + this.stateTable[currentHash]);
        var action = this.chooseAction(this.stateTable[currentHash]);
        if(moveDebug) console.log('QLearner:\t\t Chosen Action: ' + action);

        // ok, now perform it
        this.player.performAction(action);

        // get reward for this action
        var reward = this.player.reward();//this.calculateReward(this.player);

        // determine new state hash
        var newHash = this.player.hash();//this.stateHash(_player, this.env);
        this.stateTable[newHash] = this.initState(newHash);

        // updates stateTable
        this.stateTable[currentHash][action] = this.stateTable[currentHash][action] + this.alpha * (reward + this.gamma * this.stateTable[newHash][this.chooseAction(this.stateTable[newHash])] - this.stateTable[currentHash][action]);
    };

    /**
     * Choose an action based on the given `_actionValues`
     *
     * @param {Array} _actionValues the array containing the actionValues
     * @return {ACTIONS} the determined action to perform
     */
    this.chooseAction = function (_actionValues) {
        var chooseActionDebug = false;
        // random?
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random()*_actionValues.length);
        }
        var actionCandidates = [];
        // do we have a single max value?
        var testMax = Array.max(_actionValues);
        var pos = _actionValues.indexOf(testMax); // first pos
        while ( pos != -1 ) {
            actionCandidates.push(pos);
            pos = _actionValues.indexOf(testMax, pos + 1);
        }
        var randomFromCandidates = actionCandidates[Math.floor(Math.random()*actionCandidates.length)];
        if(chooseActionDebug) console.log('ChooseAction:\t actionCandidates to choose from: ' + actionCandidates.toString());
        return randomFromCandidates;
    };

    /**
     * Init a single ActionTable entry
     *
     * @param {String} _hash the hash for the stateTable entry
     * @returns {Object} the action values for this hash or a default set (0)
     */
    this.initState = function (_hash) {
        if (!this.stateTable[_hash]) {
            this.stateTable[_hash] = newFilledArray(Object.keys(ACTIONS).length, 0);
        }
        return this.stateTable[_hash];
    };
}