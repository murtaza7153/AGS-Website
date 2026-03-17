var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
class BrochureSignup {
	constructor() {
		this.form = jQuery('.wp-block-group.brochure-signup-form')
		this.brochureList = jQuery('.wp-block-group.brochure-list')
		this.cookie = 'brochure_signup'

		//Show brochures on page load if form has already been submitted
		if(getCookie(this.cookie) == 1) {
			this.showBrochures(false)
		} else {
			this.hideBrochures()
		}

		this.handleEvents()
	}
	handleEvents() {
		const self = this

		//Check for form submit
		document.addEventListener( 'wpcf7mailsent', function(event) {
			//Get form values
			const form = jQuery(event.target);
			//Make sure form submitted
			if(form.hasClass('brochure-signup-form')) {
				//Update cookie
				setCookie(self.cookie, 1, 30)

				//Grab success message & show below
				jQuery('<div class="wrapper"><div class="alertBanner success">Thank you for signing up for our brochures. Please view them below.</div></div>').prependTo(self.brochureList)

				//Show brochures
				self.showBrochures()
			}
		}, false );
	}
	showBrochures(animate=true) {
		if(animate === true) {
			this.form.slideUp()
			this.brochureList.slideDown()
		} else {
			this.form.hide()
			this.brochureList.show()
		}
	}
	hideBrochures() {
		this.form.show()
		this.brochureList.hide()
	}
}

class ProductMatrix {
	constructor() {
		this.container = jQuery('.wp-block-table.product-matrix')
		this.onLoad()
	}

	onLoad() {
		//Change all table cells that contain "x" to a check icon
		this.container.find('td').each(function(){
			if(jQuery(this).html() == 'x') jQuery(this).html('<i class="fas fa-check-circle"></i>')
		})
	}
}

jQuery(document).ready(function() {
	
	//SMOOTH SCROLLING
	jQuery('a[href*="#"]:not([href="#"])').click(function() {
		if(location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = jQuery(this.hash);
			target = target.length ? target : jQuery('[name=' + this.hash.slice(1) +']');
			if (target.length) {
				jQuery('html,body').animate({
					scrollTop: target.offset().top
				}, 500);
				return false;
			}
		}
	});
	//SMOOTH SCROLL TO TOP
	jQuery('a[href="#top"]').click(function() {
		jQuery('html, body').animate({scrollTop:0}, 'fast');
		return false;
	});
	
	//HOVER STYLE FOR SUB NAV
	jQuery('nav#menu ul li').hover(function () {
		jQuery(this).addClass('hover-style');
		jQuery(this).find('ul').fadeIn();
	}, function () {
		jQuery(this).removeClass('hover-style');
	});
	
	//TABS
	jQuery( ".tabs" ).tabs();
	
	//ACCORDION
	jQuery( ".accordion" ).accordion({
		collapsible: true,
		active: false,
		heightStyle: "content",
		navigation: true,
		header: 'h3.accordion-header',
		icons: {
			header: "ui-icon-triangle-1-w",
      activeHeader: "ui-icon-triangle-1-s"
		}
	});
	//EXPAND SELECTED ACCORDION
	var hash = window.location.hash.substring(1);
	var anchor = jQuery('.accordion h3 a[name="'+hash+'"]').closest('h3');
	if(anchor.length > 0){
		anchor.click();
	}
	
	//IMAGE HOVERS
	jQuery('img[data-hover]').hover(function () {
		var src_img = jQuery(this).attr('src');
		var hover_img = jQuery(this).data('hover');
		jQuery(this).attr('src', hover_img);
		jQuery(this).data('src', src_img);
		jQuery(this).attr('srcset', '');
	}, function () {
		var data_src = jQuery(this).data('src');
		jQuery(this).attr('src', data_src);
	});
	//PRE-LOAD ALL IMAGE HOVERS
	jQuery('img[data-hover]').each(function() {
		jQuery('<img src="'+jQuery(this).data('hover')+'" style="display:none;">').appendTo('body');
	});
	
	jQuery('#search i').click(function() {
		let search = jQuery(this).parent();
		if(search.hasClass('showing')) {
			search.removeClass('showing');
		} else {
			search.addClass('showing');
		}
	});
	/* jQuery('body').click(function() {
		console.log('body clicked');
		let search = jQuery('#search');
		if(search.hasClass('showing')) {
			search.removeClass('showing');
		}
	}); */

	//Parallax
	jQuery('.parallaxie').parallaxie();

	//Mobile menu
	const mobileMenu = {
		init: function(){
			this.nav = jQuery('nav#menu');
			this.navContainer = jQuery('nav#menu').find('.menu-container');
			this.menuIcon = this.nav.find('> i');
			this.body = jQuery('body');
			this.underlay = '<div id="underlay"></div>';
			this.underlaySelect = '#underlay';
			//Open menu click
			this.handleOpen();
			//Check for resize on window
			this.windowResize();
		},

		handleOpen: function() {
			jQuery(mobileMenu.menuIcon).click(function() {
				//Close menu if opened, open menu if closed
				if(mobileMenu.nav.hasClass('showing')) {
					mobileMenu.closeMenu();
				} else {
					mobileMenu.openMenu();
				}
			});
		},
		handleClose: function() {
			//Close menu on click
			jQuery('nav#menu i.close, '+mobileMenu.underlaySelect).click(function() {
				mobileMenu.closeMenu();
			});
		},
		openMenu: function() {
			//Open menu
			mobileMenu.nav.addClass('showing');
			mobileMenu.navContainer.show().animate({left: "0"}, 200);
			//Add underlay
			mobileMenu.body.append(mobileMenu.underlay).addClass('fixed');
			//Initiate close function after opened
			this.handleClose();
		},
		closeMenu: function() {
			//Close menu
			mobileMenu.nav.removeClass('showing');
			mobileMenu.navContainer.animate({left: "-425px"}, 200);
			//Remove underlay
			mobileMenu.body.removeClass('fixed');
			jQuery(mobileMenu.underlaySelect).remove();
			
		},
		windowResize: function() {
			jQuery(window).resize(function() {
				if(jQuery(window).width() > 1024) {
					mobileMenu.closeMenu();
				}
			});
		},
	}
	mobileMenu.init();

	//Golf Course parallax
	const golfCourseParallax = {
		init: function(){
			this.container = jQuery('.wp-block-parallax-golf-course');
			//Adjust height on element
			this.adjustHeight();
			//Check for resize on window
			this.windowResize();
		},
		adjustHeight: function() {
			//Get height values
			let windowHeight = jQuery(window).outerHeight();
			let headerHeight = jQuery('#header').outerHeight(); //Includes padding & border
			let thisHeight = golfCourseParallax.container.outerHeight(); //Includes padding & border
			let thisXtraSpace = golfCourseParallax.container.innerHeight() - golfCourseParallax.container.height();
			let maxHeight = 800;
			let minHeight = thisHeight >= maxHeight ? maxHeight : thisHeight;
			//Start with window height, then take away height of header/nav + extra padding
			let thisNewHeight = windowHeight - thisXtraSpace - headerHeight;
			//Apply height values to element
			golfCourseParallax.container.height(thisNewHeight).css('min-height', minHeight).css('max-height', maxHeight);
		},
		windowResize: function() {
			jQuery(window).resize(function() {
				golfCourseParallax.adjustHeight();
			});
		},
	}
	golfCourseParallax.init();

	//SCHEDULE A CONSULTATION / REQUEST MORE INFORMATION FORM REDIRECT
	document.addEventListener( 'wpcf7mailsent', function(event) {
			//Get form values
			let form = jQuery(event.target);
			//Make sure form submitted
			if(form.hasClass('schedule-consultation-form')) {
				//Get form fields
				let values = {
					'your-name': form.find('input[name=your-name]').val(),
					'your-email': form.find('input[name=your-email]').val(),
					'your-phone': form.find('input[name=your-phone]').val(),
				},
				params = jQuery.param(values);
				//Redirect to main request more info page
				location = globalObject.url+'/request-more-information/?'+params;
			}
			
	}, false );

	//News filters
	jQuery('.archive-filters .filter h4').click(function() {
		let filter = jQuery(this).closest('.filter');
		let choices = filter.find('.choices');
		let icon = filter.find('i');
		//Hide other choices
		jQuery('.archive-filters .filter').not(filter).removeClass('selected');
		jQuery('.archive-filters .filter .choices').not(choices).hide();
		//Change icon
		jQuery('.archive-filters .filter h4 i').not(icon).addClass('fa-caret-down').removeClass('fa-caret-up');
		//Show/hide selected choices
		if(choices.is(':visible')) {
			//Hide choices
			choices.hide();
			//Change icon
			icon.removeClass('fa-caret-up');
			icon.addClass('fa-caret-down');
			//Show item is no longer selected
			filter.removeClass('selected');
		} else {
			//Show choices
			choices.show();
			//Change icon
			icon.removeClass('fa-caret-down');
			icon.addClass('fa-caret-up');
			//Show item is selected
			filter.addClass('selected');
		}
	});

	//Brochure signup
	new BrochureSignup()

	//Product Matrix
	new ProductMatrix()

});

jQuery(window).resize(function() {
	
});

//PRICE FUNCTIONS
function formatPrice(price) {
	//return '$' + parseFloat(price, 10).toFixed(2).replace(/(\d)(?=(\d{3})+$)/g, '$1,').toString();
	return '$' + price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}
function unformatPrice(price) {
	return price.replace("$", "").replace(",", "");
}

// COOKIE FUNCTIONS
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

document.addEventListener('DOMContentLoaded', () => {
    const faqMenuLink = document.querySelector('#menu-footer-about .menu-item a[href="https://web.archive.org/web/20250912230553/https://www.agsgolfandsports.com/faqs/"');

    if(faqMenuLink) {
        faqMenuLink.addEventListener('click', (e) => {
            e.preventDefault();
        });
    
    }
	
	const tradeshowTitles = document.querySelectorAll('.tradeshow-title');
	if(tradeshowTitles) {
  		tradeshowTitles.forEach(tradeshowTitle => {
    		if(tradeshowTitle.innerText.startsWith('Craft Brewers Conference & BrewExpo America')) {
      			tradeshowTitle.nextElementSibling.insertAdjacentHTML('afterbegin', '<span>Trade Show </span>');
    		}
  		});
	}
})
}

/*
     FILE ARCHIVED ON 23:05:53 Sep 12, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 06:29:27 Mar 17, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.56
  exclusion.robots: 0.064
  exclusion.robots.policy: 0.053
  esindex: 0.01
  cdx.remote: 18.186
  LoadShardBlock: 596.725 (3)
  PetaboxLoader3.datanode: 518.415 (4)
  PetaboxLoader3.resolve: 148.25 (3)
  load_resource: 1243.201
*/