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
        var rgbsd = d3.select("#rshowdata");
        var bug = d3.select("#buttonsundergraph");
        bug.selectAll('*').remove();
        rgb.selectAll('*').remove();
        rgbsd.selectAll('*').remove();

        //UI elements for plotting regime switching: cartograms/map, heatchart/plot
        //set x selector to year
        function selectElement(id, valueToSelect) {
            let element = document.getElementById(id);
            element.value = valueToSelect;
            vm.setxvar(valueToSelect);
        }

        //Check to see if table view is on for regime buttons
        function shdCheck() {
            if (vm.ShowData) {
                vm.ShowData = !vm.ShowData;
                this.className += " act";



                var section = document.getElementById("regimebuttons");
                var btns = section.getElementsByClassName("xbtn");
                for (var i = 0; i < btns.length; i++) {
                    btns[i].addEventListener("click", function () {
                        var current = document.getElementsByClassName("active");
                        current[0].className = current[0].className.replace(" active", "");
                        this.className += " active";
                    });
                };

                d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
                d3.select("#resetHolder").style("display", vm.ShowData ? "none" : "");
                d3.select("#chartsvg").style("display", vm.ShowData ? "none" : "");
                d3.select("#cvarselector").style("display", vm.ShowData ? "none" : "");
                d3.select("#logbutton").style("display", vm.ShowData ? "none" : "");
                //d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
                vm.TableView.SetLowerHeadersWidth();
                vm.getBDSdata();
            }
        }
        //turn on and of xvariable selection
        function xvardisplay(option) {
            document.getElementById("xvarselector").style.display = option;
        }
        //create regime buttons function
        function CreateButtonSelector(selector, name, value, image) {
            var btn = document.createElement("Button");
            nameedit = "</br>" + name;
            btn.innerHTML = image + nameedit;
            btn.value = value;
            btn.className = xclass;
            if (value == 2) {
                btn.onclick = function () { xvardisplay("block"); !vm.heatchart; vm.heatchart = +this.value; selectElement("xelector1", "year2"); vm.getBDSdata(); vm.regimeselector[0][0].value = this.value; tmod.regimex = this.value; shdCheck(); };
            }
            if (value == 0) {
                btn.onclick = function () { selectElementS('selectorgeo', "state"); vm.SelectedOpts['geo'] = ['state']; xvardisplay("block"); vm.heatchart; vm.heatchart = +this.value; vm.getBDSdata(); vm.regimeselector[0][0].value = this.value; tmod.regimex = this.value; tmod.regimex = this.value; shdCheck(); };
            }
            if (value == 1) {
                btn.onclick = function () { xvardisplay("none"); vm.cvar = "measure"; !vm.heatchart; vm.heatchart = +this.value; vm.SelectedOpts['state'] = ['00']; vm.SelectedOpts['metropolitan statistical area'] = ['00']; selectElement("xelector1", "geo"); vm.regimeselector[0][0].value = this.value; tmod.regimex = this.value; vm.getBDSdata(); shdCheck(); };
            }
            selector[0][0].appendChild(btn);
        }
        //create regime buttons
        function AddButtonToVarSelector(selector, varvalues, whichvar, group) {
            for (i in varvalues) {
                name = varvalues[i].name;
                value = varvalues[i].code;
                image = varvalues[i].image;

                if (tmod.regimex == value) {
                    xclass = "xbtn active";
                } else {
                    xclass = "xbtn";
                }
                CreateButtonSelector(selector, name, value, image, xclass)
            };
        }
        //data for regime buttons
        var rkey = [{ name: "Barchart", code: 0, image: "<img src='images/bar_chart.png'>" }, { name: "LineChart", code: 2, image: "<img src='images/line_graph.png'>" }, { name: "Map", code: 1, image: "<img src='images/globe_icon.png'>" }];
        vm.regimeselector = [[{ value: 0 }]]

        if (vm.geomap() & tmod.regimex != 0) {
            vm.regimeselector = bug.append("select").on("change", function () { vm.cartogram = +this.value; vm.getBDSdata(); });
            vm.regimeselector.append("option").text("Map").attr("value", 0).property("selected", function (d) { return vm.cartogram === 0; });
            vm.regimeselector.append("option").text("Non-cont Cartogram").attr("value", 1).property("selected", function (d) { return vm.cartogram === 1; });
            AddButtonToVarSelector(rgb, rkey);
            xvardisplay("none");
        } else {
            AddButtonToVarSelector(rgb, rkey);
        };
        bug.append("h4").text(" ");

        //UI elements for Save and Show Data and
        var btnt = document.createElement("Button");
        btnt.id = "showdatabtn";
        btnt.innerHTML = "<img src='images/table.png'></br>Show Data";
        if (vm.ShowData) {
            btnt.className = "xbtnsd act";
        } else {
            btnt.className = "xbtnsd";
        }

        btnt.onclick = vm.toggleshowdata;
        rgbsd[0][0].appendChild(btnt);
        //rgb.append("button").text("Show Data").on("click", vm.toggleshowdata);
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
            var idname = "selector" + varr.code;
            if (document.getElementById(idname)) {
                idname = "selector" + varr.code + "sub";
            }
            selectors.append("select")//Add the selector
                .on("change", function () {
                    vm.SelectedOpts[varr1code] = d3.selectAll(this.childNodes)[0].filter(function (d) { return d.selected }).map(function (d) { return d.value });
                    vm.getBDSdata();
                })
                .attr("id", idname)
                .property("multiple", multiple)
                .classed("tallselector", multiple)
                .property("disabled", ((vm.xvar === varr.code) && (!vm.model.IsGroup(varr) || isundergroupvar)) || (varr.code == 'geo' && vm.xvar == 'geo' && tmod.regimex == 0))
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
                .attr("id", "mselect")
                //Add the selector
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
            if (varr.name != "Measure") { //Exception for measure
                selectors.append("br");
                selectors.append("h4").text(varr.name + ":"); //Add the title for selector

                AddSelectorWOptions(varr, false); //Add the selector for the variable

                if (vm.model.IsGroup(varr)) { //Add selector for the choice selected in the group variable selector
                    selectors.append("br");
                    selectors.append("h4");
                    AddSelectorWOptions(varr, true);
                };
            }
            else {
                AddSelectorMOptions(varr, false); //Add the selector for the variable

                if (vm.model.IsGroup(varr)) { //Add selector for the choice selected in the group variable selector
                    selectorm.append("br");
                    selectorm.append("h4");
                    AddSelectorMOptions(varr, true);
                };


                if (varr.asaxis) //Add the 'Make X' button
                    selectorm.append("button")
                        .on("click", function () { vm.setxvar(varr.code); })
                        .classed("activebutton", vm.xvar === varr.code)
                        .property("disabled", (!vm.model.IsGeomapvar(varr)) && ((vm.xvar === varr.code) || (vm.cvar === varr.code)))
                        .text(vm.model.IsGeomapvar(varr) ? "See Map" : "Make X-axis");
                selectorm.append("br");
            }
            //if (vm.xvar == 'geo') {
            //    selectElementS('selectorgeosub', "state");
            //}
        });
    };

    function selectElementS(id, valueToSelect) {
        let element = document.getElementById(id);
        element.value = valueToSelect;
    }
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
        this.className += " act";

        var section = document.getElementById("regimebuttons");
        var btns = section.getElementsByClassName("xbtn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", function () {
                var current = document.getElementsByClassName("active");
                current[0].className = current[0].className.replace(" active", "");
                this.className += " active";
            });
        };


        d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
        d3.select("#resetHolder").style("display", vm.ShowData ? "none" : "");
        d3.select("#chartsvg").style("display", vm.ShowData ? "none" : "");
        d3.select("#cvarselector").style("display", vm.ShowData ? "none" : "");
        d3.select("#logbutton").style("display", vm.ShowData ? "none" : "");
        //d3.select("#showdata").style("display", vm.ShowData ? "block" : "none");
        vm.TableView.SetLowerHeadersWidth();
        vm.getBDSdata();
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
        if (vm.model.IsGeomapvar(vm.xvar) & tmod.regimex == 1) {
            return true;
        } else {
            return false;
        }


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

    //reset button to defaults button
    var resetHolder = document.getElementById("resetHolder");
    var btn = document.createElement("Button");
    btn.innerHTML = "Reset to Defaults";
    btn.className = "resetBut";
    btn.onclick = function () {

        vm.PlotView.DisplayWaitingMessage();
        vm.regimeselector[0][0].value = lregi;
        tmod.regimex = lregi;
        getDefaults();
        vm.getBDSdata();
        //vm.shdCheck();
    }
    resetHolder.appendChild(btn);


    //Initial values of X-axis variable and C- variable
    var lxvar = localStorage.getItem("xvar");
    var lcvar = localStorage.getItem("cvar");
    var lregi = localStorage.getItem("regi");
    var lmeas = localStorage.getItem("meas");
    var lmeas = localStorage.getItem("meas");
    var lsic = localStorage.getItem("sic");
    var lstate = localStorage.getItem("state");
    var lmetro = localStorage.getItem("metro");
    var lyear = localStorage.getItem("year");
    var lfage = localStorage.getItem("fage");
    var lfchar = localStorage.getItem("fchar");
    var lfsize = localStorage.getItem("fsize");
    var lifsize = localStorage.getItem("ifsize");

    //set defaults from index
    function getDefaults() {
        if (lregi != null & lregi != "") {
            tmod.regimex = lregi;
        }
        if (lxvar == null || lxvar == "") {
            vm.xvar = "fage4";
        } else {
            vm.xvar = lxvar;
        }
        if (lcvar == null || lcvar == "") {
            vm.cvar = "sic1";
        }
        else {
            vm.cvar = lcvar;
        }
        if (lmeas != null & lmeas != "") {
            vm.SelectedOpts["measure"] = lmeas.split(',');
        }
        if (lsic != null & lsic != "") {
            vm.SelectedOpts["sic1"] = lsic.split(',');
        }
        if (lstate != null & lstate != "") {
            vm.SelectedOpts["state"] = lstate.split(',');
        }
        if (lmetro != null & lmetro != "") {
            vm.SelectedOpts["metro"] = lmetro.split(',');
        }
        if (lyear != null & lyear != "") {
            vm.SelectedOpts["year2"] = lyear.split(',');
        }
        if (lfage != null & lfage != "") {
            vm.SelectedOpts["fage4"] = lfage.split(',');
        }
        if (lfchar != null & lfchar != "") {
            vm.SelectedOpts["fchar"] = lfchar.split(',');
        }
        if (lfsize != null & lfsize != "") {
            vm.SelectedOpts["fsize"] = lfsize.split(',');
        }
        if (lifsize != null & lifsize != "") {
            vm.SelectedOpts["ifsize"] = lifsize.split(',');
        }

        lregi = tmod.regimex;
        lxvar = vm.xvar;
        lcvar = vm.cvar;
        lmeas = vm.SelectedOpts["measure"].join(',');
        lsic = vm.SelectedOpts["sic1"].join(',');
        lstate = vm.SelectedOpts["state"].join(',');
        lmetro = vm.SelectedOpts["metro"].join(',');
        lyear = vm.SelectedOpts["year2"].join(',');
        lfage = vm.SelectedOpts["fage4"].join(',');
        lfchar = vm.SelectedOpts["fchar"].join(',');
        lfsize = vm.SelectedOpts["fsize"].join(',');
        lifsize = vm.SelectedOpts["ifsize"].join(',');
    }

    getDefaults();


    this.PlotView.Init();

    this.PlotView.DisplayWaitingMessage();

    this.DrawUI();

    //Call initial plot
    vm.getBDSdata();

};