
// start 
define ([], function() {

	var connectWebViewJavascriptBridge = function(callback) {
		if (window.WebViewJavascriptBridge) {
			callback(WebViewJavascriptBridge)
		} else {
			document.addEventListener('WebViewJavascriptBridgeReady', function() {
				callback(WebViewJavascriptBridge)
			}, false)
		}
	};

	return {
		connect : connectWebViewJavascriptBridge
	};
})

