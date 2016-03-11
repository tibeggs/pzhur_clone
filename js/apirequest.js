var BDSVis = BDSVis || {};

BDSVis.getAPIdata = function (vm) {
	//This function puts together the request to the BDS API, does minor data processing (converting into object) and sends it further. 
	//"vm" is the reference to ViewModel

	//The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.
	var APIrequest = function  () {

		var varsrequested={};
		
		for (var i in vm.model.variables) {
			var varr=vm.model.variables[i];

			if (!vm.vars.isvar(varr.code,'any')()) varsrequested[varr.code]=[vm.SelectedOpts[varr.code]()[0]]; //If it's not c- or x-var only take first selected option
			else {
				if (varr.removetotal) {
					//Calculate whether to request single value of the variable or multiple, and remove the entry for the total (like US or EW) in selector
					var multiple = vm.SelectedOpts[varr.code]().length>1; //Whether multiple values are selected
					var totalindex = (varr.total || 0);
					var firstTotal = vm.SelectedOpts[varr.code]()[0]===vm.model[varr.code][totalindex].code; //Whether total is selected

					if ((multiple) && (firstTotal)) varsrequested[varr.code] = vm.SelectedOpts[varr.code]().slice(1); //Remove total if many values are selected
					//Otherwise return all selected values
					else varsrequested[varr.code] = vm.SelectedOpts[varr.code]();
				} else if (varr.type === 'variablegroup') {
					varsrequested[varr.code] = vm.SelectedOpts[varr.code]();
					for (var j in varr.variables)
						varsrequested[varr.variables[j].code]=vm.model.GetDomain(varr.variables[j].code);
				} else varsrequested[varr.code] = vm.geomap()?[vm.SelectedOpts[varr.code]()[0]]:vm.SelectedOpts[varr.code]();
			}
			
			
			// var incompatible
			// for (var j in varr.incompatible) {
			//	vm.StateAsLegend()?([0]):vm.AllOrFirst('sic1'),
			// }
		};

		varsrequested.xvar = (vm.model.LookUpVar(vm.xvar()).type === 'variablegroup')?(vm.SelectedOpts[vm.xvar()]()[0]):(vm.xvar());
		varsrequested.cvar = (vm.model.LookUpVar(vm.cvar()).type === 'variablegroup')?(vm.SelectedOpts[vm.cvar()]()[0]):(vm.cvar());
		
		return varsrequested;
	};


	var request = APIrequest();

    var url = "http://api.census.gov/data/bds/firms";

	var geography = "state:"+request.state; 
	if ((request.state.length===1) && (request.state[0]==="00")) geography = "us:*"; //If only "United States" is selected then use us:*
	if (vm.geomap()) geography = "state:*"; //In map regime use state:*

	//Whether to request all years or a particular year
	var reqtime;
	var tv = vm.model.LookUpVar(vm.model.timevar); //Variable denoting time (e.g. 'year2')
	if (vm.timelapse() || vm.vars.isvar(tv.code,'x')()) //When time lapse or time variable as axis request data for all times
		reqtime = "&time=from+"+tv.range[0]+"+to+"+tv.range[1]+"";
	else reqtime = "&"+tv.code+"="+(request[tv.code] || tv.default); //Else request for a particular time

	//Put everything together
    var geturl = url+"?get="+request[vm.model.yvars];

    if ((request.xvar!=vm.model.geomapvar) && (request.xvar!=vm.model.yvars)) geturl+=","+request.xvar;
    //debugger;
    //if ((request.cvar!=vm.model.timevar) && (request.cvar!=vm.model.geomapvar) && (request.cvar!=vm.model.yvars)) geturl+=","+request.cvar;

    geturl+="&for="+geography+reqtime;
    //+((vm.us() && (!vm.SectorAsArgument()) && (!vm.StateAsArgument()))?("&sic1="+request.sic1):(""))+ //sectors, if US
    		

    for (var i in vm.model.variables) {
    	var varr = vm.model.variables[i];
    	if ((varr.code!=request.xvar) && (varr.code!=vm.model.geomapvar) && (varr.code!=vm.model.timevar) &&  (varr.code!=vm.model.yvars) && (varr.type!="variablegroup"))
    		geturl+="&"+varr.code+"="+request[varr.code];
    };

    geturl+="&key=93beeef146cec68880fccbd72e455fcd7135228f";
    		
    		

    console.log(geturl);
    
    vm.waiting4api(true); //Show "waiting for data" message
    //vm.PlotView.Init();
    d3.json(geturl,function (data) {
    	if (!(data===null)) { //Convert data into array of objects with the same keys
	    	var jsoned = [];
	    	for (var i in data) {
	    		var rec = {};
	    		if (i>0) {
	    			for (iname in data[0]) { //Find keys, which are contained in the first line of the array returned by API
	    				var key = (data[0][iname]==="us")?("state"):(data[0][iname]); //Substitute "us" field name to "state"
	    				rec[key] = data[i][iname]; //Fill the object
	    			};
	    			jsoned.push(rec);
	    		};
	    	};
    		BDSVis.processAPIdata(jsoned,request,vm); //Continue to data processing and plotting
    	} else console.log("Server sent empty response to " + geturl);	
    	vm.waiting4api(false); //Hide "waiting for data" message
    });
};


//Process data obtained from API. Change codes into names, form data2show for displaying as a table and call the function making the plot
BDSVis.processAPIdata = function(data,request,vm) {
	//This function converts the data from API, replacing coded variables with their displayable names, and makes a 2D table for display of the textual data
	//"vm" is the reference to ViewModel

	var cvar = request.cvar;
	var xvar = request.xvar;
	var measure = request.measure;

	var data2show = {}; // The nested object, used as an intermediate step to convert data into 2D array

	var data1 = []; // The reshuffled (melted) data, with measures in the same column. Like R function "melt" from the "reshape" package

	for (var i in data) {

		data[i][xvar] = vm.model.NameLookUp(data[i][xvar],xvar); //Replace code strings with actual category names for x-variable
		
		data[i][cvar] = vm.model.NameLookUp(data[i][cvar],cvar); //Replace code strings with actual category names for c-variable

		if (vm.MeasureAsLegend()) 
			for (var imeasure in measure) { 
			//If comparing by measure, melt the data by measures: 
			//combine different measure in single column and create a column indicating which measure it is (c-var)
			//Possible to use melt.js library for this instead
				var rec = {};
				rec.value = data[i][measure[imeasure]]; //Column named "value" will contain values of all the measures
				rec[xvar] = data[i][xvar];		//x-axis value
				rec[cvar] = vm.model.NameLookUp(measure[imeasure],"measure"); //Column for c-variable indicates the measure
				if (vm.timelapse()) rec.time = data[i].time;
				data1.push(rec);
			}
		
		//Convert data to 2D table, so that it can be displayed
		if (data2show[data[i][xvar]] === undefined) //Create nested objects
			data2show[data[i][xvar]] = {};
		if (!vm.MeasureAsLegend())
			data2show[data[i][xvar]][data[i][cvar]] = data[i][measure]; //Fill nested objects
		else 
			for (var imeasure in request[cvar])
				data2show[data[i][xvar]][vm.model.NameLookUp(request[cvar][imeasure],"measure")] = data[i][request[cvar][imeasure]];
	};


	//Convert the nested object with data to display into nested array (including field names)
	var cvarnames = [vm.model.NameLookUp(xvar,"var")]; //Create row with names of c-variable	
	for (var xvarkey in data2show) {
		for (var cvarkey in data2show[xvarkey])
			cvarnames.push(cvarkey);
		break;
	};

	vm.data([cvarnames]); //First row of the table will contain names of c-variable
	for (var xvarkey in data2show) {
		var xvararr = [xvarkey]; //Create the column with names of x-variable
		for (var cvarkey in data2show[xvarkey])
			xvararr.push(data2show[xvarkey][cvarkey]) //Fill the data into 2D table
		vm.data.push(xvararr);
	};

	if (vm.StateAsArgument())
		BDSVis.makeMap(data,request,vm);
	else BDSVis.makePlot((!vm.MeasureAsLegend())?data:data1,request,vm);
};