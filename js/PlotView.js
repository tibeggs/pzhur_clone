var BDSVis = BDSVis || {};

//The visual elements of the plot: SVGs for the graph/map and legend
BDSVis.PlotView = {
	margin : {top: 20, right: 30, bottom: 20, left: 80},
	width0 : 850,
	height0 : 450,
	legendwidth: 250,
	titleheight: 15,
	xaxislabelheight: 40,
	Init : function() {
		//Define margins and dimensions of the SVG element containing the chart
		var margin = this.margin;

		this.width = this.width0 - margin.left - margin.right;
		this.height = this.height0 - margin.top - margin.bottom;
		var width=this.width;
		var height=this.height;

		//Select the SVG element, remove old drawings, add grouping element for the chart
		var svgcont = d3.select("#chartsvg");
		svgcont.selectAll("*").remove();
		this.svg=svgcont.attr("width", width + margin.left + margin.right+this.legendwidth)
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
		this.legendsvg=d3.select("#chartsvg")
			.append("g")
			.attr("transform","translate("+(width+margin.left+ margin.right)+","+height*.3+")")
			.attr("class","leglabel legbox");
		
		//X-axis label
		this.xaxislabel=d3.select("#chartsvg").append("text")
			.attr("class","xaxislabel")
			.attr("y",(height + margin.top + this.xaxislabelheight + this.titleheight));
	}
};