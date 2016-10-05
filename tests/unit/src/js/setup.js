((QUnit, $) => {
    'use strict';

    QUnit.config.requireExpects = true;
    QUnit.config.testTimeout = 10000;

    // Display fixture on-screen to avoid false positives
    QUnit.begin(() => {
        $('#qunit-fixture').css({
            top: 0,
            left: 0
        });
    });

    QUnit.done(() => {
        $('#qunit-fixture').css({
            top: '',
            left: ''
        });
    });

    QUnit.testDone(() => {
        const $fixture = $('#qunit-fixture');
        const $scrollbox = $('#scrollbox-container', $fixture);

        if (undefined !== $scrollbox.data('scrollbox')) {
            $scrollbox.scrollbox('destroy');
        }

        $fixture.empty();
    });

    let log = [];

    QUnit.done((results) => {
        let tests = [];

        for (let i = 0, len = log.length; i < len; i ++) {
            let details = log[i];

            tests.push({
                name: details.name,
                result: details.result,
                expected: details.expected,
                actual: details.actual,
                source: details.source
            });
        }

        results.tests = tests;

        window.global_test_results = results;
    });

    QUnit.testStart((testDetails) => {
        QUnit.log((details) => {
            if (!details.result) {
                details.name = testDetails.name;
                log.push(details);
            }
        });
    });
})(QUnit, jQuery);