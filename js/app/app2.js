(function($) {
    $(function() {
        // 载入脚本
        googleMap.loadScript();
        var map1, map2, map3;
        
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
        
        var address = document.getElementById('address').value;
        $('#btn2').click(function() {
            if (!map2) {
                map2 = new googleMap({
                    node: 'map2'
                });
            }
            map2.create().search(address, function() {
                this.infoWindow('<a title="选定该地址" class="b-3" href="#" data-action="selectLocation">选定该地址</a>').markerWindowEvent();
            });
            if (!map3) {
                map3 = new googleMap({
                    node: 'map3'
                });
            }
            map3.create().search(address, function() {
                this.infoWindow('<p>起点:</p><input id="direction" data-action="from" name="" type="text" /><p><input type="button" data-action="go" id="go" value="去这里" /></p>').markerWindowEvent();
            });
        });
        
        $(document).click(function(e) {
            var target = $(e.target), action = target.attr('data-action');
            if(action){
                if(action == 'selectLocation'){
                    var map = map2;
                    if(map){
                        if (map.markerPoint) {
                            var lat = map.markerPoint.position.Ra || map.markerPoint.position.Pa;
                            var lng = map.markerPoint.position.Sa || map.markerPoint.position.Qa;
                            map.getArea(lat, lng, {
                                success: function(data) {
                                    document.getElementById('address').value = data['formatted_address'];
                                }
                            });
                        }
                    }
                } else if (action == "go") {
                    var origin = document.getElementById('direction').value;
                    var map = map3;
                    if (map) {
                        if (map.markerPoint) {
                            var lat = map.markerPoint.position.Ra || map.markerPoint.position.Pa;
                            var lng = map.markerPoint.position.Sa || map.markerPoint.position.Qa;
                            map.getArea(lat, lng, {
                                success: function(data) {
                                    map.direction({
                                        destination: new google.maps.LatLng(lat, lng),
                                        origin: origin,
                                        renderTo: document.getElementById('directions')
                                    });
                                }
                            });
                        }
                    }
                }
            }

        });
        
        $('#btn3').click(function() {
            if (!map3) {
                map3 = new googleMap({
                    node: 'map3'
                });
            }
            map3.create().getCurrentPosition();
        });
    });
})(jQuery);
