var BDSVis = BDSVis || {};

//This function makes d3js plot, either a bar chart or scatterplot
BDSVis.makePlot = function (data,request,vm) {
	//"vm" is the reference to ViewModel

	var pv=vm.PlotView;

	pv.Init(data,request,vm);
	
	var svg=pv.svg;
	var width=pv.width;
	var height=pv.height;

	var cvar = request.cvar;
	var cvarr=vm.model.LookUpVar(cvar);
	var xvar = request.xvar;
	var xvarr=vm.model.LookUpVar(xvar);

	var YvarsAsLegend = (cvar === vm.model.yvars);
	
	//var request=vm.APIrequest();

	//If yvars is also a c-variable, then we got melted data from updateBDSdata function, with all yvars contained in the "value" column
	var yvar=YvarsAsLegend?"value":request[vm.model.yvars];


	//Setting D3 scales
	var xScale, yScale, yScale1, ymin, y0;
	if (vm.model.IsContinuous(xvarr))
		xScale = d3.scale.linear()
			.domain([vm.model[xvar][0],vm.model[xvar][vm.model[xvar].length-1]])
			.range([0, width]);
	else
		xScale = d3.scale.ordinal()
			//.domain(vm.model.GetDomain(xvar)) //For showing all the categories (even empty ones) on x-axis in any case
			.domain(data.map(function(d) {return d[xvar]})) //For only showing categories for which data exists
			.rangeRoundBands([0, width], .1);

	if (vm.logscale()) {
		ymin = d3.min(data.filter(function(d) {return d[yvar]>0}), function(d) { return +d[yvar]; })/2.; // The bottom of the graph, a half of the smallest positive value
		y0=ymin; //Where the 0 horizontal line is located, for the base of the bar. Since 0 can not be on a log plot, it's ymin
		yScale1 = d3.scale.log().domain([ymin, d3.max(data, function(d) { return +d[yvar]; })])
		.range([height,0]);
		 //0 and negative numbers are -infinity on log scale, replace them with "almost -infinity", so that they can be plotted, but outside of the graph limits.
		//data=data.map(function(d) {if (d[yvar]<=0) d[yvar]=1e-15; return d;});
		yScale = function(y) {
			if (y<=0) return yScale1(1e-15); else return yScale1(y);
		}
	} else {
		y0=0; //Where the 0 horizontal line is located, for the base of the bar
		ymin = Math.min(0,d3.min(data, function(d) { return +d[yvar]; })); //Bars should be plotted at least from 0.
		yScale = d3.scale.linear().domain([ymin, d3.max(data, function(d) { return +d[yvar]; })])
		.range([height,0]);
	}

			
	//Set up colorscale
	var cScale=d3.scale.ordinal().domain(data.map(function(d) {return d[cvar]}));
	var cvarlist = cScale.domain();

	if (vm.model.IsContinuous(cvarr))
		cScale=d3.scale.linear().domain([+cvarlist[0],+cvarlist[cvarlist.length-1]]).range(["#265DAB","#CB2027"]);

	var yearcolorscale = d3.scale.linear().domain([+cvarlist[0],+cvarlist[cvarlist.length-1]]).range(["#265DAB","#CB2027"]);
	//var normscale=d3.scale.linear().domain([0,cvarlist.length/2,cvarlist.length-1]).range(["#265DAB","#dddddd","#CB2027"]);
	var normscale=d3.scale.linear().domain([0,cvarlist.length-1]).range(["#265DAB","#dddddd"]);
			
	var colors = function(d) {
		if (vm.model.IsContinuous(xvarr)) return colorbrewer.Dark2[8][cvarlist.indexOf(d) % 8];//colarr[i % colarr.length];
		else if (vm.model.IsContinuous(cvarr)) return cScale(d);
		else if (cvarr.customcolor) return cvarr.colorscale[d];
		else return colorbrewer.BrBG[11][10 - (cvarlist.indexOf(d) % 11)];//colarr[i % colarr.length];//normscale(i);
	};

	var Tooltiptext = function(d) {
		var ttt=YvarsAsLegend?d[vm.model.yvars]:vm.model.NameLookUp(yvar,vm.model.yvars);
		ttt+=": "+d3.format(",")(d[yvar])+"\n"+xvarr.name+": "+d[xvar];
		if (!YvarsAsLegend)
			ttt+="\n"+cvarr.name+": "+d[cvar];
		return ttt;
	};

	//Adding axes
	var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

	if (vm.model.IsContinuous(xvarr)) xAxis.tickFormat(d3.format("d"));

	var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

	var yAxis = d3.svg.axis().scale(vm.logscale()?yScale1:yScale).orient("left");

	if (vm.logscale()) yAxis.ticks(5,d3.format(",d"));

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + yScale(y0) + ")")
		.call(xAxis0);

	var xAxisLabels=svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll(".tick text");

	if (vm.model.IsCategorical(xvarr))
      	xAxisLabels.call(BDSVis.util.wrap,xScale.rangeBand());

	svg.append("g")
	.attr("class", "y axis")
	.call(yAxis); 

	function refresh() {
	  svg.select(".x .axis").call(xAxis);
	  svg.select(".y .axis").call(yAxis);
	};

	//svg.call(d3.behavior.zoom().x(xScale).y(yScale).on("zoom", refresh))

	if (vm.model.IsContinuous(xvarr)) {
		//Make a scatter plot if x-variable is continuous

		// Define the line
		var valueline = d3.svg.line().interpolate("monotone")
    	.x(function(d) { return xScale(d[xvar]); })
    	.y(function(d) { return yScale(d[yvar]); });

    	
    	svg.selectAll("path .plotline")
    		// .data(cvarlist.map(function(d) {
    		// 	return {cvar: d, values: data.filter(function(d1) {return d1[cvar]===d;})}; 
    		// }))
    		.data(d3.nest().key(function(d) {return d[cvar]; }).entries(data))
    		.enter()
    		.append("path").attr("class", "plotline")
    		.attr("stroke", function(d) {return colors(d.key);})
    		.attr("d", function(d){return valueline(d.values);});

        //Add dots
        svg.selectAll("circle .plotdot")
	    	.data(data)
	  		.enter().append("circle").attr("class","plotdot")
	  		.attr("fill", function(d) {return colors(d[cvar]);})
	    	.attr("cx", function(d) { return xScale(d[xvar]); })
	    	.attr("cy", function(d) { return yScale(d[yvar]); })
	    	.append("title").text(function(d){return Tooltiptext(d);});

    	//d3.select("body").append("text").text(JSON.stringify(data));

	} else {
		//Make a bar chart if x-variable is categorical

		
		//Number of bars is number of categories in the legend, and barwidth is determined from that
		var nbars=cvarlist.length;
		var barwidth= xScale.rangeBand()/nbars;

		var bars=
		svg.selectAll("rect")
			.data(data);

		bars.enter().append("rect")
		   	.attr("fill",  function(d) {return colors(d[cvar]);})
		   	.attr("class", "plotbar")
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*cvarlist.indexOf(d[cvar])})
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[yvar]))})
		   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[yvar]))})
		   	.on("click",function(d) {
		   		//debugger;
				var ind = vm.IncludedXvarValues[xvar].indexOf(vm.model.CodeLookUp(d[xvar],xvar));
				vm.IncludedXvarValues[xvar].splice(ind,1);
				vm.getBDSdata();
			})
		   	.append("title").text(function(d){return Tooltiptext(d);});

		pv.lowerrightcornertext.text("Click on bar to remove category");
	};

	

	//Making Legend
	var RemoveItem =  function(d) { //Function to remove an item from the legend
			var so=vm.SelectedOpts[cvar]();
			var ind=so.indexOf(vm.model.CodeLookUp(d,cvar));
			so.splice(ind,1);
			vm.SelectedOpts[cvar](so);
			d3.event.stopPropagation();
		};

	var legendsvg=pv.legendsvg;

	var symbolsize=15;//Math.max(Math.min(barwidth,20),15);

	legendsvg.attr("height",(symbolsize+5)*cvarlist.length);

	legendsvg.append("text").attr("class","legtitle").text(cvarr.name+(((cvarlist.length>1) && !vm.timelapse())?"  (click to remove) ":"")+": ");

	var legendlabels=legendsvg.selectAll("text .leglabel")
		.data(cvarlist)
		.enter()
		.append("text")
		.attr("class","leglabel")
		.attr("fill","black")
		.attr("x",(symbolsize+5))
		//.attr("y",function(d,i) {return 8+(symbolsize+5)*i;})
		//.attr("y",function(d,i) {return 1.5*i+"em";})
		.attr("dy",1+"em")
		.text(function(d) {return d;});
	if ((cvarlist.length>1) && !vm.timelapse())
		legendlabels.on("click",function(d) { RemoveItem(d); });
		

	//Split long labels into multiple lines
	legendlabels.call(BDSVis.util.wrap,pv.legendwidth - (symbolsize+5));
	legendlabels.selectAll("tspan").attr("x",(symbolsize+5));
	var numlines=legendsvg.selectAll(".leglabel").selectAll("tspan").map(function(d) {return d.length;}); //Number of lines in each label
	tspany=[]; //"y" attributes for tspans
	for (var i in numlines) {
		for (var j=0; j<numlines[i]; j++)
			tspany.push((i>0)?(numlines[i-1]+i*.75):0);
		if (i>0)
			numlines[i]+=numlines[i-1];
	};

	legendsvg.selectAll("tspan")
		.data(tspany)
		.attr("y",function(d) {return d+.5+'em';});

	var legendrect = legendsvg.selectAll("rect")
		.data(cvarlist)
		.enter()
		.append("rect")
		.attr("fill",  function(d) {return colors(d);})
		.attr("width",symbolsize).attr("height",symbolsize)
		.attr("y",function(d,i) {return 0.6+((i>0)?(numlines[i-1]+i*.75):0)+"em";});

	if ((cvarlist.length>1) && !vm.timelapse())
		legendrect.on("click",function(d) { RemoveItem(d); });

	var legendheight=d3.select(".legbox").node().getBBox().height
	d3.select(".legbox").attr("transform","translate("+pv.legendx+","+Math.max(20,.5*(height+pv.margin.top+pv.margin.bottom+pv.titleheight-legendheight))+")")

	//Set the title of the plot
	var ptitle=(YvarsAsLegend && request[vm.model.yvars].length>1)?("Various "+vm.model.yvars+"s"):(vm.model.NameLookUp(request[vm.model.yvars],vm.model.yvars)); //If many yvars say "various", otherwise the yvar name
	
	

	//Continue forming title
	for (var key in data[0]) {
		//X-var should not be in the title, yvar is taken care of. Also check that the name exists in model.variables (e.g. yvar names don't)
		if ((key!==xvar) && (key!==yvar) && (key!==vm.model.yvars) && !((key===vm.model.timevar) && (vm.timelapse())) && (vm.model.VarExists(key))) {
			if (key!==cvar) ptitle+=vm.model.PrintTitle(data[0][key],key);
			else if (cvarlist.length === 1) ptitle+=vm.model.PrintTitle(vm.model.CodeLookUp(data[0][key],key),key);
			else if (key!==vm.model.yvars) ptitle+=" by " + vm.model.NameLookUp(key,"var");
		} 		
	};
	
	pv.SetPlotTitle(ptitle);

	//Y-axis label
	if ((yvar!=="value") && (vm.model.NameLookUp(yvar,vm.model.yvars).indexOf("rate")!==-1))
		pv.yaxislabel.text("% change"); else pv.yaxislabel.text(" ");

	//X-axis label
	pv.SetXaxisLabel(xvarr.name,d3.max(xAxisLabels[0].map(function(d) {return d.getBBox().y+d.getBBox().height;})));

	pv.AdjustUIElements();
	
	// Timelapse animation
	function updateyear(yr) {

		curyearmessage.transition().duration(vm.timelapsespeed()).text(yr); //Display year

		//pv.maintitle.text("");

		var dataset=data.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year

		vm.TableView.makeDataTable(dataset,cvar,xvar,vm);
		
		//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
		//empty outside this function. The following loop fills in / updates to actual data values from current year
		for (var i in data4bars) data4bars[i][yvar]=0; //Set every bar to 0 so that missing bars disappear
			
		for (var i in dataset) { //Set the values of existing bars
			data4bars[xScale.domain().indexOf(dataset[i][xvar])*cvarlist.length
					+cvarlist.indexOf(dataset[i][cvar])][yvar]=+dataset[i][yvar];
		};
		
  		var bars=svg.selectAll("rect").data(data4bars);

  		// UPDATE
		  // Update old elements as needed.
		  
		bars
		   	.attr("fill",  function(d) {return colors(d[cvar])})
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*d.icvar;})
		   	.transition().duration(vm.timelapsespeed())
		   	.attr("y",function(d) { return yScale(Math.max(0,+d[yvar]));})
		   	.attr("height",function(d) {return Math.abs(yScale(y0)-yScale(+d[yvar]));});

	};

	//Run timelapse animation
	if (vm.timelapse()) {
		//These loops are only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
		
		var data4bars=[]
		for (var i in xScale.domain())
			for (var j in cvarlist)
				{
					var datum4bar={}
					datum4bar[xvar]=xScale.domain()[i];
					datum4bar[yvar]=0;
					datum4bar[cvar]=cvarlist[j];
					datum4bar.icvar=j;
					data4bars.push(datum4bar);
				};

		svg.selectAll("rect").remove();
		svg.selectAll("rect").data(data4bars).enter().append("rect").attr("class", "plotbar").attr("width", barwidth);
		
		var timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });
		var step=vm.model.LookUpVar(vm.model.timevar).range[2];
		var iy=Math.max(timerange[0], vm.timelapsefrom());
		var curyearmessage=svg.append("text").attr("x",width/2).attr("y",height/2).attr("font-size",100).attr("fill-opacity",.3);
		var intervalfunction = function() {
  			updateyear(iy);
  			if (iy<Math.min(timerange[1],vm.timelapseto())) iy+=step; else iy=Math.max(timerange[0], vm.timelapsefrom());
  			vm.TimeLapseCurrYear=iy;//vm.model[vm.model.timevar][iy];
			clearInterval(vm.tlint);
			vm.tlint=setInterval(intervalfunction, vm.timelapsespeed());
		}
		vm.tlint=setInterval(intervalfunction, vm.timelapsespeed());
	};

	//BDSVis.util.preparesavesvg();
};