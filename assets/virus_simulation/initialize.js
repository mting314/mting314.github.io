let margin = {
        top: 10,
        right: 30,
        bottom: 30,
        left: 90
    },
    width = 630,
    height = 100;
duration = 5;

document.getElementById("display_china").addEventListener( 'change', function() {
    if(this.checked) {
        document.getElementById('china-line').style.visibility = "";
    } else {
        document.getElementById('china-line').style.visibility = "hidden";
    }
});

let us_default_color = 'green';
let us_overwhelmed_color = 'tomato';
let ch_color = 'dodgerblue';

// append the svg object to the body of the page
let svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + (margin.left / 2) + "," + (margin.top / 2) + ")");

// model params

// initialize default values
let gamma = 1.1;
let quarantine_rate = 10;
let mu = 0.01;
let n_ch_init = 100;
let t_quarantine = 0.5;

d3.select("#mu").property('value', mu);
d3.select("#gamma").property('value', gamma);
d3.select("#quarantine_rate").property('value', quarantine_rate);
d3.select("#ch_initial").property('value', n_ch_init);
d3.select("#t_shut").property('value', t_quarantine);

// when the input range changes update value 
d3.select("#mu").on("input", function () {
    mu = +this.value;
});
d3.select("#gamma").on("input", function () {
    gamma = +this.value;
});
d3.select("#quarantine_rate").on("input", function () {
    quarantine_rate = +this.value;
});
d3.select("#ch_initial").on("input", function () {
    n_ch_init = +this.value;
});
d3.select("#t_shut").on("input", function () {
    t_quarantine = +this.value;
});

let geojson = {}

let context = d3.select('#content canvas')
    .node()
    .getContext('2d');

let projection = d3.geoConicEquidistant()
    .scale(280)
    .center([-179, 50])
    .translate([20, -50])
    .rotate([180, 15, 00]);

let geoGenerator = d3.geoPath()
    .projection(projection)
    .pointRadius(2)
    .context(context);

let chLonLat = [114.3, 30.6];
let usLonLat = [-98.35, 39.5]; // geographic center of US!
let geoInterpolator = d3.geoInterpolate(chLonLat, usLonLat);

let x, x_axis, x_axis_svg;
let y_ch, y_axis_ch, y_axis_svg_ch;
let y_us, y_axis_us, y_axis_svg_us;

let ch_valueline, ch_data_line, us_valueline, us_data_line;

function reset() {
    t = 0;
    next_t_log = 0;
    log = [];

    t_shut = Infinity;
    past = [];
    overwhelmed = false;
    alreadyDrawn = false;

    n_ch = n_ch_init;
    n_us = 0;
    n_tr = 0;


    ch_dots = [];

    i_us = [];

    i_tr = [];

    x_domain_size = 5;
    y_us_domain_size = n_ch;
    y_ch_domain_size = n_ch * 4;

    clearLabels();
    svg.select("#us-after").remove();
    svg.select("#us-before").remove();

    resetting = true;
}

function clearLabels() {
    svg.select("#overwhelm-label").remove();
    svg.select("#shut-label").remove();
    svg.select("#overwhelm-line").remove();
    svg.select("#shut-line").remove();
}

function updateLines(x) {
    clearLabels();

    svg.append('line')
        .attr('x1', x(t_overwhelmed))
        .attr('y1', 0)
        .attr('x2', x(t_overwhelmed))
        .attr('y2', height)
        .attr("id", "overwhelm-line")
        .style('stroke', 'red')

    svg.append('line')
        .attr('x1', x(t_shut))
        .attr('y1', 0)
        .attr('x2', x(t_shut))
        .attr('y2', height)
        .attr("id", "shut-line")
        .style('stroke', 'green')

    svg.append("text")
        .attr("transform", "translate(" + x(t_shut) + "," + (height + 25).toString() + ")")
        .attr("dy", ".35em")
        .attr("id", "shut-label")
        .attr("text-anchor", "start")
        .style("fill", "green")
        .text("Shutdown");

    svg.append("text")
        .attr("transform", "translate(" + x(t_overwhelmed - .25) + "," + (height + 25).toString() + ")")
        .attr("dy", ".35em")
        .attr("id", "overwhelm-label")
        .attr("text-anchor", "start")
        .style("fill", "red")
        .text("Overwhelmed");
}
