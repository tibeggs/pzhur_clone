
var ViewModel = function() {
	var self = this;
	this.states= [
		//{"code" : "00", "name" : "United States", "st":"US"},
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
		{"code" : "c", "name" : "2" },
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

	this.fsize = [
		{"code" : "a", "name" : "1-4" },
		{"code" : "b", "name" : "5-9" },
		{"code" : "c", "name" : "10-19" },
		{"code" : "d", "name" : "20-49" },
		{"code" : "e", "name" : "50-99" },
		{"code" : "f", "name" : "100-249" },
		{"code" : "g", "name" : "250-499" },
		{"code" : "h", "name" : "500-999" },
		{"code" : "i", "name" : "1000-2499" },
		{"code" : "j", "name" : "2500-4999" },
		{"code" : "k", "name" : "5000-9999" },
		{"code" : "l", "name" : "10000+" },
		{"code" : "m", "name" : "All Sizes" }];

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

	this.measlookup={}; this.statelookup={};this.fagelookup={};this.fsizelookup={};

	this.data = ko.observableArray();

	this.ShowData = ko.observable(0);

	self.toggleshowdata = function () {
		if (self.ShowData()) {self.ShowData(0)} else (self.ShowData(1));
	}

	this.sector = ko.observable(this.sectors[0].code);
	this.measure = ko.observable(this.measures[18].code);
	this.state = ko.observable(this.states[0].code);
	this.SelectedStates = ko.observableArray([this.states[02].code]);
	

	var InitVM = function () {

		//Create dictionaries/hashmaps to lookup names of categorical variable values
		for (var i in self.states)
			self.statelookup[self.states[i].code]=self.states[i].name;
		for (var i in self.measures)
			self.measlookup[self.measures[i].code]=self.measures[i].name;
		for (var i in self.fage)
			self.fagelookup[self.fage[i].code]=self.fage[i].name;
		for (var i in self.fsize)
			self.fsizelookup[self.fsize[i].code]=self.fsize[i].name;

		//Subscribe to input changes
		self.sector.subscribe( function(newValue) {
			getBDSdata(newValue,self.measure(), self.SelectedStates());
		})

		self.measure.subscribe( function(newValue) {
			getBDSdata(self.sector(),newValue,self.SelectedStates());
		})

		self.SelectedStates.subscribe( function(newValue) {
			getBDSdata(self.sector(),self.measure(),newValue);
		}) 

		//Initial request and plot
		getBDSdata(self.sector(),self.measure(),self.SelectedStates());
	}

	InitVM();


	function getBDSdata(sic1,measure,states) {

		var requestdata={
    		//"get": ["sic1","job_creation_rate","fage4"],
    		"get": "fage4,"+measure,
    		"for": "",
    		"time": "2012"
		};

	    requestdata["for"]="state:";
	    for (var i in states) 
	    	requestdata["for"]+=states[i]+',';
	    requestdata["for"]=requestdata["for"].slice(0,-1);

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
	    			for (name in data[0])
	    				rec[data[0][name]]=data[i][name];
	    			jsoned.push(rec);
	    		}
	    	}
	    	updateBDSdata(jsoned,measure,states);
	    });
	}

	function updateBDSdata(data,measure,states) {

		for (var i in data) {
			data[i].fage4=self.fagelookup[data[i].fage4];
			for (var j in states) {
				if (states[j]==data[i]['state'])
					data[i]['istate']=j
			}
			data[i].state=self.statelookup[data[i].state];
			data[i].value=data[i][measure];
		}

		self.data(data);

		makeBarChart(self.data(),measure,states);
	}

	function makeBarChart(data,measure,states) {
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
		.domain(self.fage.map(function(d) { return d["name"]; }))
		.rangeRoundBands([0, width], .1);
		var yScale = d3.scale.linear()
		.domain([Math.min(0,d3.min(data, function(d) { return +d[measure]; })), d3.max(data, function(d) { return +d[measure]; })])
		.range([height,0]); 	  
		var colors=['green','red','orange','cyan','purple','blue','magenta','green','red','orange','cyan','purple','blue','magenta'];
		//["#000000","#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E"];
		var nbars=states.length;
		var barwidth= xScale.rangeBand()/nbars;

		var chart = svg.selectAll("rect")
			.data(data)
			.enter().append("rect")
		   //.attr("transform", function(d) {return "translate("+xScale(d['fage4'])+","+height+")";})  
		   .attr("fill",  function(d) {
		   	return colors[+d['istate']]
		   })
		   .attr("width", barwidth)
		   .attr("transform", function(d) {return "translate("+xScale(d['fage4'])+",1500)";}).transition().duration(500).ease("sin-in-out")
		   .attr("height", function(d) {return Math.abs(yScale(0)-yScale(+d[measure]))})
		   .attr("transform", function(d) {return "translate("+(xScale(d['fage4'])+barwidth*d.istate)+","+yScale(Math.max(0,+d[measure]))+")";})

		//.transition().duration(1000)				

		svg.selectAll("text")
			.data(data)
			.enter().append("text")
			.attr("x",function(d) {return (xScale(d['fage4'])+barwidth*d.istate)+barwidth/4})
			.attr("y",function(d) {return yScale(+d[measure])-8-7*Math.sign(d[measure])})
			.attr("dy", ".75em")
			.attr("fill","#eeeeee")
			.attr("font-size", function() {
				return d3.min(data, function(d) { 
					return 1.5*barwidth/d[measure].length; 
				})
			})
			.text(function(d) { return d[measure]; });


		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom");

		var xAxis0 = d3.svg.axis()
			.scale(xScale)
			.tickFormat("")
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + yScale(0) + ")")
			.call(xAxis0);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);


		svg.append("g")
		.attr("class", "y axis")
		.call(yAxis); 

		//Making Legend
		var legendsvg=d3.select("#legend")
		legendsvg.selectAll("*").remove();

		var symbolsize=Math.max(Math.min(barwidth,20),15);

		legendsvg.attr("height",(symbolsize+5)*states.length)
				.attr("width",200);
		legendsvg.selectAll("rect")
			.data(states)
			.enter()
			.append("rect")
			.attr("fill",  function(d,i) {
				return colors[i]
			})
			.attr("width",symbolsize).attr("height",symbolsize)
			.attr("transform",function(d,i) {return "translate(0,"+(symbolsize+5)*i+")";});

		legendsvg.selectAll("text")
			.data(states)
			.enter()
			.append("text")
			.attr("fill","black")
			.attr("transform",function(d,i) {return "translate("+(symbolsize+5)+","+(15+(symbolsize+5)*i)+")";})
			.text(function(d) { return self.statelookup[d];});
	}
}



ko.applyBindings(new ViewModel());