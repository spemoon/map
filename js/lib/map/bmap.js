(function($) {
    var config = {
        script: {
            id: 'baiduMap',
            idCity: 'CitySN',
            src: 'http://api.map.baidu.com/api?v=1.3&callback=',
            srcCity: 'http://pv.sohu.com/cityjson?ie=utf-8',
            callback: 'baiduMapCallback'
        },
        map: {
            zoom: 16,
            lat: 26.092812,
            lng: 119.307876
        }
    };
    
    var status = false; // 未载入地图脚本
    window[config.script.callback] = function() {
        status = true; // 标识可以使用地图
    };
    /**
     * 构造器
     * @param {Object} params
     *     node：{String} 必须，展示地图的容器id
     *     waiting：{Function} 可选，等待地图资源载入的提示函数
     *     loaded：{Function} 可选，地图生成完成后的回调
     *     lat：{Number} 可选，纬度
     *     lng：{Number} 可选，经度
     *     mapType：{String} 可选，地图类型
     *     zoom：{Number} 可选，地图缩放比例
     */
    var baiduMap = function(params) {
        this.node = typeof params.node == 'string' ? document.getElementById(params.node) : params.node;
        this.waiting = params.waiting ||
        function() {
            alert('正在准备地图资源，请稍候...');
        };
        this.loaded = params.loaded;
        this.lat = typeof params.lat != 'undefined' ? params.lat : config.map.lat;
        this.lng = typeof params.lng != 'undefined' ? params.lng : config.map.lng;
        this.mapType = params.mapType || config.map.type;
        this.zoom = params.zoom || config.map.zoom;
        this.localCityName = params.localCityName || returnCitySN.cname || '福州市';
    };
    /**
     * 静态方法：载入脚本
     */
    baiduMap.loadScript = function() {
        var script = document.getElementById(config.script.id);
        var scriptCity = document.getElementById(config.script.idCity);
        if (!script) {
            var url = config.script.src + config.script.callback;
            script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', url);
            script.setAttribute('id', config.script.id);
            var scripts = document.getElementsByTagName('script')[0];
            scripts.parentNode.insertBefore(script, scripts);
            
            script.onload = script.onreadystatechange = function() {
                if (!this.readyState || this.readyState === 'loaded') {
                    script.onload = script.onreadystatechange = null; //防止IE内存泄漏
                }
            }
        }
        if (!scriptCity) {
            var url = config.script.srcCity;
            script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', url);
            script.setAttribute('id', config.script.idCity);
            var scripts = document.getElementsByTagName('script')[0];
            scripts.parentNode.insertBefore(script, scripts);
            
            script.onload = script.onreadystatechange = function() {
                if (!this.readyState || this.readyState === 'loaded') {
                    script.onload = script.onreadystatechange = null; //防止IE内存泄漏
                }
            }
        }
    };
    
    baiduMap.prototype = (function() {
        return {
            constructor: baiduMap,
            /**
             * 创建地图
             */
            create: function() {
                if (status) {
                    if (!this.map) {
                        var _this = this;
                        this.map = new BMap.Map(this.node);
                        this.map.enableScrollWheelZoom();
                        var point = new BMap.Point(this.lng, this.lat);
                        var localCity = new BMap.LocalCity();
                        localCity.get(function(data) {
                            point = new BMap.Point(data.center.lng, data.center.lat);
                            _this.map.centerAndZoom(point, _this.zoom);
                            var marker = _this.marker(point, {
                                enableDragging: true
                            });
                            _this.map.addOverlay(marker);
                            _this.map.addControl(new BMap.NavigationControl());
                            _this.map.addControl(new BMap.OverviewMapControl());
                            _this.map.addControl(new BMap.MapTypeControl());  
                            _this.localCityName = data.name;
                            _this.loaded && this.loaded();
                        });
                        
                    }
                } else { // 还没载入
                    this.waiting();
                }
                return this;
            },
            /**
             * 根据地名搜索地图，并标志marker
             * @param {String} address，必须，地名
             * @param {Function} callback，可选，搜索到地图后的回调
             */
            search: function(address, callback) {
                if (address && this.map) {
                    this.map.clearOverlays();
                    if (!this.geocoder) {
                        this.geocoder = new BMap.Geocoder();
                    }
                    var _this = this;
                    this.searching = true;
                    this.geocoder.getPoint(address, function(point){
                        if (!point) {
                            alert("没有搜索到您需要的地址");
                            return;
                        }
                        _this.geocoder.getLocation(point, function(results) {
                            if(results === null){
                                alert("在前面加上城市会搜得更准哦");
                                return;
                            }
                            _this.marker(results.point, {
                                enableDragging: true,
                                callback: function() {
                                    callback && callback.call(_this);
                                }
                            });
                        });
                    }, _this.localCityName);
                }
                return this;
            },
            /**
             * 标识marker
             * @param {lng:Number, lat: Number} Point： 必须，点(经纬度)
             * @param {MarkerOptions} opts： 可选
             *        src = "http://dev.baidu.com/wiki/map/index.php?title=Class:%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB/MarkerOptions"
             */
            marker: function(point, params) {
                if (this.map) {
                    params = params || {};
                    this.markerPoint = new BMap.Marker(point, {
                        enableDragging: params.enableDragging
                    });
                    this.map.addOverlay(this.markerPoint);
                    if (params.center !== false) { // 默认居中
                        this.map.centerAndZoom(point, this.zoom);
                    }
                    params.callback && params.callback.call(this); // 回调
                }
                return this;
            },
            /**
             * 针对marker设置一个infoWindow
             * @param {String} content 展示的内容
             */
            infoWindow: function(content, callback) {
                if (this.map && this.markerPoint) {
                    var _this = this;
                    if (this.infoWin) {
                        this.infoWin.setContent(content);
                    } else {
                        this.infoWin = new BMap.InfoWindow(content);
                    }
                    this.markerPoint.openInfoWindow(this.infoWin);
                    this.markerPoint.addEventListener('click', function(e) {
                        _this.markerPoint.openInfoWindow(_this.infoWin);
                    });
                    this.infoWin.addEventListener('open', function(e) {
                        callback && callback.call(this, e);
                    });
                }
                return this;
            },
            /**
             * 根据point返回地理名称
             * @param {Point} point: 必须
             * @returns Describe what it returns
             */
            getArea: function(point, params) {
                var _this = this;
                params.before && params.before.call(this);
                if (!this.geocoder) {
                    this.geocoder = new BMap.Geocoder();
                }
                this.geocoder.getLocation(point, function(results) {
                    if (results != null) {
                        params.success && params.success.call(_this, results);
                    } else {
                        params.failure && params.failure.call(_this);
                    }
                });
                
            },
            /**
             * 公交线路绘制
             * @param {Map|Point|String} location: 必须
             * @param {TransitRouteOptions} opts: 可选
             * @returns Describe what it returns
             */
            transit: function(location, params, direction) {
                if (location) {
                    if (!this.transitRoute) {
                        this.transitRoute = new BMap.TransitRoute(location, params);
                    }
                    this.transitRoute.search(location, direction);
                    //console.log(this.transitRoute.getResults());
                }
            }
        };
    })();
    window.baiduMap = baiduMap;
})(jQuery);
