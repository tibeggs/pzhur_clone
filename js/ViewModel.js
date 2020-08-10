var BDSVis = BDSVis || {};

BDSVis.ViewModel = function (model) {
    var vm = this;
    var tmod = model;
    //Reference to the model, which contains variable names and name look up tables/functions (in model.js file)
    this.model = model;

    //Reference to the visual elements of the plot: SVGs for the graph/map and legend (PlotView.js)
    this.PlotView = BDSVis.PlotView;

    //Reference to the table showing the data; (TableView.js)
    this.TableView = BDSVis.TableView;

    this.DrawUI = function () {

        var rgb = d3.select("#regimebuttons");
        var bug = d3.select("#buttonsundergraph");
        bug.selectAll('*').remove();
        rgb.selectAll('*').remove();

        //UI elements for plotting regime switching: cartograms/map, heatchart/plot
        //set x selector to year
        function selectElement(id, valueToSelect) {
            let element = document.getElementById(id);
            element.value = valueToSelect;
            //vm.setxvar(valueToSelect);
            //vm.heatchart;
            //vm.heatchart = +2;
            vm.setxvar(valueToSelect);
            //console.log(tmod.regimeselector[0][0].value);
            //!vm.heatchart; vm.heatchart = +this.value; vm.getBDSdata();
            //tmod.regimeselector[0][0].value = this.value;
            
            //tmod.regimeselector[0][0].value = this.value
        }
        //if (tmod.regimeselector != undefined) {
        //    if (tmod.regimeselector[0][0].value == 2) {
        //        selectElement("xelector1", "year2");
        //        console.log("ran");
        //        //vm.getBDSdata();
        //        console.log(tmod.regimeselector[0][0].value);
        //    }
        //}
        function CreateButtonSelector(selector, name, value) {
            var btn = document.createElement("Button");

            btn.innerHTML = name;
            btn.value = value;
            btn.className = xclass;
            if (value == 2) {
                btn.onclick = function () { !vm.heatchart; vm.heatchart = +this.value; vm.getBDSdata(); vm.regimeselector[0][0].value = this.value; selectElement("xelector1", "year2"); tmod.regimex = this.value; };
            }
            if (value==0) {
                btn.onclick = function () { vm.heatchart; vm.heatchart = +this.value; vm.getBDSdata(); vm.regimeselector[0][0].value = this.value; tmod.regimex = this.value; tmod.regimex = this.value;};
            }
            if (value == 1) {
                btn.onclick = function () { !vm.heatchart; vm.heatchart = +this.value; vm.getBDSdata(); vm.regimeselector[0][0].value = this.value; selectElement("xelector1", "geo"); tmod.regimex = this.value; };
            }

            selector[0][0].appendChild(btn);
        }
        function AddButtonToVarSelector(selector, varvalues, whichvar, group) {
            for (i in varvalues) {
                name = varvalues[i].name;
                value = varvalues[i].code;

                if (vm.xvar === value) {
                    xclass = "xbtn active";
                } else {
                    xclass = "xbtn";
                }
                CreateButtonSelector(selector, name, value, xclass)
            };
        }

        var rkey = [{ name: "Barchart", code: 0 }, { name: "LineChart", code: 2 }, { name: "Map", code: 1 }];
        vm.regimeselector = [[{ value: 0 }]]

        if (vm.geomap()) {
            vm.regimeselector = bug.append("select").on("change", function () { vm.cartogram = +this.value; vm.getBDSdata(); });
            vm.regimeselector.append("option").text("Map").attr("value", 0).property("selected", function (d) { return vm.cartogram === 0; });
            vm.regimeselector.append("option").text("Non-cont Cartogram").attr("value", 1).property("selected", function (d) { return vm.cartogram === 1; });
            AddButtonToVarSelector(rgb, rkey);
        } else //if (!vm.model.IsContinuous(vm.ActualVarCode(vm.xvar))) {
        {
            AddButtonToVarSelector(rgb, rkey);
            //vm.regimeselector=bug.append("select").on("change", function() {vm.heatchart=+this.value; vm.getBDSdata();});
            //vm.regimeselector.append("option").text("Barchart").attr("value", 0).property("selected", function (d) { return (!vm.heatchart);});
            ////vm.regimeselector.append("option").text("Spotchart").attr("value", 1).property("selected", function (d) { return vm.heatchart; });
            //vm.regimeselector.append("option").text("Linechart").attr("value", 2).property("selected", function (d) { return vm.heatchart; });

        };
        bug.append("h4").text(" ");

        //UI elements for Save and Show Data and
        bug.append("button").text("Show Data").on("click", vm.toggleshowdata);
        if (!vm.timelapse) {
            bug.append("button").text("Save SVG").on("click", function () { BDSVis.util.savesvg('svg'); });
            bug.append("button").text("Save PNG").on("click", function () { BDSVis.util.savesvg('png'); });
        }
        if ((vm.xvar !== vm.model.timevar) && (vm.cvar !== vm.model.timevar))
            bug.append("button").text(vm.timelapse ? "Stop" : "Time Lapse").on("click", vm.toggletimelapse);


        //UI elements for controlling the Time Lapse
        if (vm.timelapse) {
            bug = bug.append("span")
            var sel = bug.append("h4").text("From: ").append("select");
            sel.selectAll("option").data(vm.model[vm.model.timevar]).enter()
                .append("option").attr("value", function (d) { return d; }).text(function (d) { return d; })
                .property("selected", function (d) { return vm.timelapsefrom === d; });
            sel.on("change", function () { vm.timelapsefrom = this.value; });

            sel = bug.append("h4").text("To: ").append("select");
            sel.selectAll("option").data(vm.model[vm.model.timevar]).enter()
                .append("option").attr("value", function (d) { return d; }).text(function (d) { return d; })
                .property("selected", function (d) { return vm.timelapseto === d; });
            sel.on("change", function () { vm.timelapseto = this.value });

            sel = bug.append("h4").text("Speed: ").append("select");
            sel.selectAll("option").data(vm.model.timelapsespeeds).enter()
                .append("option").attr("value", function (d) { return d.code; }).text(function (d) { return d.name; })
                .property("selected", function (d) { return vm.timelapsespeed === d.code; });
            sel.on("change", function () { vm.timelapsespeed = this.value });
            return;
        };

        //UI elements for measure selection
        var selectors = d3.select('.selectors');
        selectors.selectAll('*').remove();

        function AddSelectorWOptions(varr, isundergroupvar) {
            var varr1code = isundergroupvar ? vm.SelectedOpts[varr.code][0] : varr.code;
            var multiple = vm.multiple(varr.code) && (!vm.model.IsGroup(varr) || isundergroupvar);
            selectors.append("select")//Add the selector
                .on("change", function () {
                    vm.SelectedOpts[varr1code] = d3.selectAll(this.childNodes)[0].filter(function (d) { return d.selected }).map(function (d) { return d.value });
                    vm.getBDSdata();
                })
                .property("multiple", multiple)
                .classed("tallselector", multiple)
                .property("disabled", (vm.xvar === varr.code) && (!vm.model.IsGroup(varr) || isundergroupvar))
                .selectAll("option").data(vm.model[varr1code]).enter()
                .append("option")
                .property("selected", function (d) {
                    var selind = vm.SelectedOpts[varr1code].indexOf(vm.model.IsContinuous(varr) ? d.toString() : d.code);
                    return vm.multiple(varr.code) ? (selind !== -1) : (selind === 0);
                })
                .text(function (d) { return vm.model.IsContinuous(varr1code) ? d : d.name; })
                .attr("value", function (d) { return vm.model.IsContinuous(varr1code) ? d : d.code; });
        };

        //UI elements for variable selection
        var selectorm = d3.select('.selectorm');
        selectorm.selectAll('*').remove();

        function AddSelectorMOptions(varr, isundergroupvar) {
            var varr1code = isundergroupvar ? vm.SelectedOpts[varr.code][0] : varr.code;
            var multiple = vm.multiple(varr.code) && (!vm.model.IsGroup(varr) || isundergroupvar);
            selectorm.append("select")//Add the selector
                .on("change", function () {
                    vm.SelectedOpts[varr1code] = d3.selectAll(this.childNodes)[0].filter(function (d) { return d.selected }).map(function (d) { return d.value });
                    vm.getBDSdata();
                })
                .property("multiple", multiple)
                .classed("tallselector", multiple)
                .property("disabled", (vm.xvar === varr.code) && (!vm.model.IsGroup(varr) || isundergroupvar))
                .selectAll("option").data(vm.model[varr1code]).enter()
                .append("option")
                .property("selected", function (d) {
                    var selind = vm.SelectedOpts[varr1code].indexOf(vm.model.IsContinuous(varr) ? d.toString() : d.code);
                    return vm.multiple(varr.code) ? (selind !== -1) : (selind === 0);
                })
                .text(function (d) { return vm.model.IsContinuous(varr1code) ? d : d.name; })
                .attr("value", function (d) { return vm.model.IsContinuous(varr1code) ? d : d.code; });
        };

        vm.model.variables.forEach(function (varr) { //For each variable create selector and buttons
            //console.log(varr);
            if (varr.name != "Measure") { //Exception for measure
                selectors.append("h4").text(varr.name + ":"); //Add the title for selector

                AddSelectorWOptions(varr, false); //Add the selector for the variable

                if (vm.model.IsGroup(varr)) { //Add selector for the choice selected in the group variable selector
                    selectors.append("br");
                    selectors.append("h4");
                    AddSelectorWOptions(varr, true);
                };

                if (varr.aslegend) { //Add the 'Compare' button

                    var cbut = selectors.append("button")
                        .on("click", function () { vm.setcvar(varr.code); })
                        .classed("activebutton", vm.multiple(varr.code))
                        .property("disabled", (vm.geomap() || (vm.xvar === varr.code) || (vm.cvar === varr.code)))
                        .text("Compare " + varr.name + "s");
                    if (vm.model.IsGroup(varr.code))
                        cbut.text("Compare " + vm.model.NameLookUp(vm.SelectedOpts[varr.code][0], 'var') + "s")
                };

                if (varr.asaxis) //Add the 'Make X' button
                    selectors.append("button")
                        .on("click", function () { vm.setxvar(varr.code); })
                        .classed("activebutton", vm.xvar === varr.code)
                        .property("disabled", (!vm.model.IsGeomapvar(varr)) && ((vm.xvar === varr.code) || (vm.cvar === varr.code)))
                        .text(vm.model.IsGeomapvar(varr) ? "See Map" : "Make X-axis");
                selectors.append("br");
            }
            else {
                AddSelectorMOptions(varr, false); //Add the selector for the variable

                if (vm.model.IsGroup(varr)) { //Add selector for the choice selected in the group variable selector
                    selectorm.append("br");
                    selectorm.append("h4");
                    AddSelectorMOptions(varr, true);
                };

                if (varr.aslegend) { //Add the 'Compare' button

                    var cbut = selectorm.append("button")
                        .on("click", function () { vm.setcvar(varr.code); })
                        .classed("activebutton", vm.multiple(varr.code))
                        .property("disabled", (vm.geomap() || (vm.xvar === varr.code) || (vm.cvar === varr.code)))
                        .text("Compare " + varr.name + "s");
                    if (vm.model.IsGroup(varr.code))
                        cbut.text("Compare " + vm.model.NameLookUp(vm.SelectedOpts[varr.code][0], 'var') + "s")
                };

                if (varr.asaxis) //Add the 'Make X' button
                    selectorm.append("button")
                        .on("click", function () { vm.setxvar(varr.code); })
                        .classed("activebutton", vm.xvar === varr.code)
                        .property("disabled", (!vm.model.IsGeomapvar(varr)) && ((vm.xvar === varr.code) || (vm.cvar === varr.code)))
                        .text(vm.model.IsGeomapvar(varr) ? "See Map" : "Make X-axis");
                selectorm.append("br");

            }
        });
    };


    this.ActualVarCode = function (varcode) {
        //Checks if the varname is group variable, then returns code of the variable selected. 
        //If not group variable just returns the input (supposedly the variable code)
        return vm.model.IsGroup(varcode) ? vm.SelectedOpts[varcode][0] : varcode;
    };

    // The reference to function that forms and sends API request and gets data (apirequest.js)
    this.getBDSdata = function () {
        d3.select(".selectors").selectAll('*').property("disabled", true);//remove();// Disable all selectors and buttons while data is loading
        BDSVis.getAPIdata(vm);
        //this.PlotView.Refresh();
        //DrawUI();
    };

    //SHOW DATA BUTTON

    //The boolean flag for whether the data table is shown
    this.ShowData = false; //Initial value
    this.toggleshowdata = function () {
        //This function executes in click to 'Show Data' button.
        vm.ShowData = !vm.ShowData;
        d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
        d3.select("#chartsvg").style("display", vm.ShowData ? "none" : "");
        d3.select("#cvarselector").style("display", vm.ShowData ? "none" : "");
        d3.select("#logbutton").style("display", vm.ShowData ? "none" : "");
        //d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
        vm.TableView.SetLowerHeadersWidth();
    };

    //TIME LAPSE BUTTON
    //Whether time lapse regime is on	
    this.timelapse = false;//ko.observable(false); //Initial value
    //this.tlbuttontext = ko.computed (function() {return vm.timelapse?"Stop":"Time Lapse"}); //Text on the button
    this.toggletimelapse = function () {
        //This function executes in click to 'Stop'/'Time Lapse' button and stops time lapse animation or starts it.
        if (vm.timelapse) {
            vm.timelapse = false;
            clearInterval(vm.tlint); //Stop the animation
            vm.SelectedOpts[vm.model.timevar] = [vm.TimeLapseCurrYear - 1]; //Set the year to the year currently shown in animation

        } else {
            vm.timelapse = true;

        }
        vm.getBDSdata();
    };

    this.timelapsefrom = vm.model.LookUpVar(vm.model.timevar).range[0];
    this.timelapseto = vm.model.LookUpVar(vm.model.timevar).range[1] - 1;
    this.timelapsespeed = vm.model.timelapsespeeds[Math.floor(vm.model.timelapsespeeds.length / 2)].code;

    //LOG SCALE BUTTON
    //Whether the scale of y-axis is Log or Linear
    this.logscale = false; //Initial value

    //Zoom by rectangle checkbox
    this.zoombyrect = true;

    //Geo Map regime
    this.geomap = function () {
        return vm.model.IsGeomapvar(vm.xvar);
    };

    this.region = "US";
    this.cartogram = 0;
    this.heatchart = 0;

    //Set the incompatible variables to values corresponding totals
    function SetToTotals(varname) {
        if (vm.model.LookUpVar(vm.ActualVarCode(varname)).incompatible !== undefined)
            vm.model.LookUpVar(vm.ActualVarCode(varname)).incompatible.forEach(function (incvar) {
                vm.SelectedOpts[incvar] = [vm.model[incvar][vm.model.LookUpVar(incvar).total].code];
            });
    };

    //The following functions set cvar (Legend/Comparison/Color variable) and xvar (X-axis variable)
    this.setcvar = function (varname) {
        vm.cvar = varname;

        SetToTotals(varname)

        vm.getBDSdata();
    };

    this.setxvar = function (varname) {
        vm.xvar = varname;
        if (vm.geomap()) {
            vm.cvar = vm.model.yvars;
        }
            

        var varname1 = vm.ActualVarCode(varname);
        vm.IncludedXvarValues[varname1] = vm.model.GetCodes(varname1);

        SetToTotals(varname);

        vm.getBDSdata();
    };


    this.multiple = function (varname) {
        return vm.geomap() ? false : (varname === vm.cvar);
    }

    //Arrays storing values selected in input selectors and exclusion/inclusion of specific values of x-variable
    this.SelectedOpts = {};
    this.IncludedXvarValues = {};
    function AddVarToArrays(varr) {
        var initial = (vm.model.IsContinuous(varr)) ? [vm.model[varr.code][varr.default].toString()] : [vm.model[varr.code][varr.default].code];
        vm.SelectedOpts[varr.code] = initial;
        vm.IncludedXvarValues[varr.code] = vm.model.GetCodes(varr.code);
    };
    this.model.variables.forEach(function (varr) {
        AddVarToArrays(varr);
        if (vm.model.IsGroup(varr))
            varr.variables.forEach(function (varrj) {
                AddVarToArrays(varrj);
            });
    });

    //Initial values of X-axis variable and C- variable
    this.xvar = "fage4";
    this.cvar = "sic1";

    this.PlotView.Init();

    this.PlotView.DisplayWaitingMessage();
    //this.DrawUI();

    //Call initial plot
    vm.getBDSdata();

};