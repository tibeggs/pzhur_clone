var ViewModel = function() {
	var self = this;

	this.model = BDSVisModel;
	this.model.InitModel();
	

	this.data = ko.observableArray();
	this.data2show = ko.observableArray();

	this.ShowData = ko.observable(0);

	this.toggleshowdata = function () {
		if (self.ShowData()) {self.ShowData(0)} else (self.ShowData(1));
	}

	this.sector = ko.observable(this.model.sectors[0].code);
	this.measure = ko.observable(this.model.measures[18].code);
	this.state = ko.observable(this.model.states[6].code);
	this.SelectedStates = ko.observableArray([this.state()]);

	this.StateAsLegend = ko.observable(true);
	this.MeasureAsLegend = ko.observable(false);
	this.SectorAsLegend = ko.observable(false);
	this.YearAsLegend = ko.observable(false);
	this.FirmCharAsLegend = ko.observable(false);

	//Subscribe to input changes
	self.sector.subscribe( function(newValue) {
		self.getBDSdata(newValue,self.measure(), self.SelectedStates());
	})

	self.measure.subscribe( function(newValue) {
		self.getBDSdata(self.sector(),newValue,self.SelectedStates());
	})

	self.SelectedStates.subscribe( function(newValue) {
		self.getBDSdata(self.sector(),self.measure(),newValue);
	}) 

	
//Get the data from the API according to current request and render it into array of objects with field names corresponding to the variables
	this.getBDSdata = function (sic1,measure,states) {

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
	    	self.updateBDSdata(jsoned,measure,states);
	    });
	}

//Process data obtained from API. Change codes into names, add state list number (istate), form data2show for displaying as a table and call the function making the plot
	this.updateBDSdata = function(data,measure,states) {

		var data2show=[];

		for (var i in data) {
			data[i].fage4=self.model.fagelookup[data[i].fage4];
			for (var j in states) {
				if (states[j]==data[i]['state'])
					data[i]['istate']=j
			}
			data[i].state=self.model.statelookup[data[i].state];
			data[i].value=data[i][measure];
		}

		self.data(data);

		self.makeBarChart(self.data(),measure,states);
	}

	

	this.makeBarChart = function (data,measure,states) {
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
		.domain(self.model.fage.map(function(d) { return d["name"]; }))
		.rangeRoundBands([0, width], .1);
		var yScale = d3.scale.linear()
		.domain([Math.min(0,d3.min(data, function(d) { return +d[measure]; })), d3.max(data, function(d) { return +d[measure]; })])
		.range([height,0]);
		var colors=//['green','red','orange','cyan','purple','blue','magenta','green','red','orange','cyan','purple','blue','magenta'];
		["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000",
		 "#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
		var nbars=states.length;
		var barwidth= xScale.rangeBand()/nbars;

		var chart = svg.selectAll("rect")
			.data(data)
			.enter().append("rect")
		   	.attr("fill",  function(d) {return colors[+d['istate']]})
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d['fage4'])+barwidth*d.istate})
		   	.attr("y",function(d) {return yScale(0)})
		   	.attr("height",0).transition()
		   	.duration(500).ease("sin-in-out")
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[measure]))})
		   	.attr("height", function(d) {return Math.abs(yScale(0)-yScale(+d[measure]))})

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
			.attr("y",function(d,i) {return (symbolsize+5)*i;});

		legendsvg.selectAll("text")
			.data(states)
			.enter()
			.append("text")
			.attr("fill","black")
			.attr("x",(symbolsize+5)).attr("y",function(d,i) {return 15+(symbolsize+5)*i;})
			.text(function(d) { return self.model.statelookup[d];});
	}

//Initial request and plot
	this.getBDSdata(self.sector(),self.measure(),self.SelectedStates());
}

ko.applyBindings(new ViewModel());