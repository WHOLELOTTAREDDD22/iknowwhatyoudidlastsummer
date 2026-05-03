var bannerManagement = bannerManagement || { addedDesktopBanners: [], addedMobileBanners: [] };

(function () {
    if (typeof window.CustomEvent !== "function") { // If not IE
        function CustomEvent(event, params) {
            params = params || {
                bubbles: false,
                cancelable: false,
                detail: null
            };
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        window.CustomEvent = CustomEvent;
    }

    function toISO(date) {
        var tzo = -date.getTimezoneOffset(),
            dif = tzo >= 0 ? '+' : '-',
            pad = function (num) {
                return (num < 10 ? '0' : '') + num;
            };

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds())
    }
    var interval = 5000;
    var slideIndex = 0;
    var tt;
    var mytimeout = null;
    var isPause = false;
    var flowEnable = false;
    var isDesktop = true;
    var resizeIntervalID = undefined;
    var trackdDisplay = [];
    var translateLang = l?.Translator?.translate || function (str) { 
        if (str && str.indexOf('|') > 0) { 
            return str.split('|')[1]; 
        } 
        return str || "";
     };

    const PATH_MAPPING = [
        { path: '/products/.*/warranty/upgrade/?$', page: 'warranty_upgrade_page' },
        { path: '/products/.*/warranty', page: 'warranty_page' }
    ]

    function pause(h) {
        if (!flowEnable) return;
        isPause = h;
        clearTimeout(mytimeout);
        if (!isPause) {
            mytimeout = setTimeout(function () {
                bannerManagement.plusDivs(1)
            }, interval);
        }
    }

    bannerManagement.pause = pause;

    function initAddedBanners() {
		var country = getMeta('Country').toUpperCase();
		
        const addedBanners = isDesktop ? (bannerManagement.addedDesktopBanners || []) : (bannerManagement.addedMobileBanners || []);
        if (addedBanners.length <= 0) {
            return;
        }

        getSlides("addedSlider").forEach(x => x.remove())
        const addedSliders = addedBanners.map(x => {
            const element = createElement(x);
            element.classList.add("mySlides");
            element.classList.add("addedSlider");
            element.setAttribute("tabindex", "0");
            element.style.display = "none";
            return element;
        });

        let preSlider = document.querySelector(".tempSlides");
        if (!preSlider) {
            return;
        }

        const sliders = getSlides("mySlides").map(x => getRealSlider(x));
        sliders.forEach(x => x.remove());

        const appendSliders = [];
        if (["GB", "DE", "IT"].includes(country)) { // AI Banner使用134位置
            appendSliders.push(addedSliders[0]);
            if (sliders.length == 1) {
                appendSliders.push(sliders[0]);
            } else if (sliders.length > 1) {
                appendSliders.push(sliders[1]);
            }
            appendSliders.push(...addedSliders.slice(1));
        } else { // 保留第一个和最后一个（只有一个时保留），其它替换成AI Banner
            if (sliders.length > 0) {
                appendSliders.push(sliders[0]);
            }
            appendSliders.push(...addedSliders);
            if (sliders.length > 1) {
                appendSliders.push(sliders[sliders.length - 1]);
            }
        }

        for (let item of appendSliders) {
            preSlider.after(item);
            preSlider = item;
        }
    }

    function getRealSlider(slider) {
        if (!slider || slider.classList?.contains("addedSlider")) {
            return slider;
        }
        if (slider.parentElement == document.getElementById("multi-banner-div")) {
            return slider;
        }
        return getRealSlider(slider.parentElement);
    }

    function createElement(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.childNodes[0];
    }

    function track(trackName, trackContent) {
        if (_satellite == undefined || lmd == undefined || !_satellite || !lmd) return false;
        Object.assign(lmd, trackContent || {});
        if (!_satellite || !_satellite.track) return false;
        _satellite.track(trackName);
        return true;
    }

    function trackDisplayDelay(index) {
        setTimeout(function () {
            trackDisplay(index);
        }, 1000);
    }

    function trackDisplay(index) {
        const page = getCurrentPage();
        if (!page) return;

        try {
            const sliders = getSlides("mySlides") || [];
            const slider = sliders[index];
            const url = getSliderUrl(slider);
            if (!url) return;
            const source = getUrlParamValue(url, "source") || "banner";
            const subsource = getUrlParamValue(url, "subsource") || "";
        
            const trackValue = page + ":" + source + ":" + subsource + ":Display";
            if (trackdDisplay.includes(index)) return;
            trackdDisplay.push(index);
            if (!track("support_custom_interaction", { customInteraction: trackValue })) {
                trackdDisplay = trackdDisplay.filter(x => x != index);
            }
        } catch(e) {}
    }

    function trackClick() {
        const page = getCurrentPage();
        if (!page) return;

        const sliders = getSlides("mySlides");
        if (!sliders || sliders.length <= 0) return;
        for (let slider of sliders) {
            try {
                const url = getSliderUrl(slider);
                if (!url) continue;
                const source = getUrlParamValue(url, "source") || "banner";
                const subsource = getUrlParamValue(url, "subsource") || "";
                const trackValue = page + ":" + source + ":" + subsource + ":Click";

                if (slider.classList?.contains("addedSlider")) {
                    const element = slider.querySelector("&>div");
                    if (!element) continue;
                    const onclick = element.onclick;
                    element.onclick = function() {
                        track("support_custom_interaction", { customInteraction: trackValue });
                        onclick && onclick.apply(this, arguments);
                    }
                } else {
                    const realSlider = getRealSlider(slider);
                    if (!realSlider) continue;
                    realSlider.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        track("support_custom_interaction", { customInteraction: trackValue });
                        window.open(url, realSlider.getAttribute("target") || "_self");
                        return false;
                    }
                }
            } catch(e) {}
        }
    }

    function getCurrentPage() {
        for (let i in PATH_MAPPING) {
            const mapping = PATH_MAPPING[i];
            if (new RegExp(mapping.path, 'i').test(location.pathname)) {
                return mapping.page;
            }
        }
        return "";
    }

    function getSliderUrl(slider) {
        if (!slider) {
            return "";
        }

        let url = "";
        if (slider.classList?.contains("addedSlider")) {
            url = slider.querySelector("&>div")?.getAttribute("onclick");
            if (!url) {
                return "";
            }
            url = url.replace(new RegExp("^window[.]open[(]'([^']*)'.*$"), "$1");
            if (!url || !url.match(new RegExp('^http'))) {
                return "";
            }
        } else {
            slider = getRealSlider(slider);
            if (!slider) {
                return;
            }
            url = slider.getAttribute("href");
            if (!url || url.match(new RegExp('^javascript'))) {
                return "";
            }
        }
        return url;
    }

    function getUrlParamValue(url, name) {
        let search = url;
        if (url && url.indexOf("?") > 0) {
            search = url.substring(url.indexOf("?"));
        }
        const exp = new RegExp('[?&]' + name + '[=]([^?&#]*)', 'i').exec(search);
        if (!exp || exp.length < 2) {
            return '';
        }
        try {
            return decodeURIComponent(exp[1]).trim();
        } catch(e) {
            return exp[1].trim();
        }
    }

    bannerManagement.bannerinit = function() {
        initAddedBanners();
        const sliders = getSlides("mySlides");
        if (!sliders || sliders.length <= 0) return;
        for (var i = 0; i < sliders.length; i++) {
            sliders[i].style.display = "none";
            sliders[i].setAttribute("role", "group");
            sliders[i].setAttribute("aria-label", i);
            sliders[i].setAttribute("aria-roledescription", "Slide");

            sliders[i].addEventListener('keydown', function (e) {
            if (e.key === "Enter" || e.key === " ") {
                if (this.classList.contains("addedSlider")) {
                    this.querySelector("&>div").click();
                } else {
                    this.click
                }
            }
        });
        }

        flowEnable = sliders.length > 1;
        tt = sliders[0];
        tt.classList.remove("esvs-animate-right");
        tt.classList.remove("esvs-animate-left");
        tt.style.display = 'block'

        try {
            resizeIntervalID && clearInterval(resizeIntervalID);
            clearTimeout(mytimeout);
        } catch(err) {}

        if (sliders.length <= 1) {
            document.getElementById('multi-circle-div').style.display = "none";
            document.getElementById('arrow-div').style.display = "none";

            adaptingDevice();
            resizeIntervalID = setInterval(resize, 500);
            slideIndex = 0;
            trackClick();
            trackDisplayDelay(slideIndex);
            return;
        }

        document.getElementById('multi-circle-div').style.display = "flex";
        document.getElementById('arrow-div').style.display = isDesktop ? "flex" : "none";

        var circles = ''
        for (var i = 0; i < sliders.length; i++) {
            circles += '<span role="button" tabindex="0" aria-label="' + translateLang('page|Page')  + ' ' + (i + 1) + '" class="esvs-badge demo esvs-transparent esvs-hover-white" style="border: 1px solid #fff;caret-color: transparent;width: 8px !important;height: 8px !important;margin: 0 3px;" onclick="bannerManagement.currentDiv(' + i + ')"> </span>'
        }
        document.getElementById("multi-circle-div").innerHTML = circles;

        var dots = getSlides("demo");
        for (let i = 0; i < dots.length; i++) {
            dots[i].addEventListener('keydown', function (e) {
            if (e.key === "Enter" || e.key === " ") {
                bannerManagement.currentDiv(i);
            }
        });
        }
        dots[0].className += " esvs-white";
        dots[0].setAttribute("aria-current", "true");
        slideIndex = 0;
        if (!isPause) {
            mytimeout = setTimeout(function () {
                bannerManagement.plusDivs(1)
            }, interval);
        }

        document.getElementById("multi-banner-div").onmouseover = event => {
            event.preventDefault();
            event.stopPropagation();
            pause(true);
        };
        document.getElementById("multi-banner-div").onmouseout = event => {
            event.preventDefault();
            event.stopPropagation();
            pause(false);
        };
       
        adaptingDevice();
        resizeIntervalID = setInterval(resize, 500);
        trackClick();
        trackDisplayDelay(slideIndex);
    }

    bannerManagement.plusDivs = function(n) {
        if (!flowEnable) return;
        showDivs(n, n < 0);
    }

    bannerManagement.currentDiv = function(n) {
        if (!flowEnable) return;
        if (slideIndex == n) return;
        var direction = slideIndex > n
        showDivs(n - slideIndex, direction);
    }

    function getSlides(name) {
        const list = [];
        document.querySelectorAll(".kindly-reminder .multi-banner ." + name).forEach(x => list.push(x));
        return list;
    }


    function flowToRight(f) {
        var x = getSlides("mySlides");
        if (!f) {
            for (i = 0; i < x.length; i++) {
                x[i].classList.remove("esvs-animate-left");
                x[i].classList.add("esvs-animate-right");
            }
        } else {
            for (i = 0; i < x.length; i++) {
                x[i].classList.remove("esvs-animate-right");
                x[i].classList.add("esvs-animate-left");
            }
        }
    }

    function flowToRight1(n, f) {
        const z = getSlides("mySlides");
        let m = n + (f ? 1 : -1);
        if (m >= z.length) {
            m = 0;
        }
        if (m < 0) {
            m = z.length - 1;
        }

        const element = z[m].cloneNode(true);
        element.classList = [];
        element.removeAttribute("class")
        element.style.width = "100%";
        element.style.height = "100%";
        element.style.display = "block";
    
        const tempSlides = document.querySelector(".tempSlides");
        tempSlides.innerHTML = "";
        tempSlides.append(element);
        
        if (!f) {
            tempSlides.classList.remove("esvs-animate-left1");
            tempSlides.classList.add("esvs-animate-right1");
        } else {
            tempSlides.classList.remove("esvs-animate-right1");
            tempSlides.classList.add("esvs-animate-left1");
        }
        tempSlides.style.display = "block";
        tempmytimeout = setTimeout(function () {
            tempSlides.style.display = "none";
        }, 300);
    }

    function showDivs(n, direction) {
        clearTimeout(mytimeout);

        var x = getSlides("mySlides");
        var dots = getSlides("demo");
        slideIndex += n;
        if (slideIndex >= x.length) {
            slideIndex = 0;
        }
        if (slideIndex < 0) {
            slideIndex = x.length - 1;
        }

        flowToRight1(slideIndex, direction)
        flowToRight(direction);
        for (let i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" esvs-white", "");
            dots[i].setAttribute("aria-current", "false");
        }
        x[slideIndex].style.display = "block";

        dots[slideIndex].className += " esvs-white";
        dots[slideIndex].setAttribute("aria-current", "true");

        document.querySelector('#multi-banner-div .sr-only[role="status"]').textContent = translateLang('showing item x of y|Showing item {0} of {1}', slideIndex + 1, x.length);

        trackDisplayDelay(slideIndex);
        clearTimeout(mytimeout);
        if (!isPause) {
            mytimeout = setTimeout(function () {
                bannerManagement.plusDivs(1)
            }, interval);
        }
        
    }

    function getBannerLang() {
        var lang = getMeta('Lenovo.Language');

        if (lang == null || lang == '') {
            lang = getMeta('Language')
            if (lang == null || lang == '')
                return null;
        }
        lang = lang.toLowerCase();
        var found = /^(da|de|en|es|fi|fr|it|ja|ko|nb|nl|pt|sv|th|zh)$/i.test(lang);
        if (found) {
            // if (lang == 'sv') lang = 'se';
            if (lang == 'ja') lang = 'Ja';
            return lang;
        } else {
            return null;
        }
    }

    function getMeta(metaName) {
        const metas = document.getElementsByTagName('meta');

        for (let i = 0; i < metas.length; i++) {
            if (metas[i].getAttribute('name') === metaName) {
                return metas[i].getAttribute('content');
            }
        }

        return '';
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return (false);
    }

    function checkImgExists(imgurl) {
        return new Promise(function (resolve, reject) {
            var ImgObj = new Image();
            ImgObj.src = imgurl;
            ImgObj.onload = function (res) {
                resolve(res);
            }
            ImgObj.onerror = function (err) {
                reject(err)
            }
        })
    }

    function adaptingDevice() {
        const desktop = document.body.clientWidth >= 991;
        isDesktop = desktop;
        const sliders = getSlides("mySlides");
        const images = document.getElementsByName('upsell-banner-img');
        if (isDesktop) {
            document.getElementById("multi-banner-div").style.borderRadius = "12px";
            document.getElementById('arrow-div').style.display = sliders && sliders.length > 1 ? "flex" : "none";
            images && images.forEach(x => {
                if (x.src.includes("Mobile")) {
                    x.src = x.src.replace("Mobile", "Desktop")
                }
            });
        } else {
            document.getElementById("multi-banner-div").style.borderRadius = "";
            document.getElementById('arrow-div').style.display = "none";
            images && images.forEach(x => {
                if (x.src.includes("Desktop")) {
                    x.src = x.src.replace("Desktop", "Mobile")
                }
            });
        }
    }

    function resize() {
        try {
            const desktop = document.body.clientWidth >= 991;
            if (isDesktop == desktop) return;
            adaptingDevice();
            bannerManagement.bannerinit();
        } catch (err) { }
    }

    function multi(picname, anchor, coupon) {
        if (!picname || !anchor || !coupon || picname.length == 0) return "";

        bannerDivId = 'bannerdiv-multi';
        var id = window.location.search;
        var domain = window.location.hostname;
        var path = window.location.pathname
        var sn = getMeta('Serial.Number');
        var country = getMeta('Country');
        var lang = getBannerLang();

        if (lang == null) return "";

        var subsource = "remote10"

        if (getQueryVariable('source')) {
            var source = getQueryVariable('source')
            if (source.toUpperCase() == 'QRAPP') {
                picname[0] = "'https://download.lenovo.com/Images/Warranties/promotions/eSupportBannerDesktopQRCODE15_" + lang + ".jpg'";
            }
            if (source.toUpperCase() == 'OMLIA') {
                picname[0] = "'https://download.lenovo.com/Images/Warranties/promotions/eSupportBannerDesktopOMLIA15_" + lang + ".jpg'";
            }
        }

        var hasSN = false
        if (domain.toLowerCase().indexOf("pcsupport") > -1) {
            var isWarrantyPage = /.*warranty[\/]*$/i.test(window.location.pathname);
            var isWarrantyUpgradePage = /.*warranty\/upgrade[\/]*$/i.test(window.location.pathname);
            var isWarrantyLookupPage = /.*warrantylookup.*/i.test(window.location.pathname);
            var isUpgradeHash = /upgrade/i.test(window.location.hash)

            var sn2 = null;
            if (sn) { sn2 = sn.split(".")[0] }

            var pics = '';

            if (isWarrantyLookupPage) sn2 = '';
            if (sn2 == null || sn2 == '') {
                for (var i = 0; i < picname.length; i++) {
                    if (anchor[i] == 'javascript:showGlobalLoginPrompt && showGlobalLoginPrompt();' && !isWarrantyPage && !isWarrantyUpgradePage) {
                        // continue;
                    }
                    var urlCoupon = '';
                    if (coupon[i] != null && coupon[i] != '') {
                        urlCoupon = 'coupon=' + coupon[i];
                    }

                    if (anchor[i] == '' || (anchor[i][0] == '#' && isUpgradeHash)) {
                        pics += "<img name='upsell-banner-img' class='mySlides esvs-animate-left' tabindex='0' src=" + picname[i] + "style='cursor:width:100%;height:auto;object-fit:cover;'><style>.kindly-reminder{display:block !important;}</style>"
                    } else if (anchor[i][0] == '#') {
                        if (urlCoupon != '') {
                            pics += "<img name='upsell-banner-img' class='mySlides esvs-animate-left' tabindex='0' onclick='showGlobalSearchSNPopover && showGlobalSearchSNPopover(\"subsource=servicebanner&" + urlCoupon + "\")' src=" + picname[i] + "style='cursor:pointer;width:100%;height:auto;object-fit:cover;'><style>.kindly-reminder{display:block !important;}</style>"
                        } else {
                            pics += "<img name='upsell-banner-img' class='mySlides esvs-animate-left' tabindex='0' onclick='showGlobalSearchSNPopover && showGlobalSearchSNPopover(\"subsource=servicebanner\")' src=" + picname[i] + "style='cursor:pointer;width:100%;height:auto;object-fit:cover;'><style>.kindly-reminder{display:block !important;}</style>"
                        }
                    } else if (anchor[i].toLowerCase().indexOf('http') == 0) {
                        if (urlCoupon != '') {
                            //在anchor中的？后拼接{urlCoupon&},如果没有？直接在anchor后边加{?urlCoupon} 
                            if (anchor[i].indexOf('?') > -1) {
                                var anchorLeft = anchor[i].substring(0, anchor[i].indexOf('?') + 1);//截止到？，包含？
                                var anchorRight = anchor[i].substring(anchor[i].indexOf('?') + 1, anchor[i].length);//？开始，不包含？
                                pics += "<a href='" + anchorLeft + urlCoupon + "&" + anchorRight + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                            } else {
                                pics += "<a href='" + anchor[i] + "?" + urlCoupon + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                            }
                        } else {
                            pics += "<a href='" + anchor[i] + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                        }
                    } else if (anchor[i].toLowerCase().indexOf('javascript') == 0) {
                        pics += "<a href='" + anchor[i] + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                    }
                }
            }
            else {
                for (var i = 0; i < picname.length; i++) {
                    var urlCoupon = '';
                    if (coupon[i] != null && coupon[i] != '') {
                        urlCoupon = 'coupon=' + coupon[i];
                    }
                    if (anchor[i] == '' || (anchor[i][0] == '#' && isUpgradeHash)) {
                        pics += "<img name='upsell-banner-img' class='mySlides esvs-animate-left' tabindex='0' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'><style>.kindly-reminder{display:block !important;}</style>"
                    }
                    else if (anchor[i][0] == '#') {
                        if (urlCoupon != '') {
                            pics += "<a href='/products/" + sn2 + "/warranty/upgrade?anchorPoint=" + anchor[i].replace("#", "") + "&subsource=servicebanner&" + urlCoupon + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                        } else {
                            pics += "<a href='/products/" + sn2 + "/warranty/upgrade?anchorPoint=" + anchor[i].replace("#", "") + "&subsource=servicebanner' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                        }
                    }
                    else if (anchor[i].toLowerCase().indexOf('http') == 0) {
                        if (urlCoupon != '') {
                            //在anchor中的？后拼接{urlCoupon&},如果没有？直接在anchor后边加{?urlCoupon} 
                            if (anchor[i].indexOf('?') > -1) {
                                var anchorLeft = anchor[i].substring(0, anchor[i].indexOf('?') + 1);//截止到？，包含？
                                var anchorRight = anchor[i].substring(anchor[i].indexOf('?') + 1, anchor[i].length);//？开始，不包含？
                                pics += "<a href='" + anchorLeft + urlCoupon + "&" + anchorRight + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                            } else {
                                pics += "<a href='" + anchor[i] + "?" + urlCoupon + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                            }

                        } else {
                            pics += "<a href='" + anchor[i] + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                        }
                    }
                    else if (anchor[i].toLowerCase().indexOf('javascript') == 0) {
                        pics += "<a href='" + anchor[i] + "' tabindex='0'><img name='upsell-banner-img' class='mySlides esvs-animate-left' src=" + picname[i] + "style='width:100%;height:auto;object-fit:cover;'></a><style>.kindly-reminder{display:block !important;}</style>"
                    }
                }
            }

            return pics;
        }
        return "";
    }

    var bannerDivId = 'bannerdiv-multi'

    function show() {
        document.getElementById(bannerDivId).style.display = 'inherit'
    }

    function canShowBanner(isAIBanner) {
        var path = window.location.pathname
        var sn = getMeta('Serial.Number').split(".")[0] || 'NOTEXIST';
        var mt = getMeta('Product.Machine.Type') || 'NOTEXIST';
        var subSeries = getMeta('Product.Sub-Series') || 'NOTEXIST';
        var series = getMeta('Series') || 'NOTEXIST';
        var isProductSn = new RegExp(`.*/products/.*/${sn}/?$`, "i").test(path);
        var isProductMt = new RegExp(`.*/products/.*/${mt}/?$`, "i").test(path);
        var isProductMtm = new RegExp(`.*/products/.*/${mt}/${mt}[^/]+/?$`, "i").test(path);
        var isProductSubSeries = new RegExp(`.*/products/.*/${subSeries}/?$`, "i").test(path);
        var isProductSeries = new RegExp(`.*/products/.*/${series}/?$`, "i").test(path);

        var isProductPage = false;
        if (isAIBanner) {
            isProductPage = isProductSn || isProductMtm || isProductMt || isProductSubSeries || isProductSeries;
        } else {
            isProductPage = isProductSn || isProductMtm || isProductMt;
        }
         
        var isPartPage = /.*[\/]parts[\/].*$/i.test(window.location.pathname);
        var criticalUpdateShow = /.*(warranty).*/i.test(window.location.href);
        var isFccl = /.*(fccl).*/i.test(window.location.href);
      
        return (criticalUpdateShow || isProductPage) && !isFccl;
    }

    function canShowAIBanner() {
        return canShowBanner(true);
    }

    function prepare() {
        if (!canShowBanner()) {
            return;
        }
        var country = getMeta('Country').toUpperCase();

        var isWarrantyPage = /.*warranty[\/]*$/i.test(window.location.pathname);
        var isWarrantyUpgradePage = /.*warranty\/upgrade[\/]*$/i.test(window.location.pathname);
        var isWarrantyLookupPage = /.*warrantylookup.*/i.test(window.location.pathname);
        var isFancyWarrantyUpgrade = /.*(warranty-upgrade-and-services).*/i.test(window.location.href);
     
        if (isFancyWarrantyUpgrade) {
            setTimeout(function () {
                prepareSn()
            }, 500)
            return;
        }
        if ((isWarrantyPage && !isWarrantyUpgradePage) || (isWarrantyLookupPage && !isWarrantyUpgradePage)) {
            setTimeout(function () {
                prepareSn()
            }, 500)
        }

        var picname, startdates, enddates, anchor, coupon;
        var pics = new Array();
        var starts = new Array();
        var ends = new Array();
        var anchors = new Array();
        var coupons = new Array();

        
if(country =='AU' || country =='NZ'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_EN_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/ProfInst ANZ_Desktop.jpg'"];
startdates=['2025-12-01T00:00:00','2025-12-10T08:26:13'];
enddates=['2027-01-01T01:00:00','2026-02-01T00:00:00'];
anchor=['#warranty','https://support.lenovo.com/parts-lookup'];
coupon=['',''];
}
if(country =='IT'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_IT_Desktop.jpg'"];
startdates=['2025-12-02T00:00:00'];
enddates=['2026-12-02T09:00:00'];
anchor=['#warranty'];
coupon=[''];
}
if(country =='PT'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_PT_Desktop.jpg'"];
startdates=['2025-12-02T00:00:00'];
enddates=['2026-12-09T00:00:00'];
anchor=['#warranty'];
coupon=[''];
}
if(country =='ES'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_ES_Desktop.jpg'"];
startdates=['2025-12-02T00:00:00'];
enddates=['2026-12-09T00:00:00'];
anchor=['#warranty'];
coupon=[''];
}
if(country =='US' || country =='CA'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_EN_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/Rewards Banner_Desktop.jpeg'","'https://download.lenovo.com/BannerManagement/images/NA CM 25_Desktop.jpg'"];
startdates=['2025-12-08T00:00:00','2023-07-01T00:00:00','2025-11-30T23:00:00.000Z'];
enddates=['2026-12-08T00:00:00','2025-07-01T00:00:00','2025-12-07T23:00:00.000Z'];
anchor=['#warranty','https://javascript:showGlobalLoginPrompt();','#warranty'];
coupon=['','','CYBER20'];
}
if(country =='JP'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_JA_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/JP BF 25_Desktop.jpg'"];
startdates=['2025-12-05T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-04T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','JPBF20'];
}
if(country =='FR'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_FR_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/FR BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2029-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='AR' || country =='PE' || country =='CL' || country =='MX' || country =='CO'){
picname=["'https://download.lenovo.com/BannerManagement/images/Smart Banner LA_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/BF LAS 25_Desktop.jpg'"];
startdates=['2025-12-02T00:00:00','2025-11-23T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-01T23:00:00.000Z'];
anchor=['#smart-section',''];
coupon=['','LABF50'];
}
if(country =='BR'){
picname=["'https://download.lenovo.com/BannerManagement/images/BR Up50 Banner_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/BF BR 25_Desktop.jpg'"];
startdates=['2025-12-02T00:00:00','2025-11-23T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-01T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','LABF50'];
}
if(country =='GB' || country =='IE'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_EN_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/EN BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='DE' || country =='AT'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_DE_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/DE BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='BE'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_FR_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/FR BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='CH'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_FR_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/DE BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='NO'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_NB_NEW_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/NO BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='SE'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_SV_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/SE BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='DK'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_DA_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/DK BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-09T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='FI'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_FI_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/FI BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-08T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='NL'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_NL_NEW_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/NL BF 25_Desktop.jpg'"];
startdates=['2025-12-09T00:00:00','2025-11-13T23:00:00.000Z'];
enddates=['2026-12-08T00:00:00','2025-12-08T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','BLACK30'];
}
if(country =='IN'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_EN_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/FestiveSeason 2025_Desktop.jpg'"];
startdates=['2025-11-03T00:00:00','2025-10-17T06:32:43.000Z'];
enddates=['2025-12-15T00:00:00','2025-11-02T23:00:00.000Z'];
anchor=['#warranty','#warranty'];
coupon=['','FESTIVE15'];
}
if(country =='PH'){
picname=["'https://download.lenovo.com/BannerManagement/images/Remote10_EN_Desktop.jpg'"];
startdates=['2020-11-01T04:00:00.000Z'];
enddates=['2027-01-01T00:00:00.000Z'];
anchor=['#warranty'];
coupon=['REMOTE10'];
}
if(country =='TH'){
picname=["'https://download.lenovo.com/BannerManagement/images/Smart10_TH_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/Th_15_Desktop.jpg'"];
startdates=['2022-01-19T02:38:14.000Z','2022-10-31T16:00:00.000Z'];
enddates=['2026-12-31T16:00:00.000Z','2026-12-31T17:00:00.000Z'];
anchor=['#smart-section','#warranty'];
coupon=['SMART10','CAPSVC15'];
}
if(country =='KR'){
picname=["'https://download.lenovo.com/BannerManagement/images/kr_15_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/Smart10_KR_Desktop.jpg'"];
startdates=['2022-10-31T16:00:00.000Z','2022-01-19T02:38:14.000Z'];
enddates=['2026-12-31T17:00:00.000Z','2026-12-31T16:00:00.000Z'];
anchor=['#warranty','#smart-section'];
coupon=['CAPSVC15','SMART10'];
}
if(country =='HK'){
picname=["'https://download.lenovo.com/BannerManagement/images/HK_15_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/Hk_smart_Desktop.jpg'"];
startdates=['2022-10-31T16:00:00.000Z','2022-01-19T02:38:14.000Z'];
enddates=['2026-12-31T17:00:00.000Z','2026-12-31T16:00:00.000Z'];
anchor=['#warranty','#smart-section'];
coupon=['CAPSVC15','SMART10'];
}
if(country =='SG' || country =='MY'){
picname=["'https://download.lenovo.com/BannerManagement/images/CAP_EN_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/CAP_smart10_Desktop.jpg'"];
startdates=['2022-10-31T16:00:00.000Z','2022-01-19T02:38:14.000Z'];
enddates=['2026-12-31T17:00:00.000Z','2026-12-31T16:00:00.000Z'];
anchor=['#warranty','#smart-section'];
coupon=['CAPSVC15','SMART10'];
}
if(country =='TW'){
picname=["'https://download.lenovo.com/BannerManagement/images/TW_Desktop.jpg'","'https://download.lenovo.com/BannerManagement/images/Smart10_ZH_Desktop.jpg'"];
startdates=['2022-10-31T16:00:00.000Z','2022-01-19T02:38:14.000Z'];
enddates=['2026-12-31T17:00:00.000Z','2026-12-31T16:00:00.000Z'];
anchor=['#warranty','#smart-section'];
coupon=['CAPSVC15','SMART10'];
}


        if (!picname || picname.length == 0) return {pics, anchors, coupons};
        var now = toISO(new Date());
        var nowDate = new Date();
        for (var i = 0; i < picname.length; i++) {

            var currentCoupon = coupon[i];
            if (currentCoupon != null && coupon[i] != '') {
                var couponDateStart = new Date(startdates[i])
                var couponDateEnd = new Date(enddates[i])

                if (nowDate < couponDateStart.getTime() || nowDate > couponDateEnd.getTime()) continue;
            } else {
                if (now < startdates[i] || now > enddates[i]) continue;
            }
            if (anchor[i] && anchor[i].indexOf('()') > -1) {
                anchor[i] = 'javascript:showGlobalLoginPrompt && showGlobalLoginPrompt();'
            }
            pics.push(picname[i])
            starts.push(startdates[i])
            ends.push(enddates[i])
            anchors.push(anchor[i])
            coupons.push(coupon[i])
        }
      
        return {pics, anchors, coupons};
    }

    function init() {
        const data = prepare();
        if (!data && !canShowAIBanner()) {
            return;
        }

        var html = '<div class="tempSlides" style="width:100%;height:100%;display:none;top:0;position:absolute;opacity:0.8;" ></div>';
        html += multi(data?.pics, data?.anchors, data?.coupons) || "";
        html += '<div id="arrow-div" style="pointer-events: none;display: flex;width: 100%;height: 20px;position: absolute;top: calc(50% - 10px);align-items: center;justify-content: space-between;padding: 0 16px;background-color: transparent;" >' +
        '<span onclick="bannerManagement.plusDivs(-1)" role="button" tabindex="0" aria-label="' + translateLang('previous|Prev') + '" style="pointer-events: auto;width: 24px;height: 24px;cursor: pointer;display: flex;align-items: center;justify-content: center;border-radius: 50%;background-color: #000;"><svg xmlns="http://www.w3.org/2000/svg" width="8.424" height="14.5" viewBox="0 0 8.424 14.5"><g id="icon-arrow-left-16" transform="translate(0 0)"><g id="icon-chevron-left" transform="translate(8.424 0) rotate(90)"><path id="chevron" d="M0,1.174,1.182,0,7.25,6.068,13.318,0,14.5,1.174,7.25,8.424Z" transform="translate(0 0)" fill="#fff"/></g></g></svg></span>' +
        '<span onclick="bannerManagement.plusDivs(1)" role="button" tabindex="0" aria-label="' + translateLang('next|Next') + '" style="pointer-events: auto;width: 24px;height: 24px;cursor: pointer;display: flex;align-items: center;justify-content: center;border-radius: 50%;background-color: #000;"><svg xmlns="http://www.w3.org/2000/svg" width="8.424" height="14.5" viewBox="0 0 8.424 14.5"><g id="icon-arrow-right-16" transform="translate(0)"><g id="icon-chevron-left" transform="translate(8.424 0) rotate(90)"><path id="chevron" d="M0,7.25,1.182,8.424,7.25,2.356l6.068,6.068L14.5,7.25,7.25,0Z" transform="translate(0)" fill="#fff"/></g></g></svg></span>' +
        '</div>' +
        '<style>#arrow-div span:hover {background-color:#4E444E !important;}</style>' +
        '<div id="multi-circle-div" style="left: 50%;transform: translate(-50%,0);pointer-events: auto;display: flex;position: absolute;bottom: 3px;background-color: #ffffff4d;border-radius: 20px;padding: 6px 5px;">'+
        '</div>' +
        '<div class="sr-only" role="status" aria-atomic="true" aria-live="off"></div>';

        document.getElementById("multi-banner-div").innerHTML = html;
        document.getElementById("multi-banner-div").style.borderRadius = "12px";
        document.getElementById("multi-banner-div").setAttribute("role", "region");
        document.getElementById("multi-banner-div").setAttribute("aria-label", translateLang('a11y carousel area|Carousel Area'));

        document.getElementById("multi-banner-div").addEventListener('focusin', () => {
            pause(true);
            document.querySelector('#multi-banner-div .sr-only[role="status"]').setAttribute('aria-live', 'polite');
        });

        document.getElementById("multi-banner-div").addEventListener('focusout', () => {
            pause(false);
            document.querySelector('#multi-banner-div .sr-only[role="status"]').setAttribute('aria-live', 'off');
        });

        document.querySelector('#arrow-div span:first-child').addEventListener('keydown', function (e) {
            if (e.key === "Enter" || e.key === " ") {
                bannerManagement.plusDivs(-1);
            }
        });

        document.querySelector('#arrow-div span:last-child').addEventListener('keydown', function (e) {
            if (e.key === "Enter" || e.key === " ") {
                bannerManagement.plusDivs(1);
            }
        });

        bannerManagement.bannerinit();
        show();
    }

    var showCouponBanner = function () {
        init();
    }

    showCouponBanner();
    window.addEventListener('locationchange', function (e) {
        showCouponBanner();
    });

    var oldpath = window.location.pathname
    function testReset() {

        if (window.location.pathname != oldpath) {
            oldpath = window.location.pathname
            clearTimeout(mytimeout);
            document.getElementById("multi-banner-div").innerHTML = "";
            document.getElementById("bannerdiv-single").innerHTML = "";
            showCouponBanner();

        }
        setTimeout(function () {
            testReset()
        }, 100)

    }

    setTimeout(function () {
        testReset()
    }, 100)

    function prepareSn() {
        var x = document.querySelectorAll(".search-sn-popover-box .button-box span.disabled:not([id='37871_found'])")
        if (x && x.length != 0) {
            snfilter()
        }


        setTimeout(function () {
            prepareSn()
        }, 500)
    }

    function formatSn(sn) {
        var ids = sn.split('.');

        for (var i = 0; i < ids.length; i++) {
            if (i < 2) ids[i] = ids[i].replaceAll('-', '');
            var newIds = ids[i].split('-');
            for (var j = 0; j < newIds.length; j++) {
                newIds[j] = newIds[j].replace(/\W/g, '');
                newIds[j] = newIds[j].replace('_', '');
            }
            ids[i] = newIds.join('-');
        }
        return ids.join('.');
    }

    function snfilter() {
        subParent = document.querySelectorAll(".search-sn-popover-box .button-box span.disabled:not([id='37871_found'])")[0].parentElement

        sub = document.querySelectorAll(".search-sn-popover-box .button-box span.disabled:not([id='37871_found'])")[0]

        sub2 = sub.cloneNode(true)
        sub.id = '37871_found'
        sub2.id = '37871_found'
        subParent.appendChild(sub2)
        sub.style.display = 'none'


        var inputbox = document.querySelectorAll(".search-sn-popover-box .inputBox input:not([id='37871_found'])")[0]

        //inputbox.removeEventListener('keyup',getEventListeners(inputbox).keyup[0].listener)
        inputbox.id = '37871_found'
        sub2.inputbox = inputbox;
        sub2.sub = sub;
        inputbox.onkeydown = function (e) {

            if (e.key == 'Enter' || e.code == 'Enter') {

                sub2.click()
            }
        }
        inputbox.onkeyup = function (e) {
            if (inputbox.value.length < 7 && !sub2.classList.contains("disabled")) {
                sub2.classList.add('disabled')
            }
            if (inputbox.value.length >= 7 && sub2.classList.contains("disabled")) {
                while (sub2.classList.contains("disabled")) {
                    sub2.classList.remove('disabled')
                }
            }
        }

        sub2.onclick = function (e) {
            var inputbox = this.inputbox;
            inputbox.value = formatSn(inputbox.value)

            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("input", false, true);
            inputbox.dispatchEvent(evt);
            setTimeout(function () {
                this.sub.click()
            }, 30)

        }

    }
})(bannerManagement);

window.bannerManagement = bannerManagement;
