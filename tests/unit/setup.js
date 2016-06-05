(function (QUnit, $) {
    QUnit.config.requireExpects = true;
    QUnit.config.testTimeout = 20000;

    // Display fixture on-screen to avoid false positives
    QUnit.begin(function () {
        $('#qunit-fixture').css({
            top: 0,
            left: 0
        });
    });

    QUnit.done(function () {
        $('#qunit-fixture').css({
            top: '',
            left: ''
        });
    });

    QUnit.testDone(function () {
        $('#qunit-fixture').empty();
    });

    var log = [];
    var testName;

    QUnit.done(function (test_results) {
        var tests = [];

        for (var i = 0, len = log.length; i < len; i ++) {
            var details = log[i];
            tests.push({
                name: details.name,
                result: details.result,
                expected: details.expected,
                actual: details.actual,
                source: details.source
            });
        }

        test_results.tests = tests;

        window.global_test_results = test_results;
    });
    QUnit.testStart(function (testDetails) {
        QUnit.log(function (details) {
            if (!details.result) {
                details.name = testDetails.name;
                log.push(details);
            }
        });
    });
})(QUnit, jQuery);