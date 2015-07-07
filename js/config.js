// This set's up the module paths for underscore and backbone
require.config({
    'paths': {
        // libs
        jquery:     'libs/jquery',
        // extend
        fastclick:  'libs/fastclick',
        lazyImages: 'libs/dataLazy',
    },
    'shim': { }

});

require(['NewsDetailView'], function (NewsDetailView) {
    NewsDetailView.init();
});
