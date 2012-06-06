(function($) {
    var config = {
        script: {
            id: 'googleMap',
            src: 'http://ditu.google.cn/maps/api/js?v=3.7&sensor=false&language=zh-CN&callback=',
            callback: 'googleMapCallback'
        },
        map: {
            zoom: 16,
            lat: 26.075522,
            lng: 119.308044,
            type: 'ROADMAP'
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
    var googleMap = function(params) {
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
    };
    /**
     * 静态方法：载入脚本
     */
    googleMap.loadScript = function() {
        var script = document.getElementById(config.script.id);
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
    };
    /**
     * 纠偏
     */
    googleMap.correction = function(params) {
        params = params || {};
        var host = 'http://search1.mapabc.com/sisserver';
        var urlConfig = {
            config: 'BSPS',
            resType: 'json',
            gps: 1,
            glong: params.lng || config.map.lng,
            glat: params.lat || config.map.lat,
            cdma: 0,
            sid: 14136,
            nid: 0,
            bid: 8402,
            lon: 0,
            lat: 0,
            macs: '',
            a_k: 'c2b0f58a6f09cafd1503c06ef08ac7aeb7ddb91a3ce48789b37a6c2da3a69309fec4cfad868b6c21'
        };
        
        var url = host + '?';
        for (var i in urlConfig) {
            url += i + '=' + urlConfig[i] + '&';
        }
        
        $.post(params.url, {
            url: url
        }, function(data) {
            if (data.message == 'ok') {
                params.callback && params.callback(data.list[0].ceny, data.list[0].cenx);
            }
        }, 'json');
    };
    
    googleMap.prototype = (function() {
        return {
            constructor: googleMap,
            /**
             * 创建地图
             */
            create: function() {
                if (status) {
                    if (!this.map) {
                        var latlng = new google.maps.LatLng(this.lat, this.lng); // 设置坐标
                        var options = {
                            zoom: this.zoom,
                            center: latlng,
                            mapTypeId: google.maps.MapTypeId[this.mapType]
                        };
                        this.map = new google.maps.Map(this.node, options);
                        this.loaded && this.loaded();
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
                    if (!this.geocoder) {
                        this.geocoder = new google.maps.Geocoder();
                    }
                    var _this = this;
                    this.searching = true;
                    this.geocoder.geocode({
                        address: address
                    }, function(results, status) {
                        this.searching = false;
                        if (status == google.maps.GeocoderStatus.OK) {
                            _this.map.setCenter(results[0].geometry.location);
                            _this.marker(results[0].geometry.location.Ra || results[0].geometry.location.Pa, results[0].geometry.location.Sa || results[0].geometry.location.Qa, {
                                draggable: true,
                                callback: function() {
                                    callback && callback.call(_this); // 回调
                                }
                            });
                        } else {
                            alert("没有搜索到您需要的地址");
                        }
                    });
                }
                return this;
            },
            searchLL: function(lat, lng, callback) {
				var _this = this;
                this.setCenter(lat, lng);
                this.marker(lat, lng, {
                    draggable: true,
                    callback: function() {
                        callback && callback.call(_this); // 回调
                    }
                });
            },
            /**
             * 地图路线渲染
             * @param {String|Latlng} destination: 必须，目的地
             * @param {String|Latlng} origin: 必须，起点
             * @param {TravelMode} travelMode: 必须，方式
             * @returns Describe what it returns
             */
            direction: function(params) {
                if (this.map) {
                    var _this = this;
                    var destination = typeof params.destination != 'undefined' ? params.destination : '';
                    var origin = typeof params.origin != 'undefined' ? params.origin : '';
                    var travelMode = typeof params.travelMode != 'undefined' ? params.travelMode : google.maps.TravelMode.DRIVING;
                    if (!this.directionsRenderer) {
                        this.directionsRenderer = new google.maps.DirectionsRenderer();
                    }
                    if (params.renderTo) {
                        this.directionsRenderer.setPanel(params.renderTo);
                    }
                    this.directionsRenderer.setMap(this.map);
                    if (!this.directionsService) {
                        this.directionsService = new google.maps.DirectionsService();
                    }
                    console.log(destination);
                    this.directionsService.route({
                        destination: destination,
                        origin: origin,
                        travelMode: travelMode
                    }, function(results, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            _this.directionsRenderer.setDirections(results);
                        }
                    });
                }
            },
            /**
             * 标识marker
             * @param {Number} lat： 可选，纬度
             * @param {Number} lng： 可选，经度
             * @param {Object} params
             *     icon：{String} 可选，头像
             *     center：{Boolean} 可选，是否以marker为地图中心，默认true
             *     draggable：{Boolean} 可选，marker是否可以拖拽，默认false
             *     callback：{Function} 可选，标识marker后的回调
             */
            marker: function(lat, lng, params) {
                if (this.map) {
                    params = params || {};
                    if (this.markerPoint) {
                        this.markerPoint.setMap(null);
                    }
                    this.markerPoint = new google.maps.Marker({
                        position: new google.maps.LatLng(lat, lng),
                        icon: params.icon,
                        draggable: !!params.draggable,
                        map: this.map
                    });
                    if (params.center !== false) { // 默认居中
                        this.setCenter(lat, lng);
                    }
                    params.callback && params.callback.call(this); // 回调
                }
                return this;
            },
            /**
             * 设置中心点
             * @param {Number} lat： 必须，纬度
             * @param {Number} lng： 必须，经度
             */
            setCenter: function(lat, lng) {
                if (this.map) {
                    this.map.setCenter(new google.maps.LatLng(lat, lng));
                }
                return this;
            },
            /**
             * 设置地图类型
             * ROADMAP，用于显示默认的道路地图视图
             * SATELLITE，用于显示 Google 地球卫星图像
             * HYBRID，用于同时显示普通视图和卫星视图
             * TERRAIN，用于根据地形信息显示实际地图
             */
            setMapType: function(type) {
                if (this.map) {
                    this.map.setMapTypeId(google.maps.MapTypeId[type] || google.maps.MapTypeId.ROADMAP);
                }
            },
            /**
             * 获取个人当前PC所在位置
             * @param {Object} params
             *     icon：{String} 可选，头像
             *     center：{Boolean} 可选，是否以marker为地图中心，默认true
             *     draggable：{Boolean} 可选，marker是否可以拖拽，默认true
             *     success：{Function} 成功获取地理位置后的回调
             *     failure：{Function} 获取地理位置失败后的回调
             */
            getCurrentPosition: function(params) {
                var _this = this;
                params = params || {};
                if (navigator.geolocation) { // 浏览器地理坐标
                    navigator.geolocation.getCurrentPosition(function(position) {
                        if (_this.searching !== true) {
                            console.log(position.coords.latitude);
                            _this.marker(position.coords.latitude, position.coords.longitude, {
                                icon: params.icon,
                                center: params.center,
                                draggable: params.draggable !== false,
                                callback: function() {
                                    params.success && params.success.call(_this, position.coords.latitude, position.coords.longitude);
                                }
                            });
                        }
                    }, function() { // 获取失败
                        if (_this.searching !== true) {
                            _this.marker(_this.lat, _this.lng, {
                                icon: params.icon,
                                center: params.center,
                                draggable: params.draggable !== false,
                                callback: function() {
                                    params.failure && params.failure.call(_this, _this.lat, _this.lng);
                                }
                            });
                        }
                    });
                } else {
                    _this.marker(_this.lat, _this.lng, {
                        icon: params.icon,
                        center: params.center,
                        draggable: params.draggable !== false,
                        callback: function() {
                            params.failure && params.failure.call(_this, _this.lat, _this.lng);
                        }
                    });
                }
                return this;
            },
            /**
             * 针对marker设置一个infoWindow
             * @param {String} content 展示的内容
             */
            infoWindow: function(content, callback) {
                if (this.map && this.markerPoint) {
                    if (this.infoWin) {
                        this.infoWin.setContent(content);
                    } else {
                        this.infoWin = new google.maps.InfoWindow({
                            content: content
                        });
                    }
                    this.infoWin.open(this.map, this.markerPoint);
                }
                return this;
            },
            /**
             * 给marker绑定显示infoWindow的事件
             */
            markerWindowEvent: function() {
                if (this.map && this.markerPoint && this.infoWin) {
                    var _this = this;
                    google.maps.event.addListener(this.markerPoint, 'click', function() {
                        _this.infoWin.open(_this.map, _this.markerPoint);
                    });
                }
                return this;
            },
            route: function() {
            
            },
            getArea: function(lat, lng, params) {
                var _this = this;
                params.before && params.before.call(this);
                if (!this.geocoder) {
                    this.geocoder = new google.maps.Geocoder();
                }
                this.geocoder.geocode({
                    location: new google.maps.LatLng(lat, lng)
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        params.success && params.success.call(_this, results[0], results);
                    } else {
                        params.failure && params.failure.call(_this);
                    }
                });
                
            }
        };
    })();
    window.googleMap = googleMap;
})(jQuery);
