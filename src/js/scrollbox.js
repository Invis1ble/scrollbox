/*!
 * Scrollbox v3.0.1
 * (c) 2013-2016, Max Invis1ble
 * Licensed under MIT (https://opensource.org/licenses/mit-license.php)
 */

const Scrollbox = (($) => {

    const NAME               = 'scrollbox';
    const VERSION            = '3.0.1';
    const DATA_KEY           = NAME;
    const JQUERY_NO_CONFLICT = $.fn[NAME];

    const ClassName = {
        OVERFLOWED: `${NAME}-overflowed`,
        RAIL: `${NAME}-rail`,
        BAR: `${NAME}-bar`,
        HORIZONTAL_RAIL: `${NAME}-horizontal-rail`,
        VERTICAL_RAIL: `${NAME}-vertical-rail`,
        HORIZONTAL_BAR: `${NAME}-horizontal-bar`,
        VERTICAL_BAR: `${NAME}-vertical-bar`,
        WRAPPER: `${NAME}-wrapper`,
        RAIL_SHOWN: `${NAME}-rail-in`,
        BAR_SHOWN: `${NAME}-bar-in`,
        BAR_CAPTURED: `${NAME}-bar-captured`
    };

    const Position = {
        LEFT: 'left',
        RIGHT: 'right',
        TOP: 'top',
        BOTTOM: 'bottom'
    };

    const Default = {
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

    const Event = {
        REACH_LEFT: `reach${Position.LEFT}.${NAME}`,
        REACH_RIGHT: `reach${Position.RIGHT}.${NAME}`,
        REACH_TOP: `reach${Position.TOP}.${NAME}`,
        REACH_BOTTOM: `reach${Position.BOTTOM}.${NAME}`
    };

    class Scrollbox {

        constructor(element, config) {
            this._config = config;
            this._$element = $(element);

            this._$horizontalRail = $(config.templates.horizontalRail)
                .addClass(`${ClassName.RAIL} ${ClassName.HORIZONTAL_RAIL}`);

            this._$verticalRail = $(config.templates.verticalRail)
                .addClass(`${ClassName.RAIL} ${ClassName.VERTICAL_RAIL}`);

            this._$horizontalBar = $(config.templates.horizontalBar)
                .addClass(`${ClassName.BAR} ${ClassName.HORIZONTAL_BAR}`);

            this._$verticalBar = $(config.templates.verticalBar)
                .addClass(`${ClassName.BAR} ${ClassName.VERTICAL_BAR}`);

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

        static getVersion() {
            return VERSION;
        }

        static getDefault() {
            return Default;
        }

        /**
         *
         * @param {(Number|'left'|'right')} [x]
         * @param {(Number|'top'|'bottom')} [y]
         * @param {Object} [animationOptions]
         */
        scrollTo(x, y, animationOptions) {
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
        }

        /**
         *
         * @param {Number} [deltaX=0]
         * @param {Number} [deltaY=0]
         * @param {Object} [animationOptions]
         */
        scrollBy(deltaX, deltaY, animationOptions) {
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

            const DESTINATION_X = this._currentPosition.x + deltaX;
            const DESTINATION_Y = this._currentPosition.y + deltaY;

            let computedDestinationX;
            let computedDestinationY;

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

            animationOptions.progress = (animation) => {
                if (
                    null === this._currentPosition ||
                    (computedDestinationX !== DESTINATION_X &&
                    computedDestinationX === this._currentPosition.x &&
                    computedDestinationY !== DESTINATION_Y &&
                    computedDestinationY === this._currentPosition.y)
                ) {
                    animation.stop();
                }
            };

            this._$element.animate({
                scrollLeft: DESTINATION_X,
                scrollTop: DESTINATION_Y
            }, animationOptions);
        }

        update() {
            this._sync();
            this._checkIsReached();
        }

        destroy() {
            if (this._hasCommonListeners) {
                this._removeCommonListeners();
            }

            this._$element
                .removeClass(ClassName.OVERFLOWED)
                .unwrap()
                .removeData(DATA_KEY);

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
        }

        _init() {
            this._$wrapper = this._$element
                .addClass(ClassName.OVERFLOWED)
                .wrap(this._config.templates.wrapper).parent()
                .addClass(ClassName.WRAPPER)
                .append(this._$horizontalRail)
                .append(this._$horizontalBar)
                .append(this._$verticalRail)
                .append(this._$verticalBar);

            this._syncCurrentPosition();
            this._sync();

            this.scrollTo(this._config.startAt.x, this._config.startAt.y);
        }

        _sync() {
            const IS_OVERFLOWED_X = this._elementOuterWidth < this._$element[0].scrollWidth;
            const IS_OVERFLOWED_Y = this._elementOuterHeight < this._$element[0].scrollHeight;
            const IS_HORIZONTAL_SCROLL_SHOWN = this._$horizontalBar.hasClass(ClassName.BAR_SHOWN);
            const IS_VERTICAL_SCROLL_SHOWN = this._$verticalBar.hasClass(ClassName.BAR_SHOWN);

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

            if (
                !this._hasCommonListeners &&
                (IS_OVERFLOWED_X && !IS_HORIZONTAL_SCROLL_SHOWN) ||
                (IS_OVERFLOWED_Y && !IS_VERTICAL_SCROLL_SHOWN)
            ) {
                this._addCommonListeners();
            } else if (
                this._hasCommonListeners &&
                !IS_OVERFLOWED_X && IS_HORIZONTAL_SCROLL_SHOWN &&
                !IS_OVERFLOWED_Y && IS_VERTICAL_SCROLL_SHOWN
            ) {
                this._removeCommonListeners();
            }

            this._isReachEventTriggered = {
                [Position.LEFT]: false,
                [Position.RIGHT]: false,
                [Position.TOP]: false,
                [Position.BOTTOM]: false
            };
        }

        _addCommonListeners() {
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
        }

        _addListenersToHorizontalScroll() {
            this._$horizontalBar.on({
                mousedown: $.proxy(this, '_onHorizontalBarMouseDown'),
                touchstart: $.proxy(this, '_onHorizontalBarTouchStart'),
                touchmove: $.proxy(this, '_onHorizontalBarTouchMove'),
                touchend: $.proxy(this, '_onHorizontalBarTouchEnd')
            });
        }

        _addListenersToVerticalScroll() {
            this._$verticalBar.on({
                mousedown: $.proxy(this, '_onVerticalBarMouseDown'),
                touchstart: $.proxy(this, '_onVerticalBarTouchStart'),
                touchmove: $.proxy(this, '_onVerticalBarTouchMove'),
                touchend: $.proxy(this, '_onVerticalBarTouchEnd')
            });
        }

        _removeCommonListeners() {
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
        }

        _removeListenersFromHorizontalScroll() {
            this._$horizontalBar.off({
                mousedown: this._onHorizontalBarMouseDown,
                touchstart: this._onHorizontalBarTouchStart,
                touchmove: this._onHorizontalBarTouchMove,
                touchend: this._onHorizontalBarTouchEnd
            });
        }

        _removeListenersFromVerticalScroll() {
            this._$verticalBar.off({
                mousedown: this._onVerticalBarMouseDown,
                touchstart: this._onVerticalBarTouchStart,
                touchmove: this._onVerticalBarTouchMove,
                touchend: this._onVerticalBarTouchEnd
            });
        }

        _onElementScroll(e) {
            e.preventDefault();

            this._syncCurrentPosition();
            this._updateHorizontalBarPosition();
            this._updateVerticalBarPosition();
            this._checkIsReached();
        }

        _onElementTouchStart(e) {
            const touches = e.originalEvent.targetTouches;

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
        }

        _onWheel(e) {
            e.preventDefault();

            this.scrollBy(-e.deltaX * this._config.wheelSensitivity, -e.deltaY * this._config.wheelSensitivity);
        }

        _onHorizontalBarMouseDown(e) {
            if (1 === e.which) {
                e.preventDefault();
    
                this._captureHorizontalBar(e.pageX);
            }
        }

        _onVerticalBarMouseDown(e) {
            if (1 === e.which) {
                e.preventDefault();

                this._captureVerticalBar(e.pageY);
            }
        }

        _onDocumentMouseMove(e) {
            if (this._isHorizontalBarCaptured) {
                e.preventDefault();

                this._dragToX(e.pageX);
            }

            if (this._isVerticalBarCaptured) {
                e.preventDefault();

                this._dragToY(e.pageY);
            }
        }

        _onDocumentMouseUp(e) {
            if ((this._isHorizontalBarCaptured || this._isVerticalBarCaptured) && 1 === e.which) {
                e.preventDefault();

                this._releaseHorizontalBar();
                this._releaseVerticalBar();
            }
        }

        _onHorizontalBarTouchStart(e) {
            const touches = e.originalEvent.targetTouches;
    
            if (touches.length) {
                e.preventDefault();
    
                this._horizontalBarTouchId = touches[0].identifier;
                this._captureHorizontalBar(touches[0].pageX);
            }
        }

        _onVerticalBarTouchStart(e) {
            const touches = e.originalEvent.targetTouches;
    
            if (touches.length) {
                e.preventDefault();
    
                this._verticalBarTouchId = touches[0].identifier;
                this._captureVerticalBar(touches[0].pageY);
            }
        }

        _onElementTouchMove(e) {
            $.each(e.originalEvent.targetTouches, (i, touch) => {
                if (touch.identifier === this._elementTouchId) {
                    e.preventDefault();

                    this._swipe(touch.pageX, touch.pageY);

                    return false;
                }
            });
        }
        
        _onHorizontalBarTouchMove(e) {
            $.each(e.originalEvent.targetTouches, (i, touch) => {
                if (touch.identifier === this._horizontalBarTouchId) {
                    e.preventDefault();

                    this._dragToX(touch.pageX);
                    
                    return false;
                }
            });
        }
        
        _onVerticalBarTouchMove(e) {
            $.each(e.originalEvent.targetTouches, (i, touch) => {
                if (touch.identifier === this._verticalBarTouchId) {
                    e.preventDefault();

                    this._dragToY(touch.pageY);
                    
                    return false;
                }
            });
        }

        _onElementTouchEnd(e) {
            $.each(e.originalEvent.changedTouches, (i, touch) => {
                if (touch.identifier === this._elementTouchId) {
                    const SWIPE_DURATION = Date.now() - this._swipeStartedAt;

                    if (SWIPE_DURATION <= this._config.momentum.thresholdTime) {
                        const SWIPE_WIDTH = this._swipeStartPosition.x - touch.pageX;
                        const SWIPE_HEIGHT = this._swipeStartPosition.y - touch.pageY;
                        const SWIPE_HORIZONTAL_SPEED = Math.abs(SWIPE_WIDTH / SWIPE_DURATION);
                        const SWIPE_VERTICAL_SPEED = Math.abs(SWIPE_HEIGHT / SWIPE_DURATION);

                        let deltaX = SWIPE_HORIZONTAL_SPEED * SWIPE_HORIZONTAL_SPEED * 2 * this._config.momentum.acceleration;
                        let deltaY = SWIPE_VERTICAL_SPEED * SWIPE_VERTICAL_SPEED * 2 * this._config.momentum.acceleration;

                        if (SWIPE_WIDTH < 0) {
                            deltaX *= -1;
                        }

                        if (SWIPE_HEIGHT < 0) {
                            deltaY *= -1;
                        }

                        this.scrollBy(deltaX, deltaY, {
                            duration: Math.max(
                                SWIPE_HORIZONTAL_SPEED * this._config.momentum.acceleration,
                                SWIPE_VERTICAL_SPEED * this._config.momentum.acceleration
                            ),
                            easing: 'momentum'
                        });
                    }

                    this._swipeStartPosition = {
                        x: null,
                        y: null
                    };

                    this._elementTouchId = null;
                    this._swipeStartedAt = null;

                    return false;
                }
            });
        }

        _onHorizontalBarTouchEnd(e) {
            $.each(e.originalEvent.changedTouches, (i, touch) => {
                if (touch.identifier === this._horizontalBarTouchId) {
                    e.preventDefault();

                    this._releaseHorizontalBar();
                    this._horizontalBarTouchId = null;

                    return false;
                }
            });
        }

        _onVerticalBarTouchEnd(e) {
            $.each(e.originalEvent.changedTouches, (i, touch) => {
                if (touch.identifier === this._verticalBarTouchId) {
                    e.preventDefault();

                    this._releaseVerticalBar();
                    this._verticalBarTouchId = null;

                    return false;
                }
            });
        }

        _onDocumentTouchEnd(e) {
            const touches = e.originalEvent.changedTouches;

            if (null !== this._horizontalBarTouchId) {
                $.each(touches, (i, touch) => {
                    if (touch.identifier === this._horizontalBarTouchId) {
                        e.preventDefault();

                        this._releaseHorizontalBar();
                        this._horizontalBarTouchId = null;
                        
                        return false;
                    }
                });
            }

            if (null !== this._verticalBarTouchId) {
                $.each(touches, (i, touch) => {
                    if (touch.identifier === this._verticalBarTouchId) {
                        e.preventDefault();

                        this._releaseVerticalBar();
                        this._verticalBarTouchId = null;
                        
                        return false;
                    }
                });
            }
        }

        _captureHorizontalBar(x) {
            this._isHorizontalBarCaptured = true;
            this._previousPosition.x = x;

            this._$horizontalBar.addClass(ClassName.BAR_CAPTURED);
        }

        _captureVerticalBar(y) {
            this._isVerticalBarCaptured = true;
            this._previousPosition.y = y;

            this._$verticalBar.addClass(ClassName.BAR_CAPTURED);
        }
        
        _dragToX(x) {
            this.scrollBy(
                (x - this._previousPosition.x) * this._maxScrollLeft /
                (this._elementOuterWidth - this._horizontalBarWidth),
                0
            );
            
            this._previousPosition.x = x;
        }
        
        _dragToY(y) {
            this.scrollBy(
                0,
                (y - this._previousPosition.y) * this._maxScrollTop /
                (this._elementOuterHeight - this._verticalBarHeight)
            );

            this._previousPosition.y = y;
        }

        _swipe(x, y) {
            this.scrollBy(this._previousPosition.x - x, this._previousPosition.y - y);

            this._previousPosition = {
                x: x,
                y: y
            };
        }
        
        _releaseHorizontalBar() {
            this._isHorizontalBarCaptured = false;
            this._$horizontalBar.removeClass(ClassName.BAR_CAPTURED);
        }
        
        _releaseVerticalBar() {
            this._isVerticalBarCaptured = false;
            this._$verticalBar.removeClass(ClassName.BAR_CAPTURED);
        }

        _updateHorizontalBarSize() {
            this._$horizontalBar.width(
                this._elementOuterWidth * this._elementOuterWidth / this._$element[0].scrollWidth
            );

            this._horizontalBarWidth = this._$horizontalBar.outerWidth();
        }

        _updateVerticalBarSize() {
            this._$verticalBar.height(
                this._elementOuterHeight * this._elementOuterHeight / this._$element[0].scrollHeight
            );

            this._verticalBarHeight = this._$verticalBar.outerHeight();
        }

        _updateHorizontalBarPosition() {
            this._$horizontalBar.css(
                'left',
                (this._elementOuterWidth - this._horizontalBarWidth) *
                (this._currentPosition.x / this._maxScrollLeft)
            );
        }

        _updateVerticalBarPosition() {
            this._$verticalBar.css(
                'top',
                (this._elementOuterHeight - this._verticalBarHeight) *
                (this._currentPosition.y / this._maxScrollTop)
            );
        }

        _checkIsReached() {
            if (
                !this._isReachEventTriggered[Position.LEFT] &&
                this._currentPosition.x - this._config.distanceToReach.x <= 0
            ) {
                this._$element.trigger(Event.REACH_LEFT);
                this._isReachEventTriggered[Position.LEFT] = true;
            }

            if (
                !this._isReachEventTriggered[Position.RIGHT] &&
                this._currentPosition.x + this._config.distanceToReach.x >= this._maxScrollLeft
            ) {
                this._$element.trigger(Event.REACH_RIGHT);
                this._isReachEventTriggered[Position.RIGHT] = true;
            }

            if (
                !this._isReachEventTriggered[Position.TOP] &&
                this._currentPosition.y - this._config.distanceToReach.y <= 0
            ) {
                this._$element.trigger(Event.REACH_TOP);
                this._isReachEventTriggered[Position.TOP] = true;
            }

            if (
                !this._isReachEventTriggered[Position.BOTTOM] &&
                this._currentPosition.y + this._config.distanceToReach.y >= this._maxScrollTop
            ) {
                this._$element.trigger(Event.REACH_BOTTOM);
                this._isReachEventTriggered[Position.BOTTOM] = true;
            }
        }

        _syncElementSize() {
            this._elementOuterWidth = this._$element.outerWidth();
            this._elementOuterHeight = this._$element.outerHeight();
        }

        _syncCurrentPosition() {
            this._currentPosition = {
                x: this._$element.scrollLeft(),
                y: this._$element.scrollTop()
            };
        }

        static _jQueryInterface(config, ...args) {
            return this.each(() => {
                const $this = $(this);

                let scrollbox = $this.data(DATA_KEY);

                if (!scrollbox) {
                    scrollbox = new Scrollbox(
                        this,
                        $.extend(true, {}, Scrollbox.getDefault(), $this.data(), 'object' === typeof config && config)
                    );

                    $this.data(DATA_KEY, scrollbox);
                }

                if ('string' === typeof config) {
                    if ('function' !== typeof scrollbox[config]) {
                        throw new Error(`No method named "${config}"`);
                    }

                    scrollbox[config].apply(scrollbox, args);
                }
            });
        }

    }

    $.fn[NAME]             = Scrollbox._jQueryInterface;
    $.fn[NAME].Constructor = Scrollbox;
    $.fn[NAME].noConflict  = () => {
        $.fn[NAME] = JQUERY_NO_CONFLICT;
        return Scrollbox._jQueryInterface;
    };

    if (!$.easing.momentum) {
        // easeOutExpo
        $.easing.momentum = (x, t, b, c, d) => {
            /* eslint eqeqeq: 0 */
            return t == d ? b + c : c * (- Math.pow(2, -10 * t / d) + 1) + b;
        };
    }

    return Scrollbox;

})(jQuery);

// export default Scrollbox;