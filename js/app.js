var BDSVis = BDSVis || {};

var selectors = d3.select('.selectors');

var varnames=['sic1','measure','state','year2'];

for (var i in varnames) {
	var varname=varnames[i];
	var varfullname=BDSVis.Model.NameLookUp(varname,"var");
	var multiple="vars.multiple('"+varname+"')";
	var so="SelectedOpts['"+varname+"']";
	selectors.append("h4").text(varfullname+":");
	selectors.append("select").attr("data-bind","options: model."+varname+", optionsText: 'name', optionsValue: 'code', value: "+so+"()[0], selectedOptions: "+so+", attr: {multiple: "+multiple+"}, css: {tallselector: "+multiple+"}, disable:  vars.disabled('"+varname+"','selector')");
	selectors.append("button").attr("data-bind","click: function(variable) {setcvar('"+varname+"')}, disable: vars.disabled('"+varname+"','cbutton'), css: {activebutton: "+multiple+"}").text("Compare "+varfullname+"s");//, text: FcharCompButtonText");
	selectors.append("button").attr("data-bind","click: function(variable) {setxvar('"+varname+"')}, disable: vars.disabled('"+varname+"','xbutton'), css: {activebutton: vars.isvar('"+varname+"','x')}").text("Make X-axis");
	selectors.append("br");
}

varnames=['fchar'];

for (var i in varnames) {
	var varname=varnames[i];
	var multiple="vars.multiple('"+varname+"')";
	selectors.append("h4").text(BDSVis.Model.NameLookUp(varname,"var")+":");
	selectors.append("select").attr("data-bind","options: model."+varname+", optionsText: 'name', optionsValue: 'code', value: "+varname+", disable: vars.disabled('"+varname+"','selector')");
	selectors.append("button").attr("data-bind","click: function(variable) {setcvar('"+varname+"')}, disable: vars.disabled('"+varname+"','cbutton'), css: {activebutton: "+multiple+"}, text: FcharCompButtonText");
	selectors.append("button").attr("data-bind","click: function(variable) {setxvar('"+varname+"')}, disable: vars.disabled('"+varname+"','xbutton'), css: {activebutton: vars.isvar('"+varname+"','x')}").text("Make X-axis");
	selectors.append("br");
}


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
			vm.SelectedOpts['year2']([vm.TimeLapseCurrYear-1]);	//Set the year to the year currently shown in animation
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
	this.setcvar = function (varname) {
		vm.cvar(varname);
		if (varname==="sic1")
			vm.SelectedOpts['state']([this.model.state[0].code]);
		else if (varname==="state")
			vm.SelectedOpts['sic1']([this.model.sic1[0].code]);
		else vm.getBDSdata();
	};

	this.setxvar = function (varname) {
		vm.xvar(varname);
		if (((varname==="sic1") && vm.StateAsLegend()) || varname==="state") vm.cvar("measure");
		vm.getBDSdata();
	};

	//Disabled / Active / Selected logic
	this.vars=ko.observable(0);

	//Check whether a variable is x- or c- or any of the two
	this.vars.isvar = function(varname,xc) {
		return ko.computed(function() {
			if (xc==='c') return vm.cvar()===varname;
			else if (xc==='x') return vm.xvar()===varname; 
			else if (xc==='any') return ((vm.xvar()===varname) || ( vm.cvar()===varname));
			else return false;
		}, this);	
	}.bind(this.vars);

	//For disabled controls
	this.vars.disabled = function (varname,uielement) {
		if (disableAll()) return true;
		else if (uielement==='selector') {
			if (vm.vars.isvar(varname,'x')() && (varname!="fchar")) return true; //Disable selector is variable is on x-axis
			if (varname==='sic1') {
				if (vm.vars.isvar('state','any')()) return true; //Disable simultaneous sector and state choice
			} else if (varname==='state') {
				if (vm.vars.isvar('sic1','any')()) return true; //Disable simultaneous sector and state choice
			}
		} else if (uielement==='xbutton') {
			return vm.vars.isvar(varname,'any'); //Disable 'Make X' button is variable is xvar or cvar
		} else if (uielement==='cbutton') {
			if (vm.vars.isvar('state','x')()) return true; //Disable 'Compare' button is variable is xvar or cvar or in geomap regime
			else if (varname==='sic1') {
				if (vm.vars.isvar('state','any')()) return true; //Disable simultaneous sector and state choice
			} else if (varname==='state') {
				if (vm.vars.isvar('sic1','x')()) return true; //Disable simultaneous sector and state choice
			}
			else return vm.vars.isvar(varname,'any');
		} else return false;

	}.bind(this.vars);

	//Whether selector is multiple (basically, amounts to being c-variable) and "Compare" button active
	this.vars.multiple = function (varname) {
		var multiple = vm.vars.isvar(varname,'c')();
		if (varname==='measure') multiple = multiple && (!vm.vars.isvar('state','x')());
		return multiple; 
	}.bind(this.vars);
    
	//Initial values of what is selected in the input selectors
	this.SelectedOpts = {
		state:ko.observableArray([this.model.state[0].code]),
		sic1:ko.observableArray([this.model.sic1[0].code]),
		measure:ko.observableArray([this.model.measure[11].code]),
		year2:ko.observableArray([this.model.year2[36]])
	}
	
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

	//Whether a variable is either X- or C-
	this.SectorVar = ko.computed( function () {return (vm.SectorAsLegend() || vm.SectorAsArgument());});
	this.StateVar = ko.computed( function () {return (vm.StateAsLegend() || vm.StateAsArgument());});
	this.YearVar = ko.computed( function () {return (vm.YearAsLegend() || vm.YearAsArgument());});
	this.FirmCharVar = ko.computed( function () {return (vm.FirmCharAsLegend() || vm.FirmCharAsArgument());});

	this.FcharCompButtonText = ko.computed( function() {return "Compare "+vm.model.NameLookUp(vm.fchar(),"var");});

	this.us = function(){
		if (vm.StateAsLegend()) return false; //If states are Legend, we need many states, so request NOT general, but by state
		else if (vm.SectorVar()) return true; //If sector is either c- or x- variable, then there is no by-state data, so YES
		else if (vm.SelectedOpts['sic1']()[0]===0) return false; //If "Economy Wide" is selected in sectors, then by state
		else return true; //Else means a sector is selected, so there can not be by-state request
	};

	//Subscribe to input changes
	//Any change in the input select fields triggers request to the server, followed by data processing and making of a new plot
	var varnames=['state','measure','sic1','year2'];
	for (var i in varnames) {
		this.SelectedOpts[varnames[i]].subscribe(function() {vm.getBDSdata();});
	}
	this.fchar.subscribe(function() {vm.getBDSdata();});

	//Call initial plot
	//Get the geographic map from the shape file in JSON format
	d3.json("../json/gz_2010_us_040_00_20m.json", function(geo_data) {
		vm.geo_data=geo_data;
		vm.getBDSdata();
	});
}

ko.applyBindings(new BDSVis.ViewModel());