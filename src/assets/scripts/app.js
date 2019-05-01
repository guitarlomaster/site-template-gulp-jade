// ==================================================
//
// Promo page script
//
// ==================================================

var uid = null,
    reflink_code = null,
    ratingList = null,
    linkParams = location.search.slice(1).split('&'),
    aliasEventRequest = 'comeback',
    buttonPushed = false,
    endpoint = false,
    detectedBlock = false,
    api_url = 'https://api.101xp.com/',
    MainConfigLand = {
        prod: {
            widget_url: {
                ru: 'https://portal-id.101xp.com',
                en: 'https://portal-id-en.101xp.com',
                pl: 'https://portal-id-pl.101xp.com'
            }
        },
        stage: {
            widget_url: {
                ru: 'https://portal-id-stage.101xp.com',
                en: 'https://portal-id-stage.101xp.com',
                pl: 'https://portal-id-stage.101xp.com'
            }
        },
        dev: {
            widget_url: {
                ru: 'https://portal-id-stage.101xp.com',
                en: 'https://portal-id-stage.101xp.com',
                pl: 'https://portal-id-stage.101xp.com'
            }
        }
    },
    Config = MainConfigLand[livePeriod];

function listener(event) {
    //console.log(event);
    console.log(event.data);
    var data =
        typeof event.data == 'object' ? event.data : JSON.parse(event.data);
    //var data = JSON.parse(event.data);

    xpAuthWidget(data.event, data);
}

function xpAuthWidget(name, event) {
    //console.log(Config);
    var widgetHost = Config.widget_url[localeLand],
        params = localeLand != 'ru' ? '' : '',
        stylesPack =
            '" width="100%" height="100%" style="z-index: 9999; position: fixed; top:0; left: 0; border: none; margin:0; padding:0;"';

    function openFrame(path) {
        jQuery('iframe[name="dialog"]').remove();
        jQuery('body').append(
            '<iframe name="dialog" src="' +
            widgetHost +
            path +
            '?' +
            params +
            stylesPack +
            '></iframe>'
        );
    }

    switch (name) {
        case 'dialogClose':
            jQuery(document)
                .find('iframe[name="dialog"]')
                .remove();
            window.frames.header.postMessage('window:close', '*');
            //loginUser();
            break;
        case 'profile':
            openFrame('/profile/games');
            break;
        case 'profileAuthorization':
            openFrame('/profile/options/authorization');
            break;
        case 'profileClose':
            $('iframe[name="profile"]').remove();
            window.frames.header.postMessage('profile:logout', '*');
            break;
        case 'changeName':
            // window.frames.header.postMessage({
            //     type: 'name:change',
            //     name: data.data
            // }, '*');
            break;
        case 'changeBalance':
            // window.frames.header.postMessage({
            //     type: 'balance:change',
            //     balance: data.data
            // }, '*');
            break;
        case 'signin':
            openFrame('/signin');
            break;
        case 'signup':
            openFrame('/signup');
            break;
        case 'login-success':
            setTimeout(function () {
                location.reload();
            }, 1000);

            break;
        case 'logout':
            setTimeout(function () {
                location.reload();
            }, 1000);
            break;
        case 'dropdownOpen':
            jQuery(document)
                .find('#panel')
                .css('height', event.data.height + 48);
            break;
        case 'dropdownClose':
            jQuery(document)
                .find('#panel')
                .css('height', 48);
            break;

        case 'restorePassword:email':
            openFrame('/password/restore/email');
            break;
        case 'restorePassword:send':
            openFrame('/password/restore/send');
            break;
        case 'email-binding:email':
            openFrame('/email/binding/email');
            break;
        case 'email-binding:code':
            openFrame('/email/binding/code');
            break;
        case 'email-binding:payment-success':
            openFrame('/email/binding/success');
            break;
        case 'email-confirm:email':
            openFrame('/email-confirm/email');
            break;
        case 'email-confirm:need-support':
            openFrame('/email-confirm/support');
            break;
        case 'email-confirm:change':
            openFrame('/email-confirm/change');
            break;
        default:
            //console.log(event);
            break;
    }
}

if (window.addEventListener) {
    window.addEventListener('message', listener);
} else {
    // IE8
    window.attachEvent('onmessage', listener);
}

function widgetModal(event) {
    listener({data: {event: event}});
}

var shareParams = {
        page: 'https://' + promo + '.101xp.com/' + localeLand + '/', // page url
        title: document.title,
        text: $(document)
            .find('meta[name="description"]')
            .attr('content'),

        image: 'https://' + promo + '.101xp.com/images/share/' + localeLand + '/all.jpg',
        vk_image: 'https://' + promo + '.101xp.com/images/share/' + localeLand + '/vk-big.jpg'
    },
    ShareUpdate = {
        vk: function (code) {
            var url = 'http://vkontakte.ru/share.php?';
            url += 'url=' + encodeURIComponent(shareParams.page + '?social=vk');
            url += '&title=' + encodeURIComponent(shareParams.title);
            //url += '&description='  + encodeURIComponent(shareParams.text);
            url += '&comment=' + encodeURIComponent(shareParams.text);
            url += '&image=' + encodeURIComponent(shareParams.image);
            url += '&noparse=true&callback=?';
            this.popup(url);
        },
        fb: function (code) {
            var url = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(shareParams.page);
            url += '&p[images][0]=' + encodeURIComponent(shareParams.image);
            this.popup(url);
        },
        fb_mobile: function (code) {
            var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareParams.page);
            this.popup(url);
        },
        mm: function (code) {
            var url = 'http://connect.mail.ru/share?';
            url += 'url=' + encodeURIComponent(shareParams.page);
            url += '&title=' + encodeURIComponent(shareParams.title);
            url += '&description=' + encodeURIComponent(shareParams.text);
            url += '&imageurl=' + encodeURIComponent(shareParams.image);
            this.popup(url)
        },
        ok: function (code) {
            var url = 'https://connect.ok.ru/offer?';
            url += 'url=' + encodeURIComponent(shareParams.page);
            url += '&title=' + encodeURIComponent(shareParams.title);
            url += '&description=' + encodeURIComponent(shareParams.text);
            url += '&imageUrl=' + encodeURIComponent(shareParams.image);
            this.popup(url);
        },
        tw: function (code) {
            var url = 'https://twitter.com/intent/tweet?';
            url += 'url=' + encodeURIComponent(shareParams.page);
            url += '&title=' + encodeURIComponent(shareParams.title);
            url += '&text=' + encodeURIComponent(shareParams.text);
            url += '&imageUrl=' + encodeURIComponent(shareParams.image);
            this.popup(url);
        },

        popup: function (url) {
            openPopupShare(
                window.open(
                    url,
                    document.title,
                    'toolbar=0,status=0,width=700,height=436'
                )
            );
        }
    };

function openPopupShare(socModal) {
    if (socModal.closed) {
    } else {
        socModal.postMessage('requestCredentials', '*');
        setTimeout(function () {
            openPopupShare(socModal);
        }, 500);
    }
}

function getCookie(name) {
    var matches = document.cookie.match(
        new RegExp(
            '(?:^|; )' +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
            '=([^;]*)'
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function checkAuth() {
    if (document.cookie.indexOf('auth_token') >= 0) {
        return true;
    } else {
        return false;
    }
}

function initClassesListener($types) {
    $types.click(function () {
        var target = $(this).attr('data-target_ref');
        var imgSel = $(this)
            .closest('.uniques__slide-three')
            .find('.slide-img');
        $types.removeClass('active');
        $(this).addClass('active');
        imgSel.removeClass('classic');
        imgSel.removeClass('chibi');
        imgSel.addClass(target);
    });
}

//Classes and chibi
function initHintListeners(eventSel, hintSel, hintInnerSel) {
    $(eventSel)
        .on('mouseenter', function () {
            var isDevice = 'ontouchstart' in document.documentElement;
            var hint = $(this).find(hintSel);
            var hintInner = $(this).find(hintInnerSel);
            hint.css({'display': 'block'});
            var pointHeight = $(this)[0].offsetHeight;
            var hintHeight = hintInner[0].offsetHeight;
            if (!isDevice) {
                hintInner.css({'top': '-' + (hintHeight / 2 - pointHeight / 2) + 'px'});
            }
        })
        .on('mouseleave', function () {
            $(this).find(hintSel).css({'display': 'none'});
        });
}

$.fn.outerHTML = function () {
    return (this[0]) ? this[0].outerHTML : '';
};

var userId = 0;

function getUserId() {
    $.get(
        api_url + 'account?access_token=' + $.cookie('auth_token'),
        function (res) {
            if (res.status === 'success') {
                userId = res.account['id'];
            }
        }, 'json'
    );
}


$(document).ready(function () {



});
