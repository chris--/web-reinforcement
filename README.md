# HTML5 Reinforcement Learning

This framework tries to provide an easy-to-extend plattform for experimenting with Reinforcement Learning. 

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

# Hintergrundwissen

Für die Softwarepräsentation

## Motivation

* Q-Learning-Algo verstehen
* Leicht erweiterbare Plattform erstellen

## Realisierung

Hier werden die einzelnen Komponenten des Spiels kurz vorgestellt.

### Environment 

* Umwelt
* Grid-World
* obstacles
* players
* getResultingPosition()

### Player

* Position
* performAction()
* reward() (goalReached)
* hash()
* qlearner

### QLearner

* 1-1 Player
* move()
* chooseAction()
* initState()

### Game

* options
* import/export
* play()
* step()
* asnyc/sync


## Player
    
Ausprägung von Player bestimmt seine Fähigkeiten und Ziele.

### Victim

Hat kein Ziel und keinen qLearner, bewegt sich zufällig.

### StillVictim

Erbt von Victim, bewegt sich nicht.

### ManualVictim

Erbt von Victim, bewegt sich nur durch Keyboardtasten hoch, runter, links, rechts. `ShufflePosition` wird überschrieben.

### Hunter

QLearner ist aktiviert, die Reward-Funktion wird angepasst, so dass der Hunter belohnt wird, wenn er sich dem Victim auf 1 Feld genähert hat.

### SensingHunter

Erbt vom Hunter, kann Victims "sensen", also die Richtung auf eine einstellbare Entfernung ausmachen. Dafür wird die Hash-Funktion überschrieben und mit der Distanz zum Victim erweitert. Die Sichtweite lässt sich über den Parameter `this.sight` einstellen.

### OptimizedSensingHunter

Erbt vom SensingHunter, die Hash-Tabelle enthält nicht nur die Richtung sondern auch die Distanz zum Victim.

### TeamHunter

Erbt vom SensingHunter, kann zusätzlich zum "sensing" andere Hunter nach ihren Sensing-Informationen fragen.

### AllKnowingHunter

Erbt vom Hunter, verwendet als Hash seine Position und die Position des Victims. Dadurch wird die Zustandstabelle sehr groß und es dauert sehr lange, bis sich der Hunter auf dem Spielfeld zurechtfindet. 