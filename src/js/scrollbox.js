/*!
 * Scrollbox v2.3.1
 * (c) 2013-2016, Max Invis1ble
 * Licensed under MIT (https://opensource.org/licenses/mit-license.php)
 */

+function ($, window, document, undefined) {

    'use strict';

    var name = 'scrollbox',
        Scrollbox = function ($element, options) {
            (function (that, options, methods) {
                that.options = options;

                that.$element = $element;
                that.$rail = $(options.templates.rail);
                that.$bar = $(options.templates.bar);
                
                $.each(methods, function (i, method) {
                    if (options[method]) {
                        that[method] = options[method];
                    }
                });

                that._isBarCaptured = that._isShown = that._isCorrectionRequired = false;
                that._prevY = 0;
                that._isReachTriggered = { top: false, bottom: false };
                that._scrollHeight = undefined;
                that._setScrolledToY($element.scrollTop());
                that._barTouchId = that._elementTouchId = that._swipeStartY = that._swipeStartedAt = null;

                that.init();
            })(this, $.extend({}, $.fn[name].defaults, options), [
                'init',
                'addListeners',
                'removeListeners',
                'scroll',
                'jump',
                'update',
                'destroy'
            ]);
        };

    Scrollbox.prototype = {

        init: function () {
            (function (that, options) {
                that.$wrapper = that.$element
                    .trigger('init.' + name)
                    .addClass('scrollbox-overflowed')
                    .wrap(options.templates.wrapper).parent()
                    .append(that.$rail)
                    .append(that.$bar);
                
                that._updateBarHeight();

                if (that._isShown) {
                    that.addListeners();
                }

                that.jump(options.start);
            })(this, this.options);
        },

        addListeners: function () {
            (function (that, proxy) {
                that.$wrapper.on('mousewheel', proxy(that, '_onWheel'));

                that.$bar.on({
                    mousedown: proxy(that, '_onBarMouseDown'),
                    touchstart: proxy(that, '_onBarTouchStart')
                });

                that.$element.on({
                    scroll: proxy(that, '_onElementScroll'),
                    touchstart: proxy(that, '_onElementTouchStart')
                });

                $(document).on({
                    mouseup: proxy(that, '_onDocumentMouseUp'),
                    mousemove: proxy(that, '_onDocumentMouseMove'),
                    touchend: proxy(that, '_onDocumentTouchEnd'),
                    touchmove: proxy(that, '_onDocumentTouchMove')
                });
            })(this, $.proxy);
        },

        removeListeners: function () {
            (function (that) {
                that.$wrapper.off('mousewheel', that._onWheel);

                that.$bar.off({
                    mousedown: that._onBarMouseDown,
                    touchstart: that._onBarTouchStart
                });

                that.$element.off({
                    scroll: that._onElementScroll,
                    touchstart: that._onElementTouchStart
                });

                $(document).off({
                    mouseup: that._onDocumentMouseUp,
                    mousemove: that._onDocumentMouseMove,
                    touchend: that._onDocumentTouchEnd,
                    touchmove: that._onDocumentTouchMove
                });
            })(this);
        },

        _onWheel: function (e) {
            e.preventDefault();
            
            this.scroll(-e.deltaY * this.options.wheelSensitivity);
        },

        _onBarMouseDown: function (e) {
            if (1 === e.which) {
                e.preventDefault();

                this._dragStart(e.pageY);
            }
        },

        _onDocumentMouseMove: function (e) {
            if (this._isBarCaptured) {
                e.preventDefault();

                this._drag(e.pageY);
            }
        },

        _onDocumentMouseUp: function (e) {
            if (this._isBarCaptured && 1 === e.which) {
                e.preventDefault();

                this._dragStop();
            }
        },

        _onBarTouchStart: function (e) {
            var touches = e.originalEvent.targetTouches;

            if (1 == touches.length) {
                e.preventDefault();

                this._barTouchId = touches[0].identifier;
                this._dragStart(touches[0].pageY);
            }
        },

        _onDocumentTouchMove: function (e) {
            var touches = e.originalEvent.targetTouches;

            if (this._isBarCaptured) {
                $.each(touches, $.proxy(function (i, touch) {
                    if (touch.identifier === this._barTouchId) {
                        e.preventDefault();

                        this._drag(touch.pageY);
                        return false;
                    }
                }, this));
            }

            if (null !== this._elementTouchId) {
                $.each(touches, $.proxy(function (i, touch) {
                    if (touch.identifier === this._elementTouchId) {
                        e.preventDefault();

                        this._swipe(touch.pageY);
                        return false;
                    }
                }, this));
            }
        },

        _onDocumentTouchEnd: function (e) {
            var touches = e.originalEvent.changedTouches,
                swipeDuration,
                swipeDistance,
                swipeSpeed,
                offset;

            if (this._isBarCaptured) {
                $.each(touches, $.proxy(function (i, touch) {
                    if (touch.identifier === this._barTouchId) {
                        e.preventDefault();

                        this._dragStop();
                        this._barTouchId = null;
                        return false;
                    }
                }, this));
            }

            if (null !== this._elementTouchId) {
                $.each(touches, $.proxy(function (i, touch) {
                    if (touch.identifier === this._elementTouchId) {
                        swipeDuration = Date.now() - this._swipeStartedAt;

                        if (swipeDuration <= this.options.momentum.thresholdTime) {
                            swipeDistance = this._swipeStartY - touch.pageY;
                            swipeSpeed = Math.abs(swipeDistance / swipeDuration);
                            offset = swipeSpeed * swipeSpeed * 2 * this.options.momentum.acceleration;

                            if (swipeDistance < 0) {
                                offset = -offset;
                            }

                            this.scroll(offset, {
                                duration: swipeSpeed * this.options.momentum.acceleration,
                                easing: 'momentum'
                            });
                        }

                        this._swipeStartY = this._swipeStartedAt = this._elementTouchId = null;
                        return false;
                    }
                }, this));
            }
        },

        _onElementScroll: function (e) {
            e.preventDefault();
            
            if (this._isCorrectionRequired) {
                this._isCorrectionRequired = false;
            } else {
                this._setScrolledToY(this.$element.scrollTop());
            }

            this._updateBarPosition();
            this._checkIsReached();
        },

        _onElementTouchStart: function (e) {
            var touches = e.originalEvent.targetTouches;

            if (1 == touches.length) {
                if (this.$element.is(':animated')) {
                    this.$element.stop(true, false);
                }

                this._elementTouchId = touches[0].identifier;
                this._swipeStartY = this._prevY = touches[0].pageY;
                this._swipeStartedAt = Date.now();
            }
        },

        _dragStart: function (y) {
            this._isBarCaptured = true;
            this._prevY = y;

            this.$bar.addClass(name + '-bar-captured');
        },

        _drag: function (y) {
            var elementHeight = this.$element.outerHeight();

            this.scroll((y - this._prevY) * ((this._getScrollHeight() - elementHeight) / (elementHeight - this.$bar.height())));
            this._prevY = y;
        },

        _dragStop: function () {
            this._isBarCaptured = false;

            this.$bar.removeClass(name + '-bar-captured');
        },

        _swipe: function (y) {
            this.scroll(this._prevY - y);
            this._prevY = y;
        },

        scroll: function (delta, animationOptions) {
            var max = this._getScrollHeight() - this.$element.outerHeight(),
                destination = this._getScrolledToY() + delta,
                computedDestination;

            this.$element
                .trigger('scroll.' + name)
                .stop(true, false);

            if (0 === delta) {
                this._checkIsReached();
            } else {
                if (destination >= max) {
                    computedDestination = max;
                } else if (destination <= 0) {
                    computedDestination = 0;
                } else {
                    computedDestination = destination;
                }

                if (undefined === animationOptions) {
                    this._isCorrectionRequired = true;
                    this.$element.scrollTop(computedDestination);
                    this._setScrolledToY(computedDestination);
                } else {
                    animationOptions.progress = $.proxy(function (animation) {
                        if (computedDestination !== destination && computedDestination === this._getScrolledToY()) {
                            animation.stop();
                        }
                    }, this);

                    this.$element.animate({
                        scrollTop: destination
                    }, animationOptions);
                }
            }
        },

        jump: function (y, animationOptions) {
            if ('top' === y) {
                y = 0;
            } else if ('bottom' === y) {
                y = this._getScrollHeight() - this.$element.height();
            }

            this.scroll(y - this._getScrolledToY(), animationOptions);
        },

        update: function () {
            var isShown = this._isShown;

            this._scrollHeight = undefined;
            this._isReachTriggered.top = this._isReachTriggered.bottom = false;
            this._updateBarHeight();

            if (this._isShown) {
                this._updateBarPosition();

                if (!isShown) {
                    this.addListeners();
                }
            }
        },

        _getScrolledToY: function () {
            return this._scrolledToY;
        },

        _setScrolledToY: function (y) {
            this._scrolledToY = y;
        },

        _getScrollHeight: function () {
            // opera bug workaround
            if (undefined === this._scrollHeight) {
                this._scrollHeight = this.$element[0].scrollHeight;
            }

            return this._scrollHeight;
        },

        _updateBarHeight: function () {
            var elementHeight = this.$element.outerHeight(),
                ratio = elementHeight / this._getScrollHeight();

            if (1 !== ratio) {
                this.$bar.height(elementHeight * ratio);

                if (!this._isShown) {
                    this.$bar.addClass(name + '-bar-in');
                    this.$rail.addClass(name + '-rail-in');
                    this._isShown = true;
                }
            } else if (this._isShown) {
                this.removeListeners();
                this.$bar.removeClass(name + '-bar-in');
                this.$rail.removeClass(name + '-rail-in');
                this._isShown = false;
            }
        },

        _updateBarPosition: function () {
            var elementHeight = this.$element.outerHeight();

            this.$bar.css(
                'top',
                (elementHeight - this.$bar.outerHeight()) * (this.$element.scrollTop() / (this._getScrollHeight() - elementHeight))
            );
        },

        _checkIsReached: function () {
            var scrolledTo = this.$element.scrollTop(),
                position;

            if (
                !this._isReachTriggered.bottom
                && scrolledTo + this.options.distanceToReach >= this._getScrollHeight() - this.$element.outerHeight()
            ) {
                position = 'bottom';
            } else if (
                !this._isReachTriggered.top
                && scrolledTo - this.options.distanceToReach <= 0
            ) {
                position = 'top';
            }

            if (position) {
                this.$element.trigger($.Event('reach.' + name, { position: position }));
                this._isReachTriggered[position] = true;
            }
        },

        destroy: function () {
            this.removeListeners();

            this.$element
                .removeClass('scrollbox-overflowed')
                .unwrap()
                .removeData(name);

            this.$rail.remove();
            this.$bar.remove();

            this.$bar = this.$rail = this.$element = this.$wrapper = null;
        }

    };

    if (undefined === $.easing.momentum) {
        // easeOutExpo
        $.easing.momentum = function (x, t, b, c, d) {
            return t == d ? b + c : c * (- Math.pow(2, -10 * t / d) + 1) + b;
        };
    }

    $.fn[name] = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function () {
            var $this = $(this),
                data = $this.data(name),
                options;

            if ('object' === typeof option) {
                options = option;
            }

            if (!data) {
                $this.data(name, (data = new Scrollbox($this, options)));
            }

            if ('string' === typeof option) {
                data[option].apply(data, args);
            }
        });
    };

    $.fn[name].Constructor = Scrollbox;

    $.fn[name].defaults = {
        distanceToReach: 0,
        wheelSensitivity: 20,
        momentum: {
            acceleration: 1600,
            thresholdTime: 500
        },
        start: 'top',
        templates: {
            bar: '<div class="' + name + '-bar"></div>',
            rail: '<div class="' + name + '-rail"></div>',
            wrapper: '<div class="' + name + '-wrapper"></div>'
        }
    };

}(jQuery, window, document);