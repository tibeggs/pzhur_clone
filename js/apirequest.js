var BDSVis = BDSVis || {};

BDSVis.getAPIdata = function (vm) {
	//This function puts together the request to the BDS API, does minor data processing (converting into object) and sends it further. 
	//"vm" is the reference to ViewModel
	
	var request={}; //The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.

	request.xvar = vm.ActualVarCode(vm.xvar());
	request.cvar = vm.ActualVarCode(vm.cvar());

	vm.model.variables.forEach(function(varr1) { //Add variables with requested values to the request

		var varr = vm.model.IsGroup(varr1)?vm.model.LookUpVar(vm.SelectedOpts[varr1.code]()[0]):varr1; //If variable is a group variable, put variable that is selected in it instead

		if (varr.code===request.xvar) request[varr.code]=vm.IncludedXvarValues[varr.code]; //For x-var take the included values
		else if (varr.code!==request.cvar) request[varr.code]=[vm.SelectedOpts[varr.code]()[0]]; //If it's not c- or x-var only take first selected option
		else request[varr.code] = vm.geomap()?[vm.SelectedOpts[varr.code]()[0]]:vm.SelectedOpts[varr.code](); //For the c-var take all selected if not in geo map regime
	
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
    d3.json(geturl,function (data) { //Send request to the server and get response
    	if (data===null) console.log("Server sent empty response to " + geturl);
    	BDSVis.processAPIdata(data,request,vm); //Continue to data processing and plotting
    	vm.waiting4api(false); //Hide "waiting for data" message
    });
};


//Process data obtained from API. Change codes into names, form data2show for displaying as a table and call the function making the plot
BDSVis.processAPIdata = function(data,request,vm) {
	//This function converts the data from API, replacing coded variables with their displayable names, and makes a 2D table for display of the textual data
	//"vm" is the reference to ViewModel

	//Set shortcuts
	var cvar = request.cvar;
	var xvar = request.xvar;
	var yvar = request[vm.model.yvars];
	//var YvarsAsLegend = (cvar === vm.model.yvars);

	if (data.length<1) { //Display No Data message is no data is received
		vm.PlotView.Init();
		vm.PlotView.DisplayNoData();
		return;	
	};

	//Convert data into array of objects with the keys defined by the first row
	var keys=data[0]; //First row contains keys
	data=data.slice(1).map(function(d) {
		var rec = {};
		for (iname in keys) { //Find keys, which are contained in the first line of the array returned by API
			var key = (keys[iname]==="us")?("state"):(keys[iname]); //Substitute "us" field name to "state"
			key = (key==="time")?vm.model.timevar:key;
			rec[key] = d[iname]; //Fill the object
		};
		return rec;
	});

 	//Filter the obtained data, so that only what is requested remains (API does not filter all the variables)
	for (var key in request) {
    	if ((key!==vm.model.yvars) && //(key!==xvar) && 
    		(key!=="cvar") &&
    		(key!=="xvar") && (!vm.model.IsGroup(key)) && !(vm.timelapse() && (key===vm.model.timevar))) {
    		data = data.filter(function(d) { return request[key].map(function(d) {return d.toString();}).indexOf(d[key])!=-1;});
    	}
	};
	
	if (data.length<1) { //Display No Data message is all received data is filtered
		vm.PlotView.Init();
		vm.PlotView.DisplayNoData();
		return;	
	};

	data.forEach(function(d){
		d[xvar] = vm.model.NameLookUp(d[xvar],xvar); //Replace code strings with actual category names for x-variable
		d[cvar] = vm.model.NameLookUp(d[cvar],cvar); //Replace code strings with actual category names for c-variable
	});

	//Melt the data, with yvars in the same column. Like R function "melt" from the "reshape" package. 
	//(This is needed when several yvars are used, i.e. when yvar is also a cvar)
	data = d3.merge(data.map(function(d) {
		//Split each record into array of records where value equals to one of yvars, and vm.model.yvars(e.g "measure") is equal to name of that yvar
			return yvar.map(function(yv){ 
				var rec=JSON.parse(JSON.stringify(d));
                rec[vm.model.yvars]=vm.model.NameLookUp(yv,vm.model.yvars); //Set vm.model.yvars (e.g. "measure") field to actual name of yv
                rec.value=d[yv]; //Set value field to the value of variable yv
                return rec;
			}) 
		})); //d3.merge flattens the array


	var cvarvalues = d3.set(data.map(function(d) {return d[cvar]})).values(); //All the values of returned cvars
	var xvarvalues = d3.set(data.map(function(d) {return d[xvar]})).values(); //All the values of returned xvars

	//Data as table output via KnockOut
	vm.data( //Set the KnockOut observable array containing the data for displaying as a table ("Show Data" button)
		xvarvalues
			.map(function(xv){ return data.filter(function(d) {return d[xvar]===xv;});}) //Map a row of yvar values to each xvar value
			.map(function(dxv){
				return d3.merge([ [dxv[0][xvar]], //Add the xvar value as a first element of the row
						cvarvalues.map(function(cv){ //Map a yvar value to each cvar/xvar values pair (or, a column of yvar values to each cvar value)
							return dxv.filter(function(d) {return d[cvar]===cv}).map(function(d) {return d.value});
						})])
			})
	);
	vm.data.unshift(d3.merge([[vm.model.NameLookUp(xvar,"var")],cvarvalues])); //Header line: the xvar values + all the cvar values
	
	// //Data as table output via D3
	// var datashowtable = d3.select("#graphdata");
	// datashowtable.selectAll("*").remove()
	// datashowtable.append("thead")
	// 	.selectAll("th").data(d3.merge([[vm.model.NameLookUp(xvar,"var")],cvarvalues]))
	// 	.enter().append("th").text(function(d){return d});
	// datashowtable.append("tbody")
	// 	.selectAll("tr").data(xvarvalues.map(function(xv){
	// 		return data.filter(function(d) {return d[xvar]===xv;} //Map a row of yvar values to each xvar value
	// 	)}))
	// 	.enter().append("tr")
	// 		.selectAll("td")
	// 		.data(function(dxv) {
	// 			return d3.merge([ [dxv[0][xvar]], //Add the xvar value as a first element of the row
	// 							cvarvalues.map(function(cv){ //Map a yvar value to each cvar/xvar values pair (or, a column of yvar values to each cvar value)
	// 								return dxv.filter(function(d) {return d[cvar]===cv}).map(function(d) {return d.value});
	// 							})
	// 		])}).enter().append("td")
	// 		.text(function(d) {return d});

	

	if (vm.geomap())
		BDSVis.makeMap(data,request,vm);
	else BDSVis.makePlot(data,request,vm);
};