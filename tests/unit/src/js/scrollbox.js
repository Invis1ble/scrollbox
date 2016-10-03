((QUnit, $, Modernizr, Hand) => {
    'use strict';

    const createScrollbox = (scrollboxMaxWidth, contentWidth, scrollboxMaxHeight, contentHeight) => {
        return $(
            `<div id="scrollbox-container" style="max-width: ${scrollboxMaxWidth}px; max-height: ${scrollboxMaxHeight}px">` +
                `<div id="scrollbox-content" style="width: ${contentWidth}px; height: ${contentHeight}px"></div>` +
            `</div>`
        )
            .appendTo('#qunit-fixture');
    };
    
    const getWrapper = (scrollbox) => {
        return $(scrollbox).parent();
    };

    const getHorizontalBar = (scrollbox) => {
        return $('.scrollbox-horizontal-bar', getWrapper(scrollbox));
    };

    const getHorizontalRail = (scrollbox) => {
        return $('.scrollbox-horizontal-rail', getWrapper(scrollbox));
    };
    
    const getVerticalBar = (scrollbox) => {
        return $('.scrollbox-vertical-bar', getWrapper(scrollbox));
    };

    const getVerticalRail = (scrollbox) => {
        return $('.scrollbox-vertical-rail', getWrapper(scrollbox));
    };

    const dragAndDropVia = (type, from, delta, duration, timing, timeout) => {
        const deferred = $.Deferred();

        if (undefined === timing || null === timing) {
            timing = 'minimal';
        }

        if (undefined === timeout) {
            timeout = 100;
        }

        (new Hand({ timing: timing }))
            .growFinger(type, {x: from.x, y: from.y})
            .down()
            .moveBy(delta.x, delta.y, duration)
            .wait(200)
            .up();

        setTimeout(deferred.resolve, duration + 200 + timeout);

        return deferred;
    };

    const dragAndDropViaTouch = (from, delta, duration, timing, timeout) => {
        return dragAndDropVia('touch', from, delta, duration, timing, timeout);
    };

    const dragAndDropViaMouse = (element, from, delta, duration, timing, timeout) => {
        /**
         * TODO: Uncomment.
         * See: https://github.com/Leaflet/prosthetic-hand/issues/4,
         * https://github.com/Leaflet/prosthetic-hand/issues/8
         */
        // return dragAndDropVia('mouse', from, delta, duration, timing, timeout);

        const deferred = $.Deferred();
        const $document = $(document);

        if (undefined === duration) {
            duration = 100;
        }

        if (undefined === timeout) {
            timeout = 100;
        }

        $(element)
            .trigger($.Event('mousedown', {
                which: 1,
                pageX: from.x,
                pageY: from.y
            }));

        setTimeout(() => {
            $document
                .trigger($.Event('mousemove', {
                    pageX: from.x + delta.x,
                    pageY: from.y + delta.y
                }));

            setTimeout(() => {
                $document
                    .trigger($.Event('mouseup', {
                        which: 1
                    }));

                setTimeout(deferred.resolve, timeout);
            // }, duration);
            // Old Safari bug workaround (too many "mousemove" events)
            }, 0);
        }, 200);

        return deferred;
    };

    QUnit.extend(QUnit.assert, {
        scrollPositionIs: function (scrollbox, expectedScrollLeft, expectedScrollTop, message) {
            const $scrollbox = $(scrollbox);

            const ACTUAL_SCROLL_LEFT = $scrollbox.scrollLeft();
            const ACTUAL_SCROLL_TOP = $scrollbox.scrollTop();

            this.push(
                ACTUAL_SCROLL_LEFT === expectedScrollLeft && ACTUAL_SCROLL_TOP === expectedScrollTop,
                `left: ${ACTUAL_SCROLL_LEFT}, top: ${ACTUAL_SCROLL_TOP}`,
                `left: ${expectedScrollLeft}, top: ${expectedScrollTop}`,
                undefined !== message ? message : 'scroll position is proper'
            );
        },
        
        horizontalScrollPositionIs: function (scrollbox, expectedScrollLeft, message) {
            const $scrollbox = $(scrollbox);

            const ACTUAL_SCROLL_LEFT = $scrollbox.scrollLeft();

            this.push(
                ACTUAL_SCROLL_LEFT === expectedScrollLeft,
                ACTUAL_SCROLL_LEFT,
                expectedScrollLeft,
                undefined !== message ? message : 'horizontal scroll position is proper'
            );
        },
        
        verticalScrollPositionIs: function (scrollbox, expectedScrollTop, message) {
            const $scrollbox = $(scrollbox);

            const ACTUAL_SCROLL_TOP = $scrollbox.scrollTop();

            this.push(
                ACTUAL_SCROLL_TOP === expectedScrollTop,
                ACTUAL_SCROLL_TOP,
                expectedScrollTop,
                undefined !== message ? message : 'vertical scroll position is proper'
            );
        },

        barsHaveProperSizes: function (scrollbox, message) {
            const $scrollbox = $(scrollbox);
            const $content = $('#scrollbox-content', $scrollbox);
            const $horizontalBar = getHorizontalBar(scrollbox);
            const $verticalBar = getVerticalBar(scrollbox);

            const CONTAINER_WIDTH = $scrollbox.outerWidth();
            const CONTAINER_HEIGHT = $scrollbox.outerHeight();

            const HORIZONTAL_BAR_ACTUAL_WIDTH = $horizontalBar.outerWidth();
            const HORIZONTAL_BAR_EXPECTED_WIDTH = Math.max(
                CONTAINER_WIDTH / $content.outerWidth() * CONTAINER_WIDTH,
                parseInt($horizontalBar.css('min-width'), 10)
            );
            const VERTICAL_BAR_ACTUAL_HEIGHT = $verticalBar.outerHeight();
            const VERTICAL_BAR_EXPECTED_HEIGHT = Math.max(
                CONTAINER_HEIGHT / $content.outerHeight() * CONTAINER_HEIGHT,
                parseInt($verticalBar.css('min-height'), 10)
            );

            const LEGAL_DELTA = 1;

            this.push(
                Math.abs(HORIZONTAL_BAR_ACTUAL_WIDTH - HORIZONTAL_BAR_EXPECTED_WIDTH) <= LEGAL_DELTA &&
                Math.abs(VERTICAL_BAR_ACTUAL_HEIGHT - VERTICAL_BAR_EXPECTED_HEIGHT) <= LEGAL_DELTA,
                `horizontal bar width: ${HORIZONTAL_BAR_ACTUAL_WIDTH}, ` +
                `vertical bar height: ${VERTICAL_BAR_ACTUAL_HEIGHT}`,
                `horizontal bar width: ${HORIZONTAL_BAR_EXPECTED_WIDTH}, ` +
                `vertical bar height: ${VERTICAL_BAR_EXPECTED_HEIGHT}`,
                undefined !== message ? message : 'bars have a proper sizes'
            );
        },

        barsHaveProperPosition: function (scrollbox, message) {
            const $scrollbox = $(scrollbox);

            const HORIZONTAL_BAR_ACTUAL_POSITION_LEFT = getHorizontalBar(scrollbox).position().left;
            const HORIZONTAL_BAR_EXPECTED_POSITION_LEFT = $scrollbox.scrollLeft() /
                $scrollbox[0].scrollWidth * $scrollbox.outerWidth();
            const VERTICAL_BAR_ACTUAL_POSITION_TOP = getVerticalBar(scrollbox).position().top;
            const VERTICAL_BAR_EXPECTED_POSITION_TOP = $scrollbox.scrollTop() /
                $scrollbox[0].scrollHeight * $scrollbox.outerHeight();

            const LEGAL_DELTA = 1;

            this.push(
                Math.abs(HORIZONTAL_BAR_ACTUAL_POSITION_LEFT - HORIZONTAL_BAR_EXPECTED_POSITION_LEFT) <= LEGAL_DELTA &&
                Math.abs(VERTICAL_BAR_ACTUAL_POSITION_TOP - VERTICAL_BAR_EXPECTED_POSITION_TOP) <= LEGAL_DELTA,
                `horizontal bar position left: ${HORIZONTAL_BAR_ACTUAL_POSITION_LEFT}, ` +
                `vertical bar position top: ${VERTICAL_BAR_ACTUAL_POSITION_TOP}`,
                `horizontal bar position left: ${HORIZONTAL_BAR_EXPECTED_POSITION_LEFT}, ` +
                `vertical bar position top: ${VERTICAL_BAR_EXPECTED_POSITION_TOP}`,
                undefined !== message ? message : 'bars have a proper positions'
            );
        },
        
        barsAreVisible: function (scrollbox, expected, message) {
            const HORIZONTAL_RAIL_ACTUAL_STATE = getHorizontalRail(scrollbox).is(':visible');
            const HORIZONTAL_BAR_ACTUAL_STATE = getHorizontalBar(scrollbox).is(':visible');
            const VERTICAL_RAIL_ACTUAL_STATE = getVerticalRail(scrollbox).is(':visible');
            const VERTICAL_BAR_ACTUAL_STATE = getVerticalBar(scrollbox).is(':visible');
            
            this.push(
                HORIZONTAL_RAIL_ACTUAL_STATE === expected &&
                HORIZONTAL_BAR_ACTUAL_STATE === expected &&
                VERTICAL_RAIL_ACTUAL_STATE === expected &&
                VERTICAL_BAR_ACTUAL_STATE === expected,
                `horizontal rail visible: ${HORIZONTAL_RAIL_ACTUAL_STATE}, ` +
                `horizontal bar visible: ${HORIZONTAL_BAR_ACTUAL_STATE}, ` +
                `vertical rail visible: ${VERTICAL_RAIL_ACTUAL_STATE}, ` +
                `vertical bar visible: ${VERTICAL_BAR_ACTUAL_STATE}`,
                `horizontal rail visible: ${expected}, ` +
                `horizontal bar visible: ${expected}, ` +
                `vertical rail visible: ${expected}, ` +
                `vertical bar visible: ${expected}`,
                undefined !== message ? message : `bars are ${expected ? 'visible' : 'hidden'}`
            );
        },

        barStateIs: function (bar, isCaptured, message) {
            const ACTUAL_STATE = $(bar).hasClass('scrollbox-bar-captured');

            this.push(
                ACTUAL_STATE === isCaptured,
                ACTUAL_STATE,
                isCaptured,
                undefined !== message ? message : `bar is ${isCaptured ? 'captured' : 'released'}`
            );
        }
    });

    $(() => {
        QUnit.module('Scrollbox plugin');

        QUnit.test('should be defined on jquery object', (assert) => {
            assert.expect(1);

            assert.ok($(document.body).scrollbox, 'scrollbox method is defined');
        });

        QUnit.module('Scrollbox API', {
            beforeEach: () => {
                $.fn._scrollbox = $.fn.scrollbox.noConflict();
            },
            afterEach: () => {
                $.fn.scrollbox = $.fn._scrollbox;
                delete $.fn._scrollbox;
            }
        });

        QUnit.test('should provide no conflict', (assert) => {
            assert.expect(1);

            assert.strictEqual($.fn.scrollbox, undefined, 'scrollbox was set back to undefined (orig value)');
        });

        QUnit.test('should throw explicit error on undefined method', function (assert) {
            assert.expect(1);

            const $scrollbox = $('<div />')._scrollbox();

            try {
                $scrollbox._scrollbox('noMethod');
            } catch (err) {
                assert.strictEqual(err.message, 'No method named "noMethod"');
            }
        });

        QUnit.test('should return jquery collection containing the element', (assert) => {
            assert.expect(2);

            const $el = $('<div />');
            const $scrollbox = $el._scrollbox();

            assert.ok($scrollbox instanceof $, 'returns jquery collection');
            assert.strictEqual($scrollbox[0], $el[0], 'collection contains element');
        });

        QUnit.test('should expose defaults var for settings', (assert) => {
            assert.expect(1);

            assert.ok($.fn._scrollbox.Constructor.Default, 'default object exposed');
        });

        QUnit.test('should show rail and bar if content size is greater than the container one', (assert) => {
            assert.expect(1);

            const $scrollbox = createScrollbox(40, 150, 40, 150)
                ._scrollbox();

            assert.barsAreVisible($scrollbox, true);
        });

        QUnit.test('should not show rail and bar if content size is less than the container one', (assert) => {
            assert.expect(1);

            const $scrollbox = createScrollbox(150, 40, 150, 40)
                ._scrollbox();

            assert.barsAreVisible($scrollbox, false);
        });

        QUnit.test('should not show rail and bar if content size is equal to the container one', (assert) => {
            assert.expect(1);

            const $scrollbox = createScrollbox(150, 150, 150, 150)
                ._scrollbox();

            assert.barsAreVisible($scrollbox, false);
        });

        QUnit.test('should have a properly sized bars', (assert) => {
            assert.expect(1);

            const $scrollbox = createScrollbox(100, 200, 100, 400)
                ._scrollbox();

            assert.barsHaveProperSizes($scrollbox);
        });

        QUnit.test('should have a properly sized bars with respect to min-width/min-height', (assert) => {
            assert.expect(1);

            // min-width = 5px and min-height = 5px
            const $scrollbox = createScrollbox(20, 200, 20, 400)
                ._scrollbox();

            assert.barsHaveProperSizes($scrollbox);
        });

        QUnit.test('should start at the top left corner by default', (assert) => {
            assert.expect(2);

            const $scrollbox = createScrollbox(40, 150, 40, 150)
                ._scrollbox();

            assert.scrollPositionIs($scrollbox, 0, 0);
            assert.barsHaveProperPosition($scrollbox);
        });

        QUnit.test('should start at the top left corner if specified', (assert) => {
            assert.expect(2);

            const $scrollbox = createScrollbox(40, 150, 40, 150)
                ._scrollbox({
                    startAt: {
                        x: 'left',
                        y: 'top'
                    }
                });

            assert.scrollPositionIs($scrollbox, 0, 0);
            assert.barsHaveProperPosition($scrollbox);
        });

        QUnit.test('should start at the right bottom corner if specified', (assert) => {
            assert.expect(2);
            const done = assert.async(1);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 140;
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox({
                    startAt: {
                        x: 'right',
                        y: 'bottom'
                    }
                });

            assert.scrollPositionIs($scrollbox, CONTENT_WIDTH - CONTAINER_WIDTH, CONTENT_HEIGHT - CONTAINER_HEIGHT);

            setTimeout(() => {
                assert.barsHaveProperPosition($scrollbox);
                done();
            }, 100);
        });

        QUnit.test('should start at the specified position', (assert) => {
            assert.expect(2);
            const done = assert.async(1);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 140;
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;

            const startAt = {
                x: Math.round((CONTENT_WIDTH - CONTAINER_WIDTH) / 2),
                y: Math.round((CONTENT_HEIGHT - CONTAINER_HEIGHT) / 2)
            };

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox({
                    startAt: startAt
                });

            assert.scrollPositionIs($scrollbox, startAt.x, startAt.y);

            setTimeout(() => {
                assert.barsHaveProperPosition($scrollbox);
                done();
            }, 100);
        });

        QUnit.test('should scroll by the specified distance', (assert) => {
            assert.expect(2);
            const done = assert.async(1);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 140;
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;
            const DELTA_X = Math.round((CONTENT_WIDTH - CONTAINER_WIDTH) / 2);
            const DELTA_Y = Math.round((CONTENT_HEIGHT - CONTAINER_HEIGHT) / 2);

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox()
                ._scrollbox('scrollBy', DELTA_X, DELTA_Y);

            assert.scrollPositionIs($scrollbox, DELTA_X, DELTA_Y);

            setTimeout(() => {
                assert.barsHaveProperPosition($scrollbox);
                done();
            }, 100);
        });

        QUnit.test('should not scroll by the specified distance when already reached the boundaries', (assert) => {
            assert.expect(4);
            const done = assert.async(2);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 140;
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox()
                ._scrollbox('scrollBy', -20, -20);

            assert.scrollPositionIs($scrollbox, 0, 0);

            setTimeout(() => {
                assert.barsHaveProperPosition($scrollbox);
                done();

                const MAX_POSITION_X = CONTENT_WIDTH - CONTAINER_WIDTH;
                const MAX_POSITION_Y = CONTENT_HEIGHT - CONTAINER_HEIGHT;

                $scrollbox._scrollbox('scrollBy', MAX_POSITION_X + 20, MAX_POSITION_Y + 20);

                assert.scrollPositionIs($scrollbox, MAX_POSITION_X, MAX_POSITION_Y);

                setTimeout(() => {
                    assert.barsHaveProperPosition($scrollbox);
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should scroll to the specified position', (assert) => {
            assert.expect(6);
            const done = assert.async(3);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 140;
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;
            const MAX_POSITION_X = CONTENT_WIDTH - CONTAINER_WIDTH;
            const MAX_POSITION_Y = CONTENT_HEIGHT - CONTAINER_HEIGHT;

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox()
                ._scrollbox('scrollTo', 'right', 'bottom');

            assert.scrollPositionIs($scrollbox, MAX_POSITION_X, MAX_POSITION_Y);

            setTimeout(() => {
                assert.barsHaveProperPosition($scrollbox);
                done();

                $scrollbox._scrollbox('scrollTo', 'left', 'top');

                assert.scrollPositionIs($scrollbox, 0, 0);

                setTimeout(() => {
                    assert.barsHaveProperPosition($scrollbox);
                    done();

                    const POSITION_X = Math.round(MAX_POSITION_X / 2);
                    const POSITION_Y = Math.round(MAX_POSITION_Y / 2);

                    $scrollbox._scrollbox('scrollTo', POSITION_X, POSITION_Y);

                    assert.scrollPositionIs($scrollbox, POSITION_X, POSITION_Y);

                    setTimeout(() => {
                        assert.barsHaveProperPosition($scrollbox);
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });

        QUnit.test('should completely remove all stuff on "destroy"', (assert) => {
            assert.expect(7);

            const $scrollbox = createScrollbox(40, 150, 40, 150)
                ._scrollbox()
                ._scrollbox('destroy');

            assert.strictEqual($scrollbox.data('scrollbox'), undefined, 'instance was removed');
            assert.ok(getHorizontalRail($scrollbox).length === 0, 'horizontal rail was removed from DOM');
            assert.ok(getHorizontalBar($scrollbox).length === 0, 'horizontal bar was removed from DOM');
            assert.ok(getVerticalRail($scrollbox).length === 0, 'vertical rail was removed from DOM');
            assert.ok(getVerticalBar($scrollbox).length === 0, 'vertical bar was removed from DOM');
            assert.notOk(getWrapper($scrollbox).hasClass('scrollbox-wrapper'), 'wrapper was removed from DOM');
            assert.notOk($scrollbox.hasClass('scrollbox-overflowed'), 'overflow restored');
        });

        QUnit.test('should fire "reachleft" event', (assert) => {
            assert.expect(3);
            const done = assert.async(3);

            const EVENT_REACH_LEFT = 'reachleft.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_LEFT, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        x: 'left'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_LEFT}" event fired on start`);
                done();

                isPassed = false;

                $scrollbox
                    ._scrollbox('destroy')
                    ._scrollbox({
                        startAt: {
                            x: 'right'
                        }
                    })
                    .one(EVENT_REACH_LEFT, () => isPassed = true)
                    ._scrollbox('scrollTo', 'left');

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_LEFT}" event fired on scroll via plugin API`);
                    done();

                    isPassed = false;

                    $scrollbox
                        ._scrollbox('destroy')
                        ._scrollbox({
                            startAt: {
                                x: 'right'
                            }
                        })
                        .one(EVENT_REACH_LEFT, () => isPassed = true)
                        .scrollLeft(0);

                    setTimeout(() => {
                        assert.ok(isPassed, `"${EVENT_REACH_LEFT}" event fired on scroll via browser API`);
                        done();
                    }, 100)
                }, 100);
            }, 100);
        });

        QUnit.test('should fire "reachright" event', (assert) => {
            assert.expect(3);
            const done = assert.async(3);

            const EVENT_REACH_RIGHT = 'reachright.scrollbox';
            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 150;
            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_RIGHT, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        x: 'right'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_RIGHT}" event fired on start`);
                done();

                isPassed = false;

                $scrollbox
                    ._scrollbox('destroy')
                    ._scrollbox({
                        startAt: {
                            x: 'left'
                        }
                    })
                    .one(EVENT_REACH_RIGHT, () => isPassed = true)
                    ._scrollbox('scrollTo', 'right');

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_RIGHT}" event fired on scroll via plugin API`);
                    done();

                    isPassed = false;

                    $scrollbox
                        ._scrollbox('destroy')
                        ._scrollbox({
                            startAt: {
                                x: 'left'
                            }
                        })
                        .one(EVENT_REACH_RIGHT, () => isPassed = true)
                        .scrollLeft(CONTENT_WIDTH - CONTAINER_WIDTH);

                    setTimeout(() => {
                        assert.ok(isPassed, `"${EVENT_REACH_RIGHT}" event fired on scroll via browser API`);
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });

        QUnit.test('should fire "reachtop" event', (assert) => {
            assert.expect(3);
            const done = assert.async(3);

            const EVENT_REACH_TOP = 'reachtop.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_TOP, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        y: 'top'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_TOP}" event fired on start`);
                done();

                isPassed = false;

                $scrollbox
                    ._scrollbox('destroy')
                    ._scrollbox({
                        startAt: {
                            y: 'bottom'
                        }
                    })
                    .one(EVENT_REACH_TOP, () => isPassed = true)
                    ._scrollbox('scrollTo', undefined, 'top');

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_TOP}" event fired on scroll via plugin API`);
                    done();

                    isPassed = false;

                    $scrollbox
                        ._scrollbox('destroy')
                        ._scrollbox({
                            startAt: {
                                y: 'bottom'
                            }
                        })
                        .one(EVENT_REACH_TOP, () => isPassed = true)
                        .scrollTop(0);

                    setTimeout(() => {
                        assert.ok(isPassed, `"${EVENT_REACH_TOP}" event fired on scroll via browser API`);
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });

        QUnit.test('should fire "reachbottom" event', (assert) => {
            assert.expect(3);
            const done = assert.async(3);

            const EVENT_REACH_BOTTOM = 'reachbottom.scrollbox';
            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;
            const $scrollbox = createScrollbox(40, 150, CONTAINER_HEIGHT, CONTENT_HEIGHT);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_BOTTOM, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        y: 'bottom'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_BOTTOM}" event fired on start`);
                done();

                isPassed = false;

                $scrollbox
                    ._scrollbox('destroy')
                    ._scrollbox({
                        startAt: {
                            y: 'top'
                        }
                    })
                    .one(EVENT_REACH_BOTTOM, () => isPassed = true)
                    ._scrollbox('scrollTo', undefined, 'bottom');

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_BOTTOM}" event fired on scroll via plugin API`);
                    done();

                    isPassed = false;

                    $scrollbox
                        ._scrollbox('destroy')
                        ._scrollbox({
                            startAt: {
                                y: 'top'
                            }
                        })
                        .one(EVENT_REACH_BOTTOM, () => isPassed = true)
                        .scrollTop(CONTENT_HEIGHT - CONTAINER_HEIGHT);

                    setTimeout(() => {
                        assert.ok(isPassed, `"${EVENT_REACH_BOTTOM}" event fired on scroll via browser API`);
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });

        QUnit.test('should not fire "reachleft" event if already reached', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_LEFT = 'reachleft.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_LEFT, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        x: 'left'
                    }
                });

            setTimeout(() => {
                $scrollbox
                    .one(EVENT_REACH_LEFT, () => isPassed = false)
                    .scrollLeft(0);

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_LEFT}" event did not fire`);
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should not fire "reachright" event if already reached', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const CONTAINER_WIDTH = 40;
            const CONTENT_WIDTH = 150;
            const EVENT_REACH_RIGHT = 'reachright.scrollbox';
            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_RIGHT, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        x: 'right'
                    }
                });

            setTimeout(() => {
                $scrollbox
                    .one(EVENT_REACH_RIGHT, () => isPassed = false)
                    .scrollLeft(CONTENT_WIDTH - CONTAINER_WIDTH);

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_RIGHT}" event did not fire`);
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should not fire "reachtop" event if already reached', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_TOP = 'reachtop.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_TOP, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        y: 'top'
                    }
                });

            setTimeout(() => {
                $scrollbox
                    .one(EVENT_REACH_TOP, () => isPassed = false)
                    .scrollTop(0);

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_TOP}" event did not fire`);
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should not fire "reachbottom" event if already reached', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const CONTAINER_HEIGHT = 40;
            const CONTENT_HEIGHT = 150;
            const EVENT_REACH_BOTTOM = 'reachbottom.scrollbox';
            const $scrollbox = createScrollbox(40, 150, CONTAINER_HEIGHT, CONTENT_HEIGHT);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_BOTTOM, () => isPassed = true)
                ._scrollbox({
                    startAt: {
                        y: 'bottom'
                    }
                });

            setTimeout(() => {
                $scrollbox
                    .one(EVENT_REACH_BOTTOM, () => isPassed = false)
                    .scrollTop(CONTENT_HEIGHT - CONTAINER_HEIGHT);

                setTimeout(() => {
                    assert.ok(isPassed, `"${EVENT_REACH_BOTTOM}" event did not fire`);
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should re-render bars on "update" called', (assert) => {
            assert.expect(3);

            const CONTAINER_WIDTH = 50;
            const CONTENT_WIDTH = 100;
            const CONTAINER_HEIGHT = 60;
            const CONTENT_HEIGHT = 180;

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                ._scrollbox({
                    startAt: {
                        x: 20,
                        y: 60
                    }
                });

            const $content = $('#scrollbox-content', $scrollbox);

            const WIDTH_MULTIPLIER = 2.5;
            const HEIGHT_MULTIPLIER = 2;

            $content
                .width(CONTENT_WIDTH * WIDTH_MULTIPLIER)
                .height(CONTENT_HEIGHT * HEIGHT_MULTIPLIER);

            $scrollbox._scrollbox('update');

            assert.barsHaveProperSizes($scrollbox);
            assert.barsHaveProperPosition($scrollbox);

            $content
                .width(CONTAINER_WIDTH)
                .height(CONTAINER_HEIGHT);

            $scrollbox._scrollbox('update');

            assert.barsAreVisible($scrollbox, false);
        });

        QUnit.test('should re-fire "reachleft" event on "update" called', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_LEFT = 'reachleft.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_LEFT, () => {
                    $scrollbox
                        .one(EVENT_REACH_LEFT, () => isPassed = true)
                        ._scrollbox('update');
                })
                ._scrollbox({
                    startAt: {
                        x: 'left'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_LEFT}" event re-fired`);
                done();
            }, 200);
        });

        QUnit.test('should re-fire "reachright" event on "update" called', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_RIGHT = 'reachright.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_RIGHT, () => {
                    $scrollbox
                        .one(EVENT_REACH_RIGHT, () => isPassed = true)
                        ._scrollbox('update');
                })
                ._scrollbox({
                    startAt: {
                        x: 'right'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_RIGHT}" event re-fired`);
                done();
            }, 200);
        });

        QUnit.test('should re-fire "reachtop" event on "update" called', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_TOP = 'reachtop.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_TOP, () => {
                    $scrollbox
                        .one(EVENT_REACH_TOP, () => isPassed = true)
                        ._scrollbox('update');
                })
                ._scrollbox({
                    startAt: {
                        y: 'top'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_TOP}" event re-fired`);
                done();
            }, 200);
        });

        QUnit.test('should re-fire "reachbottom" event on "update" called', (assert) => {
            assert.expect(1);
            const done = assert.async(1);

            const EVENT_REACH_BOTTOM = 'reachbottom.scrollbox';
            const $scrollbox = createScrollbox(40, 150, 40, 150);

            let isPassed = false;

            $scrollbox
                .one(EVENT_REACH_BOTTOM, () => {
                    $scrollbox
                        .one(EVENT_REACH_BOTTOM, () => isPassed = true)
                        ._scrollbox('update');
                })
                ._scrollbox({
                    startAt: {
                        y: 'bottom'
                    }
                });

            setTimeout(() => {
                assert.ok(isPassed, `"${EVENT_REACH_BOTTOM}" event re-fired`);
                done();
            }, 200);
        });

        QUnit.module('Scrollbox GUI interaction');

        QUnit.test('should change bars state on capture/release via mouse', (assert) => {
            assert.expect(4);
            const done = assert.async(4);

            const $document = $(document);
            const $scrollbox = createScrollbox(40, 150,40, 150)
                .scrollbox();

            const $horizontalBar = getHorizontalBar($scrollbox);
            const $verticalBar = getVerticalBar($scrollbox);

            $horizontalBar
                .trigger($.Event('mousedown', {
                    which: 1
                }));

            setTimeout(() => {
                assert.barStateIs($horizontalBar, true, 'horizontal bar is captured');
                done();

                $document
                    .trigger($.Event('mouseup', {
                        which: 1
                    }));

                setTimeout(() => {
                    assert.barStateIs($horizontalBar, false, 'horizontal bar is released');
                    done();


                    $verticalBar
                        .trigger($.Event('mousedown', {
                            which: 1
                        }));

                    setTimeout(() => {
                        assert.barStateIs($verticalBar, true, 'vertical bar is captured');
                        done();

                        $document
                            .trigger($.Event('mouseup', {
                                which: 1
                            }));

                        setTimeout(() => {
                            assert.barStateIs($verticalBar, false, 'vertical bar is released');
                            done();
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        });

        if (Modernizr.touchevents) {
            QUnit.test('should change bars state on capture/release via touch', (assert) => {
                assert.expect(4);
                const done = assert.async(4);

                const hand = new Hand({timing: 'minimal'});

                const $scrollbox = createScrollbox(40, 150, 40, 150)
                    .scrollbox();

                const $horizontalBar = getHorizontalBar($scrollbox);
                const horizontalBarOffset = $horizontalBar.offset();
                const $verticalBar = getVerticalBar($scrollbox);
                const verticalBarOffset = $verticalBar.offset();

                const finger = hand.growFinger('touch', {
                    x: horizontalBarOffset.left,
                    y: horizontalBarOffset.top
                });

                finger.down();

                setTimeout(() => {
                    assert.barStateIs($horizontalBar, true, 'horizontal bar is captured');
                    done();

                    finger.up();

                    setTimeout(() => {
                        assert.barStateIs($horizontalBar, false, 'horizontal bar is released');
                        done();

                        finger.moveTo(verticalBarOffset.left, verticalBarOffset.top, 0);

                        setTimeout(() => {
                            finger.down();

                            setTimeout(() => {
                                assert.barStateIs($verticalBar, true, 'vertical bar is captured');
                                done();

                                finger.up();

                                setTimeout(() => {
                                    assert.barStateIs($verticalBar, false, 'vertical bar is released');
                                    done();
                                }, 100);
                            }, 100);
                        }, 100);
                    }, 100);
                }, 100);
            });
        }

        QUnit.test('should scroll by the certain distance on mouse wheel', (assert) => {
            assert.expect(4);
            const done = assert.async(4);

            const $scrollbox = createScrollbox(40, 150, 40, 150)
                .scrollbox();

            const WHEEL_SENSITIVITY = $scrollbox.data('scrollbox')._config.wheelSensitivity;

            let scrollLeft = $scrollbox.scrollLeft();
            let wheelDeltaX = -2;
            let expectedDistanceX = -wheelDeltaX * WHEEL_SENSITIVITY;
            let scrollTop = $scrollbox.scrollTop();
            let wheelDeltaY = -2;
            let expectedDistanceY = -wheelDeltaY * WHEEL_SENSITIVITY;

            $scrollbox
                .trigger($.Event('mousewheel', {
                    deltaX: wheelDeltaX
                }));

            setTimeout(() => {
                assert.horizontalScrollPositionIs(
                    $scrollbox,
                    scrollLeft + expectedDistanceX,
                    `scrolled right by ${Math.abs(expectedDistanceX)}px`
                );
                done();

                scrollLeft = $scrollbox.scrollLeft();
                wheelDeltaX = 1;
                expectedDistanceX = -wheelDeltaX * WHEEL_SENSITIVITY;

                $scrollbox
                    .trigger($.Event('mousewheel', {
                        deltaX: wheelDeltaX
                    }));

                setTimeout(() => {
                    assert.horizontalScrollPositionIs(
                        $scrollbox,
                        scrollLeft + expectedDistanceX,
                        `scrolled left by ${Math.abs(expectedDistanceX)}px`
                    );
                    done();

                    $scrollbox
                        .trigger($.Event('mousewheel', {
                            deltaY: wheelDeltaY
                        }));

                    setTimeout(() => {
                        assert.verticalScrollPositionIs(
                            $scrollbox,
                            scrollTop + expectedDistanceY,
                            `scrolled down by ${Math.abs(expectedDistanceY)}px`
                        );
                        done();

                        scrollTop = $scrollbox.scrollTop();
                        wheelDeltaY = 1;
                        expectedDistanceY = -wheelDeltaY * WHEEL_SENSITIVITY;

                        $scrollbox
                            .trigger($.Event('mousewheel', {
                                deltaY: wheelDeltaY
                            }));

                        setTimeout(() => {
                            assert.verticalScrollPositionIs(
                                $scrollbox,
                                scrollTop + expectedDistanceY,
                                `scrolled up by ${Math.abs(expectedDistanceY)}px`
                            );
                            done();
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        });

        QUnit.test('should scroll by the certain distance on drag horizontal bar via mouse', (assert) => {
            assert.expect(2);
            const done = assert.async(2);

            const CONTAINER_WIDTH = 50;
            const CONTENT_WIDTH = 200;
            const WIDTH_RATIO = CONTAINER_WIDTH / CONTENT_WIDTH;

            const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, 50, 200)
                .scrollbox();

            const $horizontalBar = getHorizontalBar($scrollbox);

            const dragDelta = {
                x: 10,
                y: 0
            };

            let horizontalBarOffset = $horizontalBar.offset();
            let scrollLeft = $scrollbox.scrollLeft();
            let expectedDistanceX = dragDelta.x / WIDTH_RATIO;

            dragAndDropViaMouse($horizontalBar, {
                x: horizontalBarOffset.left,
                y: horizontalBarOffset.top
            }, dragDelta, 100)
                .done(() => {
                    assert.horizontalScrollPositionIs(
                        $scrollbox,
                        expectedDistanceX + scrollLeft,
                        `scrolled right by ${Math.abs(expectedDistanceX)}px`
                    );
                    done();

                    dragDelta.x = -8;
                    horizontalBarOffset = $horizontalBar.offset();
                    scrollLeft = $scrollbox.scrollLeft();
                    expectedDistanceX = dragDelta.x / WIDTH_RATIO;

                    dragAndDropViaMouse($horizontalBar, {
                        x: horizontalBarOffset.left,
                        y: horizontalBarOffset.top
                    }, dragDelta, 100)
                        .done(() => {
                            assert.horizontalScrollPositionIs(
                                $scrollbox,
                                expectedDistanceX + scrollLeft,
                                `scrolled left by ${Math.abs(expectedDistanceX)}px`
                            );
                            done();
                        });
                });
        });

        QUnit.test('should scroll by the certain distance on drag vertical bar via mouse', (assert) => {
            assert.expect(2);
            const done = assert.async(2);

            const CONTAINER_HEIGHT = 50;
            const CONTENT_HEIGHT = 200;
            const HEIGHT_RATIO = CONTAINER_HEIGHT / CONTENT_HEIGHT;

            const $scrollbox = createScrollbox(50, 200, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                .scrollbox();

            const $verticalBar = getVerticalBar($scrollbox);

            const dragDelta = {
                x: 0,
                y: 10
            };

            let verticalBarOffset = $verticalBar.offset();
            let scrollTop = $scrollbox.scrollTop();
            let expectedDistanceY = dragDelta.y / HEIGHT_RATIO;

            dragAndDropViaMouse($verticalBar, {
                x: verticalBarOffset.left,
                y: verticalBarOffset.top
            }, dragDelta, 100)
                .done(() => {
                    assert.verticalScrollPositionIs(
                        $scrollbox,
                        expectedDistanceY + scrollTop,
                        `scrolled bottom by ${Math.abs(expectedDistanceY)}px`
                    );
                    done();

                    dragDelta.y = -8;
                    verticalBarOffset = $verticalBar.offset();
                    scrollTop = $scrollbox.scrollTop();
                    expectedDistanceY = dragDelta.y / HEIGHT_RATIO;

                    dragAndDropViaMouse($verticalBar, {
                        x: verticalBarOffset.left,
                        y: verticalBarOffset.top
                    }, dragDelta, 100)
                        .done(() => {
                            assert.verticalScrollPositionIs(
                                $scrollbox,
                                expectedDistanceY + scrollTop,
                                `scrolled top by ${Math.abs(expectedDistanceY)}px`
                            );
                            done();
                        });
                });
        });

        if (Modernizr.touchevents) {
            QUnit.test('should scroll by the certain distance on drag horizontal bar via touch', (assert) => {
                assert.expect(2);
                const done = assert.async(2);

                const CONTAINER_WIDTH = 50;
                const CONTENT_WIDTH = 200;
                const WIDTH_RATIO = CONTAINER_WIDTH / CONTENT_WIDTH;

                const $scrollbox = createScrollbox(CONTAINER_WIDTH, CONTENT_WIDTH, 50, 200)
                    .scrollbox();

                const $horizontalBar = getHorizontalBar($scrollbox);

                const dragDelta = {
                    x: 10,
                    y: 0
                };

                let horizontalBarOffset = $horizontalBar.offset();
                let scrollLeft = $scrollbox.scrollLeft();
                let expectedDistanceX = dragDelta.x / WIDTH_RATIO;

                dragAndDropViaTouch({
                    x: horizontalBarOffset.left,
                    y: horizontalBarOffset.top
                }, dragDelta, 100)
                    .done(() => {
                        assert.horizontalScrollPositionIs(
                            $scrollbox,
                            expectedDistanceX + scrollLeft,
                            `scrolled right by ${Math.abs(expectedDistanceX)}px`
                        );
                        done();

                        dragDelta.x = -8;
                        horizontalBarOffset = $horizontalBar.offset();
                        scrollLeft = $scrollbox.scrollLeft();
                        expectedDistanceX = dragDelta.x / WIDTH_RATIO;

                        dragAndDropViaTouch({
                            x: horizontalBarOffset.left + $horizontalBar.outerWidth() - 1,
                            y: horizontalBarOffset.top
                        }, dragDelta, 100)
                            .done(() => {
                                assert.horizontalScrollPositionIs(
                                    $scrollbox,
                                    expectedDistanceX + scrollLeft,
                                    `scrolled left by ${Math.abs(expectedDistanceX)}px`
                                );
                                done();
                            });
                    });
            });

            QUnit.test('should scroll by the certain distance on drag vertical bar via touch', (assert) => {
                assert.expect(2);
                const done = assert.async(2);

                const CONTAINER_HEIGHT = 50;
                const CONTENT_HEIGHT = 200;
                const HEIGHT_RATIO = CONTAINER_HEIGHT / CONTENT_HEIGHT;

                const $scrollbox = createScrollbox(50, 200, CONTAINER_HEIGHT, CONTENT_HEIGHT)
                    .scrollbox();

                const $verticalBar = getVerticalBar($scrollbox);

                const dragDelta = {
                    x: 0,
                    y: 10
                };

                let verticalBarOffset = $verticalBar.offset();
                let scrollTop = $scrollbox.scrollTop();
                let expectedDistanceY = dragDelta.y / HEIGHT_RATIO;

                dragAndDropViaTouch({
                    x: verticalBarOffset.left,
                    y: verticalBarOffset.top
                }, dragDelta, 100)
                    .done(() => {
                        assert.verticalScrollPositionIs(
                            $scrollbox,
                            expectedDistanceY + scrollTop,
                            `scrolled bottom by ${Math.abs(expectedDistanceY)}px`
                        );
                        done();

                        dragDelta.y = -8;
                        verticalBarOffset = $verticalBar.offset();
                        scrollTop = $scrollbox.scrollTop();
                        expectedDistanceY = dragDelta.y / HEIGHT_RATIO;

                        dragAndDropViaTouch({
                            x: verticalBarOffset.left,
                            y: verticalBarOffset.top + $verticalBar.outerHeight() - 1
                        }, dragDelta, 100)
                            .done(() => {
                                assert.verticalScrollPositionIs(
                                    $scrollbox,
                                    expectedDistanceY + scrollTop,
                                    `scrolled top by ${Math.abs(expectedDistanceY)}px`
                                );
                                done();
                            });
                    });
            });

            QUnit.test('should scroll by the certain distance on drag container', (assert) => {
                assert.expect(2);
                const done = assert.async(2);

                const CONTAINER_WIDTH = 130;
                const CONTAINER_HEIGHT = 220;

                const $scrollbox = createScrollbox(CONTAINER_WIDTH, 500, CONTAINER_HEIGHT, 700)
                    .scrollbox();

                const $wrapper = getWrapper($scrollbox);

                const MOMENTUM_THRESHOLD_TIME = $scrollbox.data('scrollbox')._config.momentum.thresholdTime;

                const containerCenter = {
                    x: Math.floor(CONTAINER_WIDTH / 2),
                    y: Math.floor(CONTAINER_HEIGHT / 2)
                };

                let dragDelta = {
                    /**
                     * TODO: Uncomment.
                     * See: https://github.com/Leaflet/prosthetic-hand/issues/12
                     */
                    // x: -Math.round(CONTAINER_WIDTH * .75),
                    // y: -Math.round(CONTAINER_HEIGHT * .75)
                    x: -Math.round(CONTAINER_WIDTH * .45),
                    y: -Math.round(CONTAINER_HEIGHT * .45)
                };

                let wrapperOffset = $wrapper.offset();

                let positionEnd = {
                    x: containerCenter.x + dragDelta.x,
                    y: containerCenter.y + dragDelta.y
                };

                if (positionEnd.x < wrapperOffset.left) {
                    wrapperOffset.left = -positionEnd.x;
                }

                if (positionEnd.y < wrapperOffset.top) {
                    wrapperOffset.top = -positionEnd.y;
                }

                $wrapper.offset(wrapperOffset);

                let scrollLeft = $scrollbox.scrollLeft();
                let scrollTop = $scrollbox.scrollTop();

                dragAndDropViaTouch({
                    x: containerCenter.x + wrapperOffset.left,
                    y: containerCenter.y + wrapperOffset.top
                }, dragDelta, MOMENTUM_THRESHOLD_TIME + 100)
                    .done(() => {
                        assert.scrollPositionIs(
                            $scrollbox,
                            scrollLeft - dragDelta.x,
                            scrollTop - dragDelta.y
                        );
                        done();

                        dragDelta = {
                            /**
                             * TODO: Uncomment.
                             * See: https://github.com/Leaflet/prosthetic-hand/issues/12
                             */
                            // x: Math.round(CONTAINER_WIDTH * .6),
                            // y: Math.round(CONTAINER_HEIGHT * .6)
                            x: Math.round(CONTAINER_WIDTH * .3),
                            y: Math.round(CONTAINER_HEIGHT * .3)
                        };

                        scrollLeft = $scrollbox.scrollLeft();
                        scrollTop = $scrollbox.scrollTop();

                        dragAndDropViaTouch({
                            x: containerCenter.x + wrapperOffset.left,
                            y: containerCenter.y + wrapperOffset.top
                        }, dragDelta, MOMENTUM_THRESHOLD_TIME + 100)
                            .done(() => {
                                assert.scrollPositionIs(
                                    $scrollbox,
                                    scrollLeft - dragDelta.x,
                                    scrollTop - dragDelta.y
                                );
                                done();
                            });
                    });
            });

            QUnit.test('should scroll with inertia on swipe container', (assert) => {
                assert.expect(4);
                const done = assert.async(4);

                const CONTAINER_WIDTH = 130;
                const CONTAINER_HEIGHT = 220;

                const $scrollbox = createScrollbox(CONTAINER_WIDTH, 500, CONTAINER_HEIGHT, 700)
                    .scrollbox();

                const $wrapper = getWrapper($scrollbox);

                const containerCenter = {
                    x: Math.floor(CONTAINER_WIDTH / 2),
                    y: Math.floor(CONTAINER_HEIGHT / 2)
                };

                let dragDelta = {
                    /**
                     * TODO: Uncomment.
                     * See: https://github.com/Leaflet/prosthetic-hand/issues/12
                     */
                    // x: -Math.round(CONTAINER_WIDTH * .75),
                    // y: -Math.round(CONTAINER_HEIGHT * .75)
                    x: -Math.round(CONTAINER_WIDTH * .45),
                    y: -Math.round(CONTAINER_HEIGHT * .45)
                };

                const wrapperOffset = $wrapper.offset();

                let positionEnd = {
                    x: containerCenter.x + dragDelta.x,
                    y: containerCenter.y + dragDelta.y
                };

                if (positionEnd.x < wrapperOffset.left) {
                    wrapperOffset.left = -positionEnd.x;
                }

                if (positionEnd.y < wrapperOffset.top) {
                    wrapperOffset.top = -positionEnd.y;
                }

                $wrapper.offset(wrapperOffset);

                let scrollLeft = $scrollbox.scrollLeft();
                let scrollTop = $scrollbox.scrollTop();

                dragAndDropViaTouch({
                    x: containerCenter.x + wrapperOffset.left,
                    y: containerCenter.y + wrapperOffset.top
                }, dragDelta, 100, null, 500)
                    .done(() => {
                        const EXPECTED_SCROLL_LEFT_DISTANCE = Math.abs(dragDelta.x);
                        const EXPECTED_SCROLL_TOP_DISTANCE = Math.abs(dragDelta.y);
                        const ACTUAL_SCROLL_LEFT_DISTANCE = Math.abs($scrollbox.scrollLeft() - scrollLeft);
                        const ACTUAL_SCROLL_TOP_DISTANCE = Math.abs($scrollbox.scrollTop() - scrollTop);

                        assert.ok(
                            ACTUAL_SCROLL_LEFT_DISTANCE > EXPECTED_SCROLL_LEFT_DISTANCE,
                            `scrolled right with inertia by ${ACTUAL_SCROLL_LEFT_DISTANCE}px, ` +
                            `more than ${EXPECTED_SCROLL_LEFT_DISTANCE}px expected`
                        );
                        done();

                        assert.ok(
                            ACTUAL_SCROLL_TOP_DISTANCE > Math.abs(dragDelta.y),
                            `scrolled bottom with inertia by ${ACTUAL_SCROLL_TOP_DISTANCE}px, ` +
                            `more than ${EXPECTED_SCROLL_TOP_DISTANCE}px expected`
                        );
                        done();

                        dragDelta = {
                            /**
                             * TODO: Uncomment.
                             * See: https://github.com/Leaflet/prosthetic-hand/issues/12
                             */
                            // x: Math.round(CONTAINER_WIDTH * .6),
                            // y: Math.round(CONTAINER_HEIGHT * .6)
                            x: Math.round(CONTAINER_WIDTH * .3),
                            y: Math.round(CONTAINER_HEIGHT * .3)
                        };

                        scrollLeft = $scrollbox.scrollLeft();
                        scrollTop = $scrollbox.scrollTop();

                        dragAndDropViaTouch({
                            x: containerCenter.x + wrapperOffset.left,
                            y: containerCenter.y + wrapperOffset.top
                        }, dragDelta, 100, null, 500)
                            .done(() => {
                                const EXPECTED_SCROLL_LEFT_DISTANCE = Math.abs(dragDelta.x);
                                const EXPECTED_SCROLL_TOP_DISTANCE = Math.abs(dragDelta.y);
                                const ACTUAL_SCROLL_LEFT_DISTANCE = Math.abs($scrollbox.scrollLeft() - scrollLeft);
                                const ACTUAL_SCROLL_TOP_DISTANCE = Math.abs($scrollbox.scrollTop() - scrollTop);

                                assert.ok(
                                    ACTUAL_SCROLL_LEFT_DISTANCE > Math.abs(dragDelta.x),
                                    `scrolled left with inertia by ${ACTUAL_SCROLL_LEFT_DISTANCE}px, ` +
                                    `more than ${EXPECTED_SCROLL_LEFT_DISTANCE}px expected`
                                );
                                done();

                                assert.ok(
                                    ACTUAL_SCROLL_TOP_DISTANCE > Math.abs(dragDelta.y),
                                    `scrolled top with inertia by ${ACTUAL_SCROLL_TOP_DISTANCE}px, ` +
                                    `more than ${EXPECTED_SCROLL_TOP_DISTANCE}px expected`
                                );
                                done();
                            });
                    });
            });
        }
    });
})(QUnit, jQuery, Modernizr, Hand);
