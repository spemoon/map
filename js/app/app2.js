(function($) {
    $(function() {
        // 载入脚本
        googleMap.loadScript();
        var map1, map2;
        
        $('#btn1').click(function() {
            var lat = +document.getElementById('lat').value;
            var lng = +document.getElementById('lng').value;
            if (!map1) {
                map1 = new googleMap({
                    node: 'map1',
                    lat: lat,
                    lng: lng
                });
            }
            map1.create().marker(lat, lng);
        });
        
        $('#btn2').click(function() {
            var address = document.getElementById('address').value;
            if (!map2) {
                map2 = new googleMap({
                    node: 'map2'
                });
            }
            map2.create().search(address, function() {
                this.infoWindow('hello').markerWindowEvent();
            });
        });
        
        $('#btn3').click(function() {
            if (!map2) {
                map2 = new googleMap({
                    node: 'map2'
                });
            }
            map2.create().getCurrentPosition();
        });
    });
})(jQuery);
