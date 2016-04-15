var BDSVis = BDSVis || {};

BDSVis.ViewModel = function() {
	var vm = this;

	//Reference to the model, which contains variable names and name look up tables/functions (in model.js file)
	this.model = BDSVis.Model;
	this.model.InitModel();

	//Make HTML UI elements
	var selectors = d3.select('.selectors');
	
	this.model.variables.forEach(function(varr) { //For each variable create selector and buttons
		//Data is bound to selectors using knockout.js

		var	multiple="vars.multiple('"+varr.code+"')", //Whether selector allows multiple options
			so="SelectedOpts['"+varr.code+"']", //Options selected in the selector
			optionstext="",
			optionsvalue="";
		if (vm.model.IsContinuous(varr)) {optionstext="$data"; optionsvalue="$data"}; //Continous variables values are just arrays of numbers
		if ((vm.model.IsCategorical(varr)) || (vm.model.IsGroup(varr))) {optionstext="'name'"; optionsvalue="'code'"}; //Categorical variables values are arrays of name/code objects
	
		var databind="options: model."+varr.code
					+", optionsText: "+optionstext
					+", optionsValue: "+optionsvalue
					+", disable: vars.disabled('"+varr.code+"','selector')"
					//+", value: "+so+"()[0]"
					+", selectedOptions: "+so;

		if ((!vm.model.IsGroup(varr)) && (varr.aslegend)) //Allow multiple selection if variable is not group selector and can be used as c-/legend variable
			databind+=", attr: {multiple: "+multiple+"}"
					+", css: {tallselector: "+multiple+"}";
	
		selectors.append("h4").text(varr.name+":"); //Add the title for selector

		selectors.append("select").attr("data-bind", databind); //Add the selector

		if (vm.model.IsGroup(varr)) { //Add selector for the choice selected in the group variable selector
			selectors.append("br");
			selectors.append("h4");
			selectors.append("select").attr("data-bind","options: model["+so+"()[0]], optionsText: 'name', optionsValue: 'code', selectedOptions: SelectedOpts[vars.firstsel('"+varr.code+"')], attr: {multiple: "+multiple+"}, css: {tallselector: "+multiple+"}, disable: vars.disabled('"+varr.code+"','subselector')"); //, value: SelectedOpts["+so+"()[0]]()[0]
		}

	
		if (varr.aslegend) { //Add the 'Compare' button
			var cbutdbind="click: function(variable) {setcvar('"+varr.code+"')}"
									+", disable: vars.disabled('"+varr.code+"','cbutton')"
									+", css: {activebutton: "+multiple+"}";
			if (vm.model.IsGroup(varr)) cbutdbind+=", text: 'Compare '+model.NameLookUp("+so+"()[0],'var')";
			selectors.append("button")
					.attr("data-bind",cbutdbind).text("Compare "+varr.name+"s");
		}
		if (varr.asaxis) //Add the 'Make X' button
			selectors.append("button")
					.attr("data-bind","click: function(variable) {setxvar('"+varr.code+"')}"
									+", disable: vars.disabled('"+varr.code+"','xbutton')"
									+", css: {activebutton: vars.isvar('"+varr.code+"','x')}").text((varr.code===vm.model.geomapvar)?"See Map":"Make X-axis");
		selectors.append("br");

	});

	//UI elements for controlling the Time Lapse
	var bug=d3.select("#timelapsecontrols");
	bug.append("h4").text("From:");
	bug.append("select").attr("data-bind", "options: model[model.timevar], optionsText: $data, optionsValue: $data, value: timelapsefrom");
	bug.append("h4").text("To:"); 
	bug.append("select").attr("data-bind", "options: model[model.timevar], optionsText: $data, optionsValue: $data, value: timelapseto");
	bug.append("h4").text("Speed:");
	bug.append("select").attr("data-bind", "options: model.timelapsespeeds, optionsText: 'name', optionsValue: 'code', value: timelapsespeed");
	
	//Reference to the visual elements of the plot: SVGs for the graph/map and legend
	this.PlotView = BDSVis.PlotView;

	//Reference to the table showing the data;
	this.TableView = BDSVis.TableView;


	this.ActualVarCode = function(varcode) {
		//Checks if the varname is group variable, then returns code of the variable selected. 
		//If not group variable just returns the input (supposedly the variable code)
		return vm.model.IsGroup(vm.model.LookUpVar(varcode))?vm.SelectedOpts[varcode]()[0]:varcode;
	};

	// The reference to function that forms and sends API request and gets data (apirequest.js)
	this.getBDSdata = function () {
		return BDSVis.getAPIdata(vm);
	};

	//SHOW DATA BUTTON
	//The data array do be displayed as table with numbers
	this.data = ko.observableArray();
	
	//The boolean flag for whether the data table is shown
	this.ShowData = ko.observable(0); //Initial value
	this.toggleshowdata = function () {
		//This function executes in click to 'Show Data' button.
		vm.ShowData(!vm.ShowData());
		vm.TableView.SetLowerHeadersWidth();
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
		} else {
			vm.timelapse(true);
			vm.getBDSdata();
		}
	};

	this.timelapsefrom = ko.observable(vm.model.LookUpVar(vm.model.timevar).range[0]);
	this.timelapseto = ko.observable(vm.model.LookUpVar(vm.model.timevar).range[1]-1);
	this.timelapsespeed = ko.observable(vm.model.timelapsespeeds[Math.floor(vm.model.timelapsespeeds.length / 2)].code);

	//LOG SCALE BUTTON
	//Whether the scale of y-axis is Log or Linear
	this.logscale = ko.observable(0); //Initial value
	
	// The code below is deprecated. Log checkbox with onlick event is generated in PlotView.Init();

	// this.yscalebuttontext = ko.computed (function() {return vm.logscale()?"Linear":"Log"});  //Text on the button
	// this.toggleyscale = function () { 
	// 	//Toggle whether to plot the graph in log or linear scale
	// 	vm.logscale(!vm.logscale());
	// 	vm.getBDSdata();
	// };

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
		vm.cvar(varname);
		vm.getBDSdata();
	};

	this.setxvar = function (varname) {	
		vm.xvar(varname);
		if (vm.geomap()) vm.cvar(vm.model.yvars);

		var varname1=vm.ActualVarCode(varname);
		vm.IncludedXvarValues[varname1]=vm.model.GetCodes(varname1);
		
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

		var IncompExists = function(list, xc) { 
			//Check that among incompatible variables, there is one that is x- or c- and/or has a non-total value selected
			//Example: There is no by-state+by-sector data. So, if "state" is x- or c- var, then selector and cbutton and xbutton for "sector" (sic1) should be disabled, unless "United States" is selected for the "state". Likewise, selection of "state" is disabled, unless "Economy Wide" is selected for "sector"
			var disabled = false;
			for (var i in list) {
				var totalindex = (vm.model.LookUpVar(list[i]).total || 0);
				var selOpts = vm.SelectedOpts[list[i]]();
				//Whether the value selected is not the option standing for total (like "United States" or "Economy Wide" or "All ages" or "All sizes")
				var toplinenottotal = (selOpts[0]!==vm.model[list[i]][totalindex].code);
				//Whether the variable in incombatible list is x/c/a
				if ((vm.vars.isvar(list[i],xc)()) && (toplinenottotal || selOpts.length>1 )) disabled = true;
				else if (toplinenottotal) disabled = true;	
			}
			return disabled;
			
		};
		
		if (disableAll()) return true;

		else if (uielement==='selector') {		
			if (vm.vars.isvar(varname,'x')() && (!vm.model.IsGroup(varr))) return true; //Disable selector if variable is on x-axis
			else return IncompExists(varr.incompatible,'any'); //Disable selector if an incompatible variable is xvar or cvar

		} else if (uielement==='subselector') {		
			if (vm.vars.isvar(varname,'x')()) return true; //Disable selector if variable is on x-axis
			else return IncompExists(varr.incompatible,'any');

		} else if (uielement==='xbutton') {
			if (varname === vm.model.geomapvar) return false; //Enable entering into geo map regime at any time
			if (vm.vars.isvar(varname,'any')()) return true; //Disable 'Make X' button is variable is xvar or cvar
			else return IncompExists(varr.incompatible,'c');  //Disable 'Make X' if the cvar is incompatible

		} else if (uielement==='cbutton') {

			if ((vm.vars.isvar(varname,'any')()) || (vm.vars.isvar(vm.model.geomapvar,'x')())) return true; //Disable 'Compare' button if variable is xvar or cvar or if geomap regime
			else return IncompExists(varr.incompatible,'x')  //Disable 'Compare' if the xvar is incompatible
		
		} else return false;

	}.bind(this.vars);

	//Whether selector is multiple (basically, amounts to being c-variable) and "Compare" button active
	this.vars.multiple = function (varname) {
		return vm.geomap()?false:vm.vars.isvar(varname,'c')(); 
	}.bind(this.vars);
    
	//Knockout observables for input selectors and lists for exclusion/inclusion of specific values of x-variable
	this.SelectedOpts = {};
	this.IncludedXvarValues = {};
	this.model.variables.forEach(function(varr) {
		var initial = (vm.model.IsContinuous(varr))?[vm.model[varr.code][varr.default]]:[vm.model[varr.code][varr.default].code];
		vm.SelectedOpts[varr.code]=ko.observableArray(initial);
		vm.IncludedXvarValues[varr.code]=vm.model.GetCodes(varr.code);
		if (vm.model.IsGroup(varr)) {
			varr.variables.forEach(function(varrj){
				//vm.SelectedOpts[varrj.code]=ko.observableArray(vm.model[varrj.code].map(function(d){return d.code;}));
				var initial = (vm.model.IsContinuous(varrj))?[vm.model[varrj.code][varrj.default]]:[vm.model[varrj.code][varrj.default].code];
				vm.SelectedOpts[varrj.code]=ko.observableArray(initial);
				vm.IncludedXvarValues[varrj.code]=vm.model.GetCodes(varrj.code);
			});
		};
	});

	//Returns the selected options for the variable that is selected in selector corresponding to varname (for variablegroup)
	this.vars.firstsel = function(varname) {
		return vm.SelectedOpts[varname]()[0];
	}.bind(this.vars);

	//Initial values of X-axis variable and C- variable
	this.xvar = ko.observable("sic1");
	this.cvar = ko.observable("fchar");	

	//Subscribe to input changes
	//Any change in the input select fields triggers request to the server, followed by data processing and making of a new plot
	this.model.variables.forEach(function(varr) {
		vm.SelectedOpts[varr.code].subscribe(function() {vm.getBDSdata();});
		if (vm.model.IsGroup(varr))
				varr.variables.forEach(function(varrj){
					vm.SelectedOpts[varrj.code].subscribe(function() {vm.getBDSdata();});
				});
	});

	//Call initial plot
	//Get the geographic map from the shape file in JSON format
	d3.json("../json/gz_2010_us_040_00_20m.json", function(geo_data) {
		vm.geo_data=geo_data;
		vm.getBDSdata();
	});
	//vm.getBDSdata();
};

ko.applyBindings(new BDSVis.ViewModel());