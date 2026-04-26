


function RegisterSteamOnWebPanelShownHandler( f )
{
	$J(document).on( 'visibilitychange', function() {
		if ( document.visibilityState === "visible" )
			f();
	});
}

function RegisterSteamOnWebPanelHiddenHandler( f )
{
	$J(document).on( 'visibilitychange', function() {
		if ( document.visibilityState === "hidden" )
			f();
	});
}





function RefreshNotificationArea()
{
	// the new way - updates both the old envelope and responsive menu
	UpdateNotificationCounts();
}

function vIE()
{
	return (navigator.appName=='Microsoft Internet Explorer') ? parseFloat( ( new RegExp( "MSIE ([0-9]{1,}[.0-9]{0,})" ) ).exec( navigator.userAgent )[1] ) : -1;
}

function checkAbuseSub( elForm )
{
	if ( !$J(elForm).find('input[name=abuseType]:checked').length )
	{
		alert( 'Please select a reason for reporting abuse' );
		return false;
	}

	CModal.DismissActiveModal();

	var params = $J(elForm).serializeArray();
	params.push( {name: 'json', value: 1} );

	$J.post( 'https://steamcommunity.com/actions/ReportAbuse/', params).done( function() {
		ShowAlertDialog( 'Thank You!', 'Thank you for reporting offensive content and helping to keep Steam clean and friendly.' );
	}).fail( function() {
		ShowAlertDialog( 'Report Violation', 'There was a problem saving your report.  Please try again later.' );
	});
	return false;
}



var g_whiteListedDomains = [
	"steampowered.com",
	"steamgames.com",
	"steamcommunity.com",
	"valvesoftware.com",
	"youtube.com",
	"youtu.be",
	"live.com",
	"msn.com",
	"myspace.com",
	"facebook.com",
	"hi5.com",
	"wikipedia.org",
	"orkut.com",
	"blogger.com",
	"friendster.com",
	"fotolog.net",
	"google.fr",
	"baidu.com",
	"microsoft.com",
	"shacknews.com",
	"bbc.co.uk",
	"cnn.com",
	"foxsports.com",
	"pcmag.com",
	"nytimes.com",
	"flickr.com",
	"amazon.com",
	"veoh.com",
	"pcgamer.com",
	"metacritic.com",
	"fileplanet.com",
	"gamespot.com",
	"gametap.com",
	"ign.com",
	"kotaku.com",
	"xfire.com",
	"pcgames.gwn.com",
	"gamezone.com",
	"gamesradar.com",
	"digg.com",
	"engadget.com",
	"gizmodo.com",
	"gamesforwindows.com",
	"xbox.com",
	"cnet.com",
	"l4d.com",
	"teamfortress.com",
	"tf2.com",
	"half-life2.com",
	"aperturescience.com",
	"dayofdefeat.com",
	"dota2.com",
	"playdota.com",
	"kickstarter.com",
	"gamingheads.com",
	"reddit.com",
	"counter-strike.net",
	"imgur.com"
];

function getHostname( str )
{
	var re = new RegExp( '^(steam://openurl(_external)?/)?(f|ht)tps?://([^@/?#]*@)?([^/#?]+)', 'im' );
	return str.trim().match(re)[5].toString();
}

function AlertNonSteamSite( elem )
{
	var url = elem.href;
	var hostname = getHostname( url );
	if ( hostname )
	{
		hostname = hostname.toLowerCase();
		for ( var i = 0; i < g_whiteListedDomains.length; ++i )
		{
			var index = hostname.lastIndexOf( g_whiteListedDomains[i] );
			if ( index != -1 && index == ( hostname.length - g_whiteListedDomains[i].length )
				 && ( index == 0 || hostname.charAt( index - 1 ) == '.' ) )
			{
				return true;
			}
		}
		return confirm( 'Note: the URL you have clicked on is not an official Steam web site.\n\n'
						+ url.replace( new RegExp( '^steam://openurl(_external)?/' ), '' ) + '\n\n'
						+ 'If this web site asks for your user name or password, do not enter that information. You could lose your Steam account and all your games!\n'
						+ 'Are you sure you want to visit this page? Click OK to continue at your own risk.\n' );
	}

	ShowAlertDialog( '', 'The URL is badly formed.');
	return false;
}

var lastFilters = new Object();
function FilterListFast( target, str )
{
	var lastFilter = lastFilters[target];
	if ( !lastFilter )
		lastFilter = '';

	str = str.toLowerCase();
	if ( str == lastFilter )
		return false;

	var expanding = false;
	var contracting = false;
	if ( str.length > lastFilter.length && str.startsWith( lastFilter ) )
		expanding = true;
	if ( !str || str.length < lastFilter.length && lastFilter.startsWith( str ) )
		contracting = true;

	var strParts = str.split(/\W/);

	var elemTarget = $(target);
	var elemParent = elemTarget.parentNode;
	elemParent.removeChild( elemTarget );

	var rgChildren = elemTarget.childNodes;
	for ( var i = 0; i < rgChildren.length; i++ )
	{
		var child = rgChildren[i];
		if ( child.nodeType != child.ELEMENT_NODE )
			continue;
		if ( expanding && child.style.display=='none' || contracting && child.style.display != 'none' )
			continue;
		if ( !child.lcText )
			child.lcText = (child.innerText || child.textContent).toLowerCase();

		var text = child.lcText;
		var show = true;
		for ( var iPart = 0; show && iPart < strParts.length; iPart++ )
			if ( !text.include( strParts[iPart] ) )
				show=false;

		if ( show )
			child.style.display = '';
		else
			child.style.display = 'none';
	}
	lastFilters[target] = str;
	elemParent.appendChild( elemTarget );
	return true;
}


// goes into fullscreen, returning false if the browser doesn't support it
function requestFullScreen( element )
{
	// Supports most browsers and their versions.
	var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

	if (requestMethod)
	{
		// Native full screen.
		requestMethod.call(element);
		return true;
	}

	return false;
}

function exitFullScreen()
{
	if (document.exitFullscreen) {
		document.exitFullscreen();
	}
	else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	}
	else if (document.webkitCancelFullScreen) {
		document.webkitCancelFullScreen();
	}
}

function RecordAJAXPageView( url )
{
	if ( typeof ga != "undefined" && ga )
	{
		var rgURLs = [ 'https://steamcommunity.com', 'https://steamcommunity.com' ];
		for ( var i = 0; i < rgURLs.length; ++i )
		{
			var baseURL = rgURLs[i];
			var idx = url.indexOf(baseURL);
			if ( idx != -1 )
			{
				url = url.substring( idx + baseURL.length );
			}
			ga( 'send', 'pageview', url );
			return;
		}
	}
}

var g_SNR = false;
var g_strLanguage = 'english';

// given an array of impressions as strings, this will handle joining them all together into a singular string, but enforcing that it doesn't
// go above the cookie size limit which can otherwise cause users to become stuck since the page requests will start failing
function JoinImpressionsUpToLimit( rgImpressions )
{
	//cookies generally can go up to 4k bytes, but we can have problems when we start getting that close, so cut it off earlier
	var nRemainingLen = 3200;
	var result = '';
	for ( var i = 0; i < rgImpressions.length; i++ )
	{
		var impression = String( rgImpressions[ i ] );
		var nImpressionLen = encodeURIComponent( impression + '|' ).length;

		//did we run out of room in our list?
		if ( nRemainingLen < nImpressionLen )
			break;

		//add the separator if not the first entry
		if ( result !== '' )
			result += '|';

		//add our impression and remove that space from what is available
		result += impression;
		nRemainingLen -= nImpressionLen;
	}

	return result;
}

function RecordAppImpression( appid, snr )
{
	if ( appid == 0 || !snr )
		return;

	if ( typeof g_bAllowAppImpressions == 'undefined' || !g_bAllowAppImpressions )
	{
				return;
	}
	
	var strImpressions = V_GetCookie( "app_impressions" );
	var rgImpressions = strImpressions && strImpressions.length != 0 ? strImpressions.split( "|" ) : [];


	var strImpressionData = appid + '@' + snr;
	rgImpressions.push( strImpressionData );

	V_SetCookie( "app_impressions", JoinImpressionsUpToLimit( rgImpressions ) );
}


// doesn't properly handle cookies with ; in them (needs to look for escape char)
function GetCookie( strCookieName )
{
	var rgMatches = document.cookie.match( '(^|; )' + strCookieName + '=([^;]*)' );
	if ( rgMatches && rgMatches[2] )
		return rgMatches[2];
	else
		return null;
}

function SetCookie( strCookieName, strValue, expiryInDays, path )
{
	if ( !expiryInDays )
		expiryInDays = 0;
	if ( !path )
		path = '/';
	
	var dateExpires = new Date();
	dateExpires.setTime( dateExpires.getTime() + 1000 * 60 * 60 * 24 * expiryInDays );
	document.cookie = strCookieName + '=' + strValue + '; expires=' + dateExpires.toGMTString() + ';path=' + path;
}

// included data: strCode, eCurrencyCode, strSymbol, bSymbolIsPrefix, bWholeUnitsOnly
g_rgCurrencyData = {"USD":{"strCode":"USD","eCurrencyCode":1,"strSymbol":"$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"GBP":{"strCode":"GBP","eCurrencyCode":2,"strSymbol":"\u00a3","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"EUR":{"strCode":"EUR","eCurrencyCode":3,"strSymbol":"\u20ac","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":" ","strSymbolAndNumberSeparator":""},"CHF":{"strCode":"CHF","eCurrencyCode":4,"strSymbol":"CHF","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":" ","strSymbolAndNumberSeparator":" "},"RUB":{"strCode":"RUB","eCurrencyCode":5,"strSymbol":"\u0440\u0443\u0431.","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":"","strSymbolAndNumberSeparator":" "},"BRL":{"strCode":"BRL","eCurrencyCode":7,"strSymbol":"R$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"JPY":{"strCode":"JPY","eCurrencyCode":8,"strSymbol":"\u00a5","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"NOK":{"strCode":"NOK","eCurrencyCode":9,"strSymbol":"kr","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"IDR":{"strCode":"IDR","eCurrencyCode":10,"strSymbol":"Rp","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":" ","strSymbolAndNumberSeparator":" "},"MYR":{"strCode":"MYR","eCurrencyCode":11,"strSymbol":"RM","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"PHP":{"strCode":"PHP","eCurrencyCode":12,"strSymbol":"P","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"SGD":{"strCode":"SGD","eCurrencyCode":13,"strSymbol":"S$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"THB":{"strCode":"THB","eCurrencyCode":14,"strSymbol":"\u0e3f","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"VND":{"strCode":"VND","eCurrencyCode":15,"strSymbol":"\u20ab","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":""},"KRW":{"strCode":"KRW","eCurrencyCode":16,"strSymbol":"\u20a9","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"TRY":{"strCode":"TRY","eCurrencyCode":17,"strSymbol":"TL","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"UAH":{"strCode":"UAH","eCurrencyCode":18,"strSymbol":"\u20b4","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":" ","strSymbolAndNumberSeparator":""},"MXN":{"strCode":"MXN","eCurrencyCode":19,"strSymbol":"Mex$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"CAD":{"strCode":"CAD","eCurrencyCode":20,"strSymbol":"CDN$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"AUD":{"strCode":"AUD","eCurrencyCode":21,"strSymbol":"A$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"NZD":{"strCode":"NZD","eCurrencyCode":22,"strSymbol":"NZ$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"PLN":{"strCode":"PLN","eCurrencyCode":6,"strSymbol":"z\u0142","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":" ","strSymbolAndNumberSeparator":" "},"CNY":{"strCode":"CNY","eCurrencyCode":23,"strSymbol":"\u00a5","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"INR":{"strCode":"INR","eCurrencyCode":24,"strSymbol":"\u20b9","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"CLP":{"strCode":"CLP","eCurrencyCode":25,"strSymbol":"CLP$","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"PEN":{"strCode":"PEN","eCurrencyCode":26,"strSymbol":"S\/.","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"COP":{"strCode":"COP","eCurrencyCode":27,"strSymbol":"COL$","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"ZAR":{"strCode":"ZAR","eCurrencyCode":28,"strSymbol":"R","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":" ","strSymbolAndNumberSeparator":" "},"HKD":{"strCode":"HKD","eCurrencyCode":29,"strSymbol":"HK$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"TWD":{"strCode":"TWD","eCurrencyCode":30,"strSymbol":"NT$","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"SAR":{"strCode":"SAR","eCurrencyCode":31,"strSymbol":"SR","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"AED":{"strCode":"AED","eCurrencyCode":32,"strSymbol":"AED","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"SEK":{"strCode":"SEK","eCurrencyCode":33,"strSymbol":"kr","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"ARS":{"strCode":"ARS","eCurrencyCode":34,"strSymbol":"ARS$","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":" "},"ILS":{"strCode":"ILS","eCurrencyCode":35,"strSymbol":"\u20aa","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"BYN":{"strCode":"BYN","eCurrencyCode":36,"strSymbol":"Br","bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""},"KZT":{"strCode":"KZT","eCurrencyCode":37,"strSymbol":"\u20b8","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":" ","strSymbolAndNumberSeparator":""},"KWD":{"strCode":"KWD","eCurrencyCode":38,"strSymbol":"KD","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"QAR":{"strCode":"QAR","eCurrencyCode":39,"strSymbol":"QR","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"CRC":{"strCode":"CRC","eCurrencyCode":40,"strSymbol":"\u20a1","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":""},"UYU":{"strCode":"UYU","eCurrencyCode":41,"strSymbol":"$U","bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"strDecimalSymbol":",","strThousandsSeparator":".","strSymbolAndNumberSeparator":""},"BGN":{"strCode":"BGN","eCurrencyCode":42,"strSymbol":"\u043b\u0432","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"HRK":{"strCode":"HRK","eCurrencyCode":43,"strSymbol":"kn","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"CZK":{"strCode":"CZK","eCurrencyCode":44,"strSymbol":"K\u010d","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"DKK":{"strCode":"DKK","eCurrencyCode":45,"strSymbol":"kr.","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"HUF":{"strCode":"HUF","eCurrencyCode":46,"strSymbol":"Ft","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"RON":{"strCode":"RON","eCurrencyCode":47,"strSymbol":"lei","bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":" "},"RMB":{"strCode":"RMB","eCurrencyCode":9000,"strSymbol":"\u5200\u5e01","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":"","strSymbolAndNumberSeparator":" "},"NXP":{"strCode":"NXP","eCurrencyCode":9001,"strSymbol":"\uc6d0","bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"strDecimalSymbol":".","strThousandsSeparator":",","strSymbolAndNumberSeparator":""}};


// takes an integer
function v_currencyformat( valueInCents, currencyCode, countryCode )
{
	var currencyFormat = (valueInCents / 100).toFixed(2);

	if ( g_rgCurrencyData[currencyCode] )
	{
		var currencyData = g_rgCurrencyData[currencyCode];
		if ( IsCurrencyWholeUnits( currencyCode ) )
		{
			currencyFormat = currencyFormat.replace( '.00', '' );
		}

		if ( currencyData.strDecimalSymbol != '.' )
		{
			currencyFormat = currencyFormat.replace( '.', currencyData.strDecimalSymbol );
		}

		var currencyReturn = IsCurrencySymbolBeforeValue( currencyCode ) ?
			 GetCurrencySymbol( currencyCode ) + currencyData.strSymbolAndNumberSeparator + currencyFormat
			 : currencyFormat + currencyData.strSymbolAndNumberSeparator + GetCurrencySymbol( currencyCode );

		if ( currencyCode == 'USD' && typeof(countryCode) != 'undefined' && countryCode != 'US' )
		{
			return currencyReturn + ' USD';
		}
		else if ( currencyCode == 'EUR' )
		{
			return currencyReturn.replace( ',00', ',--' );
		}
		else
		{
			return currencyReturn;
		}
	}
	else
	{
		return currencyFormat + ' ' + currencyCode;
	}
}


function IsCurrencySymbolBeforeValue( currencyCode )
{
	return g_rgCurrencyData[currencyCode] && g_rgCurrencyData[currencyCode].bSymbolIsPrefix;
}

function IsCurrencyWholeUnits( currencyCode )
{
		return g_rgCurrencyData[currencyCode] && g_rgCurrencyData[currencyCode].bWholeUnitsOnly && currencyCode != 'RUB';
}

// Return the symbol to use for a currency
function GetCurrencySymbol( currencyCode )
{
	return g_rgCurrencyData[currencyCode] ? g_rgCurrencyData[currencyCode].strSymbol : currencyCode + ' ';
}

function GetCurrencyCode( currencyId )
{
	for ( var code in g_rgCurrencyData )
	{
		if ( g_rgCurrencyData[code].eCurrencyCode == currencyId )
			return code;
	}
	return 'Unknown';
}

function GetAvatarURLFromHash( hash, size )
{
    var strURL = 'https://avatars.fastly.steamstatic.com/' + hash;

	if ( size == 'full' )
		strURL += '_full.jpg';
	else if ( size == 'medium' )
		strURL += '_medium.jpg';
	else
		strURL += '.jpg';

	return strURL;
}




// need to hold on to this so it doesn't get lost when we remove() the dialog element
var g_AbuseModalContents = null;
function ShowAbuseDialog()
{
	if ( !g_AbuseModalContents )
		g_AbuseModalContents = $J('#reportAbuseModalContents');

	if ( g_AbuseModalContents )
	{
		var Modal = ShowDialog( 'Report Violation', g_AbuseModalContents );
	}
}

function StandardCommunityBan( steamid, elemLink )
{
	$J.get( 'https://steamcommunity.com/actions/communitybandialog', { 'sessionID' : g_sessionID, 'steamID' : steamid } )
	.done( function( data )
	{
		var $Content = $J(data);
		var Modal = ShowConfirmDialog( "Community Ban", $Content, 'Submit'
		).done(	function( ) {

			var $Form = $Content.find( 'form#community_ban_form' );

			$J.post( "https://steamcommunity.com/actions/StandardCommunityBan", $Form.serialize() )
			.done( function( data ) {
				if ( !$J.isEmptyObject( elemLink ) )
				{
                    $J(elemLink).replaceWith( '<span style="color: red;">Banned</span>' );
				}
				else {
                    location.reload();
				}

			}).fail( function( jqxhr ) {
				// jquery doesn't parse json on fail
				var data = V_ParseJSON( jqxhr.responseText );
				ShowAlertDialog( 'Community Ban & Delete Comments', 'Failed with error message: ' + data.success );
			});
		} );

	}).fail( function( data )
	{
		ShowAlertDialog( 'Community Ban & Delete Comments', 'You do not have permissions to view this or you are not logged in.' );
	});

}

function ReportProfile( steamID )
{
	var $Content = $J('<div class="group_invite_throbber"><img src="https://community.fastly.steamstatic.com/public/images/login/throbber.gif"></div>');
	var $Modal = ShowDialog( null, $Content );
	var sURL = 'https://steamcommunity.com/actions/ReportProfile/' + steamID;
	$J.ajax( {
		url: sURL,
		type: 'GET'
	}).done( function ( data ) {
		var $DialogHTML = $J( data );
		$Content.replaceWith( $DialogHTML );
		$Modal.SetMaxHeight( '850' );
	} );
}

function CEmoticonPopup( $EmoticonButton, $Textarea, strBaseURL )
{
	this.m_$EmoticonButton = $EmoticonButton;
	this.m_$TextArea = $Textarea;
	this.m_strBaseURL = strBaseURL || 'https://steamcommunity.com';

	if ( CEmoticonPopup.sm_deferEmoticonsLoaded == null )
		CEmoticonPopup.sm_deferEmoticonsLoaded = new jQuery.Deferred();

	this.m_bVisible = false;
	this.m_$Popup = null;

	var _this = this;
	this.m_$EmoticonButton.one('mouseenter', function() { _this.LoadEmoticons(); } );
	this.m_$EmoticonButton.click( function() { _this.LoadEmoticons(); CEmoticonPopup.sm_deferEmoticonsLoaded.done( function() { _this.OnButtonClick(); } ) } );
	this.m_fnOnDocumentClick = function() { _this.DismissPopup(); };
}

CEmoticonPopup.sm_rgEmoticons = [];
CEmoticonPopup.sm_bEmoticonsLoaded = false;
CEmoticonPopup.sm_deferEmoticonsLoaded = null;

CEmoticonPopup.prototype.LoadEmoticons = function()
{
	if ( CEmoticonPopup.sm_bEmoticonsLoaded )
		return;

	CEmoticonPopup.sm_bEmoticonsLoaded = true;
	CEmoticonPopup.sm_rgEmoticons = [];
	$J.get( this.m_strBaseURL + '/actions/EmoticonList' )
		.done( function(data) {
			if ( data )
				CEmoticonPopup.sm_rgEmoticons = data;
		}).always( function() { CEmoticonPopup.sm_deferEmoticonsLoaded.resolve() } );
};

CEmoticonPopup.prototype.OnButtonClick = function()
{
	if ( this.m_bVisible )
	{
		this.DismissPopup();
	}
	else
	{
		if ( !this.m_$Popup )
			this.BuildPopup();
		else
			PositionEmoticonHover( this.m_$Popup, this.m_$EmoticonButton );

		this.m_$EmoticonButton.addClass( 'focus' );
		this.m_$Popup.stop();
		this.m_$Popup.fadeIn( 'fast' );
		this.m_bVisible = true;

		if ( window.UseSmallScreenMode && window.UseSmallScreenMode() )
		{
			// scroll such that the emoticon button is just above the popup window we're showing at the bottom of the screen
			// 	the 10 pixels represents the popup being positioned 5px from the bottom of the screen, and 5px between the popup and button
			$J(window).scrollTop( this.m_$EmoticonButton.offset().top - $J(window).height() + this.m_$Popup.height() + this.m_$EmoticonButton.height() + 10 );
		}

		var _this = this;
		window.setTimeout( function() { $J(document).one( 'click.EmoticonPopup', _this.m_fnOnDocumentClick ) }, 0 );
	}
};

CEmoticonPopup.prototype.DismissPopup = function()
{
	this.m_$Popup.fadeOut( 'fast' );
	this.m_$EmoticonButton.removeClass( 'focus' );
	this.m_bVisible = false;

	$J(document).off( 'click.EmoticonPopup' );
};

CEmoticonPopup.prototype.BuildPopup = function()
{
	this.m_$Popup = $J('<div/>', {'class': 'emoticon_popup_ctn' } );

	var $PopupInner = $J('<div/>', {'class': 'emoticon_popup' } );
	this.m_$Popup.append( $PopupInner );
	var $Content = $J('<div/>', {'class': 'emoticon_popup_content' } );
	$PopupInner.append( $Content );

	for( var i = 0; i < CEmoticonPopup.sm_rgEmoticons.length; i++ )
	{
		var strEmoticonName = CEmoticonPopup.sm_rgEmoticons[i].replace( /:/g, '' );
		var strEmoticonURL = 'https://community.fastly.steamstatic.com/economy/emoticon/' + strEmoticonName;

		var $Emoticon = $J('<div/>', {'class': 'emoticon_option', 'data-emoticon': strEmoticonName } );
		var $Img = $J('<img/>', {'src': strEmoticonURL, 'class': 'emoticon' } );
		$Emoticon.append( $Img );

		$Emoticon.click( this.GetEmoticonClickClosure( strEmoticonName ) );

		$Content.append( $Emoticon );
	}

	$J(document.body).append( this.m_$Popup );
	PositionEmoticonHover( this.m_$Popup, this.m_$EmoticonButton );
};

CEmoticonPopup.prototype.GetEmoticonClickClosure = function ( strEmoticonName )
{
	var _this = this;
	var strTextToInsert = ':' + strEmoticonName + ':';
	return function() {
		var elTextArea = _this.m_$TextArea[0];
		if ( elTextArea )
		{
			var nSelectionStart = elTextArea.selectionStart;
			elTextArea.value = elTextArea.value.substr( 0, nSelectionStart ) + strTextToInsert + elTextArea.value.substr( nSelectionStart );
			elTextArea.selectionStart = nSelectionStart + strTextToInsert.length;
		}

		_this.m_$TextArea.focus();

		_this.DismissPopup();

		if ( window.DismissEmoticonHover )
			window.setTimeout( DismissEmoticonHover, 1 );
	};
};

function PositionEmoticonHover( $Hover, $Target )
{
	// we position fixed in CSS for responsive mode
	if ( window.UseSmallScreenMode && window.UseSmallScreenMode() )
	{
		$Hover.css( 'left', '' ).css('top', '' );
		return;
	}

		$Hover.css( 'visibility', 'hidden' );
	$Hover.show();

	var offset = $Target.offset();
	$Hover.css( 'left', offset.left + 'px' );
	$Hover.css( 'top', offset.top + 'px');

	var $HoverBox = $Hover.children( '.emoticon_popup' );
	var $HoverArrowLeft = $Hover.children( '.miniprofile_arrow_left' );
	var $HoverArrowRight = $Hover.children( '.miniprofile_arrow_right' );

	var nWindowScrollTop = $J(window).scrollTop();
	var nWindowScrollLeft = $J(window).scrollLeft();
	var nViewportWidth = $J(window).width();
	var nViewportHeight = $J(window).height();

		var $HoverArrow = $HoverArrowRight;
	var nBoxRightViewport = ( offset.left - nWindowScrollLeft ) + $Target.outerWidth() + $HoverBox.width();
	var nSpaceRight = nViewportWidth - nBoxRightViewport;
	var nSpaceLeft = offset.left - $Hover.width();
	if ( nSpaceLeft > 0 || nSpaceLeft > nSpaceRight)
	{
				$Hover.css( 'left', ( offset.left - $Hover.width() - 12) + 'px' );
		$HoverArrowLeft.hide();
		$HoverArrowRight.show();
	}
	else
	{
				$Hover.css( 'left', ( offset.left + $Target.outerWidth() ) + 'px' );
		$HoverArrow = $HoverArrowLeft;
		$HoverArrowLeft.show();
		$HoverArrowRight.hide();
	}

	var nTopAdjustment = 0;

			if ( $Target.height() < 48 )
		nTopAdjustment = Math.floor( $Target.height() / 2 ) - 12;
	var nDesiredHoverTop = offset.top - 0 + nTopAdjustment;
	$Hover.css( 'top', nDesiredHoverTop + 'px' );

	// see if the hover is cut off by the bottom of the window, and bump it up if neccessary
	var nTargetTopViewport = ( offset.top - nWindowScrollTop ) + nTopAdjustment;
	if ( nTargetTopViewport + $HoverBox.height() + 35 > nViewportHeight )
	{
		var nViewportAdjustment = ( $HoverBox.height() + 35 ) - ( nViewportHeight - nTargetTopViewport );

		var nViewportAdjustedHoverTop = offset.top - nViewportAdjustment;
		$Hover.css( 'top', nViewportAdjustedHoverTop + 'px' );

		// arrow is normally offset 30pixels.  we move it down the same distance we moved the hover up, so it is "fixed" to where it was initially
		$HoverArrow.css( 'top', ( 30 + nDesiredHoverTop - nViewportAdjustedHoverTop ) + 'px' );
	}
	else
	{
		$HoverArrow.css( 'top', '' );
	}

	$Hover.hide();
	$Hover.css( 'visibility', '' );
}


function InitEconomyHovers( strEconomyCSSURL, strEconomyCommonJSURL, strEconomyJSURL )
{
	var $Hover = $J('<div/>', {'class': 'economyitem_hover'} );
	var $HoverContent = $J('<div/>', {'class': 'economyitem_hover_content'} );
	$Hover.append( $HoverContent );
	$Hover.hide();

	var fnOneTimeEconomySetup = function() {
		$J(document.body).append( $Hover );

		if ( typeof UserYou == 'undefined' )
		{
						var css = document.createElement( "link" );
			css.setAttribute( "rel", "stylesheet" );
			css.setAttribute( "type", "text/css" );
			css.setAttribute( "href", strEconomyCSSURL );
			var js1 = document.createElement( "script" );
			js1.setAttribute( "type", "text/javascript" );
			js1.setAttribute( "src", strEconomyCommonJSURL );
			var js2 = document.createElement( "script" );
			js2.setAttribute( "type", "text/javascript" );
			js2.setAttribute( "src", strEconomyJSURL );
			var head = $J('head')[0];
			head.appendChild( css );
			head.appendChild( js1 );
			head.appendChild( js2 );
		}
	};

	var fnDataFactory = function( key ) {
		var rgItemKey = key.split('/');
		if ( rgItemKey.length >= 3 && rgItemKey.length <= 5 )
		{
			if ( fnOneTimeEconomySetup )
			{
				fnOneTimeEconomySetup();
				fnOneTimeEconomySetup = null;
			}

			// pop amount off the end first if it's present
			var nAmount;
			var strLastEntry = rgItemKey[rgItemKey.length - 1];
			if ( strLastEntry && strLastEntry.length > 2 && strLastEntry.substr( 0, 2 ) == 'a:' )
			{
				nAmount = strLastEntry.substr( 2 );
				rgItemKey.pop();
			}

			var strURL = null;
			var appid = rgItemKey[0];
			if ( appid == 'classinfo' )
			{
				// class info style
				appid = rgItemKey[1];
				var classid = rgItemKey[2];
				var instanceid = ( rgItemKey.length > 3 ? rgItemKey[3] : 0 );
				strURL = 'economy/itemclasshover/' + appid + '/' + classid + '/' + instanceid;
				strURL += '?content_only=1&l=english';
			}
			else
			{
				// real asset
				var contextid = rgItemKey[1];
				var assetid = rgItemKey[2];
				var strURL = 'economy/itemhover/' + appid + '/' + contextid + '/' + assetid;
				strURL += '?content_only=1&t=q&omit_owner=1&l=english';
				if ( rgItemKey.length == 4 && rgItemKey[3] )
				{
					var strOwner = rgItemKey[3];
					if ( strOwner.indexOf( 'id:' ) == 0 )
						strURL += '&o_url=' + strOwner.substr( 3 );
					else
						strURL += '&o=' + strOwner;
				}
			}
			if ( nAmount && nAmount > 1 )
				strURL += '&amount=' + nAmount;
			return new CDelayedAJAXData( strURL, 100 );
		}
		else
			return null;
	};

	var rgCallbacks = BindAJAXHovers( $Hover, $HoverContent, {
		fnDataFactory: fnDataFactory,
		strDataName: 'economy-item',
		strURLMatch: 'itemhover'
	} );
}

function ShowTradeOffer( tradeOfferID, rgParams )
{
	var strParams = '';
	if ( rgParams )
		strParams = '?' + $J.param( rgParams );

	var strKey = ( tradeOfferID == 'new' ? 'NewTradeOffer' + rgParams['partner'] : 'TradeOffer' + tradeOfferID );

	var winHeight = 1120;
	if ( Steam.BIsUserInSteamClient() && Steam.GetClientPackageVersion() < 1407800248 )
	{
		// workaround for client break when the popup window is too tall for the screen.  Try and pick a height that will fit here.
		var nClientChromePX = 92;
		if ( window.screen.availHeight && window.screen.availHeight - nClientChromePX < winHeight )
			winHeight = window.screen.availHeight - nClientChromePX;
	}

	var strURL = 'https://steamcommunity.com/tradeoffer/' + tradeOfferID + '/' + strParams;
	if ( Steam.BIsUserInSteamMobileApp() )
	{
		window.location = strURL;
	}
	else
	{
		var winOffer = window.open( strURL, strKey, 'height=' + winHeight + ',width=1028,resize=yes,scrollbars=yes' );

		winOffer.focus();
	}
}

function Logout()
{
	PostToURLWithSession( 'https://steamcommunity.com/login/logout/' );
}

function ChangeLanguage( strTargetLanguage, bStayOnPage )
{
	var Modal = ShowBlockingWaitDialog( 'Change language', '' );
	$J.post( 'https://steamcommunity.com/actions/SetLanguage/', {language: strTargetLanguage, sessionid: g_sessionID })
		.done( function() {
			if ( bStayOnPage )
				Modal.Dismiss();
			else
			{
								if( g_steamID )
					window.location = 'https://store.steampowered.com/account/languagepreferences/';
				else if ( window.location.href.match( /[?&]l=/ ) )
					window.location = window.location.href.replace( /([?&])l=[^&]*&?/, '$1' );
				else
					window.location.reload();
			}
		}).fail( function() {
			Modal.Dismiss();
			ShowAlertDialog( 'Change language', 'There was a problem communicating with the Steam servers.  Please try again later.' );
		});
}

var g_ContentDescriptorPreferences = [ 3, 4 ];
var g_UGCWithNoBlur = {};
var g_bLoadedUGCWithNoBlur = false;
var g_UGCSkipAdultContentCheckForAppID = false;

function LoadUGCWithNoBlur()
{
	if ( g_bLoadedUGCWithNoBlur )
	{
		return;
	}

	var strUGCNoBlur = WebStorage.GetLocal( 'rgUGCNoBlur', false );
	if ( strUGCNoBlur != null )
	{
		g_UGCWithNoBlur = JSON.parse( strUGCNoBlur );
	}
}

function SaveUGCWithNoBlur()
{
	var keys = Object.keys( g_UGCWithNoBlur );
	var maxKeys = 1000;
	if ( keys.length >= maxKeys )
	{
		var rgTemp = [];
		for ( var i = 0; i < keys.length; ++i )
		{
			var key = keys[i];
			var value = g_UGCWithNoBlur[key];
			rgTemp.push( { v: value['timestamp'], k: key } );
		}
		rgTemp.sort( function( a, b ) {
			if ( a.v > b.v ) { return 1; }
			if ( a.v < b.v ) { return -1; }
			return 0;
		});

		var delta = rgTemp.length - maxKeys;
		for ( var i = 0; i < rgTemp.length && i < delta; ++i )
		{
			var a = rgTemp[i];
			delete g_UGCWithNoBlur[a.k];
		}
	}
	WebStorage.SetLocal( 'rgUGCNoBlur', JSON.stringify( g_UGCWithNoBlur ), false );
}

function ApplyAdultContentPreferences()
{
	LoadUGCWithNoBlur();

	var elementsWithAdultContent = $J( '[data-descids]');
	if ( elementsWithAdultContent.length == 0 )
	{
		return;
	}

	for ( var i = 0; i < elementsWithAdultContent.length; ++i )
	{
		var e = $J( elementsWithAdultContent[i] );
		ApplyAdultContentPreferencesHelper( e, g_ContentDescriptorPreferences, false );
	}
}

function ReapplyAdultContentPreferences()
{
	var elementsWithAdultContent = $J( '[data-descids]');
	if ( elementsWithAdultContent.length == 0 )
	{
		return;
	}

	for ( var i = 0; i < elementsWithAdultContent.length; ++i )
	{
		var e = $J( elementsWithAdultContent[i] );
		ApplyAdultContentPreferencesHelper( e, g_ContentDescriptorPreferences, true );
	}
}


function EditContentDescriptors( publishedfileid, callback )
{
	$J.get( 'https://steamcommunity.com/sharedfiles/ajaxeditcontentdescriptors/', { publishedfileid: publishedfileid } )
		.done( function( json ) {
			if ( json.success == 1 )
			{
				var content = $J( json.html );
				var dialog = ShowConfirmDialog( 'Update Content Descriptors', content );

				dialog.done( function() {
					var rgCheckboxes = $J("input:checkbox", content );

					var add = [];
					var remove = [];

					for ( var i = 0; i < rgCheckboxes.length; ++i )
					{
						let checkbox = rgCheckboxes[i];
						if ( checkbox.checked && !checkbox.disabled )
						{
							add.push( checkbox.value );
						}
						else
						{
							remove.push( checkbox.value );
						}
					}

					if ( add.length == 0 && remove.length == 0 )
						return;

					$J.post(
						'https://steamcommunity.com/sharedfiles/ajaxupdatecontentdescriptors/',
						{ sessionid: g_sessionID, publishedfileid: publishedfileid, add: add, remove: remove },
					).done( function( json )
					{
						if ( json.success == 1 )
						{
							if ( callback )
							{
								callback( publishedfileid );
							}
							else
							{
								window.location.reload();
							}
						}
						else
						{
							ShowAlertDialog( 'Update Content Descriptors', 'There was a problem updating the content descriptors for this item: ' + json.success );
						}
					} );
				} );
			}
		} );
}

function HandleRelatedContentDescriptors( $topContainer, $elem, bAnimate )
{
	var checked = $elem.prop( "checked" ) && !$elem.attr( "disabled" );
	var descid = $elem.val();
	var $container = $elem.closest( '[data-parentdescid]' );
	var parentDescID = $container.data( 'parentdescid' );
	var childrenDescriptors = $topContainer.find( '[data-parentdescid="' + descid + '"]' );

	if ( checked )
	{
		// check all ancestors
		if ( parentDescID )
		{
			var $parentElem = $topContainer.find( '#descriptor_' + parentDescID );
			$parentElem.prop( 'checked', true );
			HandleRelatedContentDescriptors( $topContainer, $parentElem, bAnimate );
		}
	}
	else
	{
		childrenDescriptors.each( function( ) {
			var child = $J( this );
			child.find( 'input[type="checkbox"]' ).each( function() {
				$J( this ).prop( "checked", false );
				HandleRelatedContentDescriptors( $topContainer, $J( this ), bAnimate );
			} );
		} );
	}
}

// override where necessary
function HandleNewDynamicLink( newDynamicLinkElement )
{
	if ( newDynamicLinkElement.hasClass( "has_adult_content" ) )
	{
		ApplyAdultContentPreferencesHelper( newDynamicLinkElement, g_ContentDescriptorPreferences, false );
	}
}

function UGCAdultContentPreferencesMenu( elSource )
{
	var $El = $J(this);
	var $elSource = $J(elSource.parentNode);
	$El.empty();

	var appid = $elSource.data('appid');
	var publishedFileID = $elSource.data('publishedfileid');

	// preferences
	{
		var fnViewPreferences = function ()
		{
			top.location.href = 'https://store.steampowered.com//account/preferences/#CommunityContentPreferences';
			return true;
		};
		var $elViewPreferences = $J( '<div/>' ).click( fnViewPreferences ).text( 'Edit Preferences' ).addClass( 'option' );
		$El.append( $elViewPreferences );
	}
}

function ApplyAdultContentPreferencesHelper( e, rgContentDescriptorsToExclude, bForce )
{
	if ( !bForce && e.data( 'processed_adult_content') )
	{
		return;
	}

	if ( ( typeof( g_bViewingOwnProfile ) != 'undefined' ) && g_bViewingOwnProfile )
	{
		e.removeClass( 'has_adult_content' );
		return;
	}

	if ( ( typeof( g_bIsAppHubModerator ) != 'undefined' ) && g_bIsAppHubModerator )
	{
		e.removeClass( 'has_adult_content' );
		return;
	}

	e.data( 'processed_adult_content', true );

	var bIsAnchor = e.is('a');

	var publishedFileID = e.data( 'publishedfileid' );
	var bCountryDisallowed = e.data( 'adult-disallowed' );
	var rgContentDescriptorIDs = e.data( 'descids' ) ?? [];
	var appid = e.data( 'appid' );
	var bForceDeBlur = ( publishedFileID && g_UGCWithNoBlur.hasOwnProperty( publishedFileID ) ) || ( appid && g_UGCSkipAdultContentCheckForAppID == appid );

	var filteredArray = rgContentDescriptorIDs.filter( function( descid ) { return rgContentDescriptorsToExclude.indexOf( descid ) !== -1; } );
	var bHasExcludedContent = filteredArray.length != 0;

	if ( bForceDeBlur || !bHasExcludedContent )
	{
		e.removeClass( 'has_adult_content' );
	}
	else if ( bHasExcludedContent )
	{
		e.addClass( 'has_adult_content' );
	}

	if ( e.data( 'ugclinktextonly' ) === 1 || bCountryDisallowed )
	{

	}
	else
	{
		// widget
		{
			var $elMenu = $J( '<div></div>', { 'class': 'ugc_options' } ).append( $J( '<div>' ) );
			$elMenu.v_tooltip( {
				'tooltipClass': 'ugc_options_tooltip',
				'location': 'bottom left',
				'offsetY': -20,
				'useClickEvent': true,
				'useMouseEnterEvent': false,
				'preventDefault': true,
				'stopPropagation': true,
				func: UGCAdultContentPreferencesMenu
			} );
			e.append( $elMenu );
		}

		// warning
		if ( e.width() > 100 && !e.hasClass( 'ugc_show_warning_image' ) && !e.hasClass( 'dynamiclink_box' ) )
		{
			var $elWarning = $J( '<div></div>', {
				'class': 'ugc_warning'
			} );
			if ( e.width() > 350 )
			{
				$elWarning.addClass( "large" );
			}

			if ( e.height() > 125 )
			{
				e.addClass( "ugc_show_warning_image" );
			}
			else
			{
				$elWarning.append( $J( '<div>', { 'class': 'ugc_warning_image' } ) );
			}

			$elWarning.append( $J( '<span>', { 'text': 'Content may not be appropriate based on your preferences '} ) );

			var $elOptions = $J( '<div></div>' );
			var $elViewOption = $J( '<div></div>', {
				'class': 'ugc_inline_option',
				'text': 'View Content'
			} );
			$elViewOption.click( function ( event ) {
				event.preventDefault();
				event.stopPropagation();
				if ( bIsAnchor && !e.hasClass( "modalContentLink" ) )
				{
					top.location.href = e[0].href;
				}
				else
				{
					e.removeClass( 'has_adult_content' );
					e.click();
					e.addClass( 'has_adult_content' );
				}
				return false;
			} );
			$elOptions.append( $elViewOption );
			$elOptions.append( "&nbsp;|&nbsp;" );
			var $elPreferencesOption = $J( '<div></div>', {
				'class': 'ugc_inline_option',
				'text': 'Edit Preferences'
			} );
			$elPreferencesOption.click( function ( event )	{
				event.stopPropagation();
				top.location.href = 'https://store.steampowered.com/account/preferences';
				return false;
			} );
			$elOptions.append( $elPreferencesOption );

			$elWarning.append( $elOptions );

			e.append( $elWarning );
		}
		else
		{
			e.addClass( "ugc_show_warning_image" );
		}
	}
}







