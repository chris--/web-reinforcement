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

// Load the Google Visualization API library
google.load('visualization', '1.0', {'packages':['controls']});
function drawChart(dashboardDiv, array) {

    // add divs for filter and chart
    var chartDiv = document.createElement("div");
    chartDiv.id = dashboardDiv.id + "_chart";
    var filterDiv = document.createElement("div");
    filterDiv.id = dashboardDiv.id + "_filter";
    dashboardDiv.appendChild(chartDiv);
    dashboardDiv.appendChild(filterDiv);

    // initialize components
    var dashboard = new google.visualization.Dashboard(dashboardDiv);
    var rangeSlider = new google.visualization.ControlWrapper({
      'controlType': 'NumberRangeFilter',
      'containerId': filterDiv.id,
      'options': {
        'filterColumnLabel': 'games run'
      }
    });
    var chart = new google.visualization.ChartWrapper({
        'chartType': 'LineChart',
        'containerId': chartDiv.id,
        'options': {
            title: 'Steps needed after x Episodes',
            vAxis: {title: 'steps/ StateTable size',  titleTextStyle: {color: 'red'}},
            legend: 'bottom'
        }
    });

    dashboard.bind(rangeSlider, chart);
    var data = google.visualization.arrayToDataTable(array);
    dashboard.draw(data);

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

/**
 *
 * @todo handle primitive types (int,string)
 */
function checkInstance(_testObject, _instance) {
    if (typeof _instance === 'int' || typeof _instance === 'string') {
        throw Error('cannot check for primitive types');
    }
    if (_testObject instanceof _instance) {
        return null;
    } else {
        throw Error('Argument is not of erwarted type');
    }
}
