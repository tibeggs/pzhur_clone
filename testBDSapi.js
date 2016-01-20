var ViewModel = function() {
	var self = this;

	this.sectors = ko.observableArray([
		{"code" : 00, "acr" : "EW", "name" : "Economy Wide" },
		{"code" : 07, "acr" : "AGR", "name" : "Agriculture, Forestry, and Fishing" },
		{"code" : 10, "acr" : "MIN", "name" : "Mining" },
		{"code" : 15, "acr" : "CON", "name" : "Construction" },
		{"code" : 20, "acr" : "MAN", "name" : "Manufacturing" },
		{"code" : 40, "acr" : "TCU", "name" : "Transportation, Communication, and Public Utilities" },
		{"code" : 50, "acr" : "WHO", "name" : "Wholesale Trade" },
		{"code" : 52, "acr" : "RET", "name" : "Retail Trade" },
		{"code" : 60, "acr" : "FIRE", "name" : "Finance, Insurance, and Real Estate" },
		{"code" : 70, "acr" : "SRV", "name" : "Services" },
		]);

	this.sector = ko.observable(00);

	this.sector.subscribe( function(newValue) {
		getBDSdata(newValue);
	}) 

}



ko.applyBindings(new ViewModel());



function getBDSdata(sic1) {
	
    var requestdata={
        //"get": ["sic1","job_creation_rate","fage4"],
		"get": "job_creation_rate,fage4",
        "for": "us:*",
		"time": "2012"
    };
	var url="http://api.census.gov/data/bds/firms";

	var geturl=url+"?";
	for (i in requestdata) {
		geturl+="&"+i+"="+requestdata[i]
	}
	geturl+='&sic1='+sic1;
	console.log(geturl);
	
	var parsed={};
	var jsoned=[];

	d3.json(geturl,function (data) {
		// for (i in data) {
// 			if (i==0) {
// 				for (name in data[0]) {
// 					parsed[data[0][name]]=[];
// 				}
// 			} else {
// 				for (name in data[0]) {
// 					parsed[data[0][name]].push(data[i][name]);
// 				}
// 			}
// 		}
		for (i in data) {
			var rec={};
			if (i>0) {
				for (name in data[0]) {
					rec[data[0][name]]=data[i][name];
				}
				jsoned.push(rec);
			}
		}
		makechart(jsoned);
		//console.log(parsed);
	   	});

	return jsoned;
	
	// var data;
// 	d3.json(geturl, function(error, json) {
//
// 	  if (error) return console.warn(error);
// 	  data = json;
// 	  console.log(json[0]);
// 	  console.log(data);
// 	 // visualizeit();
// 	});
// 	//debugger;
// 	console.log(data);
}



var datalocal="";

var data=getBDSdata(0);
//var datajson=data.responseJSON;
//console.log(data);


function makechart(data) {
	var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var svgcont = d3.select("svg");
	svgcont.selectAll("*").remove();
	svg=svgcont.attr("width", width + margin.left + margin.right)
     			.attr("height", height + margin.top + margin.bottom)
	 			.append('g')
	 			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	 			.attr('class', 'chart');
	
	//data=[[5,10],[12,20],[50,10]];
	
	//debugger;
	
	var xScale = d3.scale.ordinal()
					.domain(['a','b','c','d','e','f','g','h','i','j','k','l','m'])
					 //.domain(data.map(function(d) { return d["fage4"]; }))
                     //.domain([0, d3.max(data, function(d) { return +d['sic1']; })])
                     //.range([0, width]);
					 .rangeRoundBands([0, width], .1);
					 
	var yScale = d3.scale.linear()
                     .domain([0, d3.max(data, function(d) { return +d['job_creation_rate']; })])
                     .range([height,0]);
					 
					 //debugger;
					 
	var chart = svg.selectAll("rect")
			       .data(data)
			       .enter().append("rect")
				   //.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+","+height+")";})  
				.attr("fill",  "green")
				.attr("width", xScale.rangeBand())
				.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+",1500)";}).transition().duration(1000).ease("sin-in-out")
				.attr("height", function(d) {return height-yScale(+d['job_creation_rate'])})
				.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+","+yScale(+d['job_creation_rate'])+")";})
	
	//.transition().duration(1000)				
					 
			   svg.selectAll("text")
			       .data(data)
			       .enter().append("text")
					 .attr("x",function(d) {return xScale(d['fage4'])+xScale.rangeBand()/4})
					 .attr("y",function(d) {return yScale(+d['job_creation_rate'])+3})
			         .attr("dy", ".75em")
					 .attr("fill","white")
			         .text(function(d) { return d['job_creation_rate']; });
					 
					 
	 var xAxis = d3.svg.axis()
	     .scale(xScale)
	     .orient("bottom");
		 
	 var yAxis = d3.svg.axis()
	     .scale(yScale)
	     .orient("left");
	 
	 svg.append("g")
	     .attr("class", "x axis")
	     .attr("transform", "translate(0," + height + ")")
	     .call(xAxis);	
		 
	 svg.append("g")
		 .attr("class", "y axis")
		 .call(yAxis); 

					 
}