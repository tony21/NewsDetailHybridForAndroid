
// start 
define (['jquery'], function($) {

	var htmlStr;

	// http
	var requestDetailContentHtmlByParam = function(param) {

		var url = 'http://www.biketo.com/app.php?m=client&a=render&';
		var callback = function (respones) {
			var newstext = respones.details;
			$(document).trigger('ajaxSucces', newstext);
		}
		$.get(url, {'classid' : param.classid, 'id' : param.aid }, callback, 'json');
	}
	
	return { init: requestDetailContentHtmlByParam };
})

