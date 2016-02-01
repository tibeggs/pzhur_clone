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

	this.toggletimelapse = function () {
		if (self.timelapse()) {
			clearInterval(self.tlint);
			self.SelectedYears([self.TimeLapseCurrYear]);
		}
		self.timelapse(!self.timelapse());
	}

	this.setsectorcvar = function () {
		self.cvar("sic1");
	}

	this.setstatecvar = function () {
		self.SelectedSectors([this.model.sic1[0].code]);
		//self.state(20);
		self.cvar("state");
	}

	this.setyearcvar = function () {
		//self.SelectedSectors([this.model.sic1[0].code]);
		self.cvar("year2");
	}

	this.setmeasurecvar = function () {
		self.cvar("measure");
	}


	waiting4api = ko.observable(false);

	this.SelectedStates = ko.observableArray([this.model.state[20].code]);
	this.SelectedSectors = ko.observableArray([this.model.sic1[0].code]);
	this.SelectedMeasures = ko.observableArray([this.model.measure[11].code]);
	this.SelectedYears = ko.observableArray([this.model.year2[36]]);
	this.fchar = ko.observable(this.model.fchar[0].code);
	//this.SelectedFchar = ko.observableArray([this.fchar()]);

	this.xvar = ko.observable("fchar");
	this.cvar = ko.observable("state");
	this.timelapse = ko.observable(false);
	this.tlbuttontext = ko.computed (function() {return self.timelapse()?"Stop":"Time Lapse"});

	this.StateAsLegend = ko.computed( function () {return self.cvar()=="state";});
	this.MeasureAsLegend = ko.computed( function () {return self.cvar()=="measure";});
	this.SectorAsLegend = ko.computed( function () {return self.cvar()=="sic1";});
	this.YearAsLegend = ko.computed( function () {return self.cvar()=="year2";});
	this.FirmCharAsLegend = ko.computed( function () {return self.cvar()=="fchar";});


	this.APIrequest = ko.computed( function  () {
		return {
			sic1 : self.SelectedSectors(),
			state : self.SelectedStates(),
			measure : self.SelectedMeasures(),
			fchar : self.fchar(),
			year2 : self.SelectedYears(),
			xvar : (self.xvar()==="fchar")?(self.fchar()):(self.xvar()),
			cvar : (self.cvar()==="fchar")?(self.fchar()):(self.cvar()),
			timelapse : self.timelapse()
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
	    				"&for="+(((request.cvar)==="state")?("state:"+request.state):("us:*"))+
	    				((request.timelapse)?("&time=from+1977+to+2013"):
	    				("&year2="+((request.cvar==="year2")?(request.year2):(request.year2[0]))))+
	    				((self.SectorAsLegend())?("&sic1="+request.sic1):(""))+
	    				"&key=93beeef146cec68880fccbd72e455fcd7135228f";

	    console.log(geturl);
	    
	    waiting4api(true); //Show "waiting for data" message
	    d3.json(geturl,function (data) {
	    	if (!(data===null)) {
		    	var jsoned=[];
		    	for (var i in data) {
		    		var rec={};
		    		if (i>0) {
		    			for (name in data[0])
		    				rec[data[0][name]]=data[i][name];
		    			jsoned.push(rec);
		    		}
		    	}

	    		self.updateBDSdata(jsoned);
	    	} else {
	    		console.log("Server sent empty response to " + geturl);	
	    	}
	    	waiting4api(false); //Hide "waiting for data" message
	    });
	    
	}

//Process data obtained from API. Change codes into names, add state list number (icvar), form data2show for displaying as a table and call the function making the plot
	this.updateBDSdata = function(data) {

		var request=self.APIrequest();

		var data2show={};

		//If comparing measures, combine different measures into a single column named "measure"
		var data1=[]
		// if (request.cvar==="measure") {
		// 	for (var i in data) {
		// 		var rec={}
		// 	}
		// }

		for (var i in data) {

			data[i][request.xvar]=self.model.NameLookUp(data[i][request.xvar],request.xvar); //Replace code strings with actual category names for x-variable
			if (request.cvar!="measure")
					 data[i][request.cvar]=self.model.NameLookUp(data[i][request.cvar],request.cvar); //Replace code strings with actual category names for c-variable
			else 
				for (var imeasure in request.measure) {
					var rec={};
					rec.value=data[i][request.measure[imeasure]];
					rec[request.xvar]=data[i][request.xvar];
					rec[request.cvar]=self.model.NameLookUp(request.measure[imeasure],"measure");
					data1.push(rec);
				}
			
			//Convert data to 2D table, so that it can be displayed
			if (data2show[data[i][request.xvar]]===undefined)
				data2show[data[i][request.xvar]]={};
			
			if (request.cvar!="measure")
				data2show[data[i][request.xvar]][data[i][request.cvar]]=data[i][request.measure];
			else 
				for (var imeasure in request[request.cvar])
					data2show[data[i][request.xvar]][request[request.cvar][imeasure]]=data[i][request[request.cvar][imeasure]];
		}


		//Convert the nested object with data to display into nested array (including field names)
		var cvarnames=[(self.xvar()==="fchar")?(self.model.NameLookUp(request.xvar,"fchar")):(request.xvar)];
		for (var xvarkey in data2show) {
			for (var cvarkey in data2show[xvarkey])
				cvarnames.push(cvarkey);
			break;
		};
		self.data([cvarnames]);
		for (var xvarkey in data2show) {
			var xvararr=[xvarkey];
			for (var cvarkey in data2show[xvarkey])
				xvararr.push(data2show[xvarkey][cvarkey])
			self.data.push(xvararr);
		}

		
		self.makeBarChart((request.cvar!="measure")?data:data1);
	}

	

	this.makeBarChart = function (data) {

		//Define margins and dimensions of the SVG element containing the chart
		var margin = {top: 20, right: 30, bottom: 30, left: 80},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

		//Select the SVG element, remove old drawings, add grouping element for the chart
		var svgcont = d3.select("#chartsvg");
		svgcont.selectAll("*").remove();
		var svg=svgcont.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr('class', 'chart');

		var request=self.APIrequest();
		//List of selected categories by actual name rather than code
		var cvarlist=request[request.cvar].map(function(d) {return self.model.NameLookUp(d,request.cvar)});

		if (request.cvar=="measure") request.measure="value";
		
		var xScale = d3.scale.ordinal()
		.domain(self.model.GetDomain(request.xvar))
		.rangeRoundBands([0, width], .1);
		var yScale = d3.scale.linear()
		.domain([Math.min(0,d3.min(data, function(d) { return +d[request.measure]; })), d3.max(data, function(d) { return +d[request.measure]; })])
		.range([height,0]);
		var colors=//['green','red','orange','cyan','purple','blue','magenta','green','red','orange','cyan','purple','blue','magenta'];
		["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000",
		 "#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
		
		var nbars=cvarlist.length;
		var barwidth= xScale.rangeBand()/nbars;

		var bars=
		svg.selectAll("rect")
			.data(data);


		bars.enter().append("rect")
		   	.attr("fill",  function(d) {return colors[cvarlist.indexOf(d[request.cvar])];})
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*cvarlist.indexOf(d[request.cvar])})
		   	.attr("y",function(d) {return yScale(0)})
		   	.attr("height",0).transition()
		   	.duration(500).ease("sin-in-out")
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[request.measure]))})
		   	.attr("height", function(d) {return Math.abs(yScale(0)-yScale(+d[request.measure]))})

		 // var fontsize= d3.min(data, function(d,i) {
			// 		return 1.5*barwidth/d[request.measure].length; 
			// 	});

		// svg.selectAll("text")
		// 	.data(data)
		// 	.enter().append("text")
		// 	.attr("x",function(d) {return (xScale(d[request.xvar])+barwidth*cvarlist.indexOf(d[request.cvar]))+barwidth/4})
		// 	.attr("y",function(d) {return yScale(+d[request.measure])-8-7*Math.sign(d[request.measure])})
		// 	.attr("dy", ".75em")
		// 	.attr("fill","#eeeeee")
		// 	.attr("font-size", fontsize)
		// 	.text(function(d) { return d[request.measure]; });


		var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

		var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

		var yAxis = d3.svg.axis().scale(yScale).orient("left");

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

		legendsvg.attr("height",(symbolsize+5)*cvarlist.length)
				.attr("width",400);
		legendsvg.selectAll("rect")
			.data(cvarlist)
			.enter()
			.append("rect")
			.attr("fill",  function(d,i) {
				return colors[i]
			})
			.attr("width",symbolsize).attr("height",symbolsize)
			.attr("y",function(d,i) {return (symbolsize+5)*i;});

		legendsvg.selectAll("text")
			.data(cvarlist)
			.enter()
			.append("text")
			.attr("fill","black")
			.attr("x",(symbolsize+5)).attr("y",function(d,i) {return 15+(symbolsize+5)*i;})
			.text(function(d) { return  d;});

		// Timelapse animation
		function updateyear(yr) {

			curyearmessage.transition().duration(1000).text(self.model.year2[yr]); //Display year

			var dataset=data.filter(function(d) {return +d.time==self.model.year2[yr]}); //Select data corresponding to the year
			
			//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
			//empty outside this function. The following loop fills in / updates to actual data values from current year
		
			for (var i in dataset) {
				data4bars[xScale.domain().indexOf(dataset[i][request.xvar])*request[request.cvar].length
						+cvarlist.indexOf(dataset[i][request.cvar])][request.measure]=+dataset[i][request.measure]
			}
			
      		var bars=svg.selectAll("rect").data(data4bars);

      		// UPDATE
			  // Update old elements as needed.
			  
			bars
			   	.attr("fill",  function(d) {return colors[+d.icvar]})
			   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*d.icvar;})
			   	.transition().duration(500)
			   	.attr("y",function(d) {return yScale(Math.max(0,+d[request.measure]));})
			   	.attr("height",function(d) {return Math.abs(yScale(0)-yScale(+d[request.measure]));});

		}

		//Run timelapse animation
		if (request.timelapse) {


			//These loops are only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
			var data4bars=[]
			for (var i in xScale.domain())
				for (var j in request[request.cvar])
					{
						var datum4bar={}
						datum4bar[request.xvar]=xScale.domain()[i];
						datum4bar[request.measure]=0;
						datum4bar.icvar=j;
						data4bars.push(datum4bar);
					}

			svg.selectAll("rect").remove();
			svg.selectAll("rect").data(data4bars).enter().append("rect").attr("width", barwidth);

			var iy=0;
			var curyearmessage=svg.append("text").attr("x",width/2).attr("y",height/2).attr("font-size",100).attr("fill-opacity",.3);
			self.tlint=setInterval(function() {
	  			updateyear(iy);
	  			if (iy<self.model.year2.length) iy++; else iy=0;
	  			self.TimeLapseCurrYear=self.model.year2[iy];
			}, 500);

		}
		
	}

	this.getBDSdata();
}

ko.applyBindings(new ViewModel());
