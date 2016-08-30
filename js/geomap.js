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


	//Filter by region
	data = data.filter(function(d1){
		return vm.model[xvar][vm.model[xvar].map(function(d) {return d.code}).indexOf(d1[xvar])].regions.indexOf(vm.region)>-1;
	})
	vm.TableView.makeDataTable(data,request.cvar,request.xvar,vm); 
	
	
	//Plot the map	
    var mapg = svg.append('g').attr("clip-path", "url(#clip)")
    		.attr('class', 'map');

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

	if ((ymin<0) && !vm.logscale) //If there are negative values use blue to red scale with white(ish) for 0 and strength of color corresponding to absolute value
		yScale.domain([-maxabs,0,maxabs]).range(["#CB2027","#eeeeee","#265DAB"]);
	else
		//yScale.domain([ymin,ymax]).range(["#eeeeee","#265DAB"]);
		yScale.domain([ymin,ymid(ymin,ymax),ymax]).range([purple,"#bbbbbb",golden]);
		//yScale.domain([ymin,ymid,ymax]).range(["red","#ccffcc","blue"]);


	var geo_data1=vm.model.geo_data[xvar].slice(0),
		emptystates=0,
		timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });

	

	if (vm.timelapse) { //In time lapse regime, select only the data corresponding to the current year
		var datafull=data;
		data=data.filter(function(d) {return +d[vm.model.timevar]===timerange[0];});
	};


	//Put the states/MSAs in geo_data in the same order as they are in data

	var xir = data.map(LUName);
	//var xir = data.map(function(d) {return d[xvar]});
	for (var i in vm.model.geo_data[xvar]) {
		var iir = xir.indexOf(vm.model.geo_data[xvar][i].properties.name);
		if (iir === -1) { //If the state/MSA is not in data (e.g. Puerto Rico is never there), put it to the end of the array
			geo_data1[data.length+emptystates]=vm.model.geo_data[xvar][i];
			emptystates++;
		} else {
			geo_data1[iir]=vm.model.geo_data[xvar][i];
			// geo_data1[iir][xvar]=data[iir][xvar];
			// geo_data1[iir][yvar]=data[iir][yvar];
		}
	};

	// Create a unit projection.
	var projection = d3.geo.albersUsa().scale(1).translate([0, 0]);

	// Create a path generator.
	var path = d3.geo.path().projection(projection);

	// Compute the bounds of a feature of interest, then derive scale & translate.
	var b = geo_data1.slice(0,data.length).map(path.bounds),
		leftbound = d3.min(b.map(function(d) {return d[0][0]}).filter(function(d) {return Math.abs(d)!==Infinity}));
		rightbound = d3.max(b.map(function(d) {return d[1][0]}).filter(function(d) {return Math.abs(d)!==Infinity}));
		topbound = d3.min(b.map(function(d) {return d[0][1]}).filter(function(d) {return Math.abs(d)!==Infinity}));
		bottombound = d3.max(b.map(function(d) {return d[1][1]}).filter(function(d) {return Math.abs(d)!==Infinity}));

	s = .95 / Math.max((rightbound - leftbound) / width, (bottombound - topbound) / height),
	t = [(width - s * (rightbound + leftbound)) / 2, (height - s * (topbound + bottombound)) / 2];

	// Update the projection to use computed scale & translate.
	projection.scale(s).translate(t);

	var carto = d3.cartogram()
            .projection(projection)
            .properties(function(d) {return d.properties;})
            .value(function(d,i) {return +d.properties[landarea]+212885012434;});
    
    //var geo_data1=carto.features(vm.model.full_geo_data, vm.model.full_geo_data.objects.states.geometries);
   

	//Calculate relative land areas and how to scale selected states

	//Mean Land Area
	var meanla = d3.mean(geo_data1.filter(function(d) {return (xir.indexOf(d.properties.name)!==-1);}).map(function(d) {return d.properties.landarea;}));

	//Reduced land areas
	geo_data1.forEach(function(d) {d.properties.reducedla = d.properties.landarea/meanla});

	//Find maximal scaling: maximum of the "value of variable (yvar) per land area unit"
	var scalingmax = d3.max(geo_data1.map(function(d,i){
		if ((data[i]===undefined) || (["Alaska","Hawaii"].indexOf(d.properties.name)!==-1)) return 0;
		else return data[i][yvar]/d.properties.reducedla;
	}));

	//.filter(function(d) {return d[xvar]!=="11";})
	mapg.selectAll('path.outlines').data(vm.model.geo_data.state)
			.enter()
			.append('path')
			.attr('class','outlines')
			.style('fill', "white")
			.style('stroke', 'black')
			.style('stroke-width', 0.1)
			.attr('d', path)
			.attr("transform",(vm.cartogram!==1)?("translate(" + pv.translate + ")"+"scale(" + pv.scale + ")"):"");
			//.attr("transform","translate(" + pv.translate + ")"+"scale(" + pv.scale + ")");

	var map = mapg.selectAll('path.datacontour')
			.data(geo_data1)
			.enter()
			.append('path')
			.attr("class","datacontour")
			.attr('d',path)
			.style('fill', "white")
			.attr('fill-opacity', 0)
			.style('stroke', 'black')
			.style('stroke-width', 0.3)
			.on("dblclick",function(d) {
				var xvcode = vm.model[xvar].filter(function(d1) {return d1.name===d.properties.name;})[0].code;
				vm.IncludedXvarValues[xvar].push(xvcode);
				//request[xvar].push(xvcode);
				BDSVis.processAPIdata(vm.dataunfiltered,request,vm);
				//d3.event.stopPropagation()
				//vm.getBDSdata();
			})
			.data(data)
			.attr("transform", function(d,i) {
				return StatesRescaling(d,i);
			})
			.style('fill', function(d) {return yScale(d[yvar]);})
			.attr("fill-opacity",.9)
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

	
	function StatesRescaling(d,i) {
		//The function calculates the proper rescaling and translating of states/MSA for non-contiguous cartogram

		if (vm.cartogram === 0) return "translate(" + pv.translate + ")"+"scale(" + pv.scale + ")";
		var noscale = ["Alaska","Hawaii","Puerto Rico"].indexOf(geo_data1[i].properties.name)!==-1;
		if (noscale) return;
		else {
			var centroid = path.centroid(geo_data1[i]),
			x = centroid[0],
			y = centroid[1];
			return "translate(" + x + "," + y + ")"
			// + "scale(" + Math.sqrt(data[i][yvar]/ymax || 0) + ")"
			+ "scale(" + (Math.sqrt(d[yvar]/geo_data1[i].properties.reducedla/scalingmax))*pv.scale + ")"
			+ "translate(" + -x + "," + -y + ")";
		}
	};


	//d3.select("body").append("div").text(JSON.stringify(data))

	//Zooming

	function zoomscale(scale) {
		var mn=ymin,//+d3.event.translate[0]*(ymax-ymin)/1e+3,
			mx=ymax,//+d3.event.translate[1]*(ymax-ymin)/1e+3,
			md=ymid(ymin,ymax);
		if ((ymin<0) && !vm.logscale)
			yScale.domain([-d3.max([Math.abs(mn),Math.abs(mx)])*scale,0,d3.max([Math.abs(mn),Math.abs(mx)])*scale]);
		else
			yScale.domain([mn,md*scale,mx]);
		legendsvg.selectAll("rect")
			.attr("fill", yScale);
		mapg.selectAll('path.datacontour')
			.style("fill",function(d) {return yScale(d[yvar]);})
	};

	function refresh() {
		
		if (vm.zoombyrect) {
			pv.translate = d3.event.translate.slice(0); pv.scale = d3.event.scale+0.;
			var t="translate(" + pv.translate + ")"+"scale(" + pv.scale + ")";

			if (vm.cartogram === 1)
				mapg.selectAll('path.datacontour').data(data)
				.attr("transform", function(d,i) {
					return StatesRescaling(d,i);
				})
			else mapg.selectAll('path').attr("transform", t);
		}
		else {
			pv.colorscale = d3.event.scale;
			zoomscale(d3.event.scale);
		};
	};

	function colorscalerefresh() {
		zoomscale(d3.event.scale);
	};

	

	pv.zoom = d3.behavior.zoom().on("zoom",refresh);
	svg.call(pv.zoom);


	//Making Legend
	var legendsvg=vm.PlotView.legendsvg;

	legendsvg.call(d3.behavior.zoom().on("zoom",colorscalerefresh));

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
		.attr("fill",  yScale)
		.attr("width",20)
		.attr("height",colorbar.height/colorbar.nlevels+1)
		.attr("y", hScale)
		.append("title").text(legNumFormat);

	//Make the labels of the colorbar
	legendsvg.selectAll("text.leglabel")
		.data(colorbar.levels.filter(function(d,i) {return !(i % ~~(colorbar.nlevels/colorbar.nlabels));})) //Choose rectangles to put labels next to
		.enter()
		.append("text")
		.attr("fill", "black")
		.attr("class","leglabel")
		.attr("font-size", colorbar.fontsize+"px")
		.attr("x",colorbar.width+3)
		.attr("y",function(d) {return .4*colorbar.fontsize+hScale(d);})
		.text(legNumFormat);

	legendsvg.append("text").attr("y",1.2*colorbar.fontsize+colorbar.height).style("font-size","10px").text("Zoom over the colorbar to change color scale");

	pv.SetPlotTitle(ptitle);
	pv.lowerrightcornertext.style("font-size","10px").text("Double-click on states to toggle");
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
				.attr("transform", function(d,i) {
					return StatesRescaling(d,i);
				})
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