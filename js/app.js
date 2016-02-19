var ViewModel = function() {
	var self = this;

	//Reference to the model, which contains variable names and name look (in model.js file)
	this.model = BDSVisModel;
	this.model.InitModel();

	//Reference to the visual elements of the plot: SVGs for the graph/map and legend
	this.PlotView = BDSVisPlotView;

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
		//Since "sector" and "state" cannot both be variables, change c-var to "measure"
		if (self.StateAsLegend()) 
			self.cvar("measure");
		self.getBDSdata();
	}

	this.setstatecvar = function () {
		self.cvar("state");
		self.getBDSdata();
	}

	this.setstatexvar = function () {
		//This moves the app to the geo map regime. There isn't a c-variable in that regime, but something should be set as one for the getBDSdata function.
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
	this.waiting4api = ko.observable(false);    //Whether message "Waiting for data from server" is shown
	disableAll = ko.computed(function () { //Disable all the input elements (used in Time Lapse regime and when the app is waiting for data from server)
		return (self.waiting4api() || self.timelapse());
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
	
	//Form the API request and get the data from the API, then render it into array of objects with field names corresponding to the variables (apirequest.js)
	this.getBDSdata = function () {
		return BDSVisgetBDSdata(self);
	};

	//Process data obtained from API. Change codes into names, add state list number (icvar), form data2show for displaying as a table and call the function making the plot
	this.updateBDSdata = function(data,request) {
		return BDSVisupdateBDSdata(data,request,self);
	};

	//This function makes the geographical map
	this.makeMap = function (data,request) {
		return BDSVismakeMap(data,request,self);
	}

	//This function makes d3js plot, either a bar chart or scatterplot
	this.makePlot = function (data,request) {
		return BDSvismakePlot(data,request,self);
	};

	this.getBDSdata();
}

ko.applyBindings(new ViewModel());