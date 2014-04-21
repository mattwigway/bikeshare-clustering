var width = 400;
var height = 275;

 // TODO: hardcoding is bad
var ydiff = d3.scale.linear().domain([0, 7]).range([height,0]);
var yp    = d3.scale.linear().domain([0, 0.3]).range([height,0]);

var dragging = false;
var dragx = null;

var color = {
    // we keep the same type of accessibility in the same color
    jobs10: d3.rgb('#41417b'),
    jobs30: d3.rgb('#41417b'),
    jobs60: d3.rgb('#41417b'),

    population10: d3.rgb('#22571e'),
    population30: d3.rgb('#22571e'),
    population60: d3.rgb('#22571e'),

    bike30: d3.rgb('#56706c'),

    // both of the percentages: casual and weekend use
    // note that this is in a warm color to make it appear quantitatively different from the others,
    // which is because all of the others were used in the clustering but these variables were not
    casual: d3.rgb('#9d4343'),
    weekend: d3.rgb('#9d4343')
};

d3.csv('data.csv', function (data) {
    // debugging
    theData = data;

    var chartArea = d3.select('#viz');

    // draw the same plot for each of the clusters
    data.forEach(function (cluster, clusterIndex) {
        var chart = chartArea.append('div')
            .attr('class', 'cluster-chart')
            .append('svg')
            .attr('width', width + 'px')
            .attr('height', (height + 50) + 'px')
            .append('g');

        // add the bars separately
        var vars = ['jobs10', 'jobs30', 'jobs60', 'population10', 'population30', 'population60', 'bike30', 'weekend', 'casual'];
        var varLabels = ['10 min', '30 min', '60 min', '10 min', '30 min', '60 min', '30 min', 'Wknd', 'Casual'];
        chart.selectAll('rect.bar')
            .data(vars)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('width', width / 10)
            .attr('height', function (d) {
                if (d == 'casual' || d == 'weekend')
                    // p stands for probability, as in the binomial distribution
                    return height - yp(cluster['p.' + d]);
                else
                    return height - ydiff(cluster['mean.' + d]);
            })
            .attr('transform', function (d, i) {
                var x = i * width / 9;
                if (d == 'casual' || d == 'weekend')
                    var y = yp(cluster['p.' + d]);
                else
                    var y = ydiff(cluster['mean.' + d]);
                return 'translate(' + x + ' ' + y + ')';
            })
            .attr('fill', function (d) { return color[d] });

        // add confidence bands
        chart.selectAll('line.band')
            .data(vars)
            .enter().append('line')
            .attr('class', 'band')
            .attr('x1', function (d, i) { return i * width / 9 + width/18 })
            .attr('x2', function (d, i) { return i * width / 9 + width/18 })
            // lower end
            .attr('y1', function (d) {
                if (d == 'casual' || d == 'weekend')
                    return yp(Number(cluster['p.' + d]) - Number(cluster['conf.' + d]));
                else
                    return ydiff(Number(cluster['mean.' + d]) - Number(cluster['conf.' + d]));
            })
            // upper end
            .attr('y2', function (d) {
                if (d == 'casual' || d == 'weekend')
                    return yp(Number(cluster['p.' + d]) + Number(cluster['conf.' + d]));
                else
                    return ydiff(Number(cluster['mean.' + d]) + Number(cluster['conf.' + d]));
            })
            .attr('stroke', '#000');       

        // indifference line: accessibility at origin == accessibility at destination
        chart.append('line')
            .attr('x1', 0).attr('x2', 7 * width / 9 - (width / 9 - width / 10))
            .attr('y1', ydiff(1)).attr('y2', ydiff(1))
            .attr('stroke', '#000')
            .attr('stroke-width', .75);

        // add labels
        var t = chart.selectAll('text.chLabel')
            .data(vars)
            .enter().append('text')
            .attr('x', 15).attr('y', 15);
            
        t.append('tspan')
            .text(function (d) {
                return 'Cluster ' + (clusterIndex + 1);
            });

        t.append('tspan')
            .attr('dy', 15).attr('x', 15)
            .text('n: ' + cluster['n.jobs10']);

        // now, all the fancy labels
        chart.selectAll('text.colLabel')
            .data(varLabels)
            .enter().append('text')
            .attr('class', 'colLabels')
            .attr('x', function (d, i) {
                return i * width / 9
            })
            .attr('y', height + 15)
            .text(String);

        chart.append('line')
            .attr('x1', 0)
            // leave a gap
            .attr('x2', 3 * width / 9 - (width / 9 - width / 10))
            .attr('y1', height + 20)
            .attr('y2', height + 20)
            .attr('stroke', '#000');

        chart.append('line')
            .attr('x1', 3 * width / 9)
            // leave a gap
            .attr('x2', 6 * width / 9 - (width / 9 - width / 10))
            .attr('y1', height + 20)
            .attr('y2', height + 20)
            .attr('stroke', '#000');

        chart.append('text')
            .attr('x', 20)
            .attr('y', height + 38)
            .text('Jobs');

        chart.append('text')
            .attr('x', 3 * width / 9 + 20)
            .attr('y', height + 38)
            .text('Population');

        var bSt = chart.append('text')
            .attr('x', 6 * width / 9)
            .attr('y', height + 33);

        bSt.append('tspan')
            .text('Bike');
        bSt.append('tspan')
            .attr('dy', 15)
            .attr('x', 6 * width / 9)
            .text('Stations')

        
                
                
    });

    // set up dragging
    chartArea.on('mousedown', function () {
        dragging = true;
    });

    chartArea.on('mousemove', function () {
        if (dragging) {
            if (dragx != null)
                // scroll by the amount moved
                chartArea[0][0].scrollLeft -= d3.event.clientX - dragx;
            dragx = d3.event.clientX;
        }            
    });
    
    chartArea.on('mouseup', function () {
        dragging = false;
        dragx = null;
    });

    // draw the axes
    var paxis = d3.svg.axis()
        .scale(yp)
        .orient('right')
        .tickFormat(d3.format('p'));

    var diffaxis = d3.svg.axis()
        .scale(ydiff)
        .orient('left');

    d3.selectAll('.axis')
        .append('svg')
        .attr('width', '60px')
        .attr('height', (height + 10) + 'px')
        .append('g')
        .data([[diffaxis, 'Ratio of accessibilities at ends of trip'], [paxis, 'Percentage of trips']])
        .each(function (axis) {
            axis[0](d3.select(this));

	    var t = d3.select(this)
		.append('text')
		.text(axis[1]);

	    var left = axis[0].orient() == 'left';
	    if (left) {
		d3.select(this).attr('transform', 'translate(40 0)');
		t.attr('transform', 'rotate(-90) translate (-' + height + ' -25)');
	    }
	    else {
		t.attr('transform', 'rotate(90) translate (60 -45)')
	    }
        });
});
