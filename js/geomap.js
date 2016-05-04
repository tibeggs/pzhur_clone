var BDSVis = BDSVis || {};

//This function makes the geographical map
BDSVis.makeMap = function (data,request,vm,dataunfiltered) {
	//"vm" is the reference to ViewModel

	//Initialize the SVG elements and get width and length for scales
	var pv=vm.PlotView;
	pv.Refresh(data,request,vm);
	svg=pv.svg;
	width=pv.width;
	height=pv.height;
	
	var yvar=request[vm.model.yvars];
	var xvar=request.xvar;

	var LUName = function(d) {return vm.model.NameLookUp(d[xvar],xvar);}

	//Set the title of the plot
	var ptitle=vm.model.NameLookUp(yvar,vm.model.yvars); //If many yvars say "various", otherwise the yvar name
	for (var key in data[0]) {
		//X-var should not be in the title, yvar is taken care of. Also check that the name exists in model.variables (e.g. yvar names don't)
		if ((key!==xvar) && (key!==vm.model.yvars) && !((key===vm.model.timevar) && (vm.timelapse)) && (vm.model.VarExists(key)))
			ptitle+=vm.model.PrintTitle(data[0][key],key);
	};

	
	//Set D3 scales
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

	if ((ymin<0) && !vm.logscale)
		yScale.domain([-maxabs,0,maxabs]).range(["#CB2027","#eeeeee","#265DAB"]);
	else
		//yScale.domain([ymin,ymax]).range(["#eeeeee","#265DAB"]);
		yScale.domain([ymin,ymid(ymin,ymax),ymax]).range([purple,"#bbbbbb",golden]);
		//yScale.domain([ymin,ymid,ymax]).range(["red","#ccffcc","blue"]);
	
	//Plot the map	
    var mapg = svg.append('g')
    		.attr('class', 'map');


	var geo_data1=vm.model.geo_data[xvar].slice(0),
		emptystates=0,
		timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });

	mapg.selectAll('path.outlines').data(vm.model.geo_data.state)
			.enter()
			.append('path')
			.attr('class','outlines')
			.style('fill', "white")
			.style('stroke', 'black')
			.style('stroke-width', 0.1)
			.attr('d', d3.geo.path().projection(d3.geo.albersUsa().scale(800).translate([width / 2, height / 2.])))

	if (vm.timelapse) { //In time lapse regime, select only the data corresponding to the current year
		var datafull=data;
		data=data.filter(function(d) {return +d[vm.model.timevar]===timerange[0];});
	};

	//Put the states in geo_data in the same order as they are in data

	var xir = data.map(function(d) {return LUName(d)});
	for (var i in vm.model.geo_data[xvar]) {
		var iir = xir.indexOf(vm.model.geo_data[xvar][i].properties.NAME);
		if (iir === -1) {
			geo_data1[data.length+emptystates]=vm.model.geo_data[xvar][i];
			emptystates++;
		} else geo_data1[iir]=vm.model.geo_data[xvar][i]
	};

	// debugger;

	// svg.append("rect")
	// 	.attr("width", width)
	// 	.attr("height", height)
	// 	.attr("opacity", 0);

	var map = mapg.selectAll('path.datacontour')
			.data(geo_data1)
			.enter()
			.append('path')
			.attr("class","datacontour")
			.attr('d', d3.geo.path().projection(d3.geo.albersUsa().scale(800).translate([width / 2, height / 2.])))
			.style('fill', "white")
			.style('stroke', 'black')
			.style('stroke-width', 0.3)
			.on("dblclick",function(d) {
				var xvcode = vm.model[xvar].filter(function(d1) {return d1.name===d.properties.NAME;})[0].code;
				vm.IncludedXvarValues[xvar].push(xvcode);
				//request[xvar].push(xvcode);
				BDSVis.processAPIdata(vm.dataunfiltered,request,vm);
				//d3.event.stopPropagation()
				//vm.getBDSdata();
			})
			.data(data)
			.style('fill', function(d) {return yScale(d[yvar]);})
			.style('stroke-width', 0.3)
			.style('stroke', 'white')
			.on("dblclick",function(d) {
				var ind = vm.IncludedXvarValues[xvar].indexOf(vm.model[xvar].filter(function(d1) {return d1.name===LUName(d);})[0].code);
				vm.IncludedXvarValues[xvar].splice(ind,1);
				BDSVis.processAPIdata(vm.dataunfiltered,request,vm);
				//d3.event.stopPropagation()	
				//vm.getBDSdata();
			})
			.append("title").text(function(d){return LUName(d)+": "+d3.format(",")(d[yvar]);});

	//Zooming
	svg.call(d3.behavior.zoom().on("zoom",refresh));
	function refresh() {
		var t="translate(" + d3.event.translate + ")"+" scale(" + d3.event.scale + ")";
		if (vm.zoombyrect)
			mapg.selectAll('path').attr("transform", t);
		else {
			var mn=ymin,//+d3.event.translate[0]*(ymax-ymin)/1e+3,
				mx=ymax,//+d3.event.translate[1]*(ymax-ymin)/1e+3,
				md=ymid(ymin,ymax);
			if ((ymin<0) && !vm.logscale)
				yScale.domain([-d3.max([Math.abs(mn),Math.abs(mx)])*d3.event.scale,0,d3.max([Math.abs(mn),Math.abs(mx)])*d3.event.scale]);
			else
				yScale.domain([mn,md*d3.event.scale,mx]);
			legendsvg.selectAll("rect")
				.attr("fill",  function(d) {return yScale(d);})
			mapg.selectAll('path')
				.style("fill",function(d) {return yScale(d[yvar]);})
		};
	}; 

	//Making Legend
	var legendsvg=vm.PlotView.legendsvg;

	var colorbar={height:200, width:20, nlevels:50, nlabels:5, fontsize:15, levels:[]};

	var hScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.height]); //Scale for height of the rectangles in the colorbar
	var y2levelsScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.nlevels]); //Scale for levels of the colorbar

	for (var i=0; i<colorbar.nlevels+1; i++) colorbar.levels.push(y2levelsScale.invert(i));

	var legendtitle = legendsvg.append("text").attr("class","legtitle").text(vm.model.NameLookUp(yvar,vm.model.yvars)).attr("x",-20).attr("y",-20).attr("dy","1em");
	legendtitle.call(pv.wrap,pv.legendwidth);
	//legendtitle.selectAll("tspan").attr("x",function(d) { return (pv.legendwidth-this.getComputedTextLength())/2.; })
	var titleheight = legendtitle.node().getBBox().height;
	legendsvg=legendsvg.append("g").attr("transform","translate(0,"+titleheight+")");

	var legNumFormat= function(d) {
		if (Math.abs(d)>1)
			return d3.format(".3s")(d);
		else if (Math.abs(d)>5e-2)
			return d3.format(".2f")(d);
		else return d3.format(".f")(d);
	};
	
	//Make the colorbar
	legendsvg.selectAll("rect")
		.data(colorbar.levels)
		.enter()
		.append("rect")
		.attr("fill",  function(d) {return yScale(d);})
		.attr("width",20)
		.attr("height",colorbar.height/colorbar.nlevels+1)
		.attr("y",function(d) {return hScale(d);})
		.append("title").text(function(d){return legNumFormat(d);});

	//Make the labels of the colorbar
	legendsvg.selectAll("text .leglabel")
		.data(colorbar.levels.filter(function(d,i) {return !(i % ~~(colorbar.nlevels/colorbar.nlabels));})) //Choose rectangles to put labels next to
		.enter()
		.append("text")
		.attr("fill", "black")
		.attr("class","leglabel")
		.attr("font-size", colorbar.fontsize+"px")
		.attr("x",colorbar.width+3)
		.attr("y",function(d) {return .4*colorbar.fontsize+hScale(d);})
		.text(function(d) {return legNumFormat(d);});

	pv.SetPlotTitle(ptitle);
	pv.lowerrightcornertext.text("Double-click on states to toggle");
	pv.SetXaxisLabel(".",30);

	// Timelapse animation
	function updateyear(yr) {
		//curyearmessage.text(vm.model[vm.model.timevar][yr]); //Display year
		curyearmessage.text(yr); //Display year
		//pv.maintitle.text("");
		var dataset=datafull.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year
		vm.TableView.makeDataTable(dataset,vm.model.yvars,xvar,vm); //Change the data that is displayed raw as a table
		
		map = mapg.selectAll('path.datacontour')
				.data(dataset)
				.transition().duration(vm.timelapsespeed)
				.style('fill', function(d) { return yScale(d[yvar]);})

		mapg.selectAll('title').data(dataset).text(function(d){return LUName(d)+": "+d3.format(",")(d[yvar]);});
	};

	//Run timelapse animation
	if (vm.timelapse) {
		var iy=Math.max(timerange[0], vm.timelapsefrom);
		var step=vm.model.LookUpVar(vm.model.timevar).range[2];
		var curyearmessage=pv.svg.append("text").attr("x",0).attr("y",height*.5).attr("font-size",100).attr("fill-opacity",.3);
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