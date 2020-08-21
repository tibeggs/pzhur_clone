var BDSVis = BDSVis || {};
vm = BDSVis.ViewModel;
function grabinput() {
    var xvar = document.getElementById("xvar").value;
    var cvar = document.getElementById("cvar").value;
    var regi = document.getElementById("regi").value;
    var meas = document.getElementById("meas").value;
    var sic = document.getElementById("sic").value;
    var state = document.getElementById("state").value;
    var metro = document.getElementById("metro").value; 
    var year = document.getElementById("year").value;
    var fage = document.getElementById("fage").value;
    var fchar = document.getElementById("fchar").value;
    var fsize = document.getElementById("fsize").value;
    var ifsize = document.getElementById("ifsize").value;

    localStorage.setItem("xvar", xvar);
    localStorage.setItem("cvar", cvar);
    localStorage.setItem("regi", regi);
    localStorage.setItem("meas", meas);
    localStorage.setItem("sic", sic);
    localStorage.setItem("state", state);
    localStorage.setItem("metro", metro);
    localStorage.setItem("year", year);
    localStorage.setItem("fage", fage);
    localStorage.setItem("fchar", fchar);
    localStorage.setItem("fsize", fsize);
    localStorage.setItem("ifsize", ifsize);

    console.log(xvar);
    console.log(cvar);
    console.log(regi);
    console.log(meas);
    console.log(sic);
    console.log(state);
    console.log(metro);
    console.log(year);
    console.log(fage);
    console.log(fchar);
    console.log(fsize);
    console.log(ifsize);
    //window.location.href = "app.html";
}

function pushInput(xvar,cvar,regi,meas,sic,state,metro,year,fage,fchar,fsize,ifsize) {
    localStorage.setItem("xvar", xvar);
    localStorage.setItem("cvar", cvar);
    localStorage.setItem("regi", regi);
    localStorage.setItem("meas", meas);
    localStorage.setItem("sic", sic);
    localStorage.setItem("state", state);
    localStorage.setItem("metro", metro);
    localStorage.setItem("year", year);
    localStorage.setItem("fage", fage);
    localStorage.setItem("fchar", fchar);
    localStorage.setItem("fsize", fsize);
    localStorage.setItem("ifsize", ifsize);

    console.log(xvar);
    console.log(cvar);
    console.log(regi);
    console.log(meas);
    console.log(sic);
    console.log(state);
    console.log(metro);
    console.log(year);
    console.log(fage);
    console.log(fchar);
    console.log(fsize);
    console.log(ifsize);
}