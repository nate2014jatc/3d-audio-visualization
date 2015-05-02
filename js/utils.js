(function () {
    window.OC = window.OC || {};

    OC.fadeOut = function (_elementName) {
        var elementStyle = document.getElementById(_elementName).style;

        (function fade() {
            (elementStyle.opacity -= .1) < 0 ? elementStyle.display = "none" : setTimeout(fade, 40);
        })();
    }
}());