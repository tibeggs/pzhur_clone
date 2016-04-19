var BDSVis = BDSVis || {};

//The visual elements of the plot: SVGs for the graph/map and legend
BDSVis.PlotView = {
	margin : {top: 20, right: 30, bottom: 20, left: 80},
	width0 : 850,
	height0 : 450,
	legendwidth: 250,
	titleheight: 15,
	xaxislabelheight: 20,
	Init : function(data,request,vm) {
		//Define margins and dimensions of the SVG element containing the chart
		var margin = this.margin;

		this.width = this.width0 - margin.left - margin.right;
		this.height = this.height0 - margin.top - margin.bottom;
		var width=this.width;
		var height=this.height;

		//Select the SVG element, remove old drawings, add grouping element for the chart
		this.svgcont = d3.select("#chartsvg");
		this.svgcont.selectAll("g").remove();

		this.svg=this.svgcont.attr("width", width + margin.left + margin.right+this.legendwidth)
			.attr("height", height + margin.top + margin.bottom + this.titleheight + this.xaxislabelheight)
			.append('g')
			.attr("transform", "translate(" + margin.left + "," + (margin.top+this.titleheight)+ ")")
			.attr('class', 'chart');

		d3.select("#buttonsundergraph").style("width",width + margin.left+"px");
		d3.select("#plotarea").style("width", width + margin.left + margin.right+this.legendwidth+"px");
		d3.select(".waiting-caption").style("width", width + margin.left + margin.right+this.legendwidth+"px");

		//d3.select("#graphdata").style("height", height + margin.top + margin.bottom-21+"px");

		//Clear legend, set size
		// this.legendsvg=d3.select("#legend").attr("width",400).attr("height",300);
		// this.legendsvg.selectAll("*").remove();
		this.legendx=width+margin.left+ margin.right;
		this.legendsvg=this.svgcont
			.append("g")
			.attr("transform","translate("+(width+margin.left+ margin.right)+","+height*.3+")")
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

		this.lowerrightcornertext=this.svgcont.append("g").append("text").attr("class","leglabel")
			.attr("x",width+margin.left+ margin.right)
			.attr("y",this.height0-margin.bottom);

		d3.select("#xvarselector").selectAll("select").remove();
		d3.select("#cvarselector").selectAll("select").remove();
		d3.select("#logbutton").selectAll("*").remove();
		if (!vm.timelapse()) { //Add UI controls is not in Time Lapse regime

			//Logscale Checkbox
			var boxsize=10;
			//this.logbutton = this.svgcont.append("g").attr("transform","translate(3,"+(height + margin.top + this.titleheight-boxsize/2.)+")");
			//this.logbutton.append("rect").attr("class","svguibutton").attr("width",35).attr("height",20).attr("fill","url(#grad1)").attr("stroke-width",.1).attr("stroke","#000");
			//this.logbutton.append("text").attr("class","svguitext").text("Log").attr("y",".75em").attr("x","15");
			//this.logbutton.append("rect").attr("class","svguibox")
			//	.attr("width",boxsize).attr("height",boxsize).attr("fill",vm.logscale()?"#090":"#fff");
			this.logbutton = d3.select("#logbutton")
				.append("input").attr("type","Checkbox")
				.property("checked",function(d) {return vm.logscale();})
			d3.select("#logbutton").append("span").text("Log")
			this.logbutton.on("click",function() { 
				vm.logscale(!vm.logscale());
				if (vm.geomap())
					BDSVis.makeMap(data,request,vm);
				else 
					BDSVis.makePlot(data,request,vm);
				//vm.getBDSdata();
				//d3.event.stopPropagation();
			});

			//X-axis variable selector			
			this.xaxisselector = d3.select("#xvarselector").append("select");
			this.xaxisselector.selectAll("option")
				.data(vm.model.variables.filter(function(d){return (d.asaxis && d.code!==vm.cvar())})).enter().append("option")
				.attr("value",function(d) {return d.code})
				.text(function(d) {return d.name})
				.property("selected",function(d){return d.code===vm.xvar()});
			//this.xaxisselector.append("option").property("selected",true).property("disabled",true).text("(Change X-axis)")
			this.xaxisselector.on("change", function() { vm.setxvar(this.value);} );
			if (vm.model.IsGroup(vm.xvar())) {
				this.xgroupselector = d3.select("#xvarselector").append("select");
				this.xgroupselector.selectAll("option")
					.data(vm.model[vm.xvar()]).enter().append("option")
					.attr("value",function(d) {return d.code})
					.text(function(d) {return d.name})
					.property("selected",function(d){return d.code===vm.SelectedOpts[vm.xvar()]()[0];});
				this.xgroupselector.on("change", function() {vm.SelectedOpts[vm.xvar()]([this.value]);});
			};

			if (!vm.geomap()) {
				//Legend variable (cvar) selector
				this.cvarselector = d3.select("#cvarselector").append("select");
				this.cvarselector.selectAll("option")
					.data(vm.model.variables.filter(function(d){return (d.aslegend && d.code!==vm.xvar())})).enter().append("option")
					.attr("value",function(d) {return d.code})
					.text(function(d) {return d.name})
					.property("selected",function(d){return d.code===vm.cvar()});
				this.cvarselector.on("change", function() { vm.setcvar(this.value);} );
				if (vm.model.IsGroup(vm.cvar())) {
					this.xgroupselector = d3.select("#cvarselector").append("select");
					this.xgroupselector.selectAll("option")
						.data(vm.model[vm.cvar()]).enter().append("option")
						.attr("value",function(d) {return d.code})
						.text(function(d) {return d.name})
						.property("selected",function(d){return d.code===vm.SelectedOpts[vm.cvar()]()[0];});
					this.xgroupselector.on("change", function() {vm.SelectedOpts[vm.cvar()]([this.value]);});
				};
			};
		};
		this.AdjustUIElements();
	},

	DisplayNoData : function() {
		this.svgcont = d3.select("#chartsvg");
		this.svgcont.selectAll("g").remove();
		this.svgcont.append("g").append("text").attr("class","graphtitle").attr("x",this.width0/2).attr("y",this.height0/2).style("font-size","32px").text("No data");
	},

	SetPlotTitle : function(ptitle) {
		var pv = this;
		this.maintitle=this.svgcont.append("g")
			.append("text").attr("class","graph-title")
			.text(ptitle)
			.attr("dy",1+"em").attr("y","0");
		this.maintitle.call(BDSVis.util.wrap,pv.width);
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

	AdjustUIElements : function() {
		//console.log(this.xaxislabel.node().getBoundingClientRect().top, this.xaxislabel.attr("y"));
		//console.log(this.svgcont.node().getBoundingClientRect().top*1.+this.xaxislabel.attr("y")*0.);
		//console.log(this.xaxislabel.node().getBoundingClientRect().top,window.scrollY)
		var chartrect=this.svgcont.node().getBoundingClientRect();
		var sellength=d3.select("#xvarselector").node().getBoundingClientRect().right-d3.select("#xvarselector").node().getBoundingClientRect().left;

		d3.select("#xvarselector")
			.style("position","absolute")
			//d3.select("#xvarselector").style("left",(chartrect.left+window.scrollX+(+this.xaxislabel.attr("x"))+this.xaxislabel.node().getComputedTextLength()*1.5)+"px")
			.style("left",(chartrect.left+window.scrollX+(this.margin.left+this.margin.right+this.width-sellength)/2.)+"px")
			.style("top",(this.xaxislabel.node().getBoundingClientRect().top+window.scrollY)+"px");

		d3.select("#cvarselector")
				.style("position","absolute")
				.style("left",(chartrect.left+window.scrollX+this.width+this.margin.left+ this.margin.right)+"px")
				.style("top",(this.svg.node().getBoundingClientRect().top+window.scrollY)+"px");

		d3.select("#logbutton")
			.style("position","absolute")
			.style("left",(this.yaxislabel.node().getBoundingClientRect().left+window.scrollX)+"px")
			.style("top",(this.xaxislabel.node().getBoundingClientRect().top+window.scrollY)+"px")

	}
};