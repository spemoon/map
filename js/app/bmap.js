(function($) {
    $(function() {
        // 载入脚本
        baiduMap.loadScript();
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
        
        $('#btn2').click(function() {
            var address = document.getElementById('address').value;
            if (!map2) {
                map2 = new baiduMap({
                    node: 'map2'
                });
            }
                /*map2.create().search(address, function(data) {*/
                    //var _this = this;
                    //this.infoWindow('<p>' + data + '</p><a title="选定该地址" class="b-3" id="select" href="#" data-action="selectLocation">选定该地址</a>', function(data) {
                        //$('#select').click(function() {
                            //if (_this.markerPoint) {
                                //var point = _this.markerPoint.getPosition();
                                //_this.getArea(point, {
                                    //success: function(results) {
                                        //document.getElementById('address').value = results.address;
                                    //}
                                //});
                            //}
                        //});
                    //});
                /*});*/
            if (!map3) {
                map3 = new baiduMap({
                    node: 'map3',
                    markPosition: 'transit'
                });
            }
            map3.create().search(address, function(data) {
                var _this = this;
                this.infoWindow('<p>' + data + '</p><p>起点:</p><input id="direction" data-action="from" name="" type="text" /><p><input type="button" data-action="go" id="go" value="去这里" /></p>', function() {
                    $('#go').click(function() {
                        var direction = $('#direction').val();
                        if (_this.markerPoint) {
                            var point = _this.markerPoint.getPosition();
                            console.log(point);
                            _this.transit(point, {
                                renderTo: 'directions'
                            }, direction);
                        }    
                        /*var point = _this.markerPoint.getPosition();*/
                        //var transit = new BMap.TransitRoute(_this, {  
                                //renderOptions: {map: _this, panel: "directions"}  
                            //});  
                        /*transit.search(direction, point);*/

                    });
                });
            });
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
