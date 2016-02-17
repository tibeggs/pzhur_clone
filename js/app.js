var ViewModel = function() {
	var self = this;

	//Reference to the model, which contains variable names and name look (in model.js file)
	this.model = BDSVisModel;
	this.model.InitModel();

	//The data array do be displayed as table with numbers
	this.data = ko.observableArray();

	this.toggleshowdata = function () {
		//This function executes in click to 'Show Data' button.
		self.ShowData(!self.ShowData());
	}

	this.toggletimelapse = function () {
		//This function executes in click to 'Stop'/'Time Lapse' button and stops time lapse animation or starts it.
		if (self.timelapse()) {
			self.timelapse(false);
			clearInterval(self.tlint); //Stop the animation
			self.SelectedYears([self.TimeLapseCurrYear-1]);	//Set the year to the year currently shown in animation
		} else {
			self.timelapse(true);
			self.getBDSdata();
		}
	}

	this.toggleyscale = function () {
		//Toggle whether to plot the graph in log or linear scale
		self.logscale(!self.logscale());
		self.getBDSdata();
	}

	//The following functions set cvar (Legend/Comparison/Color variable) and xvar (X-axis variable)

	this.setsectorcvar = function () {
		self.cvar("sic1");
		self.getBDSdata();
	}

	this.setsectorxvar = function () {
		self.xvar("sic1");
		if (self.StateAsLegend())
			self.cvar("measure");
		self.getBDSdata();
	}

	this.setstatecvar = function () {
		self.cvar("state");
		self.getBDSdata();
	}

	this.setstatexvar = function () {
		self.cvar("measure");
		self.xvar("state");
		self.getBDSdata();
	}

	this.setyearcvar = function () {
		self.cvar("year2");
		self.getBDSdata();
	}

	this.setyearxvar = function () {
		self.xvar("year2");
		self.getBDSdata();
	}

	this.setmeasurecvar = function () {
		self.cvar("measure");
		self.getBDSdata();
	}

	this.setmeasurexvar = function () {
		self.xvar("measure");
		self.getBDSdata();
	}

	this.setfcharcvar = function () {
		self.cvar("fchar");
		self.getBDSdata();
	}

	this.setfcharxvar = function () {
		self.xvar("fchar");
		self.getBDSdata();
	}

    this.timelapse = ko.observable(false);	//Whether time lapse regime is on	
	waiting4api = ko.observable(false);    //Whether message "Waiting for data from server" is shown
	disableAll = ko.computed(function () { //Disable all the input elements (used in Time Lapse regime and when the app is waiting for data from server)
		return (waiting4api() || self.timelapse());
	})

	//Initial values of what is selected in the input selectors
	this.SelectedStates = ko.observableArray([this.model.state[0].code]);
	this.SelectedSectors = ko.observableArray([this.model.sic1[0].code]);
	this.SelectedMeasures = ko.observableArray([this.model.measure[11].code]);
	this.SelectedYears = ko.observableArray([this.model.year2[36]]);
	this.fchar = ko.observable(this.model.fchar[0].code);
	//this.SelectedFchar = ko.observableArray([this.fchar()]);

	//Initial values of X-axis variable and C- variable
	this.xvar = ko.observable("state");
	this.cvar = ko.observable("measure");

	//Initial value and text of Time Lapse button
	this.timelapse = ko.observable(false);
	this.tlbuttontext = ko.computed (function() {return self.timelapse()?"Stop":"Time Lapse"});

	//Initial value for showing data
	this.ShowData = ko.observable(0);

	//Initial value for log scale of y-axis
	this.logscale = ko.observable(0);
	this.yscalebuttontext = ko.computed (function() {return self.logscale()?"Linear":"Log"});

	//Whether a variable is C- Variable (Legend)
	this.SectorAsLegend = ko.computed( function () {return self.cvar()==="sic1";});
	this.StateAsLegend = ko.computed( function () {return self.cvar()==="state";});
	this.MeasureAsLegend = ko.computed( function () {return self.cvar()==="measure";});
	this.YearAsLegend = ko.computed( function () {return self.cvar()==="year2";});
	this.FirmCharAsLegend = ko.computed( function () {return self.cvar()==="fchar";});

	//Whether a variable is X-axis variable
	this.SectorAsArgument = ko.computed( function () {return self.xvar()==="sic1";});
	this.StateAsArgument = ko.computed( function () {return self.xvar()==="state";}); //When "state" is x-var, it is the geo map regime
	this.YearAsArgument = ko.computed( function () {return self.xvar()==="year2";});
	this.FirmCharAsArgument = ko.computed( function () {return self.xvar()==="fchar";});

	//Whether a variable is either X- or C-
	this.SectorVar = ko.computed( function () {return (self.SectorAsLegend() || self.SectorAsArgument());});
	this.StateVar = ko.computed( function () {return (self.StateAsLegend() || self.StateAsArgument());});
	this.YearVar = ko.computed( function () {return (self.YearAsLegend() || self.YearAsArgument());});
	this.FirmCharVar = ko.computed( function () {return (self.FirmCharAsLegend() || self.FirmCharAsArgument());});

	this.FcharCompButtonText = ko.computed( function() {return "Compare "+self.model.NameLookUp(self.fchar(),"var");});

 	//Whether to show the state selector (and also to send the "us:*" request or by individual states ("state:*"))
	this.us = ko.computed(function(){
		if (self.StateAsLegend()) return false; //If states are Legend, we need many states, so request NOT general, but by state
		else if (self.SectorVar()) return true; //If sector is either c- or x- variable, then there is no by-state data, so YES
		else if (self.SelectedSectors()[0]===0) return false; //If "Economy Wide" is selected in sectors, then by state
		else return true; //Else means a sector is selected, so there can not be by-state request
	});

	//Subscribe to input changes
	//Any change in the input select fields triggers request to the server, followed by data processing and making of a new plot

	this.SelectedStates.subscribe(function() {self.getBDSdata();});
	this.SelectedMeasures.subscribe(function() {self.getBDSdata();});
	this.SelectedSectors.subscribe(function() {self.getBDSdata();});
	this.SelectedYears.subscribe(function() {self.getBDSdata();});
	this.fchar.subscribe(function() {self.getBDSdata();});


	//This is a general use function for whenever the number should be printed in format with fixed significant digits and M and k for millions and thousands
	this.NumFormat = function(d) {
		var sigdig=3; //How many digits to show
		var exp=Math.floor(Math.log10(Math.abs(d)))-sigdig+1;
		var mantissa= Math.floor(d/(Math.pow(10,exp)));
		if (Math.abs(d)>1e+6)
			return d3.format("."+(6-exp)+"f")(mantissa*(Math.pow(10,exp-6)))+"M";
		else if (Math.abs(d)>1e+3)
			return d3.format("."+(3-exp)+"f")(mantissa*(Math.pow(10,exp-3)))+"k";
		else if (Math.abs(d)>1)
			return d3.format("."+(-exp)+"f")(d);
		else if (Math.abs(d)>5e-2)
			return d3.format(".2f")(d);
		else return d3.format(".f")(d);
	};


	//The visual elements of the plot: SVGs for the graph/map and legend
	this.PlotView = {
		margin : {top: 20, right: 30, bottom: 50, left: 80},
		width : 960,
		height : 450,
		legendwidth: 100,
		svg : undefined,
		legendsvg: undefined,
		Init : function() {
			//Define margins and dimensions of the SVG element containing the chart
			var margin = this.margin;

			this.width = 960 - margin.left - margin.right;
			this.height = 450 - margin.top - margin.bottom;
			var width=this.width;
			var height=this.height;

			//Select the SVG element, remove old drawings, add grouping element for the chart
			var svgcont = d3.select("#chartsvg");
			svgcont.selectAll("*").remove();
			this.svg=svgcont.attr("width", width + margin.left + margin.right+this.legendwidth)
				.attr("height", height + margin.top + margin.bottom)
				.append('g')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.attr('class', 'chart');

			d3.select("#plotarea").style("width", width + margin.left + margin.right+"px");
			//d3.select("#graphdata").style("height", height + margin.top + margin.bottom-21+"px");

			//Clear legend, set size
			this.legendsvg=d3.select("#legend").attr("width",400).attr("height",300)
			this.legendsvg.selectAll("*").remove();
			if (self.StateAsArgument())
				this.legendsvg=d3.select("#chartsvg").append("g").attr("transform","translate("+width+","+height*.3+")");
			else this.legendsvg=this.legendsvg.append("g").attr("transform","translate(0,20)");
		}
	};

	
	
//Form the API request and get the data from the API, then render it into array of objects with field names corresponding to the variables
	this.getBDSdata = function () {

		//The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.
		var APIrequest = function  () {
			
			//Calculate whether to request single state or multiple, and remove the 00 code for the US in selector
			var StateRequested;
			var multiple=self.SelectedStates().length>1; //Whether multiple states are selected
			var firstUS=self.SelectedStates()[0]==="00"; //Whether "United States" is selected

			if ((multiple) && (firstUS)) StateRequested=self.SelectedStates().slice(1); //Remove "United States" if many states are selected
			//Otherwise return all selected states or one, depending on whether state is the c-variable
			else StateRequested=(self.StateAsLegend())?self.SelectedStates():[self.SelectedStates()[0]]; 

			return {
				//If by-state request, then only send "Economy Wide", otherwise send all selected sectors or a single sector depending on whether sector is the c-variable(legend). If in map regime (StateAsArgument) send only one measure
				sic1 : self.StateAsLegend()?([0]):(self.SectorAsLegend()?self.SelectedSectors():[self.SelectedSectors()[0]]),
				//See state calculation above for StateRequested
				state : StateRequested,
				//Send all selected measures or a single one depending on whether measure is the c-variable and whether it's a geo map regime.
				measure : (self.MeasureAsLegend() && !self.StateAsArgument())?self.SelectedMeasures():[self.SelectedMeasures()[0]],
				fchar : self.fchar(),
				//Send all selected years or a single one depending on whether year is the c-variable.
				year2 : self.YearAsLegend()?self.SelectedYears():[self.SelectedYears()[0]],
				//"fchar" is actually one of 3: fage4, fsize, ifsize. So that should be sent instead of "fchar"
				xvar : (self.xvar()==="fchar")?(self.fchar()):(self.xvar()),
				cvar : (self.cvar()==="fchar")?(self.fchar()):(self.cvar()),
				//The following 3 lines are just for the case when Firm Characterstic is c-variable.
				fage4 : self.model.GetDomain("fage4"),
				fsize : self.model.GetDomain("fsize"),
				ifsize : self.model.GetDomain("ifsize"),
			}
		};

		var request=APIrequest();

	    var url="http://api.census.gov/data/bds/firms";

		var geography=(self.us()?("us:*"):("state:"+request.state)); 
		if ((request.state.length===1) && (request.state[0]==="00")) geography="us:*"; //If only "United States" is selected then use us:*
		if (self.StateAsArgument()) geography="state:*"; //In map regime use state:*

		//Whether to request all years or a particular year
		var reqtime=((self.timelapse() || self.YearAsArgument())?("&time=from+1977+to+2013"):("&year2="+request.year2));

		//Put everything together
	    var geturl=url+"?get="+request.xvar+","+request.measure+(self.FirmCharAsLegend()?(","+request.cvar):"")+ //variables: measures and firm characteristics
	    				"&for="+geography+ //states or US
	    				reqtime+ //years
	    				((self.us() && (!self.SectorAsArgument()) && (!self.StateAsArgument()))?("&sic1="+request.sic1):(""))+ //sectors, if US
	    				"&key=93beeef146cec68880fccbd72e455fcd7135228f";

	    console.log(geturl);
	    
	    waiting4api(true); //Show "waiting for data" message
	    d3.json(geturl,function (data) {
	    	if (!(data===null)) { //Convert data into array of objects with the same keys
		    	var jsoned=[];
		    	for (var i in data) {
		    		var rec={};
		    		if (i>0) {
		    			for (iname in data[0]) { //Find keys, which are contained in the first line of the array returned by API
		    				var key=(data[0][iname]==="us")?("state"):data[0][iname]; //Substitute "us" field name to "state"
		    				rec[key]=data[i][iname]; //Fill the object
		    			};
		    			jsoned.push(rec);
		    		};
		    	};
	    		self.updateBDSdata(jsoned,request); //Continue to data processing and plotting
	    	} else console.log("Server sent empty response to " + geturl);	
	    	waiting4api(false); //Hide "waiting for data" message
	    });
	};

//Process data obtained from API. Change codes into names, add state list number (icvar), form data2show for displaying as a table and call the function making the plot
	this.updateBDSdata = function(data,request) {

		var data2show={}; // The nested object, used as an intermediate step to convert data into 2D array

		var data1=[]; // The reshuffled (melted) data, with measures in the same column. Like R function "melt" from the "reshape" package

		for (var i in data) {

			data[i][request.xvar]=self.model.NameLookUp(data[i][request.xvar],request.xvar); //Replace code strings with actual category names for x-variable
			
			data[i][request.cvar]=self.model.NameLookUp(data[i][request.cvar],request.cvar); //Replace code strings with actual category names for c-variable
	
			if (self.MeasureAsLegend()) 
				for (var imeasure in request.measure) { //If comparing by measure, melt the data by measures: combine different measure in single column and create a column indicating which measure it is (c-var)
					var rec={};
					rec.value=data[i][request.measure[imeasure]]; //Column named "value" will contain values of all the measures
					rec[request.xvar]=data[i][request.xvar];		//x-axis value
					rec[request.cvar]=self.model.NameLookUp(request.measure[imeasure],"measure"); //Column for c-variable indicates the measure
					if (self.timelapse()) rec.time=data[i].time;
					data1.push(rec);
				}
			
			//Convert data to 2D table, so that it can be displayed
			if (data2show[data[i][request.xvar]]===undefined) //Create nested objects
				data2show[data[i][request.xvar]]={};
			if (!self.MeasureAsLegend())
				data2show[data[i][request.xvar]][data[i][request.cvar]]=data[i][request.measure]; //Fill nested objects
			else 
				for (var imeasure in request[request.cvar])
					data2show[data[i][request.xvar]][self.model.NameLookUp(request[request.cvar][imeasure],"measure")]=data[i][request[request.cvar][imeasure]];
		};


		//Convert the nested object with data to display into nested array (including field names)
		var cvarnames=[self.model.NameLookUp(request.xvar,"var")]; //Create row with names of c-variable	
		for (var xvarkey in data2show) {
			for (var cvarkey in data2show[xvarkey])
				cvarnames.push(cvarkey);
			break;
		};

		self.data([cvarnames]); //First row of the table will contain names of c-variable
		for (var xvarkey in data2show) {
			var xvararr=[xvarkey]; //Create the column with names of x-variable
			for (var cvarkey in data2show[xvarkey])
				xvararr.push(data2show[xvarkey][cvarkey]) //Fill the data into 2D table
			self.data.push(xvararr);
		};

		if (self.StateAsArgument())
			self.makeMap(data,request);
		else self.makePlot((!self.MeasureAsLegend())?data:data1,request);
	};


	//This function makes the geographical map
	this.makeMap = function (data,request) {

		//Initialize the SVG elements and get width and length for scales
		self.PlotView.Init();
		svg=self.PlotView.svg;
		width=self.PlotView.width;
		height=self.PlotView.height;
		
		var measure=request.measure;

		//Set graph title
		d3.select("#graphtitle").text(self.model.NameLookUp(measure,"measure")+" in "+request.year2);

		//Set D3 scales
		var ymin=d3.min(data, function(d) { return +d[measure]; });
		var ymax=d3.max(data, function(d) { return +d[measure]; });
		var ymid=(ymax+ymin)*.5;
		var maxabs=d3.max([Math.abs(ymin),Math.abs(ymax)]);
		
		var yScale = (self.logscale())?d3.scale.log():d3.scale.linear()

		var purple="rgb(112,79,161)"; var golden="rgb(194,85,12)"; var teal="rgb(22,136,51)";

		if ((ymin<0) && !self.logscale())
			yScale.domain([-maxabs,0,maxabs]).range(["#CB2027","#eeeeee","#265DAB"]);
		else
			//yScale.domain([ymin,ymax]).range(["#eeeeee","#265DAB"]);
			yScale.domain([ymin,ymid,ymax]).range([golden,"#bbbbbb",purple]);
			//yScale.domain([ymin,ymid,ymax]).range(["red","#ccffcc","blue"]);


		//Get the map from the shape file in JSON format
		d3.json("../json/gz_2010_us_040_00_20m.json", function(geo_data) {
            var mapg = svg.append('g')
            		.attr('class', 'map');
					
			var projection = d3.geo.albersUsa()
					.scale(800)
					.translate([width / 2, height / 2.]);

			var geo_data1=[];

			if (self.timelapse()) {
				var datafull=data;
				data=data.filter(function(d) {return +d.time===self.model.year2[0]});
			}

			//Put the states in geo_data in the same order as they are in data
			for (var i in data)
				geo_data1.push(geo_data.features.filter(function(d) {return data[i].state===d.properties.NAME;})[0]);

			var path = d3.geo.path().projection(projection);

			var map = mapg.selectAll('path')
					.data(geo_data1)
					.enter()
					.append('path')
					.attr('d', path)
					.data(data)
					.style('fill', function(d) { return yScale(d[measure]);})
					.style('stroke', 'white')
					.style('stroke-width', 0.3)
					.append("title").text(function(d){return d.state+": "+d3.format(",")(d[measure]);});

			//Making Legend
			var legendsvg=self.PlotView.legendsvg;
			//legendsvg.selectAll("g").remove();
			//legendsvg=legendsvg.;

			var colorbar={height:200, width:20, levels:50}
			var textlabels={n:5, fontsize:15};

			//Make the colorbar
			legendsvg.selectAll("rect")
			.data(function() {
				var levels=[];
				for (var i=0; i<colorbar.levels; i++) levels.push(yScale(ymin+i/colorbar.levels*(ymax-ymin)));
				return levels;
			})
			.enter()
			.append("rect")
			.attr("fill",  function(d) {return d;})
			.attr("width",20).attr("height",colorbar.height/colorbar.levels)
			.attr("y",function(d,i) {return i*colorbar.height/colorbar.levels;});

			//Make the labels of the colorbar
			legendsvg.selectAll("text")
			.data(function() {
				var labels=[];
				for (var i=0; i<textlabels.n+1; i++) labels.push(ymin+i/textlabels.n*(ymax-ymin));
				return labels;
			})
			.enter()
			.append("text")
			.attr("fill", "black")
			.attr("font-size", textlabels.fontsize+"px")
			.attr("x",colorbar.width+3)
			.attr("y",function(d,i) {return .4*textlabels.fontsize+i*(colorbar.height)/textlabels.n;})
			.text(function(d) {return(self.NumFormat(+d));});

			// Timelapse animation
			function updateyear(yr) {
				curyearmessage.text(self.model.year2[yr]); //Display year
				d3.select("#graphtitle").text("");
				var dataset=datafull.filter(function(d) {return +d.time===self.model.year2[yr]}); //Select data corresponding to the year
				map = mapg.selectAll('path')
						.data(dataset)
						.transition().duration(1000)
						.style('fill', function(d) { return yScale(d[measure]);})

			};

			//Run timelapse animation
			if (self.timelapse()) {
				var iy=0;
				var curyearmessage=d3.select("#chartsvg").append("text").attr("x",0).attr("y",height*.5).attr("font-size",100).attr("fill-opacity",.3);
				self.tlint=setInterval(function() {
		  			updateyear(iy);
		  			if (iy<self.model.year2.length) iy++; else iy=0;
		  			self.TimeLapseCurrYear=self.model.year2[iy];
				}, 1000);
			}
		});
	}


	//This function makes d3js plot, either a bar chart or scatterplot
	this.makePlot = function (data,request) {

		self.PlotView.Init();
		svg=self.PlotView.svg;
		width=self.PlotView.width;
		height=self.PlotView.height;
		
		//var request=self.APIrequest();

		//If measure is a (c-)variable, then we got melted data from updateBDSdata function, with all measures contained in the "value" column
		var measure=(self.MeasureAsLegend())?"value":request.measure;

		//Set the title of the plot
		var ptitle=((measure.length>1)?("Various measures"):(self.model.NameLookUp(measure,"measure")))+ //If many measures say "various", otherwise the measure name
					   (self.us()?" in US":((request.state.length>1)?(" by state"):(" in "+self.model.NameLookUp(request.state,"state")))); // The same for states
		if (!self.YearAsArgument())
			ptitle=ptitle+((request.year2.length>1)?(" by year"):(" in "+self.model.NameLookUp(request.year2,"year2"))); // the same for years
		//Say "by sector" if many sectors, if not "economy wide" add "in sector of"
		ptitle=ptitle+((request.sic1.length>1)?(" by sector"):(((request.sic1[0]===0)?" ":" in sector of ")+self.model.NameLookUp(request.sic1,"sic1")));
		d3.select("#graphtitle").text(ptitle);

		//List of selected categories by actual name rather than code
		var cvarlist=request[request.cvar].map(function(d) {
			var cv=self.FirmCharAsLegend()?d:self.model.NameLookUp(d,request.cvar);
			return (self.YearAsLegend())?(cv.toString()):(cv);
		});
		

		//Setting D3 scales
		var xScale; var yScale; var ymin; var y0;
		if (self.YearAsArgument())
			xScale = d3.scale.linear()
				.domain([self.model.year2[0],self.model.year2[self.model.year2.length-1]])
				.range([0, width]);
		else
			xScale = d3.scale.ordinal()
				.domain(self.model.GetDomain(request.xvar))
				.rangeRoundBands([0, width], .1);

		if (self.logscale()) {
			data=data.filter(function(d) {return d[measure]>0});
			ymin = d3.min(data, function(d) { return +d[measure]; })/2.;
			y0=ymin;
			yScale = d3.scale.log();
		} else {
			y0=0;
			ymin = Math.min(0,d3.min(data, function(d) { return +d[measure]; }));
			yScale = d3.scale.linear()
		}

		yScale.domain([ymin, d3.max(data, function(d) { return +d[measure]; })])
			.range([height,0]);

				
		//Set up colorscale
		var yearcolorscale = d3.scale.linear().domain([+cvarlist[0],+cvarlist[cvarlist.length-1]]).range(["#265DAB","#CB2027"]);
		//var normscale=d3.scale.linear().domain([0,cvarlist.length/2,cvarlist.length-1]).range(["#265DAB","#dddddd","#CB2027"]);
		var normscale=d3.scale.linear().domain([0,cvarlist.length-1]).range(["#265DAB","#dddddd"]);
		//var colarr=["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
			
		var colors = function(i) {
			if (self.YearAsLegend()) return yearcolorscale(cvarlist[i]);
			else if (request.cvar=="fage4") return self.model.fage4color[i];
			else if ((request.cvar=="fsize") || (request.cvar=="ifsize")) return self.model.fsizecolor[i];
			else if (self.YearAsArgument()) return colorbrewer.Dark2[8][i % 8];//colarr[i % colarr.length];
			else return colorbrewer.BrBG[11][10 - (i % 11)];//colarr[i % colarr.length];//normscale(i);
		}

		var Tooltiptext = function(d) {
			var ttt=self.MeasureAsLegend()?d.measure:self.model.NameLookUp(measure,"measure");
			ttt+=": "+d3.format(",")(d[measure])+"\n"+self.model.NameLookUp(request.xvar,"var")+": "+d[request.xvar];
			if (!self.MeasureAsLegend())
				ttt+="\n"+self.model.NameLookUp(request.cvar,"var")+": "+d[request.cvar];
			return ttt;
		}
		
		if (self.YearAsArgument()) {
			//Timeline scatter plot is year is x-variable

			// Define the line
			var valueline = d3.svg.line()
	    	.x(function(d) { return xScale(d.year2); })
	    	.y(function(d) { return yScale(d[measure]); });

	    	for (var icv in request[request.cvar])
	    		svg.append("path")
	        	.attr("class", "line")
	        	.attr("fill", "none")
	        	.attr("stroke-width",2)
	        	.attr("stroke", colors(icv))
	        	.attr("d", valueline(data.filter(function(d) {
	        			if (self.FirmCharAsLegend())
	        				return d[request.cvar]===request[request.cvar][icv]; 
	        			else return d[request.cvar]===self.model.NameLookUp(request[request.cvar][icv],request.cvar);
	        		})));

	        svg.selectAll("dot")
        	.data(data)
      		.enter().append("circle")
      		.attr("fill", function(d) {return colors(cvarlist.indexOf(d[request.cvar]));})
        	.attr("r", 5)
        	.attr("cx", function(d) { return xScale(d.year2); })
        	.attr("cy", function(d) { return yScale(d[measure]); })
        	.append("title").text(function(d){return Tooltiptext(d);});

		} else {
			//Bar chart	if x-variable is other than year
			
			//Number of bars is number of categories in the legend, and barwidth is determined from that
			var nbars=cvarlist.length;
			var barwidth= xScale.rangeBand()/nbars;

			var bars=
			svg.selectAll("rect")
				.data(data);

			bars.enter().append("rect")
			   	.attr("fill",  function(d) {return colors(cvarlist.indexOf(d[request.cvar]));})
			   	.attr("stroke", "white")
			   	.attr("stroke-width",".1")
			   	//.attr("fill",  function(d) {return colors(d[request.cvar]);})
			   	.attr("width", barwidth)
			   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*cvarlist.indexOf(d[request.cvar])})
			   	// .attr("y",function(d) {return yScale(y0)})
			   	// .attr("height",0).transition()
			   	// .duration(500).ease("sin-in-out")
			   	.attr("y",function(d) {return yScale(Math.max(0,+d[measure]))})
			   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]))})
			   	.append("title").text(function(d){return Tooltiptext(d);});
		}

		//Adding axes
		var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

		if (self.YearAsArgument()) xAxis.tickFormat(d3.format("d"));

		var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

		var yAxis = d3.svg.axis().scale(yScale).orient("left");
		if (self.logscale()) yAxis.ticks(5,d3.format(",d"));

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + yScale(y0) + ")")
			.call(xAxis0);

		var xAxisLabels=svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis).selectAll("text");

		if (self.SectorAsArgument()) {
			xAxisLabels
			.attr("y", 10)		
   			.attr("x", -.5*barwidth)
			.attr("transform", "rotate(7)")
			.style("text-anchor", "start");
			//.attr("y", function(d) {return 15-10*(self.model.GetDomain(request.xvar).indexOf(d) % 2 == 0);});
		}


		svg.append("g")
		.attr("class", "y axis")
		.call(yAxis); 

		//Making Legend
		var legendsvg=self.PlotView.legendsvg;

		var symbolsize=15;//Math.max(Math.min(barwidth,20),15);

		legendsvg.attr("height",(symbolsize+5)*cvarlist.length);

		legendsvg.append("text").text(self.model.NameLookUp(request.cvar,'var')+": ");

		legendsvg.selectAll("rect")
			.data(cvarlist)
			.enter()
			.append("rect")
			.attr("fill",  function(d,i) {return colors(i);})
			.attr("width",symbolsize).attr("height",symbolsize)
			.attr("y",function(d,i) {return 10+(symbolsize+5)*i;});

		legendsvg.selectAll("text .leglabel")
			.data(cvarlist)
			.enter()
			.append("text")
			.attr("class","leglabel")
			.attr("fill","black")
			.attr("x",(symbolsize+5)).attr("y",function(d,i) {return 22+(symbolsize+5)*i;})
			.text(function(d) { return  d;});

		// Timelapse animation
		function updateyear(yr) {

			curyearmessage.transition().duration(1000).text(self.model.year2[yr]); //Display year

			d3.select("#graphtitle").text("");

			var dataset=data.filter(function(d) {return +d.time===self.model.year2[yr]}); //Select data corresponding to the year
			
			//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
			//empty outside this function. The following loop fills in / updates to actual data values from current year
			for (var i in data4bars) data4bars[i][measure]=0; //Set every bar to 0 so that missing bars disappear
				
			for (var i in dataset) { //Set the values of existing bars
				data4bars[xScale.domain().indexOf(dataset[i][request.xvar])*request[request.cvar].length
						+cvarlist.indexOf(dataset[i][request.cvar])][measure]=+dataset[i][measure];
			};
			
      		var bars=svg.selectAll("rect").data(data4bars);

      		// UPDATE
			  // Update old elements as needed.
			  
			bars
			   	.attr("fill",  function(d) {return colors(+d.icvar)})
			   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*d.icvar;})
			   	.transition().duration(500)
			   	.attr("y",function(d) { return yScale(Math.max(0,+d[measure]));})
			   	.attr("height",function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]));});

		}

		//Run timelapse animation
		if (self.timelapse()) {
			//These loops are only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
			var data4bars=[]
			for (var i in xScale.domain())
				for (var j in cvarlist)
					{
						var datum4bar={}
						datum4bar[request.xvar]=xScale.domain()[i];
						datum4bar[measure]=0;
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
	};

	this.getBDSdata();
}

ko.applyBindings(new ViewModel());
