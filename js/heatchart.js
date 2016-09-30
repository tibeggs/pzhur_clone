var BDSVis = BDSVis || {};

BDSVis.makeHeatChart = function (data,request,vm,dataunfiltered) {
	var pv=vm.PlotView;
	pv.Refresh(data,request,vm);
	svg=pv.svg;
	width=pv.width;
	height=pv.height;
	
	var cvar = request.cvar;
	var cvarr=vm.model.LookUpVar(cvar);
	var xvar = request.xvar;
	var xvarr=vm.model.LookUpVar(xvar);

	var YvarsAsLegend = (cvar === vm.model.yvars);
	//If yvars is also a c-variable, then we got melted data from updateBDSdata function, with all yvars contained in the "value" column
	var yvar=YvarsAsLegend?"value":request[vm.model.yvars];


	var Tooltiptext = function(d) {
		var ttt=vm.model.NameLookUp(d[vm.model.yvars],vm.model.yvars);
		ttt+=": "+d3.format(",")(d[yvar])+"\n"+xvarr.name+": "+vm.model.NameLookUp(d[xvar],xvar);
		if (!YvarsAsLegend)
			ttt+="\n"+cvarr.name+": "+vm.model.NameLookUp(d[cvar],cvar);
		return ttt;
	};

	var xScale = d3.scale.ordinal()
			//.domain(vm.model.GetDomain(xvar)) //For showing all the categories (even empty ones) on x-axis in any case
			.domain(data.map(function(d) {return d[xvar]})) //For only showing categories for which data exists
			.rangeRoundBands([0, width], 0);

	var cvarlist = d3.set(data.map(function(d) {return d[cvar]})).values(); //All the values of returned cvars
		
	cvarlist.sort(function(a,b) { //Sorted like in model.js
			var arr=vm.model[cvar].map(function(d) {return d.code});
			return arr.indexOf(a)-arr.indexOf(b);
	});

	var cScale = d3.scale.ordinal()
			//.domain(vm.model.GetDomain(xvar)) //For showing all the categories (even empty ones) on x-axis in any case
			.domain(cvarlist) //For only showing categories for which data exists
			.rangeRoundBands([height, 0], 0);

	var ymin=d3.min(data, function(d) { return +d[yvar]; });
	var ymax=d3.max(data, function(d) { return +d[yvar]; });
	var maxabs=d3.max([Math.abs(ymin),Math.abs(ymax)]);

	//Define which scale to use, for the map and the colorbar. Note that log scale can be replaced by any other here (like sqrt), the colormap will adjust accordingly.
	var scaletype = (vm.logscale)?d3.scale.log():d3.scale.linear();
	//Midpoint of the colorscale
	var ymid= function(ymin,ymax) {
		return scaletype.invert(.5*(scaletype(ymax)+scaletype(ymin)));
	};

	var yScale = scaletype.copy();
	
	var purple="rgb(112,79,161)"; var golden="rgb(194,85,12)"; var teal="rgb(22,136,51)";

	if ((ymin<0) && !vm.logscale) //If there are negative values use blue to red scale with white(ish) for 0 and strength of color corresponding to absolute value
		yScale.domain([-maxabs,0,maxabs]).range(["#CB2027","#eeeeee","#265DAB"]);
	else
		//yScale.domain([ymin,ymax]).range(["#eeeeee","#265DAB"]);
		yScale.domain([ymin,ymid(ymin,ymax),ymax]).range([purple,"#bbbbbb",golden]);
		//yScale.domain([ymin,ymid,ymax]).range(["red","#ccffcc","blue"]);

	var chart=svg.append("g").attr("clip-path", "url(#clip)");
	
	var barwidth=width/xScale.domain().length,
		barheight=height/cScale.domain().length;

	var rScale=(vm.logscale)?d3.scale.log():d3.scale.sqrt();
	rScale.domain([ymin/2.,ymax]).range([0,.5*Math.min(barwidth,barheight)]);

	// 	var bars=
	// 	chart.selectAll("rect.plotbar")
	// 		.data(data.filter(function(d) {return (xScale.domain().indexOf(d[xvar])>-1) && (cScale.domain().indexOf(d[cvar])>-1);}));


	// 	bars.enter().append("rect")
	// 	   	.attr("fill",  function(d) {return yScale(d[yvar]);})
	// 	   	.attr("class", "plotbar")
	// 	   	.attr("width", barwidth)
	// 	   	.attr("height", barheight)
	// 	   	.attr("x",function(d) {return xScale(d[xvar])})
	// 	   	.attr("y",function(d) {return cScale(d[cvar])})
	// 	   	.on("dblclick",function(d) {
	// 	   		if(!vm.zoombyrect) return;
	// 			var ind = vm.IncludedXvarValues[xvar].indexOf(d[xvar]);
	// 			vm.IncludedXvarValues[xvar].splice(ind,1);
	// 			BDSVis.processAPIdata(data,request,vm);
	// 		})
	// 		// .on('mouseover', tip.show)
 //   //    		.on('mouseout', tip.hide)
	// 	   	.append("title").text(Tooltiptext);

	var dots = chart.selectAll("circle.plotdot")
	    	.data(data);

	  		
  	dots.enter().append("circle").attr("class","plotdot")
  		.attr("r",function(d) {return rScale(d[yvar]);})
  		.attr("cy", function(d) {return cScale(d[cvar])+.5*barheight;})
    	.attr("cx", function(d) { return xScale(d[xvar])+.5*barwidth;})
    	.attr("fill", function(d) { return yScale(d[yvar]); })
    	.on("dblclick",function(d) {
			var ind = vm.IncludedXvarValues[xvar].indexOf(d[xvar]);
			vm.IncludedXvarValues[xvar].splice(ind,1);
			BDSVis.processAPIdata(data,request,vm);
		})
    	.append("title").text(Tooltiptext);


	var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d){ return vm.model.NameLookUp(d,xvar)});
	var xAxisLabels=svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll(".tick text");

	// if (vm.model.IsCategorical(xvarr))
      	xAxisLabels.call(pv.wrap,xScale.rangeBand());

	var yAxis = d3.svg.axis().scale(cScale).orient("left").tickFormat(function(d){ return vm.model.NameLookUp(d,cvar)});
	var yAxisLabels=svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.selectAll(".tick text")
		.attr("transform","translate(-7,0)");

		yAxisLabels.call(pv.wrap,pv.margin.left-20);

	//Set the title of the plot
	var ptitle=(YvarsAsLegend && request[vm.model.yvars].length>1)?("Various "+vm.model.yvars+"s"):(vm.model.NameLookUp(request[vm.model.yvars],vm.model.yvars)); //If many yvars say "various", otherwise the yvar name
	
	//Continue forming title
	for (var key in data[0]) {
		//X-var should not be in the title, yvar is taken care of. Also check that the name exists in model.variables (e.g. yvar names don't)
		if ((key!==xvar) && (key!==yvar) && (key!==vm.model.yvars) && !((key===vm.model.timevar) && (vm.timelapse)) && (vm.model.VarExists(key))) {
			if (key!==cvar) ptitle+=vm.model.PrintTitle(data[0][key],key);
			else if (cvarlist.length === 1) ptitle+=vm.model.PrintTitle(data[0][key],key);
			else if (key!==vm.model.yvars) ptitle+=" by " + vm.model.NameLookUp(key,"var");
		} 		
	};
	
	pv.SetPlotTitle(ptitle);

	//X-axis label
	pv.SetXaxisLabel(xvarr.name,d3.max(xAxisLabels[0].map(function(d) {return d.getBBox().y+d.getBBox().height;})));

	var legendsvg=pv.legendsvg;
	//legendsvg.call(d3.behavior.zoom().on("zoom",colorscalerefresh));

	var colorbar={height:200, width:20, nlevels:5, nlabels:5, fontsize:15, levels:[]};

	var hScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.height]); //Scale for height of the rectangles in the colorbar
	var y2levelsScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.nlevels]); //Scale for levels of the colorbar

	for (var i=0; i<colorbar.nlevels+1; i++) colorbar.levels.push(y2levelsScale.invert(i));

	var legendtitle = legendsvg.append("text").attr("class","legtitle").text(vm.model.NameLookUp(yvar,vm.model.yvars)).attr("x",-20).attr("y",-20).attr("dy","1em");
	legendtitle.call(pv.wrap,pv.legendwidth);
	//legendtitle.selectAll("tspan").attr("x",function(d) { return (pv.legendwidth-this.getComputedTextLength())/2.; })
	var titleheight = legendtitle.node().getBBox().height;
	legendsvg=legendsvg.append("g").attr("transform","translate(20,"+titleheight+")");

	var legNumFormat= function(d) {
		if (Math.abs(d)>1)
			return d3.format(".3s")(d);
		else if (Math.abs(d)>5e-2)
			return d3.format(".2f")(d);
		else return d3.format(".f")(d);
	};
	
	//Make the colorbar
	legendsvg.selectAll("circle")
		.data(colorbar.levels)
		.enter()
		.append("circle")
		.attr("fill",  yScale)
		//.attr("width",20)
		.attr("cy",hScale)
		.attr("r", rScale)
		.append("title").text(legNumFormat);

	//Make the labels of the colorbar
	legendsvg.selectAll("text.leglabel")
		.data(colorbar.levels.filter(function(d,i) {return !(i % ~~(colorbar.nlevels/colorbar.nlabels));})) //Choose rectangles to put labels next to
		.enter()
		.append("text")
		.attr("fill", "black")
		.attr("class","leglabel")
		.attr("font-size", colorbar.fontsize+"px")
		.attr("x",colorbar.width+23)
		.attr("y",function(d) {return .4*colorbar.fontsize+hScale(d);})
		.text(legNumFormat);

	//legendsvg.append("text").attr("y",1.2*colorbar.fontsize+colorbar.height).style("font-size","10px").text("Zoom over the colorbar to change color scale");


	pv.SetYaxisLabel(vm.model.NameLookUp(cvar,'var'));

	// Timelapse animation
	function updateyear(yr) {

		curyearmessage.transition().duration(vm.timelapsespeed).text(yr); //Display year

		//pv.maintitle.text("");

		var dataset=data.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year

		vm.TableView.makeDataTable(dataset,cvar,xvar,vm);
		
		//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
		//empty outside this function. The following loop fills in / updates to actual data values from current year

		d3.merge(data4dots).forEach(function(d) {d[yvar]=0;}); //Set every bar to 0 so that missing bars disappear

		dataset.forEach( function(d) { //Set the values of existing bars
			data4dots [ xScale.domain().indexOf(d[xvar]) ] [ cvarlist.indexOf(d[cvar]) ][yvar]=+d[yvar];
		});
		
  // 		var bars=chart.selectAll("rect.plotbar").data(d3.merge(data4bars));
 		 var dots = chart.selectAll("circle.plotdot")
	    	.data(d3.merge(data4dots))
	    // 	.enter()
	    // 	.append("circle")
	    // 	.attr("class","plotdot")
	  		// //.attr("r",function(d) {return rScale(d[yvar]);})
	  	// .attr("cy", function(d) {return cScale(d[cvar])+.5*barheight;})
	    // 	.attr("cx", function(d) { return xScale(d[xvar])+.5*barwidth;})
	    // 	//.attr("fill", function(d) { return yScale(d[yvar]); })
	    // 	.append("title").text(Tooltiptext);

  		// UPDATE
		  // Update old elements as needed.
		dots
			.transition().duration(vm.timelapsespeed)
	  		.attr("r",function(d) {return rScale(d[yvar]);})
	    	.attr("fill", function(d) { return yScale(d[yvar]); })

	   // dots.append("title").text(Tooltiptext);
	   // debugger;
	   
	};

	//Run timelapse animation
	if (vm.timelapse) {
		
		//This array is only needed for smooth transition in animations. There have to be dots of 0 height for missing data.
		//Create array with entry for all values of xvar and all values of cvar.
		var data4dots = xScale.domain().map(function(xv) {return cvarlist.map(function(cv) {return (obj={}, obj[xvar]=xv, obj[cvar]=cv,obj);});});


		//Create bars for every xvar/cvar combination
		chart.selectAll("circle.plotdot").remove();
		chart.selectAll("circle.plotdot").data(d3.merge(data4dots)).enter()
			.append("circle").attr("class", "plotdot")
			.attr("r",0)
			.attr("cy", function(d) {return cScale(d[cvar])+.5*barheight;})
	    	.attr("cx", function(d) { return xScale(d[xvar])+.5*barwidth;});
		
		var timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });
		var step=vm.model.LookUpVar(vm.model.timevar).range[2];
		var iy=Math.max(timerange[0], vm.timelapsefrom);
		var curyearmessage=svg.append("text").attr("x",width/2).attr("y",height/2).attr("font-size",100).attr("fill-opacity",.3);
		var intervalfunction = function() {
  			updateyear(iy);
  			if (iy<Math.min(timerange[1],vm.timelapseto)) iy+=step; else iy=Math.max(timerange[0], vm.timelapsefrom);
  			vm.TimeLapseCurrYear=iy;//vm.model[vm.model.timevar][iy];
			clearInterval(vm.tlint);
			vm.tlint=setInterval(intervalfunction, vm.timelapsespeed);
		}
		vm.tlint=setInterval(intervalfunction, vm.timelapsespeed);
	};
};