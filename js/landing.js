var BDSVis = BDSVis || {};
vm = BDSVis.ViewModel;
console.log(vm);
function grabinput() {
    var xvar = document.getElementById("xvar").value;
    var cvar = document.getElementById("cvar").value;
    var regi = document.getElementById("regi").value;
    var meas = document.getElementById("meas").value;
    localStorage.setItem("xvar", xvar);
    localStorage.setItem("cvar", cvar);
    localStorage.setItem("regi", regi);
    localStorage.setItem("meas", meas);
    console.log(xvar);
    console.log(cvar);
    console.log(regi);
    console.log(meas);
    //window.location.href = "app.html";
}