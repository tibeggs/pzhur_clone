var BDSVis = BDSVis || {};

BDSVis.getAPIdata = function (vm) {
	//This function puts together the request to the BDS API, does minor data processing (converting into object) and sends it further. 
	//"vm" is the reference to ViewModel

	//The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.
	var APIrequest = function  () {
		
		//Calculate whether to request single state or multiple, and remove the 00 code for the US in selector
		var StateRequested;
		var multiple = vm.SelectedOpts['state']().length>1; //Whether multiple states are selected
		var firstUS = vm.SelectedOpts['state']()[0]==="00"; //Whether "United States" is selected

		if ((multiple) && (firstUS)) StateRequested = vm.SelectedOpts['state']().slice(1); //Remove "United States" if many states are selected
		//Otherwise return all selected states or one, depending on whether state is the c-variable
		else StateRequested = (vm.StateAsLegend())?vm.SelectedOpts['state']():[vm.SelectedOpts['state']()[0]]; 

		return {
			//If by-state request, then only send "Economy Wide", otherwise send all selected sectors or a single sector depending on whether sector is the c-variable(legend). If in map regime (StateAsArgument) send only one measure
			sic1 : vm.StateAsLegend()?([0]):(vm.SectorAsLegend()?vm.SelectedOpts['sic1']():[vm.SelectedOpts['sic1']()[0]]),
			//See state calculation above for StateRequested
			state : StateRequested,
			//Send all selected measures or a single one depending on whether measure is the c-variable and whether it's a geo map regime.
			measure : (vm.MeasureAsLegend() && !vm.StateAsArgument())?vm.SelectedOpts['measure']():[vm.SelectedOpts['measure']()[0]],
			fchar : vm.SelectedOpts['fchar'](),
			//Send all selected years or a single one depending on whether year is the c-variable.
			year2 : vm.YearAsLegend()?vm.SelectedOpts['year2']():[vm.SelectedOpts['year2']()[0]],
			//"fchar" is actually one of 3: fage4, fsize, ifsize. So that should be sent instead of "fchar"
			xvar : (vm.xvar()==="fchar")?(vm.SelectedOpts['fchar']()):(vm.xvar()),
			cvar : (vm.cvar()==="fchar")?(vm.SelectedOpts['fchar']()):(vm.cvar()),
			//The following 3 lines are just for the case when Firm Characterstic is c-variable.
			fage4 : vm.model.GetDomain("fage4"),
			fsize : vm.model.GetDomain("fsize"),
			ifsize : vm.model.GetDomain("ifsize"),
		}
	};
	var request = APIrequest();

    var url = "http://api.census.gov/data/bds/firms";

	var geography = (vm.us()?("us:*"):("state:"+request.state)); 
	if ((request.state.length===1) && (request.state[0]==="00")) geography = "us:*"; //If only "United States" is selected then use us:*
	if (vm.StateAsArgument()) geography = "state:*"; //In map regime use state:*

	//Whether to request all years or a particular year
	var reqtime = ((vm.timelapse() || vm.YearAsArgument())?("&time=from+1977+to+2013"):("&year2="+request.year2));

	//Put everything together
    var geturl = url+"?get="+request.xvar+","+request.measure+(vm.FirmCharAsLegend()?(","+request.cvar):"")+ //variables: measures and firm characteristics
    				"&for="+geography+ //states or US
    				reqtime+ //years
    				((vm.us() && (!vm.SectorAsArgument()) && (!vm.StateAsArgument()))?("&sic1="+request.sic1):(""))+ //sectors, if US
    				"&key=93beeef146cec68880fccbd72e455fcd7135228f";

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
	    				var key = (data[0][iname]==="us")?("state"):data[0][iname]; //Substitute "us" field name to "state"
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
			for (var imeasure in measure) { //If comparing by measure, melt the data by measures: combine different measure in single column and create a column indicating which measure it is (c-var)
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