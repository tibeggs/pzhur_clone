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
	}
};