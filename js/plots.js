//This function makes d3js plot, either a bar chart or scatterplot
var BDSvismakePlot = function (data,request,self) {
	//"self" is the reference to ViewModel

	//self.PlotView.Init();
	var svg=self.PlotView.svg;
	var width=self.PlotView.width;
	var height=self.PlotView.height;
	
	//var request=self.APIrequest();

	//If measure is a (c-)variable, then we got melted data from updateBDSdata function, with all measures contained in the "value" column
	var measure=(self.MeasureAsLegend())?"value":request.measure;

	//Set the title of the plot
	var ptitle=((request.measure.length>1)?("Various measures"):(self.model.NameLookUp(request.measure,"measure")))+ //If many measures say "various", otherwise the measure name
				   (self.us()?" in US":((request.state.length>1)?(" by state"):(" in "+self.model.NameLookUp(request.state,"state")))); // The same for states
	if (!self.YearAsArgument())
		ptitle=ptitle+((request.year2.length>1)?(" by year"):(" in "+self.model.NameLookUp(request.year2,"year2"))); // the same for years
	
	if (!self.SectorAsArgument())
		//Say "by sector" if many sectors, if not "economy wide" add "in sector of"
		ptitle=ptitle+((request.sic1.length>1)?(" by sector"):(((request.sic1[0]===0)?" ":" in sector of ")+self.model.NameLookUp(request.sic1,"sic1")));
	
	//d3.select("#graphtitle").text(ptitle);
	d3.select("#chartsvg")
		.append("text").attr("class","graph-title")
		.text(ptitle)
		.attr("x",function(d) { return (self.PlotView.margin.left+self.PlotView.margin.right+width-this.getComputedTextLength())/2.; })
		.attr("y",1+"em");

	//List of selected categories by actual name rather than code
	var cvarlist=request[request.cvar].map(function(d) {
		var cv=self.FirmCharAsLegend()?d:self.model.NameLookUp(d,request.cvar);
		return (self.YearAsLegend())?(cv.toString()):(cv);
	});
	

	//Setting D3 scales
	var xScale; var yScale; var ymin; var y0;
	if (self.YearAsArgument())
		xScale = d3.scale.linear()
			.domain([self.model.year2[0],self.model.year2[self.model.year2.length-1]])
			.range([0, width]);
	else
		xScale = d3.scale.ordinal()
			.domain(self.model.GetDomain(request.xvar))
			.rangeRoundBands([0, width], .1);

	if (self.logscale()) {
		ymin = d3.min(data.filter(function(d) {return d[measure]>0}), function(d) { return +d[measure]; })/2.;
		y0=ymin;
		yScale = d3.scale.log();
		data=data.map(function(d) {if (d[measure]<=0) d[measure]=1e-15; return d;}); //0 and negative numbers are -infinity on log scale, replace them with "almost -infinity", so that they can be plotted, but outside of the graph limits.
	} else {
		y0=0;
		ymin = Math.min(0,d3.min(data, function(d) { return +d[measure]; }));
		yScale = d3.scale.linear()
	}

	yScale.domain([ymin, d3.max(data, function(d) { return +d[measure]; })])
		.range([height,0]);

			
	//Set up colorscale
	var yearcolorscale = d3.scale.linear().domain([+cvarlist[0],+cvarlist[cvarlist.length-1]]).range(["#265DAB","#CB2027"]);
	//var normscale=d3.scale.linear().domain([0,cvarlist.length/2,cvarlist.length-1]).range(["#265DAB","#dddddd","#CB2027"]);
	var normscale=d3.scale.linear().domain([0,cvarlist.length-1]).range(["#265DAB","#dddddd"]);
	//var colarr=["#265DAB","#DF5C24","#059748","#E5126F","#9D722A","#7B3A96","#C7B42E","#CB2027","#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#8C8C8C","#8ABDE6","#FBB258","#90CD97","#F6AAC9","#BFA554","#BC99C7","#EDDD46","#F07E6E","#000000"];
		
	var colors = function(i) {
		if (self.YearAsLegend()) return yearcolorscale(cvarlist[i]);
		else if (request.cvar=="fage4") return self.model.fage4color[i];
		else if ((request.cvar=="fsize") || (request.cvar=="ifsize")) return self.model.fsizecolor[i];
		else if (self.YearAsArgument()) return colorbrewer.Dark2[8][i % 8];//colarr[i % colarr.length];
		else return colorbrewer.BrBG[11][10 - (i % 11)];//colarr[i % colarr.length];//normscale(i);
	}

	var Tooltiptext = function(d) {
		var ttt=self.MeasureAsLegend()?d.measure:self.model.NameLookUp(measure,"measure");
		ttt+=": "+d3.format(",")(d[measure])+"\n"+self.model.NameLookUp(request.xvar,"var")+": "+d[request.xvar];
		if (!self.MeasureAsLegend())
			ttt+="\n"+self.model.NameLookUp(request.cvar,"var")+": "+d[request.cvar];
		return ttt;
	}
	
	if (self.YearAsArgument()) {
		//Timeline scatter plot is year is x-variable

		// Define the line
		var valueline = d3.svg.line()
    	.x(function(d) { return xScale(d.year2); })
    	.y(function(d) { return yScale(d[measure]); });

    	for (var icv in request[request.cvar])
    		svg.append("path")
        	.attr("class", "line")
        	.attr("fill", "none")
        	.attr("stroke-width",2)
        	.attr("stroke", colors(icv))
        	.attr("d", valueline(data.filter(function(d) {
        			if (self.FirmCharAsLegend())
        				return d[request.cvar]===request[request.cvar][icv]; 
        			else return d[request.cvar]===self.model.NameLookUp(request[request.cvar][icv],request.cvar);
        		})));

        svg.selectAll("dot")
    	.data(data)
  		.enter().append("circle")
  		.attr("fill", function(d) {return colors(cvarlist.indexOf(d[request.cvar]));})
    	.attr("r", 5)
    	.attr("cx", function(d) { return xScale(d.year2); })
    	.attr("cy", function(d) { return yScale(d[measure]); })
    	.append("title").text(function(d){return Tooltiptext(d);});

	} else {
		//Bar chart	if x-variable is other than year
		
		//Number of bars is number of categories in the legend, and barwidth is determined from that
		var nbars=cvarlist.length;
		var barwidth= xScale.rangeBand()/nbars;

		var bars=
		svg.selectAll("rect")
			.data(data);

		bars.enter().append("rect")
		   	.attr("fill",  function(d) {return colors(cvarlist.indexOf(d[request.cvar]));})
		   	.attr("stroke", "white")
		   	.attr("stroke-width",".1")
		   	//.attr("fill",  function(d) {return colors(d[request.cvar]);})
		   	.attr("width", barwidth)
		   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*cvarlist.indexOf(d[request.cvar])})
		   	// .attr("y",function(d) {return yScale(y0)})
		   	// .attr("height",0).transition()
		   	// .duration(500).ease("sin-in-out")
		   	.attr("y",function(d) {return yScale(Math.max(0,+d[measure]))})
		   	.attr("height", function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]))})
		   	.append("title").text(function(d){return Tooltiptext(d);});
	}

	//Adding axes
	var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

	if (self.YearAsArgument()) xAxis.tickFormat(d3.format("d"));

	var xAxis0 = d3.svg.axis().scale(xScale).tickFormat("").orient("bottom");

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	if (self.logscale()) yAxis.ticks(5,d3.format(",d"));

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + yScale(y0) + ")")
		.call(xAxis0);

	var xAxisLabels=svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis).selectAll("text");

	if (self.SectorAsArgument()) {
		xAxisLabels
		.attr("y", 10)		
			.attr("x", -.5*barwidth)
		.attr("transform", "rotate(7)")
		.style("text-anchor", "start");
		//.attr("y", function(d) {return 15-10*(self.model.GetDomain(request.xvar).indexOf(d) % 2 == 0);});
	}

	svg.append("g")
	.attr("class", "y axis")
	.call(yAxis); 

	//X-axis label
	self.PlotView.xaxislabel
		.text(self.model.NameLookUp(request.xvar,"var"))
		.attr("x",function(d) { return (self.PlotView.margin.left+self.PlotView.margin.right+width-this.getComputedTextLength())/2.; })
		

	//Making Legend
	var legendsvg=self.PlotView.legendsvg;

	var symbolsize=15;//Math.max(Math.min(barwidth,20),15);

	legendsvg.attr("height",(symbolsize+5)*cvarlist.length);

	legendsvg.append("text").attr("class","legtitle").text(self.model.NameLookUp(request.cvar,'var')+": ");

	legendsvg.selectAll("rect")
		.data(cvarlist)
		.enter()
		.append("rect")
		.attr("fill",  function(d,i) {return colors(i);})
		.attr("width",symbolsize).attr("height",symbolsize)
		.attr("y",function(d,i) {return 10+(symbolsize+5)*i;});

	legendsvg.selectAll("text .leglabel")
		.data(cvarlist)
		.enter()
		.append("text")
		.attr("class","leglabel")
		.attr("fill","black")
		.attr("x",(symbolsize+5)).attr("y",function(d,i) {return 22+(symbolsize+5)*i;})
		.text(function(d) {return d;});

	// Timelapse animation
	function updateyear(yr) {

		curyearmessage.transition().duration(1000).text(self.model.year2[yr]); //Display year

		d3.select("#graphtitle").text("");

		var dataset=data.filter(function(d) {return +d.time===self.model.year2[yr]}); //Select data corresponding to the year
		
		//The data4bars is only needed for smooth transition in animations. There have to be rectangles of 0 height for missing data. data4bars is created
		//empty outside this function. The following loop fills in / updates to actual data values from current year
		for (var i in data4bars) data4bars[i][measure]=0; //Set every bar to 0 so that missing bars disappear
			
		for (var i in dataset) { //Set the values of existing bars
			data4bars[xScale.domain().indexOf(dataset[i][request.xvar])*request[request.cvar].length
					+cvarlist.indexOf(dataset[i][request.cvar])][measure]=+dataset[i][measure];
		};
		
  		var bars=svg.selectAll("rect").data(data4bars);

  		// UPDATE
		  // Update old elements as needed.
		  
		bars
		   	.attr("fill",  function(d) {return colors(+d.icvar)})
		   	.attr("x",function(d) {return xScale(d[request.xvar])+barwidth*d.icvar;})
		   	.transition().duration(500)
		   	.attr("y",function(d) { return yScale(Math.max(0,+d[measure]));})
		   	.attr("height",function(d) {return Math.abs(yScale(y0)-yScale(+d[measure]));});

	}

	//Run timelapse animation
	if (self.timelapse()) {
		//These loops are only needed for smooth transition in animations. There have to be bars of 0 height for missing data.
		var data4bars=[]
		for (var i in xScale.domain())
			for (var j in cvarlist)
				{
					var datum4bar={}
					datum4bar[request.xvar]=xScale.domain()[i];
					datum4bar[measure]=0;
					datum4bar.icvar=j;
					data4bars.push(datum4bar);
				}

		svg.selectAll("rect").remove();
		svg.selectAll("rect").data(data4bars).enter().append("rect").attr("width", barwidth);

		var iy=0;
		var curyearmessage=svg.append("text").attr("x",width/2).attr("y",height/2).attr("font-size",100).attr("fill-opacity",.3);
		self.tlint=setInterval(function() {
  			updateyear(iy);
  			if (iy<self.model.year2.length) iy++; else iy=0;
  			self.TimeLapseCurrYear=self.model.year2[iy];
		}, 500);
	}
};