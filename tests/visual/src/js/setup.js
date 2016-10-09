(($) => {
    'use strict';

    $(() => {
        let content = '<ul>';

        for (let i = 1; i <= 100; ++ i) {
            let anchors = [];

            for (let j = 1; j <= 10; ++ j) {
                let itemId = `${i}-${j}`;

                anchors.push(`<a id="item-${itemId}" href="#item-${itemId}">Item ${itemId}</a>`);
            }

            content += `<li id="line${i}">${anchors.join(' ')}</li>`;
        }

        content += '</ul>';

        const $container = $('#container')
            .append(content)
            .scrollbox();

        $(window).on('resize orientationchange', () => {
            $container.scrollbox('update');
        });
    });

})(jQuery);
