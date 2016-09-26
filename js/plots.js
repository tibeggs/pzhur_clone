var BDSVis = BDSVis || {};

//This function makes d3js plot, either a bar chart or scatterplot
BDSVis.makePlot = function (data,request,vm,limits) {
	//"vm" is the reference to ViewModel

	var pv=vm.PlotView;

	pv.Refresh(data,request,vm);
	
	var svg=pv.svg;
	var width=pv.width;
	var height=pv.height;

	var cvar = request.cvar;
	var cvarr=vm.model.LookUpVar(cvar);
	var xvar = request.xvar;
	var xvarr=vm.model.LookUpVar(xvar);

	var YvarsAsLegend = (cvar === vm.model.yvars);

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

	if (vm.logscale) {
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
		yScale1 = yScale;
	};

	yScale1.domain([yScale1.domain()[0],yScale1.domain()[1]*1.1]); //Add 10% space above the highest data point

	if (limits!==undefined) {
		if (vm.model.IsContinuous(xvarr)) {
			yScale1.domain([limits[2],limits[3]]);
			xScale.domain([limits[0],limits[1]]);
		} else {
			yScale1.domain([ymin,limits[3]]);
			xScale.domain(xScale.domain().slice(limits[0],limits[1]));
		}
	};
			
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
		var ttt=vm.model.NameLookUp(d[vm.model.yvars],vm.model.yvars);
		ttt+=": "+d3.format(",")(d[yvar])+"\n"+xvarr.name+": "+vm.model.NameLookUp(d[xvar],xvar);
		if (!YvarsAsLegend)
			ttt+="\n"+cvarr.name+": "+vm.model.NameLookUp(d[cvar],cvar);
		return ttt;
	};

	//Adding axes

	var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d){ return vm.model.NameLookUp(d,xvar)});

	if (vm.model.IsContinuous(xvarr)) xAxis.tickFormat(d3.format("d"));

	var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

	var yAxis = d3.svg.axis().scale(yScale1).orient("left");

	if (vm.logscale) yAxis.ticks(5,d3.format(",d"));

	svg.append("g")
		.attr("class", "x0 axis")
		.attr("transform", "translate(0," + yScale(y0) + ")")
		.call(xAxis0);

	var xAxisLabels=svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll(".tick text");

	if (vm.model.IsCategorical(xvarr))
      	xAxisLabels.call(pv.wrap,xScale.rangeBand());

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	svg.append("rect")
		.attr("width", width)
		.attr("height", height)
		.attr("opacity", 0); 

    //Zooming
	function refresh() {
		var t="translate(" + d3.event.translate + ")"+" scale(" + d3.event.scale + ")";
		svg.select(".x.axis").call(xAxis);
		svg.select(".y").call(yAxis);
		svg.select(".x0").call(xAxis0);
		d3.selectAll("path.plotline").attr("transform", t);
		d3.selectAll("circle.plotdot").attr("transform", t);
	};

	function refreshBars() {
		//var t="translate(" + d3.event.translate + ")"+" scale(" + d3.event.scale + ")";
		
		svg.select(".y.axis").call(yAxis);
		// xScale.rangeRoundBands([d3.event.translate[0], d3.event.translate[0]+width*d3.event.scale], .1);
		// //debugger;
		// svg.select(".x.axis").call(xAxis);
		svg.select(".x0.axis").attr("transform", "translate(0," + yScale(y0) + ")").call(xAxis0);

		//d3.selectAll("rect.plotbar").attr("transform", t);
		d3.selectAll("rect.plotbar")
			.attr("y",function(d) {return yScale(Math.max(0,+d[yvar]))})
		   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[yvar]))});
		var uptri = chart.selectAll(".offlimitis").data(data.filter(function(d) {return (xScale.domain().indexOf(d[xvar])>-1) && (yScale(d[yvar])<0)}));
		uptri.exit().remove()
		uptri.enter().append("path")
			.attr("class", "offlimitis")
			.attr("d", d3.svg.symbol().type("triangle-up"))
			.attr("fill","red")
		uptri
			.attr("transform", function(d) { return "translate(" + (xScale(d[xvar])+xScale.rangeBand()/2.) + "," + 0 + ")"; });

		var downtri = chart.selectAll(".downofflimitis").data(data.filter(function(d) {return (xScale.domain().indexOf(d[xvar])>-1) && (yScale(0)>height)}));
		downtri.exit().remove()
		downtri.enter().append("path")
			.attr("class", "downofflimitis")
			.attr("d", d3.svg.symbol().type("triangle-down"))
			.attr("fill","red")
		downtri
			.attr("transform", function(d) { return "translate(" + (xScale(d[xvar])+xScale.rangeBand()/2.) + "," + height*.98 + ")"; });	
	};

	if(vm.model.IsContinuous(xvarr))
		pv.zoom = d3.behavior.zoom().x(xScale).y(yScale1).on("zoom",  refresh);
	else 
		pv.zoom = d3.behavior.zoom().y(yScale1).on("zoom",  refreshBars); 


	if ((!vm.zoombyrect) && !(vm.timelapse))
	{
		svg.call(pv.zoom);
	}
	
	// //Clipping lines and dots outside the plot area
	// svg.append("defs").append("svg:clipPath")
	//         .attr("id", "clip")
	//         .append("svg:rect")
	//         .attr("id", "clip-rect")
	//         .attr("x", "0")
	//         .attr("y", "-5")
	//         .attr("width", width+5)
	//         .attr("height", height+5);

	var chart=svg.append("g").attr("clip-path", "url(#clip)");

	//Zoom-by-rectangle procedure adopted from https://gist.github.com/jasondavies/3689931 and changed to redraw the whole plot and to work with bar charts
	svg.on("mousedown", function() {
		if ((!vm.zoombyrect) || vm.timelapse) return;
      	var e = this,
	        origin = d3.mouse(e),
	        rect = svg.append("rect").attr("class", "zoom");

		d3.select("body").classed("noselect", true);
		origin[0] = Math.max(0, Math.min(width, origin[0]));
		origin[1] = Math.max(0, Math.min(height, origin[1]));
		d3.select(window)
			.on("mousemove.zoomRect", function() {
			//Draw rectangle
			    var m = d3.mouse(e);
			    m[0] = Math.max(0, Math.min(width, m[0]));
			    m[1] = Math.max(0, Math.min(height, m[1]));
			    rect.attr("x", Math.min(origin[0], m[0]))
			        .attr("y", Math.min(origin[1], m[1]))
			        .attr("width", Math.abs(m[0] - origin[0]))
			        .attr("height", Math.abs(m[1] - origin[1]));
		  	})
			.on("mouseup.zoomRect", function() {
				d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
				d3.select("body").classed("noselect", false);
				var m = d3.mouse(e);
				m[0] = Math.max(0, Math.min(width, m[0]));
				m[1] = Math.max(0, Math.min(height, m[1]));
				rect.remove();
				if (m[0] !== origin[0] && m[1] !== origin[1]) {
					//Find new extents/limits of the plot from the rectangle size and call the plot function with them as argument
					if (vm.model.IsContinuous(xvarr)) {
						var leftright=[origin[0], m[0]].map(xScale.invert).sort();
						var topbottom=[origin[1], m[1]].map((yScale1).invert).sort(function(a,b) {return a>b});
						BDSVis.makePlot(data,request,vm,d3.merge([leftright,topbottom]));
					} else {
						var left=xScale.domain().map(function(d) {return xScale(d)<d3.min([origin[0], m[0]]);}).indexOf(false);
						var right=xScale.domain().map(function(d) {return xScale(d)>d3.max([origin[0], m[0]]);}).indexOf(true);
						var topbottom=[origin[1], m[1]].map((yScale1).invert).sort(function(a,b) {return a>b});
						if (right===-1) right=xScale.domain().length;
						BDSVis.makePlot(data,request,vm,d3.merge([[left,right],topbottom]));
					}
				}
			}, true);
		d3.event.stopPropagation();
	});

	// var tip = d3.tip()
	// 	.attr('class', 'd3-tip')
	// 	.offset(function(d) {return [-10, yScale(d[yvar]/2.)];})
	// 	.html(Tooltiptext);
	// svg.call(tip);

	
	if (vm.model.IsContinuous(xvarr)) {
		//Make a scatter plot if x-variable is continuous
	
		vm.regimeselector.property("disabled",true)

		// Define the line
		var valueline = d3.svg.line().interpolate("monotone")
	    	.x(function(d) { return xScale(d[xvar]); })
	    	.y(function(d) { return yScale(d[yvar]); });

    	
    	chart.selectAll("path.plotline")
    		// .data(cvarlist.map(function(d) {
    		// 	return {cvar: d, values: data.filter(function(d1) {return d1[cvar]===d;})}; 
    		// }))
    		.data(d3.nest().key(function(d) {return d[cvar]; }).entries(data)) //Split data into separate sets for each cvar
    		.enter()
    		.append("path").attr("class", "plotline")
    		.attr("stroke", function(d) {return colors(d.key);})
    		.attr("d", function(d){return valueline(d.values);});

        //Add dots
        chart.selectAll("circle.plotdot")
	    	.data(data)
	  		.enter().append("circle").attr("class","plotdot")
	  		.attr("r",5)
	  		.attr("fill", function(d) {return colors(d[cvar]);})
	    	.attr("cx", function(d) { return xScale(d[xvar]); })
	    	.attr("cy", function(d) { return yScale(d[yvar]); })
	    	.append("title").text(Tooltiptext);

	} else {
		//Make a bar chart if x-variable is categorical		
		//Number of bars is number of categories in the legend, and barwidth is determined from that
		var nbars=cvarlist.length;
		var barwidth= xScale.rangeBand()/nbars;

		var bars=
		chart.selectAll("rect.plotbar")
			.data(data.filter(function(d) {return xScale.domain().indexOf(d[xvar])>-1}));

		bars.enter().append("rect")
		   	.attr("fill",  function(d) {return colors(d[cvar]);})
		   	.attr("class", "plotbar")
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*cvarlist.indexOf(d[cvar])})
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[yvar]))})
		   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[yvar]))})
		   	.on("dblclick",function(d) {

		   		//if(!vm.zoombyrect) return;
				var ind = vm.IncludedXvarValues[xvar].indexOf(d[xvar]);
				vm.IncludedXvarValues[xvar].splice(ind,1);
				BDSVis.processAPIdata(data,request,vm);
			})
			// .on('mouseover', tip.show)
   //    		.on('mouseout', tip.hide)
		   	.append("title").text(Tooltiptext);

		chart.selectAll(".offlimitis").data(data.filter(function(d) {return (xScale.domain().indexOf(d[xvar])>-1) && (yScale(d[yvar])<0)}))
			.enter().append("path")
			.attr("class", "offlimitis")
			.attr("d", d3.svg.symbol().type("triangle-up"))
			.attr("fill","red")
			.attr("transform", function(d) { return "translate(" + (xScale(d[xvar])+xScale.rangeBand()/2.) + "," + 0 + ")"; });

		if (!vm.zoombyrect) pv.lowerrightcornertext.text("Double-click on bar to remove category");
	};

	//Making Legend
	var RemoveItem =  function(d) { //Function to remove an item from the legend
			var ind=request[cvar].indexOf(vm.model.IsContinuous(cvar)?(+d):d);
			request[cvar].splice(ind,1);
			BDSVis.processAPIdata(vm.dataunfiltered,request,vm);
		};

	var legendsvg=pv.legendsvg;

	var symbolsize=15;//Math.max(Math.min(barwidth,20),15);

	legendsvg.attr("height",(symbolsize+5)*cvarlist.length);

	legendsvg.append("text").attr("class","legtitle").text(cvarr.name+(((cvarlist.length>1) && !vm.timelapse)?"  (click to remove) ":"")+": ");

	var legendlabels=legendsvg.selectAll("text.leglabel")
		.data(cvarlist)
		.enter()
		.append("text")
		.attr("class","leglabel")
		.attr("fill","black")
		.attr("x",(symbolsize+5))
		.attr("dy",1+"em")
		.text(function(d) {return vm.model.NameLookUp(d,cvar);});
	if ((cvarlist.length>1) && !vm.timelapse)
		legendlabels.on("click",RemoveItem);
		

	//Split long labels into multiple lines
	legendlabels.call(pv.wrap,pv.legendwidth - (symbolsize+5));
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
		.attr("fill", colors)
		.attr("width",symbolsize).attr("height",symbolsize)
		.attr("y",function(d,i) {return 0.6+((i>0)?(numlines[i-1]+i*.75):0)+"em";});

	if ((cvarlist.length>1) && !vm.timelapse)
		legendrect.on("click",RemoveItem);

	var legendheight=d3.select(".legbox").node().getBBox().height
	d3.select(".legbox").attr("transform","translate("+pv.legendx+","+Math.max(20,.5*(height+pv.margin.top+pv.margin.bottom+pv.titleheight-legendheight))+")")

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

	//Y-axis label
    var yvarname=vm.model.NameLookUp((YvarsAsLegend)?request[vm.model.yvars][0]:yvar,vm.model.yvars);
	if ((!YvarsAsLegend) || ( request[vm.model.yvars].length==1 )){
		if (yvarname.indexOf("rate")!==-1)
			pv.SetYaxisLabel(yvarname+", % change",0);
		else pv.SetYaxisLabel(yvarname);
	};

	//X-axis label
	pv.SetXaxisLabel(xvarr.name,d3.max(xAxisLabels[0].map(function(d) {return d.getBBox().y+d.getBBox().height;})));

	//pv.AdjustUIElements();
	
	// Timelapse animation
	function updateyear(yr) {

		curyearmessage.transition().duration(vm.timelapsespeed).text(yr); //Display year

		//pv.maintitle.text("");

		var dataset=data.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year

		vm.TableView.makeDataTable(dataset,cvar,xvar,vm);
		
		//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
		//empty outside this function. The following loop fills in / updates to actual data values from current year

		d3.merge(data4bars).forEach(function(d) {d[yvar]=0;}); //Set every bar to 0 so that missing bars disappear

		dataset.forEach( function(d) { //Set the values of existing bars
			data4bars [ xScale.domain().indexOf(d[xvar]) ] [ cvarlist.indexOf(d[cvar]) ][yvar]=+d[yvar];
		});
		
  		var bars=chart.selectAll("rect.plotbar").data(d3.merge(data4bars));

  		// UPDATE
		  // Update old elements as needed.
		  
		bars
		   	.attr("fill",  function(d) {return colors(d[cvar])})
		   	.attr("x",function(d) {return xScale(d[xvar])+barwidth*cvarlist.indexOf(d[cvar]);})
		   	.transition().duration(vm.timelapsespeed)
		   	.attr("y",function(d) { return yScale(Math.max(0,+d[yvar]));})
		   	.attr("height",function(d) {return Math.abs(yScale(y0)-yScale(+d[yvar]));});

	};

	//Run timelapse animation
	if (vm.timelapse) {
		
		//This array is only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
		//Create array with entry for all values of xvar and all values of cvar.
		var data4bars = xScale.domain().map(function(xv) {return cvarlist.map(function(cv) {return (obj={}, obj[xvar]=xv, obj[cvar]=cv,obj);});});

		//Create bars for every xvar/cvar combination
		chart.selectAll("rect.plotbar").remove();
		chart.selectAll("rect.plotbar").data(d3.merge(data4bars)).enter().append("rect").attr("class", "plotbar").attr("width", barwidth);
		
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

	//BDSVis.util.preparesavesvg();
};