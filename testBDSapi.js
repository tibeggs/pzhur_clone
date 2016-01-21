

var ViewModel = function() {
	var self = this;
	this.states= [
		{"code" : "00", "name" : "United States", "st":"US"},
		{"code" : "01", "name" : "Alabama", "st" : "AL" },
		{"code" : "02", "name" : "Alaska", "st" : "AK" },
		{"code" : "04", "name" : "Arizona", "st" : "AZ" },
		{"code" : "05", "name" : "Arkansas", "st" : "AR" },
		{"code" : "06", "name" : "California", "st" : "CA" },
		{"code" : "08", "name" : "Colorado", "st" : "CO" },
		{"code" : "09", "name" : "Connecticut", "st" : "CT" },
		{"code" : "10", "name" : "Delaware", "st" : "DE" },
		{"code" : "11", "name" : "District of Columbia", "st" : "DC" },
		{"code" : "12", "name" : "Florida", "st" : "FL" },
		{"code" : "13", "name" : "Georgia", "st" : "GA" },
		{"code" : "15", "name" : "Hawaii", "st" : "HI" },
		{"code" : "16", "name" : "Idaho", "st" : "ID" },
		{"code" : "17", "name" : "Illinois", "st" : "IL" },
		{"code" : "18", "name" : "Indiana", "st" : "IN" },
		{"code" : "19", "name" : "Iowa", "st" : "IA" },
		{"code" : "20", "name" : "Kansas", "st" : "KS" },
		{"code" : "21", "name" : "Kentucky", "st" : "KY" },
		{"code" : "22", "name" : "Louisiana", "st" : "LA" },
		{"code" : "23", "name" : "Maine", "st" : "ME" },
		{"code" : "24", "name" : "Maryland", "st" : "MD" },
		{"code" : "25", "name" : "Massachusetts", "st" : "MA" },
		{"code" : "26", "name" : "Michigan", "st" : "MI" },
		{"code" : "27", "name" : "Minnesota", "st" : "MN" },
		{"code" : "28", "name" : "Mississippi", "st" : "MS" },
		{"code" : "29", "name" : "Missouri", "st" : "MO" },
		{"code" : "30", "name" : "Montana", "st" : "MT" },
		{"code" : "31", "name" : "Nebraska", "st" : "NE" },
		{"code" : "32", "name" : "Nevada", "st" : "NV" },
		{"code" : "33", "name" : "New Hampshire", "st" : "NH" },
		{"code" : "34", "name" : "New Jersey", "st" : "NJ" },
		{"code" : "35", "name" : "New Mexico", "st" : "NM" },
		{"code" : "36", "name" : "New York", "st" : "NY" },
		{"code" : "37", "name" : "North Carolina", "st" : "NC" },
		{"code" : "38", "name" : "North Dakota", "st" : "ND" },
		{"code" : "39", "name" : "Ohio", "st" : "OH" },
		{"code" : "40", "name" : "Oklahoma", "st" : "OK" },
		{"code" : "41", "name" : "Oregon", "st" : "OR" },
		{"code" : "42", "name" : "Pennsylvania", "st" : "PA" },
		{"code" : "44", "name" : "Rhode Island", "st" : "RI" },
		{"code" : "45", "name" : "South Carolina", "st" : "SC" },
		{"code" : "46", "name" : "South Dakota", "st" : "SD" },
		{"code" : "47", "name" : "Tennessee", "st" : "TN" },
		{"code" : "48", "name" : "Texas", "st" : "TX" },
		{"code" : "49", "name" : "Utah", "st" : "UT" },
		{"code" : "50", "name" : "Vermont", "st" : "VT" },
		{"code" : "51", "name" : "Virginia", "st" : "VA" },
		{"code" : "53", "name" : "Washington", "st" : "WA" },
		{"code" : "54", "name" : "West Virginia", "st" : "WV" },
		{"code" : "55", "name" : "Wisconsin", "st" : "WI" },
		{"code" : "56", "name" : "Wyoming", "st" : "WY" }];

	this.fage = [
		{"code" : "a", "name" : "0" },
		{"code" : "b", "name" : "1" },
		{"code" : "c", "name" : "3" },
		{"code" : "d", "name" : "3" },
		{"code" : "e", "name" : "4" },
		{"code" : "f", "name" : "5" },
		{"code" : "g", "name" : "6-10" },
		{"code" : "h", "name" : "11-15" },
		{"code" : "i", "name" : "16-20" },
		{"code" : "j", "name" : "21-25" },
		{"code" : "k", "name" : "26+" },
		{"code" : "l", "name" : "Born before '76" },
		{"code" : "m", "name" : "All Ages" }];

	this.sectors = [
		{"code" : 00, "acr" : "EW", "name" : "Economy Wide" },
		{"code" : 07, "acr" : "AGR", "name" : "Agriculture, Forestry, and Fishing" },
		{"code" : 10, "acr" : "MIN", "name" : "Mining" },
		{"code" : 15, "acr" : "CON", "name" : "Construction" },
		{"code" : 20, "acr" : "MAN", "name" : "Manufacturing" },
		{"code" : 40, "acr" : "TCU", "name" : "Transportation, Communication, and Public Utilities" },
		{"code" : 50, "acr" : "WHO", "name" : "Wholesale Trade" },
		{"code" : 52, "acr" : "RET", "name" : "Retail Trade" },
		{"code" : 60, "acr" : "FIRE", "name" : "Finance, Insurance, and Real Estate" },
		{"code" : 70, "acr" : "SRV", "name" : "Services" }];
		
	this.measures = [
		{"code" : "firms", "name" : "Number of firms" },
		{"code" : "estabs", "name" : "Number of establishments" },
		{"code" : "emp", "name" : "Employment" },
		{"code" : "estabs_entry", "name" : "Establishments born during the last 12 months" },
		{"code" : "estabs_entry_rate", "name" : "Establishment birth rate" },
		{"code" : "estabs_exit", "name" : "Establishments exiting during the last 12 months" },
		{"code" : "estabs_exit_rate", "name" : "Establishment exit rate" },
		{"code" : "job_creation", "name" : "Jobs created over the last 12 months" },
		{"code" : "job_creation_births", "name" : "Jobs created by establishment births over the last 12 months" },
		{"code" : "job_creation_continuers", "name" : "Jobs created by continuing establishments over the last 12 months" },
		{"code" : "job_creation_rate_births", "name" : "Jobs creation rate from establishment births" },
		{"code" : "job_creation_rate", "name" : "Job creation rate" },
		{"code" : "job_destruction", "name" : "Jobs destroyed within the last 12 months" },
		{"code" : "job_destruction_deaths", "name" : "Jobs destroyed by establishment exit over the last 12 months" },
		{"code" : "job_destruction_continuer", "name" : "Jobs destroyed at continuing establishments over the last 12 months" },
		{"code" : "job_destruction_rate_deat", "name" : "Jobs destruction rate from establishment exit" },
		{"code" : "job_destruction_rate", "name" : "Jobs destruction rate" },
		{"code" : "net_job_creation", "name" : "Net job creation" },
		{"code" : "net_job_creation_rate", "name" : "Net job creation rate" },
		{"code" : "reallocation_rate", "name" : "Reallocation rate" },
		{"code" : "firmdeath_firms", "name" : "Number of firm exits" },
		{"code" : "firmdeath_estabs", "name" : "Establishment exit due to firm death" },
		{"code" : "firmdeath_emp", "name" : "Job destruction from firm exit" }];

	this.sector = ko.observable(this.sectors[0].code);
	this.measure = ko.observable(this.measures[11].code);

	this.sector.subscribe( function(newValue) {
		getBDSdata(newValue,self.measure());
	})

	this.measure.subscribe( function(newValue) {
		getBDSdata(self.sector(),newValue);
	}) 





function getBDSdata(sic1,measure) {
	
    var requestdata={
        //"get": ["sic1","job_creation_rate","fage4"],
		"get": "fage4,"+measure,
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
	
	
	var jsoned=[];

	d3.json(geturl,function (data) {

		for (i in data) {
			var rec={};
			if (i>0) {
				for (name in data[0]) {
					rec[data[0][name]]=data[i][name];
				}
				jsoned.push(rec);
			}
		}
		makechart(jsoned,measure);
		
	   	});

	return jsoned;
	

}


var data=getBDSdata(0,"job_creation_rate");



function makechart(data,measure) {
	var margin = {top: 20, right: 30, bottom: 30, left: 80},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var svgcont = d3.select("svg");
	svgcont.selectAll("*").remove();
	svg=svgcont.attr("width", width + margin.left + margin.right)
     			.attr("height", height + margin.top + margin.bottom)
	 			.append('g')
	 			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	 			.attr('class', 'chart');
	
	
	var xScale = d3.scale.ordinal()
					 .domain(self.fage.map(function(d) { return d["code"]; }))
					 .rangeRoundBands([0, width], .1);
					 
	var yScale = d3.scale.linear()
                     .domain([0, d3.max(data, function(d) { return +d[measure]; })])
                     .range([height,0]);
					 
					 //debugger;
					 
	var chart = svg.selectAll("rect")
			       .data(data)
			       .enter().append("rect")
				   //.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+","+height+")";})  
				.attr("fill",  "green")
				.attr("width", xScale.rangeBand())
				.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+",1500)";}).transition().duration(1000).ease("sin-in-out")
				.attr("height", function(d) {return height-yScale(+d[measure])})
				.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+","+yScale(+d[measure])+")";})
	
	//.transition().duration(1000)				
					 
			   svg.selectAll("text")
			       .data(data)
			       .enter().append("text")
					 .attr("x",function(d) {return xScale(d['fage4'])+xScale.rangeBand()/4})
					 .attr("y",function(d) {return yScale(+d[measure])+3})
			         .attr("dy", ".75em")
					 .attr("fill","white")
			         .text(function(d) { return d[measure]; });
					 
					 
	 var xAxis = d3.svg.axis()
	     .scale(xScale)
	     .tickFormat(function(d) {
	     	for (i in self.fage)
	     		if (self.fage[i].code===d) return self.fage[i].name;
	     	})
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
}



ko.applyBindings(new ViewModel());