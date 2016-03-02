var BDSVis = BDSVis || {};

var selectors = d3.select('.selectors');
selectors.append("h4").text('Firm Characteristic:');
selectors.append("select").attr("data-bind","options: model.fchar, optionsText: 'name', optionsValue: 'code', value: fchar, disable: FcharSelectorDis");
selectors.append("button").attr("data-bind","click: function(variable) {setcvar('fchar')},  css: {activebutton: FirmCharAsLegend()}, disable: FcharCompareDis, text: FcharCompButtonText").text("Make X-axis");
selectors.append("button").attr("data-bind","click: function(variable) {setxvar('fchar')}, disable: FcharXDis, css: {activebutton: vars.isxvar('fchar')}").text("Make X-axis");
selectors.append("br")

BDSVis.ViewModel = function() {
	var vm = this;

	//Reference to the model, which contains variable names and name look up tables/functions (in model.js file)
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
	this.setcvar = function (variable) {
		vm.cvar(variable);
		if (variable==="sic1")
			vm.SelectedStates([this.model.state[0].code]);
		else if (variable==="state")
			vm.SelectedSectors([this.model.sic1[0].code]);
		else vm.getBDSdata();
	};

	this.setxvar = function (variable) {
		vm.xvar(variable);
		if (((variable==="sic1") && vm.StateAsLegend()) || variable==="state") vm.cvar("measure");
		vm.getBDSdata();
	};
    
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
	//this.YearAsArgument = ko.computed( function (xvar) {return vm.xvar()===xvar;});
	this.FirmCharAsArgument = ko.computed( function () {return vm.xvar()==="fchar";});

	this.vars=ko.observable(0);

	this.vars.isxvar = function(variable) {
		return ko.computed(function() { return vm.xvar()===variable }, this);	
	}.bind(this.vars);

	//Whether a variable is either X- or C-
	this.SectorVar = ko.computed( function () {return (vm.SectorAsLegend() || vm.SectorAsArgument());});
	this.StateVar = ko.computed( function () {return (vm.StateAsLegend() || vm.StateAsArgument());});
	this.YearVar = ko.computed( function () {return (vm.YearAsLegend() || vm.YearAsArgument());});
	this.FirmCharVar = ko.computed( function () {return (vm.FirmCharAsLegend() || vm.FirmCharAsArgument());});

	this.FcharCompButtonText = ko.computed( function() {return "Compare "+vm.model.NameLookUp(vm.fchar(),"var");});

 	//Whether to show the state selector (and also to send the "us:*" request or by individual states ("state:*"))
	this.us = function(){
		if (vm.StateAsLegend()) return false; //If states are Legend, we need many states, so request NOT general, but by state
		else if (vm.SectorVar()) return true; //If sector is either c- or x- variable, then there is no by-state data, so YES
		else if (vm.SelectedSectors()[0]===0) return false; //If "Economy Wide" is selected in sectors, then by state
		else return true; //Else means a sector is selected, so there can not be by-state request
	};

	//For active-highlighted and disabled controls
	SectorSelectorDis = ko.computed(function() { return (vm.StateVar()  || vm.SectorAsArgument() || disableAll()) });
	SectorCompareDis = ko.computed(function()  { return (vm.SectorVar() || vm.StateAsArgument()  || disableAll()) });
	SectorXDis = ko.computed(function()        { return (vm.SectorVar() || vm.StateAsLegend()    || disableAll()) });

	MeasureSelectorDis = ko.computed(function() { return disableAll() });
	MeasureCompareDis = ko.computed(function()  { return (vm.MeasureAsLegend() || vm.StateAsArgument() || disableAll()) });

	StateSelectorDis = ko.computed(function() { return (vm.us() || vm.StateAsArgument() || disableAll()) });
	StateCompareDis = ko.computed(function()  { return  (vm.StateVar() || vm.SectorAsArgument() || disableAll()) });
	StateXDis = ko.computed(function()        { return (vm.StateVar() || disableAll()) });

	YearSelectorDis = ko.computed(function() { return (vm.YearAsArgument() || disableAll()) });
	YearCompareDis = ko.computed(function()  { return (vm.YearVar() || vm.StateAsArgument() || disableAll()) });
	YearXDis = ko.computed(function()        { return  (vm.YearVar() || disableAll()) });

	FcharSelectorDis = ko.computed(function() { return (vm.StateAsArgument() || disableAll()) });
	FcharCompareDis = ko.computed(function()  { return (vm.FirmCharVar() || vm.StateAsArgument() || disableAll()) });
	FcharXDis = ko.computed(function()        { return (vm.FirmCharVar() || disableAll()) });

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