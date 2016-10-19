var BDSVis = BDSVis || {};

//The visual elements of the plot: SVGs for the graph/map and legend. Also UI elements positioned on top of the SVG
BDSVis.PlotView = {
	margin : {top: 20, right: 30, bottom: 20, left: 100},
	width0 : 850,
	height0 : 450,
	legendwidth: 250,
	titleheight: 15,
	xaxislabelheight: 20,
	Init : function() {
		//Define margins and dimensions of the SVG element containing the chart
		
		var margin = this.margin;

		this.width = this.width0 - margin.left - margin.right;
		this.height = this.height0 - margin.top - margin.bottom;


		//Select the SVG element,, set sizes

		this.svgcont = d3.select("#chartsvg");
		
		this.svgcont.attr("width", this.width + margin.left + margin.right+this.legendwidth)
			.attr("height", this.height + margin.top + margin.bottom + this.titleheight + this.xaxislabelheight);

		
		d3.select("#buttonsundergraph").style("width",this.width + margin.left+"px");
		d3.select("#plotarea").style("width", this.width + margin.left + margin.right+this.legendwidth+"px");

		this.xvarselector = d3.select("#xvarselector");
		this.cvarselector = d3.select("#cvarselector");
		this.scaleui = d3.select("#logbutton");

		this.scale = 1;
		this.translate = [0,0];

	},

	Refresh : function(data,request,vm) {
		var pv = this;

		var margin = this.margin;
		var width=this.width;
		var height=this.height;	
		
		//remove old drawings,  add grouping element for the chart, refresh UI elements, 
		this.svgcont.selectAll("g").remove();
		this.svg=this.svgcont
			.append('g')
			.attr("transform", "translate(" + margin.left + "," + (margin.top+this.titleheight)+ ")")
			.attr('class', 'chart');

		//Clipping lines and dots outside the plot area
		this.svg.append("defs").append("svg:clipPath")
	        .attr("id", "clip")
	        .append("svg:rect")
	        .attr("id", "clip-rect")
	        .attr("x", "0")
	        .attr("y", "-5")
	        .attr("width", width+5)
	        .attr("height", height+5);

		//Clear legend, set size
		this.legendx=width+margin.left+ margin.right;
		this.legendsvg=this.svgcont
			.append("g")
			.attr("transform","translate("+this.legendx+","+height*.3+")")
			.attr("class","leglabel legbox");
		
		//X-axis label
		this.xaxislabelg=this.svgcont.append("g")
		this.xaxislabel=this.xaxislabelg.append("text")
			.attr("class","xaxislabel")
			.attr("y",(height + margin.top + this.xaxislabelheight + this.titleheight));

		//Y-axis label
		this.yaxislabel=this.svgcont.append("g").append("text")
			.attr("class","yaxislabel")
			.attr("transform","translate("+16+","+.5*(height + margin.top + this.xaxislabelheight + this.titleheight)+")rotate(-90)");

		//Text in the lower right corner of the plot (Like "double-click to remove")
		this.lowerrightcornertext=this.svgcont.append("g").append("text").attr("class","leglabel")
			.attr("x",width+margin.left+ margin.right)
			.attr("y",this.height0-margin.bottom);

		//UI controls on top of the chart refresh
		this.xvarselector.selectAll("select").remove();
		this.cvarselector.selectAll("select").remove();
		this.scaleui.selectAll("*").remove();
		if (!vm.timelapse) { //Add UI controls if not in Time Lapse regime

			//Logscale Checkbox
			var boxsize=10;
	
			this.logbutton=this.scaleui.append("input").attr("type","Checkbox")
				.property("checked",function(d) {return vm.logscale;})
			this.scaleui.append("span").text("Log")
			
			this.logbutton.on("click",function() { 
				vm.logscale=!vm.logscale;
				if (vm.geomap())
					BDSVis.makeMap(data,request,vm);
				else if ((vm.heatchart) && !(vm.model.IsContinuous(request.xvar)))
					BDSVis.makeHeatChart(data,request,vm);
				else
					BDSVis.makePlot(data,request,vm);
			});

			//Rectangular zoom checkbox
			this.rectzoom = this.scaleui//d3.select("#resetzoom")
				.append("span").text("\u00A0\u00A0")
				.append("input").attr("type","Checkbox")
				.property("checked",function(d) {return vm.zoombyrect;})
			this.scaleui.append("span").text(vm.geomap()?"Zoom / Scale Colors":"Zoom by rectangle")

			this.rectzoom.on("click", function() {

				if (vm.geomap()) {
					if (vm.zoombyrect) pv.zoom.scale(pv.colorscale || 1) //If zooming/panning, reset zoom (for colorscale) to what it was before zooming/panning
					
					else 
						pv.zoom.scale(pv.scale || 1).translate(pv.translate || [0,0]); //If scaling colors, reset zoom to what it was before scaling colors
					
				} else { 
					if (vm.zoombyrect) pv.svg.call(pv.zoom); else pv.zoom.on("zoom", null);
				};
				
				vm.zoombyrect=!vm.zoombyrect;
				// if (!vm.geomap())
				// 	BDSVis.makePlot(data,request,vm);
			});

			//Reset Zoom button
			this.resetzoom = this.scaleui
				.append("span").text("\u00A0\u00A0").append("button").text("Reset Zoom").on("click", function() {
				if (vm.geomap()) {
					//pv.scale=1; pv.translate=[0,0];
					pv.zoom.scale(1).translate([0,0]).event(pv.svg);
					//BDSVis.makeMap(data,request,vm);
				}
				else {
					if (vm.zoombyrect)
						BDSVis.makePlot(data,request,vm);
					else pv.zoom.scale(1).translate([0,0]).event(pv.svg);
				}
			});

			function AddOptionsToVarSelector(selector,varvalues,whichvar,group) { //Create a selector option for each variable value, set which are selected
				selector.selectAll("option")
					.data(varvalues).enter().append("option")
					.attr("value",function(d) {return d.code;})
					.text(function(d) {return d.name;})
					.property("selected",function(d){
							return d.code===(group?vm.SelectedOpts[vm[whichvar]][0]:vm[whichvar]);
					});
			};

			//X-axis variable selector			
			var selector = this.xvarselector.append("select");
			AddOptionsToVarSelector(selector,vm.model.variables.filter(function(d){return (d.asaxis && d.code!==vm.cvar)}),"xvar",false);
			selector.on("change", function() { vm.setxvar(this.value);} );
			if (vm.model.IsGroup(vm.xvar)) {
				var groupselector = this.xvarselector.append("select");
				AddOptionsToVarSelector(groupselector,vm.model[vm.xvar],"xvar",true);
				groupselector.on("change", function() {vm.SelectedOpts[vm.xvar]=[this.value]; vm.getBDSdata();});
			};

			if (!vm.geomap()) {
				//Legend variable (cvar) selector
				this.cvarselector.html(vm.heatchart?'Y-axis variable:<br><br>':'Legend variable:<br><br>')
				selector = this.cvarselector.append("select");
				AddOptionsToVarSelector(selector,vm.model.variables.filter(function(d){return  (d.aslegend && d.code!==vm.xvar)}),"cvar",false);			
				selector.on("change", function() { vm.setcvar(this.value);} );
				if (vm.model.IsGroup(vm.cvar)) {
					var groupselector = this.cvarselector.append("select");
					AddOptionsToVarSelector(groupselector,vm.model[vm.cvar],"cvar",true);
					groupselector.on("change", function() {vm.SelectedOpts[vm.cvar]=[this.value]; vm.getBDSdata();});
				};
			} else {
				this.cvarselector.html('Region:<br><br>')
				selector = this.cvarselector.append("select");
				selector.selectAll("option")
					.data(vm.model.regions).enter().append("option")
					.attr("value",function(d) {return d.name;})
					.text(function(d) {return d.name;})
					.property("selected",function(d){
							return d.name===vm.region;
					});		
				selector.on("change", function() { vm.region = this.value;  vm.getBDSdata();} );
			};
		};
		this.AdjustUIElements();
	},

	DisplayNoData : function(request,vm) {
		this.svgcont.selectAll("g").remove();
		this.svgcont.append("g").append("text").attr("class","graphtitle").attr("x",this.width0/2).attr("y",this.height0/2).style("font-size","32px").text("No data");
		if (request!==undefined) {
			ptitle="for "+vm.model.yvars+"s ";
			//var ptitle=vm.model.NameLookUp(yvar,vm.model.yvars); //If many yvars say "various", otherwise the yvar name
			for (var key in request) {
				//X-var should not be in the title, yvar is taken care of. Also check that the name exists in model.variables (e.g. yvar names don't)
				if ((key!==request.xvar) && (key!==vm.model.yvars) && !((key===vm.model.timevar) && (vm.timelapse)) && (vm.model.VarExists(key))) {
					ptitle+=vm.model.PrintTitle(request[key][0],key);
				}
			};
			this.svgcont.append("g").append("text").attr("class","graphtitle").attr("x",.2*this.width0).attr("y",.66*this.height0).style("font-size","18px")
				.text(ptitle);
		}
	},

	DisplayWaitingMessage : function() {
		this.svgcont.selectAll("g").attr("opacity",.4)
		this.svgcont.append("g").append("text").attr("class","graphtitle").attr("x",this.width0/2).attr("y",this.height0/2).style("font-size","32px").text("Waiting for data from the server...");
	},

	SetPlotTitle : function(ptitle) {
		var pv = this;
		this.maintitle=this.svgcont.append("g")
			.append("text").attr("class","graph-title")
			.text(ptitle)
			.attr("dy",1+"em").attr("y","0");
		this.maintitle.call(pv.wrap,pv.width);
		this.maintitle.selectAll("tspan").attr("x",function(d) { return (pv.legendx-this.getComputedTextLength())/2.; });

		this.AdjustUIElements();
	},

	SetXaxisLabel : function(xlab,offset) {
		var offs = offset || 0;
		var pv = this;
		var h = pv.margin.top + pv.margin.bottom + pv.titleheight + pv.height+offs;
		this.xaxislabel
			.text(xlab)
			.attr("x",function(d) { return (pv.margin.left+pv.margin.right+pv.width-this.getComputedTextLength())/2.; })
			.attr("y",h)
			//.attr("dy","1em");
		this.svgcont.attr("height",h+pv.margin.bottom);

		this.AdjustUIElements();
	},

	SetYaxisLabel : function(ylab,offset) {
		var offs = offset || 0;
		var pv = this;
		var h = pv.margin.top + pv.margin.bottom + pv.titleheight + pv.height+offs;
		this.yaxislabel
			.text(ylab)		
			.attr("transform","rotate(-90)");

		var yaxlrect=this.yaxislabel.node().getBoundingClientRect();
		while ((-yaxlrect.top+yaxlrect.bottom)>pv.height)  {
			var fs=this.yaxislabel.style("font-size");
			this.yaxislabel.style("font-size",+fs.slice(0,-2)-1);
			yaxlrect=this.yaxislabel.node().getBoundingClientRect();
		} 
		
		this.yaxislabel
			.attr("transform","translate("+14+","+(pv.height + pv.margin.top + this.xaxislabelheight + this.titleheight - yaxlrect.top + yaxlrect.bottom)*.5+")rotate(-90)");

		this.AdjustUIElements();
	},

	AdjustUIElements : function() {
		// Fully compatible according to https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY?redirectlocale=en-US&redirectslug=DOM%2Fwindow.scrollY
		// var supportPageOffset = window.pageXOffset !== undefined;
		// var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

		// var wsX = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
		// var wsY = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;

		var wsY=window.scrollY || window.pageYOffset;
		var wsX=window.scrollX || window.pageXOffset;

		var chartrect=this.svgcont.node().getBoundingClientRect();
		var xaxlrect=this.xaxislabel.node().getBoundingClientRect();

		var sellength=this.xvarselector.node().getBoundingClientRect();
		sellength = sellength.right-sellength.left;

		this.xvarselector
			.style("position","absolute")
			.style("left",(chartrect.left+wsX+(this.margin.left+this.margin.right+this.width-sellength)/2.)+"px")
			.style("top",(xaxlrect.top+wsY)+"px");

		this.cvarselector
			.style("position","absolute")
			.style("left",(chartrect.left+wsX+this.width+this.margin.left+ this.margin.right)+"px")
			.style("top",(chartrect.top+wsY+this.margin.top)+"px");

		this.scaleui
			.style("position","absolute")
			.style("left",(this.yaxislabel.node().getBoundingClientRect().left+wsX)+"px")
			.style("top",(xaxlrect.top+wsY)+"px");
	},

	wrap: function(text, width) {
	  	text.each(function() {
		    var text = d3.select(this),
		        words = text.text().split(/[\s]+/).reverse(),
		        word,
		        line = [],
		        lineNumber = 0,
		        lineHeight = 1.1, // ems
		        y = text.attr("y"),
		        dy = parseFloat(text.attr("dy")),
		        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	        while (word = words.pop()) {
	        	line.push(word);
	        	tspan.text(line.join(" "));
	        	if (tspan.node().getComputedTextLength() > width) {
	        		line.pop();
	        		tspan.text(line.join(" "));
	        		line = [word];
	        		if (tspan.node().getComputedTextLength()>0) //Corrected to not make a new line when even the single word is too long
	        			lineNumber++;
		        	tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
	   		 	}
			}
	  	});
	}
};