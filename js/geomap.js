var BDSVis = BDSVis || {};

//This function makes the geographical map
BDSVis.makeMap = function (data,request,vm) {
	//"vm" is the reference to ViewModel

	//Initialize the SVG elements and get width and length for scales
	var pv=vm.PlotView;
	pv.Init();
	svg=pv.svg;
	width=pv.width;
	height=pv.height;
	
	var measure=request.measure;

	//Set graph title
	//d3.select("#graphtitle").

	//Set the title of the plot
	var ptitle=vm.model.NameLookUp(measure,vm.model.yvars); //If many measures say "various", otherwise the measure name
	for (var key in data[0]) {
		//X-var should not be in the title, measure is taken care of. Also check that the name exists in model.variables (e.g. measure names don't)
		if ((key!=vm.model.geomapvar) && (key!=vm.model.yvars) && (vm.model.VarExists(key)))
			ptitle+=vm.model.PrintTitle(data[0][key],key);
	};

	pv.SetPlotTitle(ptitle);

	//Set D3 scales
	var ymin=d3.min(data, function(d) { return +d[measure]; });
	var ymax=d3.max(data, function(d) { return +d[measure]; });
	var ymid=(ymax+ymin)*.5;
	var maxabs=d3.max([Math.abs(ymin),Math.abs(ymax)]);
	
	//Define which scale to use, for the map and the colorbar. Note that log scale can be replaced by any other here (like sqrt), the colormap will adjust accordingly.
	var scaletype = (vm.logscale())?d3.scale.log():d3.scale.linear();

	var yScale = scaletype.copy();
	
	var purple="rgb(112,79,161)"; var golden="rgb(194,85,12)"; var teal="rgb(22,136,51)";

	if ((ymin<0) && !vm.logscale())
		yScale.domain([-maxabs,0,maxabs]).range(["#CB2027","#eeeeee","#265DAB"]);
	else
		//yScale.domain([ymin,ymax]).range(["#eeeeee","#265DAB"]);
		yScale.domain([ymin,ymid,ymax]).range([golden,"#bbbbbb",purple]);
		//yScale.domain([ymin,ymid,ymax]).range(["red","#ccffcc","blue"]);
	
	//Plot the map	
    var mapg = svg.append('g')
    		.attr('class', 'map');
			
	var projection = d3.geo.albersUsa()
			.scale(800)
			.translate([width / 2, height / 2.]);

	var geo_data1=[];
		timerange = d3.extent(data, function(d) { return +d[vm.model.timevar] });

	if (vm.timelapse()) { //In time lapse regime, select only the data corresponding to the current year
		var datafull=data;
		data=data.filter(function(d) {return +d[vm.model.timevar]===timerange[0];});
	};

	//Put the states in geo_data in the same order as they are in data
	for (var i in data)
		geo_data1.push(vm.geo_data.features.filter(function(d) {return data[i][vm.model.geomapvar]===d.properties.NAME;})[0]);

	var path = d3.geo.path().projection(projection);

	var map = mapg.selectAll('path')
			.data(geo_data1)
			.enter()
			.append('path')
			.attr('d', path)
			.data(data)
			.style('fill', function(d) { return yScale(d[measure]);})
			.style('stroke', 'white')
			.style('stroke-width', 0.3)
			.append("title").text(function(d){return d[vm.model.geomapvar]+": "+d3.format(",")(d[measure]);});

	//Making Legend
	var legendsvg=vm.PlotView.legendsvg;

	var colorbar={height:200, width:20, nlevels:50, nlabels:5, fontsize:15, levels:[]};

	var hScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.height]); //Scale for height of the rectangles in the colorbar
	var y2levelsScale = scaletype.copy().domain([ymin,ymax]).range([0,colorbar.nlevels]); //Scale for levels of the colorbar

	for (var i=0; i<colorbar.nlevels+1; i++) colorbar.levels.push(y2levelsScale.invert(i));

	var legendtitle = legendsvg.append("text").attr("class","legtitle").text(vm.model.NameLookUp(measure,"measure")).attr("x",-20).attr("y",-20).attr("dy","1em");
	legendtitle.call(BDSVis.util.wrap,pv.legendwidth);
	//legendtitle.selectAll("tspan").attr("x",function(d) { return (pv.legendwidth-this.getComputedTextLength())/2.; })
	var titleheight = legendtitle.node().getBBox().height;
	legendsvg=legendsvg.append("g").attr("transform","translate(0,"+titleheight+")");
	
	//Make the colorbar
	legendsvg.selectAll("rect")
		.data(colorbar.levels)
		.enter()
		.append("rect")
		.attr("fill",  function(d) {return yScale(d);})
		.attr("width",20)
		.attr("height",colorbar.height/colorbar.nlevels+1)
		.attr("y",function(d) {return hScale(d);})
		.append("title").text(function(d){return BDSVis.util.NumFormat(+d,3);});

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
		.text(function(d) {return(BDSVis.util.NumFormat(+d,3));});

	// Timelapse animation
	function updateyear(yr) {
		//curyearmessage.text(vm.model[vm.model.timevar][yr]); //Display year
		curyearmessage.text(yr); //Display year
		d3.select("#graphtitle").text("");
		var dataset=datafull.filter(function(d) {return +d[vm.model.timevar]===yr}); //Select data corresponding to the year
		//Change the data that is displayed raw as a table
		// var vmdata=vm.data();
		// for (var i=1; i<dataset.length; i++)
		// 	vmdata[i][1]=dataset[i][measure];
		// vm.data(vmdata);
		map = mapg.selectAll('path')
				.data(dataset)
				.transition().duration(vm.timelapsespeed())
				.style('fill', function(d) { return yScale(d[measure]);})

		mapg.selectAll('title').data(dataset).text(function(d){return d[vm.model.geomapvar]+": "+d3.format(",")(d[measure]);});
	};

	//Run timelapse animation
	if (vm.timelapse()) {
		var iy=Math.max(timerange[0], vm.timelapsefrom());
		var step=vm.model.LookUpVar(vm.model.timevar).range[2];
		var curyearmessage=d3.select("#chartsvg").append("text").attr("x",0).attr("y",height*.5).attr("font-size",100).attr("fill-opacity",.3);
		vm.tlint=setInterval(function() {
  			updateyear(iy);
  			if (iy<Math.min(timerange[1],vm.timelapseto())) iy+=step; else iy=Math.max(timerange[0], vm.timelapsefrom());
  			vm.TimeLapseCurrYear=iy;//vm.model[vm.model.timevar][iy];
		}, vm.timelapsespeed());
	};
};