require("./lib/social"); //Do not delete
var d3 = require('d3');

// Parse the date / time
var parseYear = d3.time.format("%Y").parse;

var svg, x, y;

// colors
function color_by_dataset(dataset) {
  if (dataset == "historical") {
    return "#C10326";
  } else if (dataset == "projected") {
    return "#E08041";
  } else {
    return "FCDC4D";
  }
}

rateData.forEach(function(d) {
    d.rateShort = Math.round(d.rate*100)/100;
});

var ratesNested = d3.nest()
  .key(function(d){ return d.group; })
  .entries(rateData);
  // .map(rateData, d3.map);

console.log(ratesNested);

var flatData = [];
rateData.forEach(function(d,idx){
  flatData.push(
    {key: d.group, rate: d.rate, year: d.year}
  );
});

console.log(flatData);

// setting sizes of interactive
var margin = {
  top: 15,
  right: 100,
  bottom: 50,
  left: 100
};
if (screen.width > 768) {
  var width = 700 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;
} else if (screen.width <= 768 && screen.width > 480) {
  var width = 650 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;
} else if (screen.width <= 480 && screen.width > 340) {
  console.log("big phone");
  var margin = {
    top: 15,
    right: 45,
    bottom: 35,
    left: 30
  };
  var width = 340 - margin.left - margin.right;
  var height = 350 - margin.top - margin.bottom;
} else if (screen.width <= 340) {
  console.log("mini iphone")
  var margin = {
    top: 15,
    right: 55,
    bottom: 35,
    left: 30
  };
  var width = 310 - margin.left - margin.right;
  var height = 350 - margin.top - margin.bottom;
}

svg = d3.select("#line-chart").append('svg')
   .attr('width', width + margin.left + margin.right)
   .attr('height', height + margin.top + margin.bottom)
   .append("g")
   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// x-axis scale
var x = d3.time.scale().range([0,width]);

// y-axis scale
var y = d3.scale.linear().range([height, 0]);

// x-axis scale
x.domain(d3.extent([parseYear("1979"),parseYear("2023")]));//.nice();
y.domain([0, 30]);

var voronoiArea = d3.geom.voronoi()
    .x(function(d) {
      return x(parseYear(String(d.year)));
    })
    .y(function(d) {
      return y(d.rate);
    })
    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom")
    .tickFormat(d3.time.format("%Y")); // tickFormat

var yAxis = d3.svg.axis().scale(y)
    .orient("left");

var valueline = d3.svg.line()
    .interpolate("monotone")//linear, linear-closed,step-before, step-after, basis, basis-open,basis-closed,monotone
    .x(function(d) {
      return x(parseYear(String(d.year)));
    })
    .y(function(d) {
      return y(d.rate);
    });

ratesNested.forEach(function(d) {
  console.log(d);
  var class_list = "line voronoi id"+d.key;
  svg.append("path")
    .attr("class", class_list)
    .style("stroke", color_by_dataset(d.key))//cscale(d.key))//
    .attr("d", valueline(d.values));
});

var focus = svg.append("g")
    .attr("transform", "translate(-100,-100)")
    .attr("class", "focus");

if (screen.width >= 480) {
  focus.append("circle")
      .attr("r", 3.5);

  focus.append("rect")
      .attr("x",-110)
      .attr("y",-25)
      .attr("width","120px")
      .attr("height","20px")
      .attr("opacity","0.8")
      .attr("fill","white")
      .attr("pointer-events", "none");

  focus.append("text")
      .attr("x", -100)
      .attr("y", -10)
      .attr("pointer-events", "none");
}

var voronoiGroup = svg.append("g")
    .attr("class", "voronoi");

voronoiGroup.selectAll(".voronoi")
  .data(voronoiArea(flatData))
  .enter().append("path")
  .attr("d", function(d) {
    if (d) {
      return "M" + d.join("L") + "Z";
    }
  })
  .datum(function(d) {
    if (d) {
      return d.point;
    }
  })
  .on("mouseover", mouseover)
  .on("mouseout", mouseout);

function mouseover(d) {
  console.log("mousing in");
  d3.select(".id"+d.key).classed("line-hover", true);
  focus.attr("transform", "translate(" + x(parseYear(String(d.year))) + "," + y(d.rate) + ")");
  focus.select("text").text(d.year+": "+d.rate+ "%");
}

function mouseout(d) {
  console.log("mousing out");
  d3.select(".id"+d.key).classed("line-hover", false);
  focus.attr("transform", "translate(-100,-100)");
}

if (screen.width <= 480) {
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)" )
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", 35)
      .style("text-anchor", "end")
      .text("Month")
} else {
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", 40)
      .style("text-anchor", "end")
      .text("Month");
}

if (screen.width <= 480) {
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 10)
      .attr("x", 0)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      // .style("fill","white")
      .text("Contribution rates (%)")
} else {
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -10)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      // .style("fill","white")
      .text("Contribution rates (%)")
}
