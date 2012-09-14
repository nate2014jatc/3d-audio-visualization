/**
*
* Be sure, the user has Firefox
*
*/
window.onload = function(){

	if(navigator.userAgent.indexOf("Firefox")==-1){
		document.getElementById("browserDetection").style["display"] = "block";
	}

}