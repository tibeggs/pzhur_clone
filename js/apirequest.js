var BDSVisgetBDSdata = function (self) {
	//This function puts together the request to the BDS API, does minor data processing (converting into object) and sends it further. 
	//"self" is the reference to ViewModel

	//The list of variables to request from API. Based on this, the request URL is formed and then this list is used when plotting.
	var APIrequest = function  () {
		
		//Calculate whether to request single state or multiple, and remove the 00 code for the US in selector
		var StateRequested;
		var multiple=self.SelectedStates().length>1; //Whether multiple states are selected
		var firstUS=self.SelectedStates()[0]==="00"; //Whether "United States" is selected

		if ((multiple) && (firstUS)) StateRequested=self.SelectedStates().slice(1); //Remove "United States" if many states are selected
		//Otherwise return all selected states or one, depending on whether state is the c-variable
		else StateRequested=(self.StateAsLegend())?self.SelectedStates():[self.SelectedStates()[0]]; 

		return {
			//If by-state request, then only send "Economy Wide", otherwise send all selected sectors or a single sector depending on whether sector is the c-variable(legend). If in map regime (StateAsArgument) send only one measure
			sic1 : self.StateAsLegend()?([0]):(self.SectorAsLegend()?self.SelectedSectors():[self.SelectedSectors()[0]]),
			//See state calculation above for StateRequested
			state : StateRequested,
			//Send all selected measures or a single one depending on whether measure is the c-variable and whether it's a geo map regime.
			measure : (self.MeasureAsLegend() && !self.StateAsArgument())?self.SelectedMeasures():[self.SelectedMeasures()[0]],
			fchar : self.fchar(),
			//Send all selected years or a single one depending on whether year is the c-variable.
			year2 : self.YearAsLegend()?self.SelectedYears():[self.SelectedYears()[0]],
			//"fchar" is actually one of 3: fage4, fsize, ifsize. So that should be sent instead of "fchar"
			xvar : (self.xvar()==="fchar")?(self.fchar()):(self.xvar()),
			cvar : (self.cvar()==="fchar")?(self.fchar()):(self.cvar()),
			//The following 3 lines are just for the case when Firm Characterstic is c-variable.
			fage4 : self.model.GetDomain("fage4"),
			fsize : self.model.GetDomain("fsize"),
			ifsize : self.model.GetDomain("ifsize"),
		}
	};
	var request=APIrequest();

    var url="http://api.census.gov/data/bds/firms";

	var geography=(self.us()?("us:*"):("state:"+request.state)); 
	if ((request.state.length===1) && (request.state[0]==="00")) geography="us:*"; //If only "United States" is selected then use us:*
	if (self.StateAsArgument()) geography="state:*"; //In map regime use state:*

	//Whether to request all years or a particular year
	var reqtime=((self.timelapse() || self.YearAsArgument())?("&time=from+1977+to+2013"):("&year2="+request.year2));

	//Put everything together
    var geturl=url+"?get="+request.xvar+","+request.measure+(self.FirmCharAsLegend()?(","+request.cvar):"")+ //variables: measures and firm characteristics
    				"&for="+geography+ //states or US
    				reqtime+ //years
    				((self.us() && (!self.SectorAsArgument()) && (!self.StateAsArgument()))?("&sic1="+request.sic1):(""))+ //sectors, if US
    				"&key=93beeef146cec68880fccbd72e455fcd7135228f";

    console.log(geturl);
    
    self.waiting4api(true); //Show "waiting for data" message
    self.PlotView.Init();
    d3.json(geturl,function (data) {
    	if (!(data===null)) { //Convert data into array of objects with the same keys
	    	var jsoned=[];
	    	for (var i in data) {
	    		var rec={};
	    		if (i>0) {
	    			for (iname in data[0]) { //Find keys, which are contained in the first line of the array returned by API
	    				var key=(data[0][iname]==="us")?("state"):data[0][iname]; //Substitute "us" field name to "state"
	    				rec[key]=data[i][iname]; //Fill the object
	    			};
	    			jsoned.push(rec);
	    		};
	    	};
    		self.updateBDSdata(jsoned,request); //Continue to data processing and plotting
    	} else console.log("Server sent empty response to " + geturl);	
    	self.waiting4api(false); //Hide "waiting for data" message
    });
};


//Process data obtained from API. Change codes into names, form data2show for displaying as a table and call the function making the plot
var BDSVisupdateBDSdata = function(data,request,self) {
	//This function converts the data from API, replacing coded variables with their displayable names, and makes a 2D table for display of the textual data
	//"self" is the reference to ViewModel

	var data2show={}; // The nested object, used as an intermediate step to convert data into 2D array

	var data1=[]; // The reshuffled (melted) data, with measures in the same column. Like R function "melt" from the "reshape" package

	for (var i in data) {

		data[i][request.xvar]=self.model.NameLookUp(data[i][request.xvar],request.xvar); //Replace code strings with actual category names for x-variable
		
		data[i][request.cvar]=self.model.NameLookUp(data[i][request.cvar],request.cvar); //Replace code strings with actual category names for c-variable

		if (self.MeasureAsLegend()) 
			for (var imeasure in request.measure) { //If comparing by measure, melt the data by measures: combine different measure in single column and create a column indicating which measure it is (c-var)
				var rec={};
				rec.value=data[i][request.measure[imeasure]]; //Column named "value" will contain values of all the measures
				rec[request.xvar]=data[i][request.xvar];		//x-axis value
				rec[request.cvar]=self.model.NameLookUp(request.measure[imeasure],"measure"); //Column for c-variable indicates the measure
				if (self.timelapse()) rec.time=data[i].time;
				data1.push(rec);
			}
		
		//Convert data to 2D table, so that it can be displayed
		if (data2show[data[i][request.xvar]]===undefined) //Create nested objects
			data2show[data[i][request.xvar]]={};
		if (!self.MeasureAsLegend())
			data2show[data[i][request.xvar]][data[i][request.cvar]]=data[i][request.measure]; //Fill nested objects
		else 
			for (var imeasure in request[request.cvar])
				data2show[data[i][request.xvar]][self.model.NameLookUp(request[request.cvar][imeasure],"measure")]=data[i][request[request.cvar][imeasure]];
	};


	//Convert the nested object with data to display into nested array (including field names)
	var cvarnames=[self.model.NameLookUp(request.xvar,"var")]; //Create row with names of c-variable	
	for (var xvarkey in data2show) {
		for (var cvarkey in data2show[xvarkey])
			cvarnames.push(cvarkey);
		break;
	};

	self.data([cvarnames]); //First row of the table will contain names of c-variable
	for (var xvarkey in data2show) {
		var xvararr=[xvarkey]; //Create the column with names of x-variable
		for (var cvarkey in data2show[xvarkey])
			xvararr.push(data2show[xvarkey][cvarkey]) //Fill the data into 2D table
		self.data.push(xvararr);
	};

	if (self.StateAsArgument())
		self.makeMap(data,request);
	else self.makePlot((!self.MeasureAsLegend())?data:data1,request);
};