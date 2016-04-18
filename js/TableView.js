var BDSVis = BDSVis || {};

BDSVis.TableView = {

	makeDataTable : function(data,cvar,xvar,vm) {

		var cvarvalues = d3.set(data.map(function(d) {return d[cvar]})).values(); //All the values of returned cvars
		cvarvalues.sort(function(a,b) { //Sorted like in model.js
				var arr=vm.model[cvar].map(function(d) {return d.name})
				return diff=arr.indexOf(a)-arr.indexOf(b);
		}) 
		var xvarvalues = d3.set(data.map(function(d) {return d[xvar]})).values(); //All the values of returned xvars
		//Data as table output via KnockOut
		vm.data( //Set the KnockOut observable array containing the data for displaying as a table ("Show Data" button)
			xvarvalues
				.map(function(xv){ return data.filter(function(d) {return d[xvar]===xv;});}) //Map a row of yvar values to each xvar value
				.map(function(dxv){
					return d3.merge([ [dxv[0][xvar]], //Add the xvar value as a first element of the row
							cvarvalues.map(function(cv){ //Map a yvar value to each cvar/xvar values pair (or, a column of yvar values to each cvar value)
								return dxv.filter(function(d) {return d[cvar]===cv})
										.map(function(d) {return d.value});
							})])
				})
		);
		vm.data.unshift(d3.merge([[vm.model.NameLookUp(xvar,"var") + " (row) \\ " +  vm.model.NameLookUp(cvar,"var") + " (col)"],cvarvalues])); //Header line: the xvar values + all the cvar values
		
		// //Data as table output via D3
		// var datashowtable = d3.select("#graphdata");
		// datashowtable.selectAll("*").remove()

		// datashowtable.append("thead")
		// 	.selectAll("th").data(d3.merge([[vm.model.NameLookUp(xvar,"var")],cvarvalues]))
		// 	.enter().append("th").text(function(d){return d});

		// datashowtable.append("tbody")
		// 	.selectAll("tr").data(xvarvalues.map(function(xv){
		// 		return data.filter(function(d) {return d[xvar]===xv;} //Map a row of yvar values to each xvar value
		// 	)}))
		// 	.enter().append("tr")
		// 		.selectAll("td")
		// 		.data(function(dxv) {
		// 			return d3.merge([ [dxv[0][xvar]], //Add the xvar value as a first element of the row
		// 							cvarvalues.map(function(cv){ //Map a yvar value to each cvar/xvar values pair (or, a column of yvar values to each cvar value)
		// 								return dxv.filter(function(d) {return d[cvar]===cv})
		// 										.map(function(d) {return d.value});
		// 							})])
		// 			}).enter().append("td")
		// 		.text(function(d) {return d});
		
		d3.select('#graphdata').selectAll('tr').attr("bgcolor",function(d,i) {return (i%2)?"#fff":"#eee";});
		this.SetLowerHeadersWidth();
	},

	SetLowerHeadersWidth : function() {
		d3.select('#graphdataheaders').selectAll('th')
			.data(d3.select('#graphdata').selectAll('th')[0].map(function(d) {return d.offsetWidth-1;}))
			.attr("width", function(d) {return d;}).style("padding",0);
	}
}