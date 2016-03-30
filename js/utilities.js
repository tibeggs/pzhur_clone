var BDSVis = BDSVis || {};

BDSVis.util = {
	//This is a general use function for whenever the number should be printed in format with fixed significant digits and M and k for millions and thousands
	NumFormat : function(d,sigdig) {
		//"sigdig" is how many digits to show
		var exp=Math.floor(Math.log(Math.abs(d))/Math.log(10))-sigdig+1;
		var mantissa= Math.floor(d/(Math.pow(10,exp)));
		if (Math.abs(d)>1e+6)
			return d3.format("."+(6-exp)+"f")(mantissa*(Math.pow(10,exp-6)))+"M";
		else if (Math.abs(d)>1e+3)
			return d3.format("."+(3-exp)+"f")(mantissa*(Math.pow(10,exp-3)))+"k";
		else if (Math.abs(d)>1)
			return d3.format("."+(-exp)+"f")(d);
		else if (Math.abs(d)>5e-2)
			return d3.format(".2f")(d);
		else return d3.format(".f")(d);
	},

	//Automatic text wrapping function by Mike Bostock, http://bl.ocks.org/mbostock/1846692, corrected
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
	},

	preparesavesvg: function() {

		//get svg element.
		var svg = document.getElementById("chartsvg");

		d3.text('css/style.css',function(data) {
			var style = document.createElement("style");
    		style.appendChild(document.createTextNode(data));
   			svg.appendChild(style);
   			//get svg source.
			var serializer = new XMLSerializer();
			//debugger;
			var source = serializer.serializeToString(svg);

			//add name spaces.
			if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
			    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
			}
			if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
			    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
			}
			//debugger;
			//add xml declaration
			source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

			//convert svg source to URI data scheme.
			var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

			//set url value to a element's href attribute.
			d3.select("#savelink").attr("href",url).attr("download","BDS.svg");
		});
	}
};