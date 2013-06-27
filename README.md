# HTML5 Reinforcement Learning

This framework wants to provide an easy-to-extend plattform for experimenting with Reinforcement Learning. 

## Start a game

    <script>
        var options0 = {
            delayBetweenSteps: 0,
            width: 11,
            height: 11,
            canvasId: 'canvas0',
            chartDivId: 'chart_div0',
            draw: {
                scale: 20,
                fps: 200
            }
        };
        var game0 = new Game(options0);
        var victim1 = game0.addPlayer(new Position(9, 9), ManualVictim);
        var hunter1 = game0.addPlayer(new Position(0, 0), Hunter);
        hunter1.shufflePosition();
    </script>


You'll also need a canvas `<canvas id="canvas0"></canvas>` and a chart div `<div id="chart_div0"></div>`. More advanced game types can be found in `./index.html`. Just open it with a modern browser (tested/developed in Chrome).