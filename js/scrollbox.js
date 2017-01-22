var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Scrollbox v4.0.0
 * (c) 2013-2017, Max Invis1ble
 * Licensed under MIT (https://opensource.org/licenses/mit-license.php)
 */

var Scrollbox = function ($) {

    var NAME = 'scrollbox';
    var VERSION = '4.0.0';
    var DATA_KEY = NAME;
    var JQUERY_NO_CONFLICT = $.fn[NAME];

    var ClassName = {
        OVERFLOWED: NAME + '-overflowed',
        RAIL: NAME + '-rail',
        BAR: NAME + '-bar',
        HORIZONTAL_RAIL: NAME + '-horizontal-rail',
        VERTICAL_RAIL: NAME + '-vertical-rail',
        HORIZONTAL_BAR: NAME + '-horizontal-bar',
        VERTICAL_BAR: NAME + '-vertical-bar',
        WRAPPER: NAME + '-wrapper',
        RAIL_SHOWN: NAME + '-rail-in',
        BAR_SHOWN: NAME + '-bar-in',
        BAR_CAPTURED: NAME + '-bar-captured'
    };

    var Position = {
        LEFT: 'left',
        RIGHT: 'right',
        TOP: 'top',
        BOTTOM: 'bottom'
    };

    var Default = {
        distanceToReach: {
            x: 0,
            y: 0
        },
        wheelSensitivity: 20,
        momentum: {
            acceleration: 1600,
            thresholdTime: 500
        },
        startAt: {
            x: Position.LEFT,
            y: Position.TOP
        },
        templates: {
            horizontalBar: '<div></div>',
            verticalBar: '<div></div>',
            horizontalRail: '<div></div>',
            verticalRail: '<div></div>',
            wrapper: '<div></div>'
        }
    };

    var Event = {
        REACH_LEFT: 'reach' + Position.LEFT + '.' + NAME,
        REACH_RIGHT: 'reach' + Position.RIGHT + '.' + NAME,
        REACH_TOP: 'reach' + Position.TOP + '.' + NAME,
        REACH_BOTTOM: 'reach' + Position.BOTTOM + '.' + NAME
    };

    var Scrollbox = function () {
        function Scrollbox(element, config) {
            _classCallCheck(this, Scrollbox);

            this._config = config;
            this._$element = $(element);

            this._$horizontalRail = $(config.templates.horizontalRail).addClass(ClassName.RAIL + ' ' + ClassName.HORIZONTAL_RAIL);

            this._$verticalRail = $(config.templates.verticalRail).addClass(ClassName.RAIL + ' ' + ClassName.VERTICAL_RAIL);

            this._$horizontalBar = $(config.templates.horizontalBar).addClass(ClassName.BAR + ' ' + ClassName.HORIZONTAL_BAR);

            this._$verticalBar = $(config.templates.verticalBar).addClass(ClassName.BAR + ' ' + ClassName.VERTICAL_BAR);

            this._syncElementSize();

            this._isHorizontalBarCaptured = false;
            this._isVerticalBarCaptured = false;
            this._horizontalBarTouchId = null;
            this._verticalBarTouchId = null;
            this._elementTouchId = null;

            this._previousPosition = {
                x: null,
                y: null
            };

            this._swipeStartPosition = {
                x: null,
                y: null
            };

            this._swipeStartedAt = null;

            this._hasCommonListeners = false;

            this._init();
        }

        Scrollbox.getVersion = function getVersion() {
            return VERSION;
        };

        Scrollbox.getDefault = function getDefault() {
            return Default;
        };

        /**
         *
         * @param {(Number|'left'|'right')} [x]
         * @param {(Number|'top'|'bottom')} [y]
         * @param {Object} [animationOptions]
         */


        Scrollbox.prototype.scrollTo = function scrollTo(x, y, animationOptions) {
            if (Position.LEFT === x) {
                x = 0;
            } else if (Position.RIGHT === x) {
                x = this._maxScrollLeft;
            } else if (undefined === x) {
                x = this._currentPosition.x;
            }

            if (Position.TOP === y) {
                y = 0;
            } else if (Position.BOTTOM === y) {
                y = this._maxScrollTop;
            } else if (undefined === y) {
                y = this._currentPosition.y;
            }

            this.scrollBy(x - this._currentPosition.x, y - this._currentPosition.y, animationOptions);
        };

        /**
         *
         * @param {Number} [deltaX=0]
         * @param {Number} [deltaY=0]
         * @param {Object} [animationOptions]
         */


        Scrollbox.prototype.scrollBy = function scrollBy(deltaX, deltaY, animationOptions) {
            var _this = this;

            if (undefined === deltaX) {
                deltaX = 0;
            }

            if (undefined === deltaY) {
                deltaY = 0;
            }

            if (0 === deltaX && 0 === deltaY) {
                this._checkIsReached();

                return;
            }

            var DESTINATION_X = this._currentPosition.x + deltaX;
            var DESTINATION_Y = this._currentPosition.y + deltaY;

            var computedDestinationX = void 0;
            var computedDestinationY = void 0;

            this._$element.stop(true, false);

            if (DESTINATION_X >= this._maxScrollLeft) {
                computedDestinationX = this._maxScrollLeft;
            } else if (DESTINATION_X <= 0) {
                computedDestinationX = 0;
            } else {
                computedDestinationX = DESTINATION_X;
            }

            if (DESTINATION_Y >= this._maxScrollTop) {
                computedDestinationY = this._maxScrollTop;
            } else if (DESTINATION_Y <= 0) {
                computedDestinationY = 0;
            } else {
                computedDestinationY = DESTINATION_Y;
            }

            if (undefined === animationOptions) {
                this._$element.scrollLeft(computedDestinationX);
                this._$element.scrollTop(computedDestinationY);
                this._currentPosition = {
                    x: computedDestinationX,
                    y: computedDestinationY
                };

                return;
            }

            animationOptions.progress = function (animation) {
                if (null === _this._currentPosition || computedDestinationX !== DESTINATION_X && computedDestinationX === _this._currentPosition.x && computedDestinationY !== DESTINATION_Y && computedDestinationY === _this._currentPosition.y) {
                    animation.stop();
                }
            };

            this._$element.animate({
                scrollLeft: DESTINATION_X,
                scrollTop: DESTINATION_Y
            }, animationOptions);
        };

        Scrollbox.prototype.update = function update() {
            this._sync();
            this._checkIsReached();
        };

        Scrollbox.prototype.destroy = function destroy() {
            if (this._hasCommonListeners) {
                this._removeCommonListeners();
            }

            this._$element.removeClass(ClassName.OVERFLOWED).unwrap().removeData(DATA_KEY);

            this._$horizontalRail.remove();
            this._$horizontalBar.remove();
            this._$verticalRail.remove();
            this._$verticalBar.remove();

            this._config = null;

            this._$horizontalRail = null;
            this._$horizontalBar = null;
            this._$verticalRail = null;
            this._$verticalBar = null;
            this._$wrapper = null;

            this._previousPosition = null;
            this._currentPosition = null;
            this._swipeStartPosition = null;

            this._swipeStartedAt = null;

            this._isReachEventTriggered = null;

            this._hasCommonListeners = null;

            this._elementOuterWidth = null;
            this._elementOuterHeight = null;
            this._maxScrollLeft = null;
            this._maxScrollTop = null;
        };

        Scrollbox.prototype._init = function _init() {
            this._$wrapper = this._$element.addClass(ClassName.OVERFLOWED).wrap(this._config.templates.wrapper).parent().addClass(ClassName.WRAPPER).append(this._$horizontalRail).append(this._$horizontalBar).append(this._$verticalRail).append(this._$verticalBar);

            this._syncCurrentPosition();
            this._sync();

            this.scrollTo(this._config.startAt.x, this._config.startAt.y);
        };

        Scrollbox.prototype._sync = function _sync() {
            var _isReachEventTriggere;

            var IS_OVERFLOWED_X = this._elementOuterWidth < this._$element[0].scrollWidth;
            var IS_OVERFLOWED_Y = this._elementOuterHeight < this._$element[0].scrollHeight;
            var IS_HORIZONTAL_SCROLL_SHOWN = this._$horizontalBar.hasClass(ClassName.BAR_SHOWN);
            var IS_VERTICAL_SCROLL_SHOWN = this._$verticalBar.hasClass(ClassName.BAR_SHOWN);

            this._syncElementSize();

            this._maxScrollLeft = this._$element[0].scrollWidth - this._elementOuterWidth;
            this._maxScrollTop = this._$element[0].scrollHeight - this._elementOuterHeight;

            this._$horizontalRail.width(this._elementOuterWidth);
            this._$verticalRail.height(this._elementOuterHeight);

            if (IS_OVERFLOWED_X) {
                this._updateHorizontalBarSize();
                this._updateHorizontalBarPosition();

                if (!IS_HORIZONTAL_SCROLL_SHOWN) {
                    this._addListenersToHorizontalScroll();

                    this._$horizontalBar.addClass(ClassName.BAR_SHOWN);
                    this._$horizontalRail.addClass(ClassName.RAIL_SHOWN);
                }
            } else {
                if (IS_HORIZONTAL_SCROLL_SHOWN) {
                    this._removeListenersFromHorizontalScroll();

                    this._$horizontalBar.removeClass(ClassName.BAR_SHOWN);
                    this._$horizontalRail.removeClass(ClassName.RAIL_SHOWN);
                }
            }

            if (IS_OVERFLOWED_Y) {
                this._updateVerticalBarSize();
                this._updateVerticalBarPosition();

                if (!IS_VERTICAL_SCROLL_SHOWN) {
                    this._addListenersToVerticalScroll();

                    this._$verticalBar.addClass(ClassName.BAR_SHOWN);
                    this._$verticalRail.addClass(ClassName.RAIL_SHOWN);
                }
            } else {
                if (IS_VERTICAL_SCROLL_SHOWN) {
                    this._removeListenersFromVerticalScroll();

                    this._$verticalBar.removeClass(ClassName.BAR_SHOWN);
                    this._$verticalRail.removeClass(ClassName.RAIL_SHOWN);
                }
            }

            if (!this._hasCommonListeners && IS_OVERFLOWED_X && !IS_HORIZONTAL_SCROLL_SHOWN || IS_OVERFLOWED_Y && !IS_VERTICAL_SCROLL_SHOWN) {
                this._addCommonListeners();
            } else if (this._hasCommonListeners && !IS_OVERFLOWED_X && IS_HORIZONTAL_SCROLL_SHOWN && !IS_OVERFLOWED_Y && IS_VERTICAL_SCROLL_SHOWN) {
                this._removeCommonListeners();
            }

            this._isReachEventTriggered = (_isReachEventTriggere = {}, _isReachEventTriggere[Position.LEFT] = false, _isReachEventTriggere[Position.RIGHT] = false, _isReachEventTriggere[Position.TOP] = false, _isReachEventTriggere[Position.BOTTOM] = false, _isReachEventTriggere);
        };

        Scrollbox.prototype._addCommonListeners = function _addCommonListeners() {
            this._$wrapper.on('mousewheel', $.proxy(this, '_onWheel'));

            this._$element.on({
                scroll: $.proxy(this, '_onElementScroll'),
                touchstart: $.proxy(this, '_onElementTouchStart'),
                touchmove: $.proxy(this, '_onElementTouchMove'),
                touchend: $.proxy(this, '_onElementTouchEnd')
            });

            $(document).on({
                mouseup: $.proxy(this, '_onDocumentMouseUp'),
                mousemove: $.proxy(this, '_onDocumentMouseMove')
            });

            this._hasCommonListeners = true;
        };

        Scrollbox.prototype._addListenersToHorizontalScroll = function _addListenersToHorizontalScroll() {
            this._$horizontalBar.on({
                mousedown: $.proxy(this, '_onHorizontalBarMouseDown'),
                touchstart: $.proxy(this, '_onHorizontalBarTouchStart'),
                touchmove: $.proxy(this, '_onHorizontalBarTouchMove'),
                touchend: $.proxy(this, '_onHorizontalBarTouchEnd')
            });
        };

        Scrollbox.prototype._addListenersToVerticalScroll = function _addListenersToVerticalScroll() {
            this._$verticalBar.on({
                mousedown: $.proxy(this, '_onVerticalBarMouseDown'),
                touchstart: $.proxy(this, '_onVerticalBarTouchStart'),
                touchmove: $.proxy(this, '_onVerticalBarTouchMove'),
                touchend: $.proxy(this, '_onVerticalBarTouchEnd')
            });
        };

        Scrollbox.prototype._removeCommonListeners = function _removeCommonListeners() {
            this._$wrapper.off('mousewheel', this._onWheel);

            this._$element.off({
                scroll: this._onElementScroll,
                touchstart: this._onElementTouchStart,
                touchmove: this._onElementTouchMove,
                touchend: this._onElementTouchEnd
            });

            $(document).off({
                mouseup: this._onDocumentMouseUp,
                mousemove: this._onDocumentMouseMove
            });

            this._hasCommonListeners = false;
        };

        Scrollbox.prototype._removeListenersFromHorizontalScroll = function _removeListenersFromHorizontalScroll() {
            this._$horizontalBar.off({
                mousedown: this._onHorizontalBarMouseDown,
                touchstart: this._onHorizontalBarTouchStart,
                touchmove: this._onHorizontalBarTouchMove,
                touchend: this._onHorizontalBarTouchEnd
            });
        };

        Scrollbox.prototype._removeListenersFromVerticalScroll = function _removeListenersFromVerticalScroll() {
            this._$verticalBar.off({
                mousedown: this._onVerticalBarMouseDown,
                touchstart: this._onVerticalBarTouchStart,
                touchmove: this._onVerticalBarTouchMove,
                touchend: this._onVerticalBarTouchEnd
            });
        };

        Scrollbox.prototype._onElementScroll = function _onElementScroll(e) {
            e.preventDefault();

            this._syncCurrentPosition();
            this._updateHorizontalBarPosition();
            this._updateVerticalBarPosition();
            this._checkIsReached();
        };

        Scrollbox.prototype._onElementTouchStart = function _onElementTouchStart(e) {
            var touches = e.originalEvent.targetTouches;

            if (touches.length) {
                if (this._$element.is(':animated')) {
                    this._$element.stop(true, false);
                }

                this._elementTouchId = touches[0].identifier;

                this._swipeStartPosition = {
                    x: touches[0].pageX,
                    y: touches[0].pageY
                };

                this._previousPosition = {
                    x: touches[0].pageX,
                    y: touches[0].pageY
                };

                this._swipeStartedAt = Date.now();
            }
        };

        Scrollbox.prototype._onWheel = function _onWheel(e) {
            e.preventDefault();

            this.scrollBy(-e.deltaX * this._config.wheelSensitivity, -e.deltaY * this._config.wheelSensitivity);
        };

        Scrollbox.prototype._onHorizontalBarMouseDown = function _onHorizontalBarMouseDown(e) {
            if (1 === e.which) {
                e.preventDefault();

                this._captureHorizontalBar(e.pageX);
            }
        };

        Scrollbox.prototype._onVerticalBarMouseDown = function _onVerticalBarMouseDown(e) {
            if (1 === e.which) {
                e.preventDefault();

                this._captureVerticalBar(e.pageY);
            }
        };

        Scrollbox.prototype._onDocumentMouseMove = function _onDocumentMouseMove(e) {
            if (this._isHorizontalBarCaptured) {
                e.preventDefault();

                this._dragToX(e.pageX);
            }

            if (this._isVerticalBarCaptured) {
                e.preventDefault();

                this._dragToY(e.pageY);
            }
        };

        Scrollbox.prototype._onDocumentMouseUp = function _onDocumentMouseUp(e) {
            if ((this._isHorizontalBarCaptured || this._isVerticalBarCaptured) && 1 === e.which) {
                e.preventDefault();

                this._releaseHorizontalBar();
                this._releaseVerticalBar();
            }
        };

        Scrollbox.prototype._onHorizontalBarTouchStart = function _onHorizontalBarTouchStart(e) {
            var touches = e.originalEvent.targetTouches;

            if (touches.length) {
                e.preventDefault();

                this._horizontalBarTouchId = touches[0].identifier;
                this._captureHorizontalBar(touches[0].pageX);
            }
        };

        Scrollbox.prototype._onVerticalBarTouchStart = function _onVerticalBarTouchStart(e) {
            var touches = e.originalEvent.targetTouches;

            if (touches.length) {
                e.preventDefault();

                this._verticalBarTouchId = touches[0].identifier;
                this._captureVerticalBar(touches[0].pageY);
            }
        };

        Scrollbox.prototype._onElementTouchMove = function _onElementTouchMove(e) {
            var _this2 = this;

            $.each(e.originalEvent.targetTouches, function (i, touch) {
                if (touch.identifier === _this2._elementTouchId) {
                    e.preventDefault();

                    _this2._swipe(touch.pageX, touch.pageY);

                    return false;
                }
            });
        };

        Scrollbox.prototype._onHorizontalBarTouchMove = function _onHorizontalBarTouchMove(e) {
            var _this3 = this;

            $.each(e.originalEvent.targetTouches, function (i, touch) {
                if (touch.identifier === _this3._horizontalBarTouchId) {
                    e.preventDefault();

                    _this3._dragToX(touch.pageX);

                    return false;
                }
            });
        };

        Scrollbox.prototype._onVerticalBarTouchMove = function _onVerticalBarTouchMove(e) {
            var _this4 = this;

            $.each(e.originalEvent.targetTouches, function (i, touch) {
                if (touch.identifier === _this4._verticalBarTouchId) {
                    e.preventDefault();

                    _this4._dragToY(touch.pageY);

                    return false;
                }
            });
        };

        Scrollbox.prototype._onElementTouchEnd = function _onElementTouchEnd(e) {
            var _this5 = this;

            $.each(e.originalEvent.changedTouches, function (i, touch) {
                if (touch.identifier === _this5._elementTouchId) {
                    var SWIPE_DURATION = Date.now() - _this5._swipeStartedAt;

                    if (SWIPE_DURATION <= _this5._config.momentum.thresholdTime) {
                        var SWIPE_WIDTH = _this5._swipeStartPosition.x - touch.pageX;
                        var SWIPE_HEIGHT = _this5._swipeStartPosition.y - touch.pageY;
                        var SWIPE_HORIZONTAL_SPEED = Math.abs(SWIPE_WIDTH / SWIPE_DURATION);
                        var SWIPE_VERTICAL_SPEED = Math.abs(SWIPE_HEIGHT / SWIPE_DURATION);

                        var deltaX = SWIPE_HORIZONTAL_SPEED * SWIPE_HORIZONTAL_SPEED * 2 * _this5._config.momentum.acceleration;
                        var deltaY = SWIPE_VERTICAL_SPEED * SWIPE_VERTICAL_SPEED * 2 * _this5._config.momentum.acceleration;

                        if (SWIPE_WIDTH < 0) {
                            deltaX *= -1;
                        }

                        if (SWIPE_HEIGHT < 0) {
                            deltaY *= -1;
                        }

                        _this5.scrollBy(deltaX, deltaY, {
                            duration: Math.max(SWIPE_HORIZONTAL_SPEED * _this5._config.momentum.acceleration, SWIPE_VERTICAL_SPEED * _this5._config.momentum.acceleration),
                            easing: 'momentum'
                        });
                    }

                    _this5._swipeStartPosition = {
                        x: null,
                        y: null
                    };

                    _this5._elementTouchId = null;
                    _this5._swipeStartedAt = null;

                    return false;
                }
            });
        };

        Scrollbox.prototype._onHorizontalBarTouchEnd = function _onHorizontalBarTouchEnd(e) {
            var _this6 = this;

            $.each(e.originalEvent.changedTouches, function (i, touch) {
                if (touch.identifier === _this6._horizontalBarTouchId) {
                    e.preventDefault();

                    _this6._releaseHorizontalBar();
                    _this6._horizontalBarTouchId = null;

                    return false;
                }
            });
        };

        Scrollbox.prototype._onVerticalBarTouchEnd = function _onVerticalBarTouchEnd(e) {
            var _this7 = this;

            $.each(e.originalEvent.changedTouches, function (i, touch) {
                if (touch.identifier === _this7._verticalBarTouchId) {
                    e.preventDefault();

                    _this7._releaseVerticalBar();
                    _this7._verticalBarTouchId = null;

                    return false;
                }
            });
        };

        Scrollbox.prototype._onDocumentTouchEnd = function _onDocumentTouchEnd(e) {
            var _this8 = this;

            var touches = e.originalEvent.changedTouches;

            if (null !== this._horizontalBarTouchId) {
                $.each(touches, function (i, touch) {
                    if (touch.identifier === _this8._horizontalBarTouchId) {
                        e.preventDefault();

                        _this8._releaseHorizontalBar();
                        _this8._horizontalBarTouchId = null;

                        return false;
                    }
                });
            }

            if (null !== this._verticalBarTouchId) {
                $.each(touches, function (i, touch) {
                    if (touch.identifier === _this8._verticalBarTouchId) {
                        e.preventDefault();

                        _this8._releaseVerticalBar();
                        _this8._verticalBarTouchId = null;

                        return false;
                    }
                });
            }
        };

        Scrollbox.prototype._captureHorizontalBar = function _captureHorizontalBar(x) {
            this._isHorizontalBarCaptured = true;
            this._previousPosition.x = x;

            this._$horizontalBar.addClass(ClassName.BAR_CAPTURED);
        };

        Scrollbox.prototype._captureVerticalBar = function _captureVerticalBar(y) {
            this._isVerticalBarCaptured = true;
            this._previousPosition.y = y;

            this._$verticalBar.addClass(ClassName.BAR_CAPTURED);
        };

        Scrollbox.prototype._dragToX = function _dragToX(x) {
            this.scrollBy((x - this._previousPosition.x) * this._maxScrollLeft / (this._elementOuterWidth - this._horizontalBarWidth), 0);

            this._previousPosition.x = x;
        };

        Scrollbox.prototype._dragToY = function _dragToY(y) {
            this.scrollBy(0, (y - this._previousPosition.y) * this._maxScrollTop / (this._elementOuterHeight - this._verticalBarHeight));

            this._previousPosition.y = y;
        };

        Scrollbox.prototype._swipe = function _swipe(x, y) {
            this.scrollBy(this._previousPosition.x - x, this._previousPosition.y - y);

            this._previousPosition = {
                x: x,
                y: y
            };
        };

        Scrollbox.prototype._releaseHorizontalBar = function _releaseHorizontalBar() {
            this._isHorizontalBarCaptured = false;
            this._$horizontalBar.removeClass(ClassName.BAR_CAPTURED);
        };

        Scrollbox.prototype._releaseVerticalBar = function _releaseVerticalBar() {
            this._isVerticalBarCaptured = false;
            this._$verticalBar.removeClass(ClassName.BAR_CAPTURED);
        };

        Scrollbox.prototype._updateHorizontalBarSize = function _updateHorizontalBarSize() {
            this._$horizontalBar.width(this._elementOuterWidth * this._elementOuterWidth / this._$element[0].scrollWidth);

            this._horizontalBarWidth = this._$horizontalBar.outerWidth();
        };

        Scrollbox.prototype._updateVerticalBarSize = function _updateVerticalBarSize() {
            this._$verticalBar.height(this._elementOuterHeight * this._elementOuterHeight / this._$element[0].scrollHeight);

            this._verticalBarHeight = this._$verticalBar.outerHeight();
        };

        Scrollbox.prototype._updateHorizontalBarPosition = function _updateHorizontalBarPosition() {
            this._$horizontalBar.css('left', (this._elementOuterWidth - this._horizontalBarWidth) * (this._currentPosition.x / this._maxScrollLeft));
        };

        Scrollbox.prototype._updateVerticalBarPosition = function _updateVerticalBarPosition() {
            this._$verticalBar.css('top', (this._elementOuterHeight - this._verticalBarHeight) * (this._currentPosition.y / this._maxScrollTop));
        };

        Scrollbox.prototype._checkIsReached = function _checkIsReached() {
            if (!this._isReachEventTriggered[Position.LEFT] && this._currentPosition.x - this._config.distanceToReach.x <= 0) {
                this._$element.trigger(Event.REACH_LEFT);
                this._isReachEventTriggered[Position.LEFT] = true;
            }

            if (!this._isReachEventTriggered[Position.RIGHT] && this._currentPosition.x + this._config.distanceToReach.x >= this._maxScrollLeft) {
                this._$element.trigger(Event.REACH_RIGHT);
                this._isReachEventTriggered[Position.RIGHT] = true;
            }

            if (!this._isReachEventTriggered[Position.TOP] && this._currentPosition.y - this._config.distanceToReach.y <= 0) {
                this._$element.trigger(Event.REACH_TOP);
                this._isReachEventTriggered[Position.TOP] = true;
            }

            if (!this._isReachEventTriggered[Position.BOTTOM] && this._currentPosition.y + this._config.distanceToReach.y >= this._maxScrollTop) {
                this._$element.trigger(Event.REACH_BOTTOM);
                this._isReachEventTriggered[Position.BOTTOM] = true;
            }
        };

        Scrollbox.prototype._syncElementSize = function _syncElementSize() {
            this._elementOuterWidth = this._$element.outerWidth();
            this._elementOuterHeight = this._$element.outerHeight();
        };

        Scrollbox.prototype._syncCurrentPosition = function _syncCurrentPosition() {
            this._currentPosition = {
                x: this._$element.scrollLeft(),
                y: this._$element.scrollTop()
            };
        };

        Scrollbox._jQueryInterface = function _jQueryInterface(config) {
            var _this9 = this;

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return this.each(function () {
                var $this = $(_this9);

                var scrollbox = $this.data(DATA_KEY);

                if (!scrollbox) {
                    scrollbox = new Scrollbox(_this9, $.extend(true, {}, Scrollbox.getDefault(), $this.data(), 'object' === (typeof config === 'undefined' ? 'undefined' : _typeof(config)) && config));

                    $this.data(DATA_KEY, scrollbox);
                }

                if ('string' === typeof config) {
                    var _scrollbox;

                    if ('function' !== typeof scrollbox[config]) {
                        throw new Error('No method named "' + config + '"');
                    }

                    (_scrollbox = scrollbox)[config].apply(_scrollbox, args);
                }
            });
        };

        return Scrollbox;
    }();

    $.fn[NAME] = Scrollbox._jQueryInterface;
    $.fn[NAME].Constructor = Scrollbox;
    $.fn[NAME].noConflict = function () {
        $.fn[NAME] = JQUERY_NO_CONFLICT;
        return Scrollbox._jQueryInterface;
    };

    if (!$.easing.momentum) {
        // easeOutExpo
        $.easing.momentum = function (x, t, b, c, d) {
            /* eslint eqeqeq: 0 */
            return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        };
    }

    return Scrollbox;
}(jQuery);

// export default Scrollbox;
