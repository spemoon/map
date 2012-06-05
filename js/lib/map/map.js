(function(MDK, $) {
    var mdk = MDK.require({
        util: {
            lang: 'lang',
            dom: 'dom',
            ajax: 'ajax'
        }
    });
    
    var config = {
        title: '',
        footer: '注：地图位置坐标仅供参考，具体情况以实际道路标识信息为准',
        loadingTextWidth: 72,
        url: {
            map: 'http://ditu.google.cn/maps?daddr={point}&dirflg=r' // 地图站点地址
        }
    };
    
    var mapHistory = {
        xhr: null,
        url: ''
    };
    
    
    var helper = {
        infoWindow: function(params) {
            var html = '';
            html += '<div class="m-map-content">';
            html += '    <p>';
            html += '        <a href="' + baseurl + 'user/' + params.user.id + '" target="_blank">' + params.user.name + '</a>';
            html += '        <span>：嘿，我在这呢！</span>';
            html += '    </p>';
            html += '    <p>';
            html += '        <a href="' + baseurl + 'client" target="_blank">下载手机客户端，随时随地发送所非中国手机号格式在位置！</a>';
            html += '    </p>';
            html += '    <p>';
            html += '        <a href="' + config.url.map.replace(/{point}/g, params.lat + ',' + params.lng) + '" target="_blank">去google地图查询详细</a>';
            html += '    </p>';
            html += '    <img src="' + params.user.avatar + '" width="48" height="48"/>';
            html += '</div>';
            return html;
        },
        show: function() {
        
            //__obj.loading.hide();
        },
        loadHistory: function(keyword, page, node, obj, force) {
            node.find('.map-suggest').eq(0).show().css('z-index', 999999);
            node.find('.map-history').eq(0).addClass('open');
            mdk.ajax.single('mapHistory', {
                type: 'GET',
                url: baseurl + 'im/map_history?keyword=' + keyword + '&page=' + (page || 1),
                before: function() {
                    node.find('ul').eq(0).html('<li class="first"><a href="#">正在载入数据...</a></li>');
                },
                success: function(data) {
                    var html = [];
                    data = data.data;
                    var len = data.data.length;
                    if (len) {
                        for (var i = 0; i < len; i++) {
                            html[i] = '<li class="item ' + (i == 0 ? ' first' : '') + '" data-lng="' + data.data[i].longitude + '" data-lat="' + data.data[i].latitude + '"><a href="#">' + data.data[i].address + '</a></li>'
                        }
                        node.find('ul').eq(0).html(html.join(''));
                        
                        var total = +data.total;
                        var page = +data.page;
                        var size = +data.pagesize;
                        var totalPage = Math.ceil(total / size);
                        
                        if (totalPage > 1) {
                            html = '<div class="wrap">';
                            if (page <= 1) {
                                html += '<a class="disabled" data-action="prevPage" href="#">上页</a>';
                            } else {
                                html += '<a href="#" data-action="prevPage" data-page="' + (page - 1) + '">上页</a>';
                            }
                            if (page >= totalPage) {
                                html += '<a class="disabled" data-action="nextPage" href="#">下页</a>';
                            } else {
                                html += '<a href="#" data-action="nextPage" data-page="' + (page + 1) + '">下页</a>';
                            }
                            html += '</div>';
                            node.find('.pagnation').eq(0).show().html(html);
                        } else {
							node.find('.pagnation').eq(0).hide().html('');
						}
                        
                        node.find('li.item').hover(function() {
                            $(this).addClass('hover');
                        }, function() {
                            $(this).removeClass('hover');
                        }).click(function() {
                            helper.getItem($(this), node, obj);
                            return false;
                        });
                        
                        node.find('a[data-action="prevPage"]').click(function() {
                            var n = $(this);
                            if (!n.hasClass('disabled')) {
                                helper.loadHistory($.trim(node.find('input.keyword').eq(0).val()), n.attr('data-page'), node, obj);
                            }
                            return false;
                        });
                        
                        node.find('a[data-action="nextPage"]').click(function() {
                            var n = $(this);
                            if (!n.hasClass('disabled')) {
                                helper.loadHistory($.trim(node.find('input.keyword').eq(0).val()), n.attr('data-page'), node, obj);
                            }
                            return false;
                        });
                    } else {
                        if (force) {
                            node.find('ul').eq(0).html('<li class="first"><a href="#">暂无数据</a></li>');
                        } else {
                            helper.hideHistory(node);
                        }
                    }
                },
                failure: function() {
                    helper.hideHistory(node);
                },
                error: function() {
                    helper.hideHistory(node);
                },
                finish: function() {
                
                }
            });
        },
        hideHistory: function(node) {
            node.find('.map-history').eq(0).removeClass('open');
            node.find('.map-suggest').eq(0).hide();
            node.find('ul').eq(0).html('');
        },
        itemIndex: function(node, type) {
            var list = node.find('.map-suggest li.item');
            var item = node.find('.map-suggest li.hover').eq(0);
            var index = -1;
            if (item[0]) {
                for (var i = 0, len = list.length; i < len; i++) {
                    if (item[0] == list.eq(i)[0]) {
                        index = i;
                        break;
                    }
                }
            }
            if (type == 'up') {
                index--;
                if (index < 0) {
                    index = len - 1;
                }
            } else if (type == 'down') {
                index++;
                if (index >= len) {
                    index = 0;
                }
            }
            node.find('.map-suggest li.hover').removeClass('hover');
            list.eq(index).addClass('hover')
        },
        getItem: function(item, node, obj) {
            var lat = item.attr('data-lat');
            var lng = item.attr('data-lng');
            node.find('input.keyword').eq(0).val(item.find('a').eq(0).text());
            if (obj.map) {
                obj.map.searchLL(lat, lng, function() {
                    this.infoWindow('<a title="分享该地址" class="b-3" href="#" data-action="shareLocation">分享该地址</a>').markerWindowEvent();
                });
            }
            helper.hideHistory(node);
        }
    };
    MDK.cmp('map', {
        width: 650,
        height: 450,
        contentWidth: 320,
        html: function() {
            return mdk.dom.box({
                className: 'm-map' + (this.className ? (' ' + this.className) : ''),
                html: function() {
                    this.mapId = MDK.id();
                    var html = '';
                    html += '<div class="m-map-head">';
                    html += '    <a href="#" class="m-map-close" data-action="close">x</a>';
                    html += '    <div class="m-map-search">'
                    //html += '        <input type="text" class="m-map-search-input ipt-0"/>';
                    //html += '        <input type="button" value="搜索" class="m-map-search-btn b-1"/>';
                    
                    html += '          <div class="map-search">';
                    html += '              <a href="#" class="btn-icon map-history"></a>';
                    html += '              <input type="input" class="keyword ipt-0"/>';
                    html += '              <input type="button" value="" class="btn-search"/>';
                    html += '          </div>';
                    
                    html += '          <div class="map-suggest hide">';
                    html += '              <ul>';
                    html += '              </ul>';
                    html += '              <div class="pagnation hide">';
                    html += '                  <a class="disabled" href="#">上页</a>';
                    html += '                  <a href="#">下页</a>';
                    html += '              </div>';
                    html += '          </div>';
                    
                    html += '    </div>';
                    html += '</div>';
                    html += '<div class="m-map-loading">地图载入中...</div>';
                    html += '<div class="m-map-body" id="' + this.mapId + '"></div>';
                    html += '<div class="m-map-foot"></div>'
                    return html;
                },
                scope: this
            });
        },
        style: function() {
            var node = $(this.mainNode);
            var body = node.children('.m-map-body').eq(0);
            var loading = node.children('.m-map-loading').eq(0);
            body.css({
                width: this.width,
                height: this.height
            });
            loading.css({
                top: this.height / 2,
                left: (this.width - config.loadingTextWidth) / 2
            })
        },
        event: function() {
            var node = $(this.mainNode);
            var close = node.find('.m-map-close').eq(0);
            var searchBtn = node.find('.btn-search').eq(0);
            var searchInput = node.find('.keyword').eq(0);
            var mapHistoryBtn = node.find('.map-history').eq(0);
            var mapSuggest = node.find('.map-suggest').eq(0);
            var searchBox = node.find('.m-map-search').eq(0);
            var timer;
            var historyKeyword = '';
            this.bind({
                node: close,
                handler: function(e, element) {
                    this.unrender();
                    return false;
                }
            }).bind({
                node: searchBtn,
                handler: function(e, element) {
                    var _this = this;
                    if (this.map) {
                        this.map.search(searchBtn.prev('input').val(), function() {
                            this.infoWindow('<a title="分享该地址" class="b-3" href="#" data-action="shareLocation">分享该地址</a>').markerWindowEvent();
                        });
                    }
                    helper.hideHistory(searchBox);
                    return false;
                }
            }).bind({
                node: node,
                handler: function(e, element) {
                    var node = $(e.target), action = node.attr('data-action');
                    if (action) {
                        if (action == 'shareLocation') {
                            if (this.map) {
                                if (this.map.markerPoint) {
                                    this.shareLoactionAction && this.shareLoactionAction.call(this, this.map.markerPoint.position.Ra || this.map.markerPoint.position.Pa, this.map.markerPoint.position.Sa || this.map.markerPoint.position.Qa);
                                }
                            }
                        }
                        return false;
                    }
                }
            }).bind({
                node: searchInput,
                type: 'keydown',
                handler: function(e, element) {
                    var keyCode = e.keyCode;
                    if (keyCode == 13) {
                        var item = searchBox.find('li.hover').eq(0);
                        if (item[0]) {
                            historyKeyword = $.trim(item.find('a').eq(0).text());
                            helper.getItem(item, searchBox, this);
                        } else {
                            searchBtn.click();
                        }
                        return false;
                    } else if (keyCode == 38) { // 向上
                        helper.itemIndex(searchBox, 'up');
                        return false;
                    } else if (keyCode == 40) { // 向下
                        helper.itemIndex(searchBox, 'down');
                        return false;
                    }
                }
            }).bind({
                node: searchInput,
                type: 'focus',
                handler: function(e, element) {
                    var _this = this;
                    timer = true;
                    mdk.lang.timer({
                        rule: function() {
                            return timer;
                        },
                        callback: function() {
                            var temp = $.trim(searchInput.val());
                            if (temp.length > 0) {
                                if (historyKeyword != temp) {
                                    historyKeyword = temp;
                                    helper.loadHistory(historyKeyword, 1, searchBox, _this);
                                }
                            } else {
                                helper.hideHistory(searchBox);
                            }
                        },
                        step: 512
                    });
                }
            }).bind({
                node: searchInput,
                type: 'blur',
                handler: function(e, element) {
                    timer = false;
                }
            }).bind({
                node: mapHistoryBtn,
                handler: function() {
                    if (mapSuggest.is(':hidden')) {
                        helper.loadHistory('', 1, searchBox, this, true);
                    } else {
                        mapHistoryBtn.removeClass('open');
                        mapSuggest.hide();
                    }
                    return false;
                }
            });
            if (this.pop !== false) { // 是否是浮动模式
                this.bind({
                    node: $(window),
                    type: 'resize',
                    handler: function(e, element) {
                        var obj = {};
                        var flag = false;
                        if (!this.top) {
                            flag = true;
                            obj.top = Math.max(0, ($(window).height() - this.height) / 2);
                        }
                        if (!this.left) {
                            flag = true;
                            obj.left = this.referenceNode.offset().left + this.referenceNode.width() - this.width - 3;
                        }
                        if (flag) {
                            node.css(obj);
                        }
                    }
                });
            }
        },
        show: function(params) {
            var node = $(this.mainNode);
            var head = node.children('.m-map-head').eq(0);
            var body = node.children('.m-map-body').eq(0);
            var foot = node.children('.m-map-foot').eq(0);
            var close = node.find('.m-map-close').eq(0);
            var loading = node.children('.m-map-loading').eq(0);
            this.shareLoactionAction = params.shareLoactionAction;
            var left;
            params = params || {};
            foot[0].innerHTML = params.footer || config.footer;
            loading.show();
            if (this.referenceNode) {
                left = this.referenceNode.offset().left + this.referenceNode.width() - this.width - 3;
            } else {
                this.left = params.left;
            }
            if (params.top) {
                this.top = params.top;
            }
            var css = {
                display: 'block'
            };
            if (this.pop !== false) {
                css.top = params.top || (Math.max(0, ($(window).height() - this.height) / 2));
                css.left = params.left || left;
                css.zIndex = MDK.get('zIndex');
            } else {
                css.position = params.position || 'relative';
            }
            node.css(css);
            this.render();
            var _this = this;
            this.map = new googleMap({
                node: this.mapId,
                lat: params.lat,
                lng: params.lng,
                loaded: function() {
                    loading.hide();
                },
                waiting: function() {
                    _this.unrender();
                    _this.waiting && _this.waiting();
                    if (_this.cmp && _this.cmp.win) {
                        _this.cmp.win.alert({
                            title: '请稍候',
                            content: '正在准备地图资源，请稍候...'
                        });
                    } else {
                        alert('正在准备地图资源，请稍候...');
                    }
                }
            });
            if (params.search === true) {
                this.map.create().getCurrentPosition({
                    success: function() {
                        this.infoWindow('<p class="map-tip">您当前的位置</p><a title="分享该地址" class="b-3" href="#" data-action="shareLocation">分享该地址</a>').markerWindowEvent();
                    },
                    failure: function() {
                        this.infoWindow('<p class="map-tip">没有获取到您当前的位置，可以使用搜索来定位</p>').markerWindowEvent();
                        node.find('.m-map-search-input').eq(0).focus();
                    }
                });
            } else {
                this.map.create().marker(+params.lat, +params.lng, {
                    callback: function() {
                        this.infoWindow(helper.infoWindow(params)).markerWindowEvent();
                    }
                });
            }
        },
        setResult: function(lat, lng, area) {
            this.resultObj = {
                lat: lat,
                lng: lng,
                area: area
            };
        },
        getResult: function() {
            return this.resultObj;
        },
        clearResult: function() {
            this.resultObj = null;
        },
        unrender: function() {
            var node = $(this.mainNode);
            node.hide();
            if (this.renderTo && this.renderTo[0] && this.renderTo[0] !== document.body) {
                this.renderTo.hide();
            }
            this.top = null;
            this.left = null;
            helper.hideHistory(node.find('.m-map-search').eq(0));
			node.find('.keyword').eq(0).val('');
            return false;
        }
    });
})(MDK, jQuery)
