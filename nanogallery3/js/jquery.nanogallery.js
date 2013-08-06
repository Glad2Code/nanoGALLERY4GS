/*
 * nanoGallery v3.2.2
 * Plugin for jQuery by Christophe Brisbois
 * http://www.brisbois.fr
 * 
 * External components:
 *  - jQuery (http://www.jquery.com)
 *  - fancybox (http://www.fancybox.net)
 */

(function( $ ) {
	$.fn.nanoGallery = function(options) {

		var settings = $.extend( {
			// default settings
			userID:'',
			kind:'',
			album:'',
			photoset:'',
			blackList:'',
			topLabel:'home',
			displayBreadcrumb:true,
			displayCaption:true,
			thumbnailWidth:230,
			thumbnailHeight:154,
			theme:'default',
			items:null,
			itemsBaseURL:''
		}, options );
		
		return this.each(function() {
			var nanoGALLERY_obj = new nanoGALLERY();
			nanoGALLERY_obj.Initiate(this,settings);
		});
	};
}( jQuery ));


function nanoGALLERY() {
 	var g_options=null;
	var g_containerFolder=null;
	var g_containerBreadcrumb=null;
	var g_path2timthumb="";
	var g_picasaThumbSize=64;
	var g_picasaThumbAvailableSizes=new Array(32, 48, 64, 72, 94, 104, 110, 128, 144, 150, 160, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600);
	var g_flickrThumbSize='s';
	var g_flickrThumbAvailableSizes=new Array(75,100,150,240,320,500,640,800,1024);		//see http://www.flickr.com/services/api/misc.urls.html
	var g_flickrThumbAvailableSizesStr=new Array('s','t','q','m','n','-','z','c','b');
	var g_itemInfo=[];
	var g_flickrApiKey="2f0e634b471fdb47446abcb9c5afebdc";
	var g_blackList=null;
	
	this.Initiate=function(element, params) {
		"use strict";
		g_options=params;
	
		if( g_options.blackList !='' ) { g_blackList=g_options.blackList.toUpperCase().split('|'); }
		jQuery(element).addClass('nanogallery_theme_'+g_options.theme);
	
		if( g_options.photoset !== undefined ) {
			if( g_options.photoset.length > 0) { g_options.displayBreadcrumb=false; }
		}
		else { g_options.photoset=''; }
		if( g_options.album !== undefined ) {
			if( g_options.album.length > 0 ) { g_options.displayBreadcrumb=false; }
		}
		else { g_options.album=''; }
	
		if( g_options.displayBreadcrumb == true && ( g_options.kind=='picasa' || g_options.kind=='flickr')) { g_containerBreadcrumb =jQuery('<div class="nanoGalleryBreadcrumb"></div>').appendTo(element); }
		g_containerFolder =jQuery('<div class="nanoGalleryContainer"></div>').appendTo(element);
		g_path2timthumb = ""; //timthumbFolder;


		var si=0;
		if( g_options.thumbnailWidth > g_options.thumbnailHeight ) { si=g_options.thumbnailWidth; }
		else { si=g_options.thumbnailHeight; }

		switch(g_options.kind) {
			case '':
				if( g_options.itemsBaseURL.length >0 ) {g_options.itemsBaseURL+='/';}
				if( g_options.items !== undefined && g_options.items !== null ) {
					ProcessItemOption();
				}
				else {
					var elements=jQuery(element).children('a');
					if( elements.length > 0 )
						ProcessHREF(elements);
					else
						alert('nanoGallery - error: no image to process.');
				}
				break;
			
			case 'getsimple':
				return;
				var url=params.pluginURL+'/nanogallery_getitems.php';
				alert(url);
				//$.getJSON(url+'/nanogallery_getitems.php', {limit: 1}, function(data) {
				//$.getJSON(url+'/nanogallery_getitems.php', function(data) {
				jQuery.ajaxSetup({ cache: false });
				jQuery.support.cors = true;
				jQuery.getJSON(url, function(data) {
					alert("ok");
					// data is now an array with all the images
					$.each(data, function(i) {
						alert(data[i]);
						// do something with each image
						// data[i] will have the image path
					});
				});
				alert("done");
				break;
				
			case 'flickr':
				for( i=0; i<g_flickrThumbAvailableSizes.length; i++) {
					g_flickrThumbSize=g_flickrThumbAvailableSizesStr[i];
					if( si < g_flickrThumbAvailableSizes[i] ) {
						break;
					}
				}
				FlickrGetItems(g_options.photoset,g_options.topLabel);
				break;
			case 'picasa':
			default:
				for(var i=0; i<g_picasaThumbAvailableSizes.length; i++) {
					g_picasaThumbSize=g_picasaThumbAvailableSizes[i];
					if( si < g_picasaThumbAvailableSizes[i] ) {
						break;
					}
				}
				PicasaGetItems(g_options.album,g_options.topLabel);
				break;
		}

	};
	
	// ##### LIST OF ITEMS IN OPTIONS #####
	function ProcessItemOption() {
		g_itemInfo.length=0;

		jQuery.each(g_options.items, function(i,item){
			var newObj=new Array(5);
			newObj['title']=item.title;
			if( item.srct !== undefined && item.srct.length>0 ) {
				newObj['thumbsrc']=g_options.itemsBaseURL+item.srct;
			}
			else {
				newObj['thumbsrc']=g_options.itemsBaseURL+item.src;
			}
			newObj['src']=g_options.itemsBaseURL+item.src;
			newObj['description']=item.description;
			newObj['kind']='image';

			g_itemInfo.push(newObj);
		});
		
		renderGallery();
	};

	// ##### LIST OF HREF ATTRIBUTES #####
	function ProcessHREF(elements) {
		g_itemInfo.length=0;

		jQuery.each(elements, function(i,item){
			var newObj=new Array(5);
			newObj['title']=jQuery(item).text();
			if( jQuery(item).attr('data-ngthumb') !== undefined && jQuery(item).attr('data-ngthumb').length>0 ) {
				newObj['thumbsrc']=g_options.itemsBaseURL+jQuery(item).attr('data-ngthumb');
			}
			else {
				newObj['thumbsrc']=g_options.itemsBaseURL+jQuery(item).attr('href');
			}
			newObj['src']=g_options.itemsBaseURL+jQuery(item).attr('href');
			newObj['description']=jQuery(item).attr('data-ngdesc');
			if( jQuery(item).attr('data-ngdesc') !== undefined && jQuery(item).attr('data-ngdesc').length>0 ) {
				newObj['description']=jQuery(item).attr('data-ngdesc');
			}
			else {
				newObj['description']='';
			}
			newObj['kind']='image';
			g_itemInfo.push(newObj);
		});
		
		jQuery.each(elements, function(i,item){
			jQuery(item).remove();
		});
		
		renderGallery();
	};

	
	// ##### FLICKR STORAGE #####
	function FlickrGetItems( itemID, albumLabel ) {
		var obj=null;

		// breadcrumb
		if( g_options.displayBreadcrumb == true ) {
			if( albumLabel != "" ) {
				if( jQuery(g_containerBreadcrumb).children().length > 0 ) {
					jQuery('<div class="separator">&nbsp;>&nbsp;</div>').appendTo(g_containerBreadcrumb);
				}
				var newDiv =jQuery('<div class="folder">'+albumLabel+'</div>').appendTo(g_containerBreadcrumb);
				jQuery(newDiv).data("path",itemID);
				newDiv.click(function() {
					var folder=jQuery(this).data("path");
					jQuery(this).nextAll().remove();
					FlickrGetItems(folder,'');
				});;
			}
		}
		
		jQuery(g_containerFolder).children().remove();

		// RETRIEVE PHOTOSETS
		if( itemID == '' ) {
			var url = "http://api.flickr.com/services/rest/?&method=flickr.photosets.getList&api_key=" + g_flickrApiKey + "&user_id="+g_options.userID+"&format=json&jsoncallback=?";
			kind='album';

			// get the content and display it
			jQuery.ajaxSetup({ cache: false });
			jQuery.support.cors = true;
			jQuery.getJSON(url, function(data) {
				g_itemInfo.length=0;
				
				jQuery.each(data.photosets.photoset, function(i,item){
					//Get the title 
					itemTitle = item.title._content;
					itemID=item.id;
					//Get the description
					itemDescription='';
					if (item.description._content != undefined)
						itemDescription=item.description._content;
					itemThumbURL = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.primary + "_" + item.secret + "_"+g_flickrThumbSize+".jpg";
					imgUrl=''
					itemKind=kind;

					var found=false;
					if( g_blackList !== null ) {
						//blackList : ignore album cointaining one of the specified keyword in the title
						var s=itemTitle.toUpperCase();
						for( var j=0; j<g_blackList.length; j++) {
							if( s.indexOf(g_blackList[j]) !== -1 ) { return true; }
						}
					}
					
					if( !found ) {
						newObj=new Array(5);
						newObj['title']=itemTitle;
						newObj['thumbsrc']=itemThumbURL;
						newObj['src']=itemID;
						newObj['description']=itemDescription;
						newObj['kind']=itemKind;
						g_itemInfo.push(newObj);
					}
				});
				
				renderGallery();
			});		
			
		}
		// RETRIEVE PHOTOS
		else {
			var url = "http://api.flickr.com/services/rest/?&method=flickr.photosets.getPhotos&api_key=" + g_flickrApiKey + "&photoset_id="+itemID+"&extras=views,url_s,url_o,url_m&format=json&jsoncallback=?";
			kind='photo';

			// get the content and display it
			jQuery.ajaxSetup({ cache: false });
			jQuery.support.cors = true;
			jQuery.getJSON(url, function(data) {
				g_itemInfo.length=0;

				jQuery.each(data.photoset.photo, function(i,item){
					//Get the title 
					itemTitle = item.title._content;
					itemID=item.id;
					//Get the description
					itemDescription='';
					itemThumbURL = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id +"_" + item.secret + "_"+g_flickrThumbSize+".jpg";
					imgUrl = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_o.jpg";
					itemKind=kind;
					
					var newObj=new Array(5);
					newObj['title']=itemTitle;
					newObj['thumbsrc']=itemThumbURL;
					newObj['src']=imgUrl;
					newObj['description']=itemDescription;
					newObj['kind']=itemKind;
					g_itemInfo.push(newObj);
					
				});
				renderGallery();
			});		
		}
	};


	// ##### PICASA STORAGE #####
	function PicasaGetItems( itemID, albumLabel ) {
		var kind='';
		jQuery(g_containerFolder).children().remove();
		if( itemID == '' ) {
			var url = 'http://picasaweb.google.com/data/feed/api/user/'+g_options.userID+'?alt=json&kind=album&thumbsize='+g_picasaThumbSize;
			kind='album';
		}
		else {
			var url = 'http://picasaweb.google.com/data/feed/api/user/'+g_options.userID+'/albumid/'+itemID+'?alt=json&kind=photo&thumbsize='+g_picasaThumbSize+'&imgmax=d';
			kind='photo';
		}

		// breadcrumb
		if( g_options.displayBreadcrumb == true ) {
			if( albumLabel != "" ) {
				if( jQuery(g_containerBreadcrumb).children().length > 0 ) {
					jQuery('<div class="separator">&nbsp;>&nbsp;</div>').appendTo(g_containerBreadcrumb);
				}
				var newDiv =jQuery('<div class="folder">'+albumLabel+'</div>').appendTo(g_containerBreadcrumb);
				jQuery(newDiv).data("path",itemID);
				newDiv.click(function() {
					var folder=jQuery(this).data("path");
					jQuery(this).nextAll().remove();
					PicasaGetItems(folder,'');
				});;
			}
		}
		
		// get the content and display it
		jQuery.ajaxSetup({ cache: false });
		jQuery.support.cors = true;
		url = url + "&callback=?";
		jQuery.getJSON(url, function(data) {
			g_itemInfo.length=0;
			
			jQuery.each(data.feed.entry, function(i,data){
				//Get the title 
				itemTitle = data.media$group.media$title.$t;
				//Get the URL of the thumbnail
				itemThumbURL = data.media$group.media$thumbnail[0].url;
				//Get the ID 
				itemID = data.id.$t;
				itemID = itemID.split('/')[9].split('?')[0];
				//Get the description
				itemDescription = data.media$group.media$description.$t;
				if( kind == 'photo') { 
					itemTitle=itemDescription;
					itemDescription='';
				}
				
				imgUrl=data.media$group.media$content[0].url
				itemKind=kind;

				var found=false;
				if( g_blackList != null && kind == 'album' ) {
					//blackList : ignore album cointaining one of the specified keyword in the title
					var s=itemTitle.toUpperCase();
					for( var j=0; j<g_blackList.length; j++) {
						if( s.indexOf(g_blackList[j]) !== -1 ) { return true; }
					}
				}
				
				if( !found ) {
					newObj=new Array(5);
					newObj['title']=itemTitle;
					newObj['thumbsrc']=itemThumbURL;
					if( kind == 'album' ) 
						newObj['src']=itemID;
					else
						newObj['src']=imgUrl;
					newObj['description']=itemDescription;
					newObj['kind']=itemKind;
					g_itemInfo.push(newObj);
				}
				
			});
				
			renderGallery();	

		})
		.error( function(XMLHttpRequest, textStatus, errorThrown) {
			alert("Error with Picasa: " + textStatus);
		});
	};



	// ##### DISPLAY THE GALLERY #####
	function renderGallery() {
		jQuery(g_containerFolder).children().remove();
		
		jQuery.each(g_itemInfo, function(i,item){
			var newDiv =jQuery('<div class="container"></div>').appendTo(g_containerFolder);
			jQuery(newDiv).append('<div class="imgContainer"><img class="image" src="'+item['thumbsrc']+'"></div>');
			if( item['kind'] == 'album' ) {
				if( g_options.displayCaption == true ) {
					jQuery(newDiv).append('<div class="iconInfo"></div>');
					var newLabel=jQuery(newDiv).append('<div class="labelImage"><div class="labelIconFolder"></div><div class="labelTitle">'+item['title']+'</div><div class="labelDescription">'+item['description']+'</div></div>');
				}
			}
			else {
				var s=item['title'];
				if( g_options.displayCaption == true ) {
					if( s ===undefined || s.length == 0 ) { s=i+1; }
					jQuery(newDiv).append('<div class="iconInfo"></div>');
					var newLabel=jQuery(newDiv).append('<div class="labelImage"><div class="labelIconImage"></div><div class="labelTitle">'+s+'</div><div class="labelDescription">'+item['description']+'</div></div>');
				}
			}

			jQuery(newDiv).data("index",i);
			newDiv.click(function() {
				var n=jQuery(this).data("index");
				if( g_itemInfo[n]['kind'] == 'album' ) {
					if( g_options.kind == 'picasa' )
						PicasaGetItems(g_itemInfo[n]['src'],g_itemInfo[n]['title']);
					else
						FlickrGetItems(g_itemInfo[n]['src'],g_itemInfo[n]['title']);
				}
				else {
					OpenFancyBox(this);
				}
			});
		});
		SetContainerSize();
	};

	function SetContainerSize() {
		jQuery(g_containerFolder).find('.imgContainer').css('width',g_options.thumbnailWidth);
		jQuery(g_containerFolder).find('.imgContainer').css('height',g_options.thumbnailHeight);
		jQuery(g_containerFolder).find('img').css('maxWidth',g_options.thumbnailWidth);
		jQuery(g_containerFolder).find('img').css('maxHeight',g_options.thumbnailHeight);
		jQuery(g_containerFolder).find('.labelImage').css('width',g_options.thumbnailWidth);
		//jQuery(g_containerFolder).find('.container').css('height',g_options.thumbnailHeight);
	};


	// ##### DISPLAY IMAGE #####
	function OpenFancyBox(element) {
		var n=jQuery(element).data("index");
		var lstImages=new Array();
		lstImages[0]=g_itemInfo[n]['src'];
		for( var j=n+1; j<g_itemInfo.length; j++) {
			lstImages[lstImages.length]=g_itemInfo[j]['src'];
		}
		for( var j=0; j<n; j++) {
			lstImages[lstImages.length]=g_itemInfo[j]['src'];
		}
		jQuery.fancybox.open(lstImages,{'autoPlay':false, 'nextEffect':'fade', 'prevEffect':'fade','scrolling':'no',
			helpers		: {	buttons	: { 'position' : 'bottom'} }
		});
	};
	
	
	
}



