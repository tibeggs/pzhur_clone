var BDSVis = BDSVis || {};

//This function makes d3js plot, either a bar chart or scatterplot
BDSVis.makePlot = function (data,request,vm) {
	//"vm" is the reference to ViewModel

	var pv=vm.PlotView;

	pv.Init();
	var svg=pv.svg;
	var width=pv.width;
	var height=pv.height;

	var cvar = request.cvar;
	var cvarr=vm.model.LookUpVar(cvar);
	var xvar = request.xvar;
	var xvarr=vm.model.LookUpVar(xvar);

	var MeasureAsLegend = (cvar === vm.model.yvars)
	
	//var request=vm.APIrequest();

	//If measure is a (c-)variable, then we got melted data from updateBDSdata function, with all measures contained in the "value" column
	var measure=MeasureAsLegend?"value":request[vm.model.yvars];

	//Set the title of the plot
	var ptitle=(MeasureAsLegend && request[vm.model.yvars].length>1)?("Various "+vm.model.yvars+"s"):(vm.model.NameLookUp(request[vm.model.yvars],vm.model.yvars)); //If many measures say "various", otherwise the measure name
	for (var key in data[0]) {
		//X-var should not be in the title, measure is taken care of. Also check that the name exists in model.variables (e.g. measure names don't)
		if ((key!=xvar) && (key!=measure) && (key!=vm.model.yvars) && (vm.model.VarExists(key))) {
			if (key!=cvar) ptitle+=vm.model.PrintTitle(data[0][key],key);
			else if (request[cvar].length === 1) ptitle+=" in " + data[0][key];
			else if (key!=vm.model.yvars) ptitle+=" by " + vm.model.NameLookUp(key,"var");
		} 		
	};
	
	pv.SetPlotTitle(ptitle);

	//List of selected categories by actual name rather than code
	var cvarlist=request[cvar].map(function(d) {
		var cv=vm.model.NameLookUp(d,cvar);
		return (vm.model.IsContinuous(cvarr))?(cv.toString()):(cv);
	});
	

	//Setting D3 scales
	var xScale; var yScale; var ymin; var y0;
	if (vm.model.IsContinuous(xvarr))
		xScale = d3.scale.linear()
			.domain([vm.model[xvar][0],vm.model[xvar][vm.model[xvar].length-1]])
			.range([0, width]);
	else
		xScale = d3.scale.ordinal()
			.domain(vm.model.GetDomain(xvar))
			.rangeRoundBands([0, width], .1);

	if (vm.logscale()) {
		ymin = d3.min(data.filter(function(d) {return d[measure]>0}), function(d) { return +d[measure]; })/2.; // The bottom of the graph, a half of the smallest positive value
		y0=ymin; //Where the 0 horizontal line is located, for the base of the bar. Since 0 can not be on a log plot, it's ymin
		yScale = d3.scale.log();
		 //0 and negative numbers are -infinity on log scale, replace them with "almost -infinity", so that they can be plotted, but outside of the graph limits.
		data=data.map(function(d) {if (d[measure]<=0) d[measure]=1e-15; return d;});
	} else {
		y0=0; //Where the 0 horizontal line is located, for the base of the bar
		ymin = Math.min(0,d3.min(data, function(d) { return +d[measure]; })); //Bars should be plotted at least from 0.
		yScale = d3.scale.linear()
	}

	yScale.domain([ymin, d3.max(data, function(d) { return +d[measure]; })])
		.range([height,0]);

			
	//Set up colorscale
	var yearcolorscale = d3.scale.linear().domain([+cvarlist[0],+cvarlist[cvarlist.length-1]]).range(["#265DAB","#CB2027"]);
	//var normscale=d3.scale.linear().domain([0,cvarlist.length/2,cvarlist.length-1]).range(["#265DAB","#dddddd","#CB2027"]);
	var normscale=d3.scale.linear().domain([0,cvarlist.length-1]).range(["#265DAB","#dddddd"]);
	//var colarr=["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
		
	
	var colors = function(d,i) {
		if (vm.model.IsContinuous(cvarr)) return yearcolorscale(cvarlist[i]);
		else if (cvarr.customcolor) return cvarr.colorscale[d];
		else if (vm.model.IsContinuous(xvarr)) return colorbrewer.Dark2[8][i % 8];//colarr[i % colarr.length];
		else return colorbrewer.BrBG[11][10 - (i % 11)];//colarr[i % colarr.length];//normscale(i);
	};

	var Tooltiptext = function(d) {
		var ttt=MeasureAsLegend?d[vm.model.yvars]:vm.model.NameLookUp(measure,vm.model.yvars);
		ttt+=": "+d3.format(",")(d[measure])+"\n"+xvarr.name+": "+d[xvar];
		if (!MeasureAsLegend)
			ttt+="\n"+cvarr.name+": "+d[cvar];
		return ttt;
	}
	
	if (vm.model.IsContinuous(xvarr)) {
		//Make a scatter plot if x-variable is continuous

		// Define the line
		var valueline = d3.svg.line()
    	.x(function(d) { return xScale(d[xvar]); })
    	.y(function(d) { return yScale(d[measure]); });


    	//Add lines
    	for (var icv in request[cvar])
    		svg.append("path")
        	.attr("class", "line")
        	.attr("fill", "none")
        	.attr("stroke-width",2)
        	.attr("stroke", colors(vm.model.NameLookUp(request[cvar][icv],cvar),icv))
        	.attr("d", valueline(data.filter(function(d) {
        				return d[cvar]===vm.model.NameLookUp(request[cvar][icv],cvar);
        		})));

        //Add dots
        svg.selectAll("dot")
    	.data(data)
  		.enter().append("circle")
  		.attr("fill", function(d) {return colors(d[cvar],cvarlist.indexOf(d[cvar]));})
    	.attr("r", 5)
    	.attr("cx", function(d) { return xScale(d[xvar]); })
    	.attr("cy", function(d) { return yScale(d[measure]); })
    	.append("title").text(function(d){return Tooltiptext(d);});

	} else {
		//Make a bar chart if x-variable is categorical
		
		//Number of bars is number of categories in the legend, and barwidth is determined from that
		var nbars=cvarlist.length;
		var barwidth= xScale.rangeBand()/nbars;

		var bars=
		svg.selectAll("rect")
			.data(data);

		bars.enter().append("rect")
		   	.attr("fill",  function(d) {return colors(d[cvar],cvarlist.indexOf(d[cvar]));})
		   	.attr("stroke", "white")
		   	.attr("stroke-width",".1")
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*cvarlist.indexOf(d[cvar])})
		   	// .attr("y",function(d) {return yScale(y0)})
		   	// .attr("height",0).transition()
		   	// .duration(500).ease("sin-in-out")
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[measure]))})
		   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]))})
		   	.append("title").text(function(d){return Tooltiptext(d);});
	}

	//Adding axes
	var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

	if (vm.model.IsContinuous(xvarr)) xAxis.tickFormat(d3.format("d"));

	var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
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

	//X-axis label
	pv.xaxislabel
		.text(xvarr.name)
		.attr("x",function(d) { return (pv.margin.left+pv.margin.right+width-this.getComputedTextLength())/2.; })

	//Y-axis label
	if ((measure!="value") && (vm.model.NameLookUp(measure,vm.model.yvars).indexOf("rate")!=-1))
		pv.yaxislabel.text("% change")
		

	//Making Legend
	var RemoveItem =  function(d,i) {
			var so=vm.SelectedOpts[cvar]();
			so.splice(i,1);
			vm.SelectedOpts[cvar](so);
			d3.event.stopPropagation();
		};

	var legendsvg=pv.legendsvg;

	var symbolsize=15;//Math.max(Math.min(barwidth,20),15);

	legendsvg.attr("height",(symbolsize+5)*cvarlist.length);

	legendsvg.append("text").attr("class","legtitle").text(cvarr.name+((cvarlist.length>1)?"  (click to remove) ":"")+": ");

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
	if (cvarlist.length>1)
		legendlabels.on("click",function(d,i) { RemoveItem(d,i); });
		

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
		.attr("fill",  function(d,i) {return colors(d,i);})
		.attr("width",symbolsize).attr("height",symbolsize)
		.attr("y",function(d,i) {return 0.6+((i>0)?(numlines[i-1]+i*.75):0)+"em";});

	if (cvarlist.length>1)
		legendrect.on("click",function(d,i) { RemoveItem(d,i); });

	var legendheight=d3.select(".legbox").node().getBBox().height
	d3.select(".legbox").attr("transform","translate("+pv.legendx+","+Math.max(20,.5*(height+pv.margin.top+pv.margin.bottom+pv.titleheight-legendheight))+")")

	

	// Timelapse animation
	function updateyear(yr) {

		curyearmessage.transition().duration(1000).text(yr); //Display year

		maintitle.text("");

		var dataset=data.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year
		
		//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
		//empty outside this function. The following loop fills in / updates to actual data values from current year
		for (var i in data4bars) data4bars[i][measure]=0; //Set every bar to 0 so that missing bars disappear
			
		for (var i in dataset) { //Set the values of existing bars
			data4bars[xScale.domain().indexOf(dataset[i][xvar])*request[cvar].length
					+cvarlist.indexOf(dataset[i][cvar])][measure]=+dataset[i][measure];
		};
		
  		var bars=svg.selectAll("rect").data(data4bars);

  		// UPDATE
		  // Update old elements as needed.
		  
		bars
		   	.attr("fill",  function(d) {return colors(d[cvar],+d.icvar)})
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*d.icvar;})
		   	.transition().duration(500)
		   	.attr("y",function(d) { return yScale(Math.max(0,+d[measure]));})
		   	.attr("height",function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]));});

	}

	//Run timelapse animation
	if (vm.timelapse()) {
		//These loops are only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
		var timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });
		var step=vm.model.LookUpVar(vm.model.timevar).range[2];
		var data4bars=[]
		for (var i in xScale.domain())
			for (var j in cvarlist)
				{
					var datum4bar={}
					datum4bar[xvar]=xScale.domain()[i];
					datum4bar[measure]=0;
					datum4bar[cvar]=cvarlist[j];
					datum4bar.icvar=j;
					data4bars.push(datum4bar);
				}

		svg.selectAll("rect").remove();
		svg.selectAll("rect").data(data4bars).enter().append("rect").attr("width", barwidth);

		var iy=timerange[0];
		var curyearmessage=svg.append("text").attr("x",width/2).attr("y",height/2).attr("font-size",100).attr("fill-opacity",.3);
		vm.tlint=setInterval(function() {
  			updateyear(iy);
  			if (iy<timerange[1]) iy+=step; else iy=timerange[0];
  			vm.TimeLapseCurrYear=iy;//vm.model[vm.model.timevar][iy];
		}, 500);
	};
};