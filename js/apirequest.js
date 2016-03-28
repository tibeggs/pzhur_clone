var BDSVis = BDSVis || {};

BDSVis.getAPIdata = function (vm) {
	//This function puts together the request to the BDS API, does minor data processing (converting into object) and sends it further. 
	//"vm" is the reference to ViewModel
	
	var request={}; //The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.

	request.xvar = vm.model.IsGroup(vm.xvar())?(vm.SelectedOpts[vm.xvar()]()[0]):(vm.xvar());
	request.cvar = vm.model.IsGroup(vm.cvar())?(vm.SelectedOpts[vm.cvar()]()[0]):(vm.cvar());

	vm.model.variables.forEach(function(varr1) { //Add variables with requested values to the request

		var varr = vm.model.IsGroup(varr1)?vm.model.LookUpVar(vm.SelectedOpts[varr1.code]()[0]):varr1; //If variable is a group variable, put variable that is selected in it instead

		if (varr.code===request.xvar) request[varr.code]=vm.IncludedXvarValues[varr.code];
		else if (varr.code!==request.cvar) request[varr.code]=[vm.SelectedOpts[varr.code]()[0]]; //If it's not c- or x-var only take first selected option
		else {
			if (varr.removetotal) {
				//Calculate whether to request single value of the variable or multiple, and remove the entry for the total (like US or EW) in selector
				var multiple = vm.SelectedOpts[varr.code]().length>1; //Whether multiple values are selected
				var totalindex = (varr.total || 0);
				var firstTotal = vm.SelectedOpts[varr.code]()[0]===vm.model[varr.code][totalindex].code; //Whether total is selected

				if ((multiple) && (firstTotal)) request[varr.code] = vm.SelectedOpts[varr.code]().slice(1); //Remove total if many values are selected
				//Otherwise return all selected values
				else request[varr.code] = vm.SelectedOpts[varr.code]();
			} else
				request[varr.code] = vm.geomap()?[vm.SelectedOpts[varr.code]()[0]]:vm.SelectedOpts[varr.code]();
		}
	});
		
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
    var getstring = request[vm.model.yvars];
    var filterstring = "";

	for (var key in request) {

    	if ((key!=="cvar") &&
    		(key!=="xvar") &&
    		(key!==vm.model.geomapvar) && 
    		(key!==vm.model.timevar) &&  
    		(key!==vm.model.yvars))

    		if (!(vm.model.LookUpVar(key).APIfiltered) || (key===request.xvar))
    			getstring+=","+key; //Get records with all values of variable with name equal to key
    		else
    			filterstring+="&"+key+"="+request[key]; //Get records with only those values of variable with name equal to key which are in the request
    };

	var geturl=url+"?get="+getstring+filterstring+"&for="+geography+reqtime+"&key=93beeef146cec68880fccbd72e455fcd7135228f";

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
	    				key = (key==="time")?vm.model.timevar:key;
	    				rec[key] = data[i][iname]; //Fill the object
	    			};
	    			jsoned.push(rec);
	    		};
	    	};
    		BDSVis.processAPIdata(jsoned,request,vm); //Continue to data processing and plotting
    	} else {
    		vm.PlotView.Init();	
    		vm.PlotView.DisplayNoData();	
    		console.log("Server sent empty response to " + geturl);	
    	}
    	vm.waiting4api(false); //Hide "waiting for data" message
    });
};


//Process data obtained from API. Change codes into names, form data2show for displaying as a table and call the function making the plot
BDSVis.processAPIdata = function(data,request,vm) {
	//This function converts the data from API, replacing coded variables with their displayable names, and makes a 2D table for display of the textual data
	//"vm" is the reference to ViewModel

	var cvar = request.cvar;
	var xvar = request.xvar;
	var yvar = request[vm.model.yvars];
	var YvarsAsLegend = (cvar === vm.model.yvars);

	var data2show = {}; // The nested object, used as an intermediate step to convert data into 2D array
	
	for (var key in request) { //Filter the obtained data, so that only what is requested remains (API does not filter all the variables)
    	if ((key!==vm.model.yvars) && //(key!==xvar) && 
    		(key!=="cvar") &&
    		(key!=="xvar") && (!vm.model.IsGroup(key)) && !(vm.timelapse() && (key===vm.model.timevar))) {
    		data = data.filter(function(d) { return request[key].map(function(d) {return d.toString();}).indexOf(d[key])!=-1;});
    	}
	};
	
	if (data.length<1) {
		vm.PlotView.Init();
		vm.PlotView.DisplayNoData();
		return;	
	};

	var data1 = []; // The reshuffled (melted) data, with yvars in the same column. Like R function "melt" from the "reshape" package

	for (var i in data) {

		data[i][xvar] = vm.model.NameLookUp(data[i][xvar],xvar); //Replace code strings with actual category names for x-variable
		
		data[i][cvar] = vm.model.NameLookUp(data[i][cvar],cvar); //Replace code strings with actual category names for c-variable

		if (YvarsAsLegend) 
			for (var iyvar in yvar) { 
			//If comparing by yvar, melt the data by yvars: 
			//combine different yvar in single column and create a column indicating which yvar it is (c-var)
				var rec = {};
				for (var key in data[i])
					if (key!==yvar[iyvar]) rec[key] = data[i][key];
				rec.value = data[i][yvar[iyvar]]; //Column named "value" will contain values of all the yvars
				rec[vm.model.yvars] = vm.model.NameLookUp(yvar[iyvar],vm.model.yvars); //Column for c-variable indicates the yvar
				data1.push(rec);
			};

		//Convert data to 2D table, so that it can be displayed
		if (data2show[data[i][xvar]] === undefined) //Create nested objects
			data2show[data[i][xvar]] = {};
		if (!YvarsAsLegend)
			data2show[data[i][xvar]][data[i][cvar]] = data[i][yvar]; //Fill nested objects
		else 
			for (var iyvar in request[cvar])
				data2show[data[i][xvar]][vm.model.NameLookUp(request[cvar][iyvar],vm.model.yvars)] = data[i][request[cvar][iyvar]];
	};

	//Convert the nested object with data to display into nested array (including field names)
	var cvarnames = [vm.model.NameLookUp(xvar,"var")]; //Create row with names of c-variable
	var cvarnames1={};	
	for (var xvarkey in data2show) {
		for (var cvarkey in data2show[xvarkey]) {
			if (cvarnames1[cvarkey]===undefined) {
				cvarnames.push(cvarkey);
				cvarnames1[cvarkey]=true;
			};
		};
	};

	vm.data([cvarnames]); //First row of the table will contain names of c-variable
	for (var xvarkey in data2show) {
		var xvararr = [xvarkey]; //Create the column with names of x-variable
		for (var cvarkey in data2show[xvarkey])
			xvararr.push(data2show[xvarkey][cvarkey]) //Fill the data into 2D table
		vm.data.push(xvararr);
	};

	if (vm.geomap())
		BDSVis.makeMap(data,request,vm);
	else BDSVis.makePlot((!YvarsAsLegend)?data:data1,request,vm);
};