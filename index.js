(function () {
    var total = 1;
    var h1 = document.getElementById('h1');
    var timer = setInterval(function () {
        if (total >= 100) {
            total = 0;
        }
        total += 2;
        h1.innerText = total
    }, 1000);
})();