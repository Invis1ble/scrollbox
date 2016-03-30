/**
 * jquery.scrollbox.js
 *
 * @version    1.0.0-alpha
 * @author     Max Invis1ble
 * @copyright  (c) 2013-2016, Max Invis1ble
 * @license    MIT http://www.opensource.org/licenses/mit-license.php
 */
+function ($, window, document, undefined) {

    'use strict';

    var name = 'scrollbox',
        Scrollbox = function ($element, options) {
            var o = this.options = $.extend({}, $.fn[name].defaults, options);

            this.$element = $element;
            this.$rail = $(o.templates.rail);
            this.$bar = $(o.templates.bar);

            this.init = o.init || this.init;
            this.addListeners = o.addListeners || this.addListeners;
            this.removeListeners = o.removeListeners || this.removeListeners;
            this.scroll = o.scroll || this.scroll;
            this.jump = o.jump || this.jump;
            this.update = o.update || this.update;
            this.destroy = o.destroy || this.destroy;

            this._isOver = this._isBarCaptured = this._isShown = false;
            this._prevY = 0;
            this._isReachTriggered = { top: false, bottom: false };
            this._scrollHeight = undefined;
            this._setScrolledToY();
            this._barTouchId = this._elementTouchId = this._swipeStartY = this._swipeStartedAt = null;

            this._listeners = {};

            this.init();
        };

    Scrollbox.prototype = {

        init: function () {
            var options = this.options;

            this.$wrapper = this.$element
                .trigger('init.' + name)
                .css('overflow', 'hidden')
                .wrap(options.templates.wrapper).parent()
                .append(this.$rail)
                .append(this.$bar);

            this._updateBarHeight();

            if ('top' !== options.start) {
                this.jump(options.start);
            }

            if (this._isShown) {
                this.addListeners();
            }
        },

        addListeners: function () {
            this._listeners.wheel = $.proxy(this._onWheel, this);

            this.$wrapper.on({
                mouseenter: $.proxy(this._onEnter, this),
                mouseleave: $.proxy(this._onLeave, this)
            });

            if (window.addEventListener) {
                window.addEventListener('DOMMouseScroll', this._listeners.wheel, false);
                window.addEventListener('mousewheel', this._listeners.wheel, false);
            } else {
                document.attachEvent('onmousewheel', this._listeners.wheel);
            }

            this.$bar.on({
                mousedown: $.proxy(this._onBarMouseDown, this),
                touchstart: $.proxy(this._onBarTouchStart, this)
            });

            this.$element.on({
                scroll: $.proxy(this._onElementScroll, this),
                touchstart: $.proxy(this._onElementTouchStart, this)
            });

            $(document).on({
                mouseup: $.proxy(this._onDocumentMouseUp, this),
                mousemove: $.proxy(this._onDocumentMouseMove, this),
                touchend: $.proxy(this._onDocumentTouchEnd, this),
                touchmove: $.proxy(this._onDocumentTouchMove, this)
            });
        },

        removeListeners: function () {
            this.$wrapper.off({
                mouseenter: this._onEnter,
                mouseleave: this._onLeave
            });

            if (window.removeEventListener) {
                window.removeEventListener('DOMMouseScroll', this._listeners.wheel, false);
                window.removeEventListener('mousewheel', this._listeners.wheel, false);
            } else {
                document.detachEvent('onmousewheel', this._listeners.wheel);
            }

            this.$bar.off({
                mousedown: this._onBarMouseDown,
                touchstart: this._onBarTouchStart
            });

            this.$element.off({
                scroll: this._onElementScroll,
                touchstart: this._onElementTouchStart
            });

            $(document).off({
                mouseup: this._onDocumentMouseUp,
                mousemove: this._onDocumentMouseMove,
                touchend: this._onDocumentTouchEnd,
                touchmove: this._onDocumentTouchMove
            });
        },

        _onEnter: function (e) {
            e.preventDefault();

            this._isOver = true;
        },

        _onLeave: function (e) {
            e.preventDefault();

            this._isOver = false;
        },

        _onWheel: function (e) {
            if (this._isOver) {
                if (undefined === e) {
                    e = window.event;
                }

                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }

                this.scroll((e.detail ? e.detail / 3 : -e.wheelDelta / 120) * this.options.wheelSensitivity);
            }
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
            var touches = e.originalEvent.targetTouches,
                i;

            if (this._isBarCaptured) {
                for (i in touches) {
                    if (touches[i].identifier === this._barTouchId) {
                        e.preventDefault();

                        this._drag(touches[i].pageY);
                        break;
                    }
                }
            }

            if (null !== this._elementTouchId) {
                for (i in touches) {
                    if (touches[i].identifier === this._elementTouchId) {
                        e.preventDefault();

                        this._swipe(touches[i].pageY);
                        break;
                    }
                }
            }
        },

        _onDocumentTouchEnd: function (e) {
            var touches = e.originalEvent.changedTouches,
                swipeDuration,
                swipeDistance,
                swipeSpeed,
                offset,
                i;

            if (this._isBarCaptured) {
                for (i in touches) {
                    if (touches[i].identifier === this._barTouchId) {
                        e.preventDefault();

                        this._dragStop();
                        this._barTouchId = null;
                        break;
                    }
                }
            }

            if (null !== this._elementTouchId) {
                for (i in touches) {
                    if (touches[i].identifier === this._elementTouchId) {
                        e.preventDefault();

                        swipeDuration = Date.now() - this._swipeStartedAt;

                        if (swipeDuration <= this.options.momentum.thresholdTime) {
                            swipeDistance = this._swipeStartY - touches[i].pageY;
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
                        break;
                    }
                }
            }
        },

        _onElementScroll: function (e) {
            e.preventDefault();

            this._updateBarPosition();
        },

        _onElementTouchStart: function (e) {
            var touches = e.originalEvent.targetTouches;

            if (1 == touches.length) {
                e.preventDefault();

                if (this.$element.is(':animated')) {
                    this.$element.stop(true, false);
                    this._setScrolledToY(this.$element.scrollTop());
                }

                this._elementTouchId = touches[0].identifier;
                this._swipeStartY = this._prevY = touches[0].pageY;
                this._swipeStartedAt = new Date();
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
                scrollToY = this._getScrolledToY() + delta,
                options = this.options,
                position;

            this.$element
                .trigger('scroll.' + name)
                .stop(true, false);

            if (scrollToY >= max) {
                scrollToY = max;
            } else if (scrollToY <= 0) {
                scrollToY = 0;
            }

            this._setScrolledToY(scrollToY);

            if (undefined === animationOptions) {
                this.$element.scrollTop(scrollToY);
            } else {
                this.$element.animate({
                    scrollTop: scrollToY
                }, animationOptions);
            }

            if (!this._isReachTriggered.bottom && scrollToY + options.distanceToReach >= max) {
                position = 'bottom';
            } else if (!this._isReachTriggered.top && scrollToY - options.distanceToReach <= 0) {
                position = 'top';
            }

            if (position) {
                this.$element.trigger($.Event('reach.' + name, { position: position }));
                this._isReachTriggered[position] = true;
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
            if (undefined === this._scrolledToY) {
                this._scrolledToY = this.$element.scrollTop();
            }

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

        destroy: function () {
            this.$wrapper
                .off('.' + name)
                .find('*').off('.' + name);

            this.removeListeners();

            this.$element
                .unwrap()
                .removeData(name);

            this.$rail.remove();
            this.$bar.remove();

            this.$bar = this.$rail = this.$element = this.$wrapper = null;
        }

    };

    if ($.easing.momentum === undefined) {
        $.easing.momentum = function (x, t, b, c, d) {
            var ts = (t /= d) * t,
                tc = ts * t;

            return b + c * (-1 * ts * ts + 4 * tc + -6 * ts + 4 * t);
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