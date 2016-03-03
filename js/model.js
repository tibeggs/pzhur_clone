var BDSVis = BDSVis || {};

BDSVis.Model = {
	variables : [
		{
			"name" : "sic1",
			"fullname" : "Sector",
			"type" : "categorical",
			"aslegend" : true,
			"asaxis" : true,
			"incompatible" : ["state"]
		},
		{
			"name" : "measure",
			"fullname" : "Measure",
			"type" : "categorical",
			"aslegend" : true,
			"asaxis" : false 
		},
		{
			"name" : "state",
			"fullname" : "State",
			"type" : "categorical",
			"aslegend" : true,
			"asaxis" : true,
			"incompatible" : ["sic1"]
		},
		{
			"name" : "year2",
			"fullname" : "Year",
			"type" : "continuous",
			"aslegend" : true,
			"asaxis" : true
		},
		{
			"name" : "fchar",
			"fullname" : "Firm Characteristic",
			"type" : "variablegroup",
			"aslegend" : true,
			"asaxis" : true,
			"variables" : [
				 {
					"name" : "fage4",
					"fullname" : "Firm Age",
					"type" : "categorical",
					"aslegend" : true,
					"asaxis" : true
				 },
				 {
					"name" : "fsize",
					"fullname" : "Firm Size",
					"type" : "categorical",
					"aslegend" : true,
					"asaxis" : true
				 },
				 {
					"name" : "ifsize",
					"fullname" : "Initial Firm Size",
					"type" : "categorical",
					"aslegend" : true,
					"asaxis" : true
				 }

			]}
	],
	state : [
		{"code" : "00", "name" : "United States", "st":"US"},
		{"code" : "01", "name" : "Alabama", "st" : "AL" },
		{"code" : "02", "name" : "Alaska", "st" : "AK" },
		{"code" : "04", "name" : "Arizona", "st" : "AZ" },
		{"code" : "05", "name" : "Arkansas", "st" : "AR" },
		{"code" : "06", "name" : "California", "st" : "CA" },
		{"code" : "08", "name" : "Colorado", "st" : "CO" },
		{"code" : "09", "name" : "Connecticut", "st" : "CT" },
		{"code" : "10", "name" : "Delaware", "st" : "DE" },
		{"code" : "11", "name" : "District of Columbia", "st" : "DC" },
		{"code" : "12", "name" : "Florida", "st" : "FL" },
		{"code" : "13", "name" : "Georgia", "st" : "GA" },
		{"code" : "15", "name" : "Hawaii", "st" : "HI" },
		{"code" : "16", "name" : "Idaho", "st" : "ID" },
		{"code" : "17", "name" : "Illinois", "st" : "IL" },
		{"code" : "18", "name" : "Indiana", "st" : "IN" },
		{"code" : "19", "name" : "Iowa", "st" : "IA" },
		{"code" : "20", "name" : "Kansas", "st" : "KS" },
		{"code" : "21", "name" : "Kentucky", "st" : "KY" },
		{"code" : "22", "name" : "Louisiana", "st" : "LA" },
		{"code" : "23", "name" : "Maine", "st" : "ME" },
		{"code" : "24", "name" : "Maryland", "st" : "MD" },
		{"code" : "25", "name" : "Massachusetts", "st" : "MA" },
		{"code" : "26", "name" : "Michigan", "st" : "MI" },
		{"code" : "27", "name" : "Minnesota", "st" : "MN" },
		{"code" : "28", "name" : "Mississippi", "st" : "MS" },
		{"code" : "29", "name" : "Missouri", "st" : "MO" },
		{"code" : "30", "name" : "Montana", "st" : "MT" },
		{"code" : "31", "name" : "Nebraska", "st" : "NE" },
		{"code" : "32", "name" : "Nevada", "st" : "NV" },
		{"code" : "33", "name" : "New Hampshire", "st" : "NH" },
		{"code" : "34", "name" : "New Jersey", "st" : "NJ" },
		{"code" : "35", "name" : "New Mexico", "st" : "NM" },
		{"code" : "36", "name" : "New York", "st" : "NY" },
		{"code" : "37", "name" : "North Carolina", "st" : "NC" },
		{"code" : "38", "name" : "North Dakota", "st" : "ND" },
		{"code" : "39", "name" : "Ohio", "st" : "OH" },
		{"code" : "40", "name" : "Oklahoma", "st" : "OK" },
		{"code" : "41", "name" : "Oregon", "st" : "OR" },
		{"code" : "42", "name" : "Pennsylvania", "st" : "PA" },
		{"code" : "44", "name" : "Rhode Island", "st" : "RI" },
		{"code" : "45", "name" : "South Carolina", "st" : "SC" },
		{"code" : "46", "name" : "South Dakota", "st" : "SD" },
		{"code" : "47", "name" : "Tennessee", "st" : "TN" },
		{"code" : "48", "name" : "Texas", "st" : "TX" },
		{"code" : "49", "name" : "Utah", "st" : "UT" },
		{"code" : "50", "name" : "Vermont", "st" : "VT" },
		{"code" : "51", "name" : "Virginia", "st" : "VA" },
		{"code" : "53", "name" : "Washington", "st" : "WA" },
		{"code" : "54", "name" : "West Virginia", "st" : "WV" },
		{"code" : "55", "name" : "Wisconsin", "st" : "WI" },
		{"code" : "56", "name" : "Wyoming", "st" : "WY" }],
	fage4 : [
		{"code" : "a", "name" : "0" },
		{"code" : "b", "name" : "1" },
		{"code" : "c", "name" : "2" },
		{"code" : "d", "name" : "3" },
		{"code" : "e", "name" : "4" },
		{"code" : "f", "name" : "5" },
		{"code" : "g", "name" : "6-10" },
		{"code" : "h", "name" : "11-15" },
		{"code" : "i", "name" : "16-20" },
		{"code" : "j", "name" : "21-25" },
		{"code" : "k", "name" : "26+" },
		{"code" : "l", "name" : "Born before '76" },
		{"code" : "m", "name" : "All Ages" }],

	fsize : [
		{"code" : "a", "name" : "1-4" },
		{"code" : "b", "name" : "5-9" },
		{"code" : "c", "name" : "10-19" },
		{"code" : "d", "name" : "20-49" },
		{"code" : "e", "name" : "50-99" },
		{"code" : "f", "name" : "100-249" },
		{"code" : "g", "name" : "250-499" },
		{"code" : "h", "name" : "500-999" },
		{"code" : "i", "name" : "1000-2499" },
		{"code" : "j", "name" : "2500-4999" },
		{"code" : "k", "name" : "5000-9999" },
		{"code" : "l", "name" : "10000+" },
		{"code" : "m", "name" : "All Sizes" }],

	sic1 : [
		{"code" : 00, "acr" : "EW", "name" : "Economy Wide" },
		{"code" : 07, "acr" : "AGR", "name" : "Agriculture, Forestry, and Fishing" },
		{"code" : 10, "acr" : "MIN", "name" : "Mining" },
		{"code" : 15, "acr" : "CON", "name" : "Construction" },
		{"code" : 20, "acr" : "MAN", "name" : "Manufacturing" },
		{"code" : 40, "acr" : "TCU", "name" : "Transportation, Communication, and Public Utilities" },
		{"code" : 50, "acr" : "WHO", "name" : "Wholesale Trade" },
		{"code" : 52, "acr" : "RET", "name" : "Retail Trade" },
		{"code" : 60, "acr" : "FIRE", "name" : "Finance, Insurance, and Real Estate" },
		{"code" : 70, "acr" : "SRV", "name" : "Services" }],
		
	measure : [
		{"code" : "firms", "name" : "Number of firms" },
		{"code" : "estabs", "name" : "Number of establishments" },
		{"code" : "emp", "name" : "Employment" },
		{"code" : "estabs_entry", "name" : "Establishments born during the last 12 months" },
		{"code" : "estabs_entry_rate", "name" : "Establishment birth rate" },
		{"code" : "estabs_exit", "name" : "Establishments exiting during the last 12 months" },
		{"code" : "estabs_exit_rate", "name" : "Establishment exit rate" },
		{"code" : "job_creation", "name" : "Jobs created over the last 12 months" },
		{"code" : "job_creation_births", "name" : "Jobs created by establishment births over the last 12 months" },
		{"code" : "job_creation_continuers", "name" : "Jobs created by continuing establishments over the last 12 months" },
		{"code" : "job_creation_rate_births", "name" : "Jobs creation rate from establishment births" },
		{"code" : "job_creation_rate", "name" : "Job creation rate" },
		{"code" : "job_destruction", "name" : "Jobs destroyed within the last 12 months" },
		{"code" : "job_destruction_deaths", "name" : "Jobs destroyed by establishment exit over the last 12 months" },
		{"code" : "job_destruction_continuer", "name" : "Jobs destroyed at continuing establishments over the last 12 months" },
		{"code" : "job_destruction_rate_deat", "name" : "Jobs destruction rate from establishment exit" },
		{"code" : "job_destruction_rate", "name" : "Jobs destruction rate" },
		{"code" : "net_job_creation", "name" : "Net job creation" },
		{"code" : "net_job_creation_rate", "name" : "Net job creation rate" },
		{"code" : "reallocation_rate", "name" : "Reallocation rate" },
		{"code" : "firmdeath_firms", "name" : "Number of firm exits" },
		{"code" : "firmdeath_estabs", "name" : "Establishment exit due to firm death" },
		{"code" : "firmdeath_emp", "name" : "Job destruction from firm exit" }],

	fchar : [
		{"code" : "fage4", "name" : "Firm age"},
		{"code" : "fsize", "name" : "Firm size"},
		{"code" : "ifsize", "name" : "Initial firm size"}
	],

	varnames : {
		"sic1" : "Sector",
		"state" : "State",
		"year2" : "Year",
		"measure" : "Measure",
		"fchar" : "Firm Characteristic"
	},

	measlookup : {},
 	statelookup : {},
 	fagelookup : {},
 	fsizelookup: {},
 	sic1lookup: {},
 	fcharlookup: {},
	VarLookUp: {},

 	year2: [],

//Color schemes
	fage4color: [],
	fsizecolor: [],

	InitModel : function() {
		for (var i in this.variables) {
			this.VarLookUp[this.variables[i].name]=i;
		}
			
		//Create dictionaries/hashmaps to lookup names of categorical variable values
		for (var i in this.state)
			this.statelookup[this.state[i].code]=this.state[i].name;
		for (var i in this.measure)
			this.measlookup[this.measure[i].code]=this.measure[i].name;
		for (var i in this.fage4)
			this.fagelookup[this.fage4[i].code]=this.fage4[i].name;
		for (var i in this.fsize)
			this.fsizelookup[this.fsize[i].code]=this.fsize[i].name;
		for (var i in this.sic1)
			this.sic1lookup[this.sic1[i].code]=this.sic1[i].name;
		for (var i in this.fchar)
			this.fcharlookup[this.fchar[i].code]=this.fchar[i].name;

		//Create list of years
		for (var i=1977; i<2014; i++)
			this.year2.push(i);

		//Generate color scales for fage4 and fsize
		var scage=d3.scale.pow().exponent(1.).domain([0,26]).range(["#CB2027","#265DAB"]);
		var fages=[0,1,2,3,4,5,10,15,20,25,30];
		for (var ifage in fages) this.fage4color.push(scage(fages[ifage]));
		this.fage4color.push("green");
		this.fage4color.push("black");

		var scsize=d3.scale.log().domain([1,10000]).range(["#CB2027","#265DAB"]);
		var fsizes=[1,5,10,30,50,100,250,500,1000,2500,5000,10000];
		for (var ifsize in fsizes ) this.fsizecolor.push(scsize(fsizes[ifsize]));
		this.fsizecolor.push("black");
	},

	GetDomain : function(v) {
		if ((v==="fsize") || (v==="ifsize"))
			return this.fsize.map(function(d) { return d.name; })
		else
			return this[v].map(function(d) { return d.name; });
	},

	NameLookUp : function(d,v) {
		if (v==="fage4")
			return this.fagelookup[d]
		else if ((v==="fsize") || (v==="ifsize"))
			return this.fsizelookup[d]
		else if (v==="measure")
			return this.measlookup[d]
		else if (v==="state")
			return this.statelookup[d]
		else if (v==="sic1")
			return this.sic1lookup[d]
		else if (v==="year2")
			return d
		else if (v==="fchar")
			return this.fcharlookup[d]
		else if (v==="var") {
			if ((d==="fsize") || (d==="ifsize") || (d==="fage4"))
				return this.fcharlookup[d]
			else return this.varnames[d]
		}
		else return "Variable is not among: fage4,fsize,ifsize,measure,state"

	},

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
	}

};