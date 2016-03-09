var BDSVis = BDSVis || {};

BDSVis.ViewModel = function() {
	var vm = this;

	//Reference to the model, which contains variable names and name look up tables/functions (in model.js file)
	this.model = BDSVis.Model;
	this.model.InitModel();

	var selectors = d3.select('.selectors');
	
	for (var i in this.model.variables) {
		var variable=this.model.variables[i],
			varname=variable.code,
			varfullname=variable.name,
			multiple="vars.multiple('"+varname+"')",
			so="SelectedOpts['"+varname+"']",
			optionstext="",
			optionsvalue="";
		if (variable.type==="continuous") {optionstext="$data"; optionsvalue="$data"};
		if ((variable.type==="categorical") || (variable.type==="variablegroup")) {optionstext="'name'"; optionsvalue="'code'"};
	
		var databind="options: model."+varname
					+", optionsText: "+optionstext
					+", optionsValue: "+optionsvalue
					+", disable: vars.disabled('"+varname+"','selector')"
					+", value: "+so+"()[0]"
					+", selectedOptions: "+so;
	
		selectors.append("h4").text(varfullname+":");
	
		if ((variable.type!="variablegroup") && (variable.aslegend))
			databind+=", attr: {multiple: "+multiple+"}"
					+", css: {tallselector: "+multiple+"}";

		selectors.append("select").attr("data-bind", databind);
	
		if (variable.aslegend) {
			var cbutdbind="click: function(variable) {setcvar('"+varname+"')}"
									+", disable: vars.disabled('"+varname+"','cbutton')"
									+", css: {activebutton: "+multiple+"}";
			if (variable.type=="variablegroup") cbutdbind+=", text: 'Compare '+model.NameLookUp("+so+"()[0],'var')";
			selectors.append("button")
					.attr("data-bind",cbutdbind).text("Compare "+varfullname+"s");
		}
		if (variable.asaxis)
			selectors.append("button")
					.attr("data-bind","click: function(variable) {setxvar('"+varname+"')}"
									+", disable: vars.disabled('"+varname+"','xbutton')"
									+", css: {activebutton: vars.isvar('"+varname+"','x')}").text("Make X-axis");
		selectors.append("br");
	}
	
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
			vm.SelectedOpts[vm.model.timevar]([vm.TimeLapseCurrYear-1]); //Set the year to the year currently shown in animation
			//vm.SelectedOpts['year2']([vm.TimeLapseCurrYear-1]);	
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

	//Geo Map regime
	this.geomap = function() {
		return vm.vars.isvar(vm.model.geomapvar,'x')();
	};

	this.waiting4api = ko.observable(false);    //Whether message "Waiting for data from server" is shown

	disableAll = ko.computed(function () { //Disable all the input elements (used in Time Lapse regime and when the app is waiting for data from server)
		return (vm.waiting4api() || vm.timelapse());
	});

	
	//The following functions set cvar (Legend/Comparison/Color variable) and xvar (X-axis variable)
	this.setcvar = function (varname) {
		var varr=vm.model.LookUpVar(varname);
		
		vm.cvar(varname);
		var incompatible_changed=false;
		for (var i in varr.incombatible) {
			var incmp=varr.incombatible[i];
			vm.SelectedOpts[incmp.code]([this.model[incmp.code][0].code]);
			incompatible_changed=true;
		}
		if (!incompatible_changed) vm.getBDSdata();
	};

	this.setxvar = function (varname) {
		vm.xvar(varname);
		//if (varname==="state") vm.cvar("measure");
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
		var varr=vm.model.LookUpVar(varname);

		var IncompExists = function(list, xc) { //Check an element exists in the list, which is x-, c- or any variable
			var disabled = false;
			for (var i in list)
				//If the variable in incombatible list is x/c/a
				if (vm.vars.isvar(list[i],xc)()) disabled = true;
				//If it's not, but the value selected is not 0 (standing for all, like "United States" or "Economy Wide")
				else if (vm.SelectedOpts[list[i]]()[0]!=vm.model[list[i]][0].code) disabled = true;
			return disabled;
			
		}
		
		if (disableAll()) return true;

		else if (uielement==='selector') {		
			if (vm.vars.isvar(varname,'x')() && (varr.type!="variablegroup")) return true; //Disable selector if variable is on x-axis
			else return IncompExists(varr.incompatible,'any'); //Disable selector if an incompatible variable is xvar or cvar

		} else if (uielement==='xbutton') {

			if (vm.vars.isvar(varname,'any')()) return true; //Disable 'Make X' button is variable is xvar or cvar
			else return IncompExists(varr.incompatible,'c');  //Disable 'Make X' if the cvar is incompatible

		} else if (uielement==='cbutton') {

			if (vm.vars.isvar(varname,'any')()) return true; //Disable 'Compare' button is variable is xvar or cvar
			else if (vm.vars.isvar('state','x')()) return true; //Disable 'Compare' button is variable is xvar or cvar or in geomap regime
			else return IncompExists(varr.incompatible,'x')  //Disable 'Compare' if the xvar is incompatible
		
		} else return false;

	}.bind(this.vars);

	//Whether selector is multiple (basically, amounts to being c-variable) and "Compare" button active
	this.vars.multiple = function (varname) {
		return vm.geomap()?false:vm.vars.isvar(varname,'c')(); 
	}.bind(this.vars);
    
	//Knockout observables for input selectors
	this.SelectedOpts = {};
	for (var i in this.model.variables) {
		var varr=this.model.variables[i];
		var initial = (varr.type==="continuous")?[vm.model[varr.code][varr.default]]:[vm.model[varr.code][varr.default].code];
		vm.SelectedOpts[varr.code]=ko.observableArray(initial);
	}

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

	this.us = function(){
		if (vm.StateAsLegend()) return false; //If states are Legend, we need many states, so request NOT general, but by state
		else if (vm.SectorVar()) return true; //If sector is either c- or x- variable, then there is no by-state data, so YES
		else if (vm.SelectedOpts['sic1']()[0]===0) return false; //If "Economy Wide" is selected in sectors, then by state
		else return true; //Else means a sector is selected, so there can not be by-state request
	};

	//Subscribe to input changes
	//Any change in the input select fields triggers request to the server, followed by data processing and making of a new plot
	for (var i in this.model.variables) {
		var varr=this.model.variables[i];
		this.SelectedOpts[varr.code].subscribe(function() {vm.getBDSdata();});
	}

	//Call initial plot
	//Get the geographic map from the shape file in JSON format
	d3.json("../json/gz_2010_us_040_00_20m.json", function(geo_data) {
		vm.geo_data=geo_data;
		vm.getBDSdata();
	});
	//vm.getBDSdata();
}

ko.applyBindings(new BDSVis.ViewModel());