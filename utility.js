Array.max = function( array ){
    return Math.max.apply( Math, array );
};

Array.min = function( array ){
    return Math.min.apply( Math, array );
};

function median(values) {
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

// Load the Visualization API library and the piechart library.
google.load('visualization', '1.0', {'packages':['corechart']});
//google.setOnLoadCallback(drawChart);
function drawChart(div, array) {
    var chart = new google.visualization.LineChart(div);
    var data = google.visualization.arrayToDataTable(array);
    var options = {
        title: 'Steps needed after x Episodes',
        vAxis: {title: 'steps',  titleTextStyle: {color: 'red'}}
    };
    chart.draw(data, options);
}

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

function newFilledArray(_length, _val) {
    var array = [];
    for (var i = 0; i < _length; i++) {
        array[i] = _val;
    }
    return array;
}

function checkInstance(_testObject, _instance) {
    if (_testObject instanceof _instance) {
        return null;
    } else {
        throw Error('Argument is not of erwarted type');
    }
}
