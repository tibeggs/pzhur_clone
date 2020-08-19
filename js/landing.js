var BDSVis = BDSVis || {};
vm = BDSVis.ViewModel;
console.log(vm);
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
    console.log(fsize);
    console.log(ifsize);
    //window.location.href = "app.html";
}