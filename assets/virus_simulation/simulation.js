let t = 0;
let dt = 0.01;
let log_inc = 0.01
let log = [];


let overwhelmed = false;
let t_overwhelmed;
let t_shut = Infinity;

// rendering params and vars
let max_n = 1000;
let rad_ch = 8;
let rad_us = 6; // lol i don't know enough about mapping to know why these
// circles don't have the same size even when radii are the same
let dl = 0.05

let x_domain_size, y_us_domain_size, y_ch_domain_size;

let firsttime = true;
let alreadyDrawn = false;

let past = [];

// simulation and viz function
function update() {

    // Eulers method
    let d_ch = (gamma * n_ch - quarantine_rate) * dt;
    let d_us = (gamma * n_us - quarantine_rate) * dt;


    n_ch = n_ch + d_ch;
    n_us = n_us + d_us;

    d_tr = (mu * n_ch) * dt
    n_tr = n_tr + d_tr


    if (past.length >= 10) {
        past.shift();
    }

    past.push(n_us);

    if (!overwhelmed && past.length >= 10) {
        if (past.every(v => v > 0)) {
            t_overwhelmed = t;
            t_shut = t_overwhelmed + t_quarantine;
            overwhelmed = true;

        }
    }

    let us_color = overwhelmed ? us_overwhelmed_color : us_default_color;


    if (t < t_shut) {
        // transition dots out of China and into "in transit" list
        while (n_tr > 1) {
            n_tr = n_tr - 1;
            n_ch = n_ch - 1;
            i_tr.push(0);
            // i_tr_n = i_tr_n + 1;
        }
    } else {
        i_tr = [];
    }


    // for dots that have crossed, remove from "in transit" and add to n_us
    for (i = 0; i < i_tr.length; i++) {
        i_tr[i] = i_tr[i] + dl + dl * gaussianRand();
        if (i_tr[i] >= 1) {
            i_tr.splice(i, 1);
            n_us = n_us + 1;
        }
    }


    // hard limits to non-negative
    if (n_ch < 0) {
        n_ch = 0;
    }
    if (n_us < 0) {
        n_us = 0;
    }

    // only need to vizualize up to some max_n
    n_ch_viz = n_ch;
    if (n_ch_viz > max_n) {
        n_ch_viz = max_n;
    }

    n_us_viz = n_us;
    if (n_us_viz > max_n) {
        n_us_viz = max_n;
    }


    // add/remove people to the lists to get the right number of people
    while (ch_dots.length > Math.ceil(n_ch_viz)) {
        ch_dots.splice(Math.floor(Math.random() * ch_dots.length), 1);
    }

    while (ch_dots.length < Math.floor(n_ch_viz)) {
        pt = randomCircle(rad_ch)
        ch_dots.push([chLonLat[0] + pt[0], chLonLat[1] + pt[1]])
    }

    while (i_us.length > Math.ceil(n_us_viz)) {
        i_us.splice(Math.floor(Math.random() * i_us.length), 1);
    }

    while (i_us.length < Math.floor(n_us_viz)) {
        pt = randomCircle(rad_us)
        i_us.push([usLonLat[0] + pt[0], usLonLat[1] + pt[1]])
    }


    //DRAW THINGS
    context.clearRect(0, 0, 800, 600);

    // country map
    context.strokeStyle = '#666';
    context.lineWidth = 1;
    context.globalAlpha = 1;

    context.beginPath();
    geoGenerator({
        type: 'FeatureCollection',
        features: geojson.features
    })
    context.stroke();

    // graticule (lat-lon lines)
    context.lineWidth = 0.5;
    context.globalAlpha = 0.5;

    let graticule = d3.geoGraticule();
    context.beginPath();
    context.strokeStyle = '#ccc';
    geoGenerator(graticule());
    context.stroke();

    // China Bubble
    context.lineWidth = 2;
    context.globalAlpha = 1;
    context.strokeStyle = ch_color;

    context.beginPath()
    let chinaCircle = d3.geoCircle()
        .center(chLonLat)
        .radius(0.75 * rad_ch);
    geoGenerator(chinaCircle());
    context.stroke()

    // US Bubble
    context.strokeStyle = us_color;

    context.beginPath()
    let americaCircle = d3.geoCircle()
        .center(usLonLat)
        .radius(0.75 * rad_us);
    geoGenerator(americaCircle());
    context.stroke()


    // China to US flight line
    context.lineWidth = 2;
    context.globalAlpha = 0.5;

    context.beginPath();
    context.strokeStyle = 'grey';
    geoGenerator({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [chLonLat, usLonLat]
        }
    });
    context.stroke();

    // dots in China
    context.globalAlpha = 0.8;
    context.fillStyle = ch_color;

    for (i = 0; i < ch_dots.length; i++) {
        context.beginPath();
        geoGenerator({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: ch_dots[i],
                radius: 100
            }
        });
        context.fill();
    }

    // dots in flight
    context.globalAlpha = 1;

    for (i = 0; i < i_tr.length; i++) {
        context.beginPath();
        geoGenerator({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: geoInterpolator(i_tr[i])
            }
        });
        context.fill();
    }

    // dots in US
    context.globalAlpha = 0.75;
    context.fillStyle = us_color;

    for (i = 0; i < i_us.length; i++) {
        context.beginPath();
        geoGenerator({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: i_us[i]
            }
        });
        context.fill();
    }


    // GRAPHING

    // first time set up axes and lines
    if (firsttime) {
        x = d3.scaleLinear().domain([0, x_domain_size]).range([0, width]);
        x_axis = d3.axisBottom(x);
        x_axis_svg = svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")");
        x_axis_svg.call(x_axis);


        y_ch = d3.scaleLinear().domain([0, y_ch_domain_size]).range([height, 0]);
        y_axis_ch = d3.axisLeft(y_ch);
        y_axis_svg_ch = svg.append("g")
            .attr("class", "axis axis--y")
            .style("fill", ch_color);
        y_axis_svg_ch.call(y_axis_ch);

        y_us = d3.scaleLinear().domain([0, y_us_domain_size]).range([height, 0]);
        y_axis_us = d3.axisRight(y_us);
        y_axis_svg_us = svg.append("g")
            .attr("class", "axis axis--y")
            .style("fill", us_color)
            .attr("transform", "translate(" + width + " ,0)");
        y_axis_svg_us.call(y_axis_us);


        ch_valueline = d3.line()
            .x(function (d) {
                return x(d[0]);
            })
            .y(function (d) {
                return y_ch(d[1]);
            });
        ch_data_line = svg.append("path")
            .attr("fill", "none")
            .attr("stroke", ch_color)
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("id", "china-line")
            .attr("d", ch_valueline(log));

        us_valueline = d3.line()
            .x(function (d) {
                return x(d[0]);
            })
            .y(function (d) {
                return y_us(d[2]);
            });
        us_data_line = svg.append("path")
            .attr("fill", "none")
            .attr("stroke", us_default_color)
            .attr("id", "us-before")
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("d", ch_valueline(log));
        firsttime = false;
    }

    // if reset has occurred make sure to reset axes
    if (resetting) {
        x.domain([0, x_domain_size])
        x_axis_svg.transition().duration(duration).ease(d3.easeLinear, 2).call(x_axis);

        y_ch.domain([0, y_ch_domain_size])
        y_axis_svg_ch.transition().duration(duration).ease(d3.easeLinear, 2).call(y_axis_ch);

        y_us.domain([0, y_us_domain_size])
        y_axis_svg_us.transition().duration(duration).ease(d3.easeLinear, 2).call(y_axis_us);

        us_data_line = svg.append("path")
            .attr("fill", "none")
            .attr("stroke", us_default_color)
            .attr("id", "us-before")
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("d", ch_valueline(log));

        resetting = false;


    }

    // only update graph every so often
    if (t >= next_t_log) {
        next_t_log = t + log_inc;
        log.push([t, n_ch, n_us]);

        // might need to rescale axes
        if (t > x_domain_size) {
            updateLines(x);
            x_domain_size = t
            x.domain([0, x_domain_size])
            x_axis_svg.transition().duration(duration).ease(d3.easeLinear, 2).call(x_axis);
        }

        if (n_ch > y_ch_domain_size) {
            y_ch_domain_size = n_ch * 1.5
            y_ch.domain([0, y_ch_domain_size])
            y_axis_svg_ch.transition().duration(duration).ease(d3.easeLinear, 2).call(y_axis_ch);
        }

        if (n_us > y_us_domain_size) {
            y_us_domain_size = n_us * 1.5
            y_us.domain([0, y_us_domain_size])
            y_axis_svg_us.transition().duration(duration).ease(d3.easeLinear, 2).call(y_axis_us);
        }

        // update the lines
        ch_data_line
            .transition()
            .duration(duration)
            .attr("d", ch_valueline(log));
        us_data_line
            .transition()
            .duration(duration)
            .attr("d", us_valueline(log));
    }
    if (overwhelmed) {
        if (!alreadyDrawn) {
            svg.select("#us-before").remove();
            us_data_line = svg.append("path")
                .attr("fill", "none")
                .attr("stroke", us_overwhelmed_color)
                .attr("stroke-width", 1.5)
                .attr("class", "line")
                .attr("id", "us-after")
                .attr("d", us_valueline(log));
            updateLines(x);
            alreadyDrawn = true;
        }
    }

    // increment time (only needed for logging)
    t = t + dt;

    // if the total infeccted passes 100k stop things
    if (n_ch + n_us > 100000) {
        clearInterval(interval);
        d3.select("#play-button").text("Start")
        alert('Reached 100k infected. Violates early phase assumptions. stopping.')
    }
}

$.getJSON("./world.json", function (json) {
    geojson = json;
    reset();
    update();
    interval = null;

    // add a play/pause and reset buttons
    // https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    let playButton = d3.select("#play-button");
    playButton.on("click", function () {
        let button = d3.select(this);
        if (button.text() == "Pause") {
            clearInterval(interval);
            button.text("Start");
        } else {
            interval = setInterval(update, 50);
            button.text("Pause");
        }
    })

    let resetButton = d3.select("#reset-button");
    resetButton.on("click", function () {
        // let button = d3.select(this);
        clearInterval(interval);
        reset();
        update();
        d3.select("#play-button").text("Start")
    })

});