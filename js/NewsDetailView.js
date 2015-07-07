
define ([
	'jquery',
	'bridge',
	'detailContent',
	// 'lazyImages',
	'fastclick'
], function($, Bridge, DetailContent,  Fastclick) {

	var uniqueId = 1

	var isCelluarTelephone;
	var isArticleFavored;
	var screenWidth;
	var articleFavoredSuccess;

	var log = function(message, data) {
		var logWrap = document.createElement('div');
		var log = document.getElementById('log')
		var el = document.createElement('div')
		el.className = 'logLine'
		el.innerHTML = uniqueId++ + '. ' + message + ':<br/>' + JSON.stringify(data)
		if (log.children.length) { log.insertBefore(el, log.children[0]) }
		else { log.appendChild(el) }
	}

	var container = document.querySelector('#view-newsDetail .content .bd');
	var recommendContainer = document.querySelector('#recommend-list');
	var authorIntroductionr = document.querySelector('#author-introduction');
	var contentFooterContainer = document.querySelector('#content-footer');
	var tagsListContainer = document.querySelector('#tags-list');

	// 渲染HTML
	var render = function(details) {
		var newstext = details.newstext.replace(/(\[!--empirenews.page--\])/g, '')
										.replace(/(src)/g, 'data-src')
										.replace(/(<img )/g, '<img src="img/image-loading.png" ')
										.replace(/<span[^>]*>/g, '')
										.replace(/<em[^>]*>/g, '')
										.replace(/<(?!img|table|iframe|a|strong|p|\/p|div|\/div|).*?>/g, '')
										

		var content = document.querySelector('#view-newsDetail .content');

		container.innerHTML.scrollTop = 0;
		container.style.fontSize = '16px';
		container.innerHTML = newstext;

		refreshContainerHeight();

		setContainerStyleAndOperation( content , container.clientWidth)

		onClickLiksDelegate( content );
	}

	// onclick 事件委托
	var onClickLiksDelegate = function(content) {
		
		var delegateHandle = function(event) {
			event.preventDefault();

			var me = $(this);
			var src = me[0].href;

			// 点击图片
			if (me[0].tagName == 'IMG') {

				var imgAll = $('section img');
				var json = {};
				imgAll.each(function(){
					// console.log(this.src, '当前：' src)
				})
			}

			// 点击超链接
			if (me[0].tagName == 'A' && me.attr('href') != undefined) {

				if (src == 'javascript:;') return;

				var liksResultJson = getLiksIdAndType(src);

				if (liksResultJson.type == 'bbs' || liksResultJson.type == 'news' || liksResultJson.type == 'default') {
					Bridge.connect(function(bridge){
						bridge.callHandler('delegateUIWebViewOnClikEvent', {'result': liksResultJson})			
					});
				}
			}

			// 点击标签 tagList
			if (me.attr('data-tagid')) {
				var tagid = me.attr('data-tagid');
				var tagname = me[0].innerHTML;

				try{
					window.ANDROID.didClickArticleTagOnTagIdFromWebView( JSON.stringify({'tagid': tagid, 'tagname': tagname}) );
				}catch(error){
					console.log('tagid: '+tagid, 'tagname 1: '+tagname)
				}
				
			}
		}

		$('section').undelegate().delegate('a, img', 'click', delegateHandle);
	}

	// 获取论坛tid 和资讯aid
	var getLiksIdAndType = function(src) {

		var domains = src.replace('http://','');
		var splitDomains = domains.split('.');
		var result = {};

		// 资讯
		if (splitDomains[0] == 'www' && splitDomains[1] == 'biketo') {
			var strSplit = src.split('/');
			var lastStr = strSplit[strSplit.length -1];
			var idStr = lastStr.split('.')[0];
			// 如果是分页
			if (idStr.indexOf('_') != -1) idStr = idStr.split('_')[0];
			result = (idStr && idStr.length <= 6 ) ? {'id':idStr, 'src': src, 'type':'news'} : {'id':idStr, 'src': src, 'type':'default'};
		}

		// 论坛
		else if (splitDomains[0] == 'bbs' && splitDomains[1] == 'biketo') {
			var strSplit = src.split('-');
			var lastStr = strSplit[strSplit.length -3]

			result = (lastStr && lastStr.length <= 8 ) ? {'id':lastStr, 'src': src, 'type':'bbs'} : {'id':lastStr, 'src': src, 'type':'default'};
		}

		// 外链
		else { result = {'id':'', 'src': src, 'type':'default'}; }

		console.log(result)

		return result;
	}

	// 设置相关样式
	var setContainerStyleAndOperation = function(newstext, containerWidth) {

		// 遍历dom节点
		var allDom = newstext.getElementsByTagName('p');
		var collectTemp = [];
		var imagesIndex = 0;
		var imageCount = 0;

		for (var i = 0; i < allDom.length; i++) collectTemp[collectTemp.length] = allDom[i];


		var firstForEache = function(i) {

			var $this = $(this);
			var $imagesTag = $this.find('img');
			var $iframeTag = $this.find('iframe');
			var $embedTag = $this.find('embed');
			var $imageParent = $imagesTag.parents('p');

			// Imges Tage
			if ($imagesTag[0]) {

				imagesIndex ++;

				// 获取图片地址
				var imgSrc = $imagesTag.attr('data-src');
				// var sdnRootUrl = 'http://source.biketo.com' + imgSrc;
				var imageSize = (isCelluarTelephone == 1) ? '/d/imagecache/rewidth/' +screenWidth : '/d/imagecache/rewidth/640/';
				var sdnRootUrl = 'http://www.biketo.com' + imageSize + imgSrc
				var imagesLength = collectTemp.length;

				$imagesTag.attr('data-index', imagesIndex);

				var img = new Image();
				img.src = sdnRootUrl;

				// 外连图片
				if (imgSrc.indexOf('http://') != -1) { 
					$imagesTag.attr('src', imgSrc);
				} 
				else {

					$imagesTag.attr('src', 'img/image-loading.png');

					// $imagesTag.attr('src', sdnRootUrl); // www.biketo.com

					// $imagesTag.attr('src', sdnRootUrl + setImageSize());	// source.biketo.com

					// 加载完成执行
					img.onload = function(){
					    $imagesTag.addClass('animated fadeIn');
					    $imagesTag.attr('src', this.src); // www.biketo.com
					}
				}

				// 图片居中 文字缩进 下边距
				$imageParent.css({ 'text-align': 'center', 'margin-bottom': '0', 'text-indent': '0' });

				// 图片宽度 默认高度 3:2
//				$imagesTag.css({ 'width': '100%', 'height': 'auto' });//TODO:设置图片宽高
				$imagesTag.css({ 'width': containerWidth +'px', 'height': containerWidth / (3/2) +'px' });

				// 判断每日一图下载图标时隐藏, 判断图片高宽度 ( 如果img的上上级元素是P元素，并且包含2个a元素 或 其中一个是a元素 )
				var that = $imagesTag.parents('a');
				if (that.length !=0 ) {
					if (that.length == 2 || that[0].tagName == 'A' || that[1].tagName == 'A') {
						$imageParent.remove();
					}
				}
			}

			// Iframe Tag
			if ($iframeTag[0]) {
				$iframeTag.attr('src', $iframeTag.attr('data-src'));
				$iframeTag.parents('p').css({'text-align': 'center', 'text-indent': '0'})
				$iframeTag.css({'height': containerWidth / (3/2) +'px'})
			};

			// Embed tag 非HTML的视屏，直接删除 
			if ($embedTag) $embedTag.remove();

			// Last elements
			if (i == collectTemp.length -1) {
				refreshContainerHeight();
				if (collectTemp[i].innerHTML.indexOf('责任编辑') <= 1) collectTemp[i].style.textAlign = "left";
			};
		}

		var secondForEache = function(i) {

			var $this = $(this);
			var $imagesTag = $this.find('img');

			var imgSrc = $imagesTag ? $imagesTag.attr('data-src') : '';
			var imgWidth = $imagesTag ? $imagesTag.attr('data-width') : '';
			var imgHeight = $imagesTag ? $imagesTag.attr('data-height') : '';
			var customWidth = containerWidth;
			var scale = imgWidth/customWidth;
			var heightScale = Math.floor(imgHeight/scale);

			// Imges Tage
			if (!$imagesTag[0]) {
				return;
			} else {
				imageCount ++;
			}

			// 如果是外链则跳过 
			if ( imgSrc.indexOf('http://') != -1 ) return;

			// 从标签获取宽高值
			$imagesTag[0].style.height = heightScale +'px';

			// 从服务器获取高度
			var requestGetImageInfoCallback = function(response) {
				// 计算图片比例
				var height = response.height;
				var width = response.width;
				var customWidth = containerWidth;
				var scale = width/customWidth;
				var heightScale = Math.floor(height/scale);

				if (!$imagesTag[0]) return;

				var imagesIndex = $imagesTag[0].getAttribute('data-index');

				// $imagesTag[0].style.border = '1px solid red'

				// 设置图片高度
				$imagesTag[0].style.height = heightScale +'px';

				if (imageCount == imagesIndex || imagesIndex == Math.floor((imageCount) / 3)) refreshContainerHeight();
			}

			// 如果已经有预设值则退出
			if (imgHeight) return;

			// 获取占位符高度, 并返回最终的高度
			$.ajax({type : 'get', 
					url : 'http://source.biketo.com' + imgSrc +'?imageInfo&time='+new Date().getTime(), 
					data : '', 
					async : true, 
					success : requestGetImageInfoCallback 
			});	
		}

		$(collectTemp).each(firstForEache);
		$(collectTemp).each(secondForEache);

		collectTemp = null;
	}

	// 设置图片大小，从OC中获取
	var setImageSize = function() {
		// &time='+new Date().getTime()
		//是否开去省流量模式
		return (isCelluarTelephone == 1) ? '?imageView2/2/w/' +screenWidth+ '/q/95' : '?imageView2/2/w/640/q/95';
	}

	var setContainerFontSize = function(fontSize) {
		$(container).css('font-size', fontSize +'px');
	}

	// 返回 总的高度
	var containerHeight = function() {
		var detailContentHeight = document.querySelector('#view-newsDetail').clientHeight;
		var recommendListHeight = recommendContainer.clientHeight +10;
		var contentFooterContainerHeight = 80;
		var height = detailContentHeight + recommendListHeight + contentFooterContainerHeight;
		return height
	}

	// 通知OC改变webView高度
	window.refreshContainerHeight = function() {

		try{
			window.ANDROID.refreshNativeWebViewHeight( JSON.stringify({'height': containerHeight()}) );
		}catch(error){
			console.log('更新高度')
		}
		

		console.log('js_log更新高度', containerHeight());
	}

	// 底部 与 喜欢 
	var contentFooter = function() {

		var $favorBtn = $(contentFooterContainer).find('.source-favor-btn a');
		var $sourceLinkBtn = $(contentFooterContainer).find('.source-link-btn a');


		// init
		$sourceLinkBtn.attr('href', fromurl);
		$favorBtn.find('span').html(diggtop +' 喜欢');

		if (isArticleFavored == 1 || articleFavoredSuccess) {

			// 成功喜欢后更新状态
			if (articleFavoredSuccess) {
				diggtop ++;
				$favorBtn.find('span').html( diggtop +' 喜欢');
			}

			$favorBtn.css('color', 'rgb(223, 58, 67)');
			$favorBtn.find('span').html(diggtop +' 喜欢');
			$favorBtn.find('span').addClass('favored');
		};

		$favorBtn.click(function() {
			if (isArticleFavored ==1) return;
			window.ANDROID.didClickArticleFavorButtonFromWebView(aid, classid );
		})
	}

	// 推荐文章列表
	var renderRecommendList = function(classid) {

		var url = 'http://www.biketo.com/app.php?m=client&a=render&';
		var showType = 'recommendList';
		var classid = classid;
		var listDom = recommendContainer.querySelector('ul');

		var callback = function (respones) {

			$(respones.list).each(function(){
				var that = $(this)[0];
				$(listDom).append('<li><a href="'+that.uri+'">'+that.title+'</a></li>');
			})

			refreshContainerHeight();
		}

		$.get(url, {'classid' : classid, 'showType': showType}, callback, 'json');
	}

		// 文章作者列表
	var authorIntroductionList = function(classid, aid) {

		var url = 'http://www.biketo.com/app.php?m=client&a=getAuthorInfByType&type=authorInfo';
		var authorname;

		var callback = function (respones) {

			if (respones === null) return;

			if (respones.status == '1') {

				$('#author-introduction').css('display', 'block');
				$('#author-introduction .right').css('width', '93%'); // fixbug
				authorIntroductionr.setAttribute('data-columnid', respones.authorList[0].columnid);
				authorIntroductionr.querySelector('.left .name').innerHTML = respones.authorList[0].name;
				authorIntroductionr.querySelector('.left .info').innerHTML = respones.authorList[0].position;
				authorIntroductionr.querySelector('.right p').innerHTML = '简介：'+respones.authorList[0].description;

				authorname = respones.authorList[0].name;

				var url = 'http://source.biketo.com'+respones.authorList[0].userpic;
				var img = new Image();
				img.src = url;

				img.onload = function() {
					authorIntroductionr.querySelector('.left .avatar img').src = url;
				}

				refreshContainerHeight();

			};
		}

		$.get(url, {'classid' : classid, 'id' : aid }, callback, 'json');

		authorIntroductionr.onclick = function(){
			
			var columnid = authorIntroductionr.getAttribute('data-columnid');
			if (!columnid) return;

			Bridge.connect(function(bridge){
				bridge.callHandler('didClickArticleAuthorIntroFromWebView', { 'columnid': columnid ,'authorname': authorname })			
			});
		}

	}
    
    // 文章标签
	var tagsList = function(aid) {

		var url = 'http://www.biketo.com/app.php?m=client&a=getArticleTagOrTagListByType';
		var listDom = tagsListContainer.querySelector('ul');
		var callback = function (respones) {

			if (respones === null) {
				console.log('ok');
				$(tagsListContainer).remove();
				return;
			};

			if (respones.status == '1') {
				console.log(respones)
				$(respones.tagList).each(function(){
					var that = $(this)[0];
					$(listDom).append('<li><a data-tagid="'+that.tagid+'">'+that.tagname+'</a></li>');
				})
			};

		}
		$.get(url, {'type' : 'tagList', 'id' : aid }, callback, 'json');

		refreshContainerHeight();
	}

	var initialize = function() {

		FastClick.attach(document.body);

		enableDebug = false;
		enableDebug = true;

		if (enableDebug) {

			DetailContent.init({'aid': '23267', 'classid': '1'}); // 每日一图

			var fontSize = '16';

			screenWidth = document.body.clientWidth;
			isArticleFavored = 0;
			diggtop = 2;
			articleFavoredSuccess = false;
			fromurl = 'http://www.biketo.com/mobile/#index'

			// 渲染html
			$(document).on('ajaxSucces', function(response, details) {
				if (details.classid && details.id) render(details);
				authorIntroductionList(details.classid, details.id);
			})
			
			// 渲染相关文章列表
			renderRecommendList(80);

			// 底部 与 喜欢 
			contentFooter();

			// 设置字体大小
			setContainerFontSize(fontSize);

			// 显示底部和推荐文章列表
			setTimeout(function(){
				$(contentFooterContainer).css('visibility', 'visible');
				$(recommendContainer).css('visibility', 'visible');
				$(tagsListContainer).css('visibility', 'visible');
			}, 1000)


			tagsList(16712); //16712

			return false;
		}


		// 接收来自android的回调
		window.newsDetailInit = function(data) {
			
			fontSize = data.fontSize;                     // 原生中设置的字体大小
			screenWidth = data.screenWidth;               // 设备宽度
			screenHeight = data.screenHeight;             // 设备高度
			isCelluarTelephone = data.isCelluarTelephone; // 是否开启省流量模式 (在应用中我的设置中)
			isArticleFavored = data.isArticleFavored;     // 是否已经收藏 （通过匹配 NSUserDefault中存储数据判断）

			// details object
	        var detailsObj = data.html.details;
	                           
			fromurl = detailsObj.fromurl;
			aid     = detailsObj.id;
			classid = detailsObj.classid;
			diggtop = detailsObj.diggtop;

			// 渲染html
			render(detailsObj);

			// 渲染相关文章列表
			renderRecommendList(detailsObj.classid);

			// 底部 与 喜欢 
			contentFooter();
            
            // 作者介绍
			authorIntroductionList(detailsObj.classid, detailsObj.id);
            
            // 标签列表
			tagsList(detailsObj.id);

			// 设置字体大小
			setContainerFontSize(fontSize);

			// 请求拿到数据结果后才显示，（否则在请求过程中会显示空的栏目）
			$(contentFooterContainer).css('visibility', 'visible');
			$(recommendContainer).css('visibility', 'visible');
			$(tagsListContainer).css('visibility', 'visible');
		}
		
		window.refreshArticleFavorStatus = function (data) {
			var data = data;
			if (data == '1') {
				articleFavoredSuccess = true;
				contentFooter();
			};
		}

	};

	return { init : initialize };
})