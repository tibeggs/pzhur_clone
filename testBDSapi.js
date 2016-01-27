var ViewModel = function() {
	var self = this;

	this.model = BDSVisModel;
	this.model.InitModel();

	this.data = ko.observableArray();
	this.data2show = ko.observableArray();

	this.ShowData = ko.observable(0);

	this.toggleshowdata = function () {
		self.ShowData(!self.ShowData());
	}

	this.sector = ko.observable(this.model.sectors[0].code);
	this.measure = ko.observable(this.model.measures[18].code);
	this.state = ko.observable(this.model.states[20].code);
	this.year = ko.observable(this.model.years[36]);
	this.fchar = ko.observable(this.model.fchar[0]);

	this.SelectedStates = ko.observableArray([this.state()]);
	this.SelectedSectors = ko.observableArray([this.sector()]);
	this.SelectedMeasures = ko.observableArray([this.measure()]);
	this.SelectedYears = ko.observableArray([this.year()]);
	this.SelectedFchar = ko.observableArray([this.fchar()]);

	//this.xvar = ko.computed(function () {return self.fchar();});
	this.yvar = ko.observable(this.measure());
	this.cvar = ko.observable("state");

	this.StateAsLegend = ko.computed( function () {return self.cvar()=="state";});
	this.MeasureAsLegend = ko.computed( function () {return self.cvar()=="measure";});
	this.SectorAsLegend = ko.computed( function () {return self.cvar()=="sector";});
	this.YearAsLegend = ko.computed( function () {return self.cvar()=="year";});
	this.FirmCharAsLegend = ko.computed( function () {return self.cvar()=="fchar";});


	this.APIrequest = ko.computed( function  () {
		return {
			sector : self.sector(),
			states : self.SelectedStates(),
			measure : self.measure(),
			fchar : self.fchar(),
			year : self.year(),
			xvar : self.fchar(),
			cvar : self.cvar()
		}
	});

	//Subscribe to input changes
	this.APIrequest.subscribe(function() {
		self.getBDSdata();
	})

	
//Get the data from the API according to current request and render it into array of objects with field names corresponding to the variables
	this.getBDSdata = function () {

		var request=self.APIrequest();

	    var url="http://api.census.gov/data/bds/firms";

	    var geturl=url+"?get="+request.fchar+","+request.measure+
	    				"&for="+"state:"+request.states.join(",")+
	    				"&year2="+request.year+
	    				"&sic1="+request.sector+
	    				"&key=93beeef146cec68880fccbd72e455fcd7135228f";

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
	    	self.updateBDSdata(jsoned);
	    });
	}

//Process data obtained from API. Change codes into names, add state list number (istate), form data2show for displaying as a table and call the function making the plot
	this.updateBDSdata = function(data) {

		var request=self.APIrequest();

		var data2show=[];

		for (var i in data) {
			data[i][request.xvar]=self.model.NameLookUp(data[i][request.xvar],request.xvar);
			for (var j in request.states) {
				if (request.states[j]==data[i]['state'])
					data[i]['istate']=j
			}
			data[i].state=self.model.statelookup[data[i].state];
			data[i].value=data[i][request.measure];
			data[i].category=data[i][request.xvar];
		}		

		self.data(data);

		self.makeBarChart(self.data());
	}

	

	this.makeBarChart = function (data) {
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
		
		var request=self.APIrequest();
		
		var xScale = d3.scale.ordinal()
		.domain(self.model.GetDomain(request.xvar))
		.rangeRoundBands([0, width], .1);
		var yScale = d3.scale.linear()
		.domain([Math.min(0,d3.min(data, function(d) { return +d[request.measure]; })), d3.max(data, function(d) { return +d[request.measure]; })])
		.range([height,0]);
		var colors=//['green','red','orange','cyan','purple','blue','magenta','green','red','orange','cyan','purple','blue','magenta'];
		["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000",
		 "#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
		var nbars=request.states.length;
		var barwidth= xScale.rangeBand()/nbars;

		var chart = svg.selectAll("rect")
			.data(data)
			.enter().append("rect")
		   	.attr("fill",  function(d) {return colors[+d['istate']]})
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*d.istate})
		   	.attr("y",function(d) {return yScale(0)})
		   	.attr("height",0).transition()
		   	.duration(500).ease("sin-in-out")
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[request.measure]))})
		   	.attr("height", function(d) {return Math.abs(yScale(0)-yScale(+d[request.measure]))})

		 var fontsize= d3.min(data, function(d,i) {
					return 1.5*barwidth/d[request.measure].length; 
				});

		svg.selectAll("text")
			.data(data)
			.enter().append("text")
			.attr("x",function(d) {return (xScale(d[request.xvar])+barwidth*d.istate)+barwidth/4})
			.attr("y",function(d) {return yScale(+d[request.measure])-8-7*Math.sign(d[request.measure])})
			.attr("dy", ".75em")
			.attr("fill","#eeeeee")
			.attr("font-size", fontsize)
			.text(function(d) { return d[request.measure]; });


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

		legendsvg.attr("height",(symbolsize+5)*request.states.length)
				.attr("width",200);
		legendsvg.selectAll("rect")
			.data(request.states)
			.enter()
			.append("rect")
			.attr("fill",  function(d,i) {
				return colors[i]
			})
			.attr("width",symbolsize).attr("height",symbolsize)
			.attr("y",function(d,i) {return (symbolsize+5)*i;});

		legendsvg.selectAll("text")
			.data(request.states)
			.enter()
			.append("text")
			.attr("fill","black")
			.attr("x",(symbolsize+5)).attr("y",function(d,i) {return 15+(symbolsize+5)*i;})
			.text(function(d) { return self.model.statelookup[d];});
	}
}

ko.applyBindings(new ViewModel());