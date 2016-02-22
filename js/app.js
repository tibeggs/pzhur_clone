var BDSVis = BDSVis || {};

BDSVis.ViewModel = function() {
	var vm = this;

	//Reference to the model, which contains variable names and name look (in model.js file)
	this.model = BDSVis.Model;
	this.model.InitModel();

	//Reference to the visual elements of the plot: SVGs for the graph/map and legend
	this.PlotView = BDSVis.PlotView;

	// The reference to function that forms and sends API request and gets data (apirequest.js)
	this.getBDSdata = function () {
		return BDSVis.getAPIdata(vm);
	};

	//SHOW DATA BUTTON
	//The data array do be displayed as table with numbers
	this.data = ko.observableArray();
	//Initial value for showing data
	this.ShowData = ko.observable(0);
	this.toggleshowdata = function () {
		//This function executes in click to 'Show Data' button.
		vm.ShowData(!vm.ShowData());
	};

	//TIME LAPSE BUTTON
	//Whether time lapse regime is on	
	this.timelapse = ko.observable(false); //Initial value
	this.tlbuttontext = ko.computed (function() {return vm.timelapse()?"Stop":"Time Lapse"}); //Text on the button
	this.toggletimelapse = function () {
		//This function executes in click to 'Stop'/'Time Lapse' button and stops time lapse animation or starts it.
		if (vm.timelapse()) {
			vm.timelapse(false);
			clearInterval(vm.tlint); //Stop the animation
			vm.SelectedYears([vm.TimeLapseCurrYear-1]);	//Set the year to the year currently shown in animation
		} else {
			vm.timelapse(true);
			vm.getBDSdata();
		}
	};

	//LOG SCALE BUTTON
	//Initial value for log scale of y-axis
	this.logscale = ko.observable(0); //Initial value
	this.yscalebuttontext = ko.computed (function() {return vm.logscale()?"Linear":"Log"});  //Text on the button
	this.toggleyscale = function () { 
		//Toggle whether to plot the graph in log or linear scale
		vm.logscale(!vm.logscale());
		vm.getBDSdata();
	};

	this.waiting4api = ko.observable(false);    //Whether message "Waiting for data from server" is shown

	disableAll = ko.computed(function () { //Disable all the input elements (used in Time Lapse regime and when the app is waiting for data from server)
		return (vm.waiting4api() || vm.timelapse());
	});

	
	//The following functions set cvar (Legend/Comparison/Color variable) and xvar (X-axis variable)
	//////////////////
	this.setsectorcvar = function () {vm.cvar("sic1"); vm.getBDSdata(); }
	this.setsectorxvar = function () {
		vm.xvar("sic1");
		if (vm.StateAsLegend()) vm.cvar("measure"); //Since "sector" and "state" cannot both be variables, change c-var to "measure"
		vm.getBDSdata();
	};
	this.setstatecvar = function () {vm.cvar("state"); vm.getBDSdata(); };
	this.setstatexvar = function () {
		//This moves the app to the geo map regime. There isn't a c-variable in that regime, but something should be set as one for the getBDSdata function.
		vm.cvar("measure");
		vm.xvar("state");
		vm.getBDSdata();
	};
	this.setyearcvar = function () {vm.cvar("year2"); vm.getBDSdata(); };
	this.setyearxvar = function () {vm.xvar("year2"); vm.getBDSdata(); };
	this.setmeasurecvar = function () {vm.cvar("measure"); vm.getBDSdata(); };
	this.setmeasurexvar = function () {vm.xvar("measure"); vm.getBDSdata(); };
	this.setfcharcvar = function () {vm.cvar("fchar"); vm.getBDSdata(); };
	this.setfcharxvar = function () {vm.xvar("fchar"); vm.getBDSdata(); };
	//////////////////////////////////////////////////////////////////////////////////
    
	//Initial values of what is selected in the input selectors
	this.SelectedStates = ko.observableArray([this.model.state[0].code]);
	this.SelectedSectors = ko.observableArray([this.model.sic1[0].code]);
	this.SelectedMeasures = ko.observableArray([this.model.measure[11].code]);
	this.SelectedYears = ko.observableArray([this.model.year2[36]]);
	this.fchar = ko.observable(this.model.fchar[0].code);
	//this.SelectedFchar = ko.observableArray([this.fchar()]);

	//Initial values of X-axis variable and C- variable
	this.xvar = ko.observable("fchar");
	this.cvar = ko.observable("sic1");	

	//Whether a variable is C- Variable (Legend)
	this.SectorAsLegend = ko.computed( function () {return vm.cvar()==="sic1";});
	this.StateAsLegend = ko.computed( function () {return vm.cvar()==="state";});
	this.MeasureAsLegend = ko.computed( function () {return vm.cvar()==="measure";});
	this.YearAsLegend = ko.computed( function () {return vm.cvar()==="year2";});
	this.FirmCharAsLegend = ko.computed( function () {return vm.cvar()==="fchar";});

	//Whether a variable is X-axis variable
	this.SectorAsArgument = ko.computed( function () {return vm.xvar()==="sic1";});
	this.StateAsArgument = ko.computed( function () {return vm.xvar()==="state";}); //When "state" is x-var, it is the geo map regime
	this.YearAsArgument = ko.computed( function () {return vm.xvar()==="year2";});
	this.FirmCharAsArgument = ko.computed( function () {return vm.xvar()==="fchar";});

	//Whether a variable is either X- or C-
	this.SectorVar = ko.computed( function () {return (vm.SectorAsLegend() || vm.SectorAsArgument());});
	this.StateVar = ko.computed( function () {return (vm.StateAsLegend() || vm.StateAsArgument());});
	this.YearVar = ko.computed( function () {return (vm.YearAsLegend() || vm.YearAsArgument());});
	this.FirmCharVar = ko.computed( function () {return (vm.FirmCharAsLegend() || vm.FirmCharAsArgument());});

	this.FcharCompButtonText = ko.computed( function() {return "Compare "+vm.model.NameLookUp(vm.fchar(),"var");});

 	//Whether to show the state selector (and also to send the "us:*" request or by individual states ("state:*"))
	this.us = ko.computed(function(){
		if (vm.StateAsLegend()) return false; //If states are Legend, we need many states, so request NOT general, but by state
		else if (vm.SectorVar()) return true; //If sector is either c- or x- variable, then there is no by-state data, so YES
		else if (vm.SelectedSectors()[0]===0) return false; //If "Economy Wide" is selected in sectors, then by state
		else return true; //Else means a sector is selected, so there can not be by-state request
	});

	//Subscribe to input changes
	//Any change in the input select fields triggers request to the server, followed by data processing and making of a new plot

	this.SelectedStates.subscribe(function() {vm.getBDSdata();});
	this.SelectedMeasures.subscribe(function() {vm.getBDSdata();});
	this.SelectedSectors.subscribe(function() {vm.getBDSdata();});
	this.SelectedYears.subscribe(function() {vm.getBDSdata();});
	this.fchar.subscribe(function() {vm.getBDSdata();});

	//Call initial plot
	//Get the geographic map from the shape file in JSON format
	d3.json("../json/gz_2010_us_040_00_20m.json", function(geo_data) {
		vm.geo_data=geo_data;
		vm.getBDSdata();
	});
}

ko.applyBindings(new BDSVis.ViewModel());