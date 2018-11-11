var app = {
	//Variables
	variables: {
		formHeight: '',
		formWidth: '',
		konaKartURL: kkRoot,
		apiUrl: '',
		store: "store1",
		apiCall: "getConfigurationValues",
		options: '',
		requestBody: '',
		domainBody: '',
		payload: {},
		payload2: {},
		VANTIV_EPROTECT_URL: '',
		VANTIV_EPROTECT_JS_URL: '',
		VANTIV_PAYPAGE_ID: '',
		VANTIV_REPORT_GROUP: '',
		ALLOWED_HOST_NAMES: '',
		formEl: document.getElementById('form'),
		formId: $('#form'),
		paymentNumberField: $('#kkNumber'),
		documentHead: $('head'),
		stylesParam: '',
		encodedUrl: '',
		link: ''
	},
	init: function (variables) {

		//Set the variable definition
		$.extend(app.variables, variables);

		//Sets the default form height
		app.runiFrameHeight(0);
		app.checkiFrameWidth();
		$(window).resize(function () {
			app.checkiFrameWidth();
			app.runiFrameHeight(0);
		});

		//Set API URL
		app.variables.apiUrl = app.variables.konaKartURL + "konakartjson";

		//Mask Payment Number
		app.maskNumber();

		//Set Validation Messages
		app.setValidationMsgs();

		// On Form Button Click - send height to parent for dynamic iFrame
		$('.kk-button').off("click").on('click', function (e) {
			//Set Form Validation
			app.validateForm();
			if (app.variables.formId.valid()) {
				app.submtForm();
			}
			return false;
		});

		//Create the requestBody that sets up the configuration
		app.variables.requestBody = app.buildVantivEngineRequestBody();

		var vantivCall = app.callKonaKartEngineAPI(app.variables.requestBody);
		vantivCall.done(function (data) {
			//Loop thru result and set our app variables
			_.each(data, function (r) {
				app.variables.VANTIV_EPROTECT_URL = r.VANTIV_EPROTECT_URL;
				app.variables.VANTIV_EPROTECT_JS_URL = r.VANTIV_EPROTECT_JS_URL;
				app.variables.VANTIV_PAYPAGE_ID = r.VANTIV_PAYPAGE_ID;
				app.variables.VANTIV_REPORT_GROUP = r.VANTIV_REPORT_GROUP;
			});
			//Set Input Values to Store Config Values
			$('#kkPaypageUrl').val(app.variables.VANTIV_EPROTECT_URL);
			$('#kkPaypageId').val(app.variables.VANTIV_PAYPAGE_ID);
			$('#kkReportGroup').val(app.variables.VANTIV_REPORT_GROUP);
			$('<script src="' + app.variables.VANTIV_EPROTECT_JS_URL + '" type="text/javascript"></script>').insertAfter("form");
		});
	},
	maskNumber: function () {
		app.variables.paymentNumberField.mask('0000 0000 0000 0000');
	},
	validateForm: function () {
		app.variables.formId.validate({
			groups: {
				cardexpired: "kkExpiryMonth kkExpiryYear"
			},
			rules: {
				kkNumber: {
					required: true,
					creditcard: true
				},
				kkExpiryMonth: {
					required: true,
					digits: true,
					minlength: 2,
					maxlength: 2,
					monthLimit: true
				},
				kkExpiryYear: {
					required: true,
					digits: true,
					minlength: 2,
					maxlength: 2,
					notexpired: true
				},
				kkCvv: {
					required: true,
					digits: true,
					minlength: 3,
					maxlength: 3
				}
			},
			highlight: function (element, errorClass, validClass) {
				var reqElement = $(element).parent().children(".kk-required-icon");
				if (reqElement == null || reqElement.length == 0) {
					reqElement = $(element).parent().parent().children(".kk-required-icon");
				}
				if (reqElement != null) {
					reqElement.removeClass("kk-required-green").addClass("kk-required-blue");
				}
			},
			unhighlight: function (element, errorClass, validClass) {
				var reqElement = $(element).parent().children(".kk-required-icon");
				if (reqElement == null || reqElement.length == 0) {
					reqElement = $(element).parent().parent().children(".kk-required-icon");
				}
				if (reqElement != null) {
					reqElement.removeClass("kk-required-blue").addClass("kk-required-green");
				}
				//Re-Run to adjust for new iFrame height
				app.runiFrameHeight(0);
			},
			errorPlacement: function (error, element) {
				var val = error[0].innerHTML;
				if (val.length > 0) {
					var msgElement = element.parent().children(".kk-validation-msg");
					if (msgElement == null || msgElement.length == 0) {
						msgElement = element.parent().parent().children(".kk-validation-msg");
					}
					if (msgElement != null) {
						error.appendTo(msgElement);
					}
				}
				//Re-Run to adjust for new iFrame height
				app.runiFrameHeight(0);
			}
		});
		//Pulled from kk-formTiles.js
		$.validator.addMethod("notexpired", function () {
			var month = document.getElementById('kkExpiryMonth').value;
			var year = '20' + document.getElementById('kkExpiryYear').value;
			var expiry = new Date(year, month - 1, 1, 0, 0, 0, 0);
			var now = new Date();
			now.setDate(1);
			now.setHours(0, 0, 0, 0);
			var diff = now - expiry;
			return (diff <= 0);
		});
		$.validator.addMethod("monthLimit", function (value, element) {
			var myRegexp = /^(\d{2})(.*?)$/;
			var match = myRegexp.exec(value);
			var bValid;
			bValid = false;
			if (match[1] > 0 && match[1] < 13) {
				bValid = true;
			}
			return this.optional(element) || bValid;
		}, "Please enter a valid month");
	},
	setValidationMsgs: function () {
		// Set jquery validation messages
		$.validator.messages = {
			required: "Required field",
			creditcard: "Please enter a valid debit card number",
			digits: "Please enter only digits",
			expirydate: "Please specify a valid expiry date in the format MMYY",
			number: "Please enter a valid number",
			notexpired: "The card has expired",
			invalidmonth: "The card month is invalid"
		};
	},
	runiFrameHeight: function (delay) {
		//Dynamically pass the iFrame Height to the parent window for it to handle the setting
		setTimeout(function () {
			app.variables.formHeight = app.variables.formId.outerHeight() + 10; // Gets the form height and adds 10 to the value for a little extra padding
			app.variables.payload2 = {
				'type': 'iframeHeight',
				'bodyHeight': app.variables.formHeight + 'px'
			};
			var obj2 = JSON.parse(JSON.stringify(app.variables.payload2)); // creates json object and hands off to the parent via a post message
			window.parent.postMessage(obj2, "*");
		}, delay);
	},
	checkiFrameWidth: function () {
		//Dynamically check iFrame width
		app.variables.formWidth = app.variables.formId.outerWidth();
		if (app.variables.formWidth <= 357) {
			$(app.variables.formId).addClass('mobile-form');
		} else {
			$(app.variables.formId).removeClass('mobile-form');
		}
	},
	buildVantivEngineRequestBody: function (options) {
		var ret = {};
		var optionses = [];
		optionses.push({key: "VANTIV_EPROTECT_URL", type: "STRING"});
		optionses.push({key: "VANTIV_EPROTECT_JS_URL", type: "STRING"});
		optionses.push({key: "VANTIV_PAYPAGE_ID", type: "STRING"});
		optionses.push({key: "VANTIV_REPORT_GROUP", type: "STRING"});
		ret.optionses = optionses;
		ret.f = app.variables.apiCall;
		ret.s = app.variables.store;
		return ret;
	},
	buildConfigureEngineRequestBody: function (options) {
		var ret = {};
		var optionses = [];
		optionses.push({key: "ALLOWED_HOST_NAMES", type: "STRING"});
		ret.optionses = optionses;
		ret.f = app.variables.apiCall;
		ret.s = app.variables.store;
		return ret;
	},
	callKonaKartEngineAPI: function (data) {
		//Creates Ajax call to konakart
		return $.ajax({
			type: 'POST',
			timeout: '35000',
			scriptCharset: "utf-8",
			contentType: "application/json; charset=utf-8",
			url: app.variables.apiUrl,
			data: JSON.stringify(data),
			dataType: 'json'
		});
	},
	submtForm: function () {
		//Submits the form and handles processing with vantiv
		$('.kk-button').hide();
		$('.kk-button-loading').show();
		var litleRequest = {
			"paypageId": $("#kkPaypageId").val(),
			"reportGroup": $("#kkReportGroup").val(),
			"id": new Date().getTime(),
			"url": $("#kkPaypageUrl").val()
		};
		var formFields = {
			"accountNum": document.getElementById("kkNumber"),
			"cvv2": document.getElementById("kkCvv"),
			"paypageRegistrationId": document.getElementById("kkPaypageRegistrationId"),
			"bin": document.getElementById("kkBin")
		};
		app.variables.payload = {
			'type': 'iframeData',
			'expMonth': $('#kkExpiryMonth').val(),
			'expYear': $('#kkExpiryYear').val()
		};
		// Exchange payment details with Vantiv/Litle. Upon success, kkPaypageRegistrationId and kkBin will be populated.
		var LITLE_TIMEOUT = 15000;
		var resp;
		new LitlePayPage().sendToLitle(
			litleRequest,
			formFields,
			function (response) {
				app.variables.payload.resp = response.message;
				app.variables.payload.lastFour = response.lastFour;
				app.variables.payload.id = response.id;
				app.variables.payload.paypageRegistrationId = response.paypageRegistrationId;
				app.variables.payload.litleTxnId = response.litleTxnId;
				app.variables.payload.orderId = response.orderId;
				app.variables.payload.reportGroup = response.reportGroup;
				app.variables.payload.responseTime = response.responseTime;
				app.variables.payload.targetServer = response.targetServer;
				app.variables.payload.rtype = response.type;
				app.sendMessageToParent(app.variables.payload);
			},
			function (response) { // Error
				app.variables.payload.error = response;
				app.cleanForm();
				app.sendMessageToParent(app.variables.payload);
			},
			function () { // Timeout
				app.variables.payload.timeout = "timeout";
				app.cleanForm();
				app.sendMessageToParent(app.variables.payload);
			},
			LITLE_TIMEOUT
		);
		// Sets the return to false and prevents default click action (stops page jump)
		return false;
	},
	sendMessageToParent: function (payload) {
		var payloadObject = JSON.parse(JSON.stringify(payload));
		window.parent.postMessage(payloadObject, "*");
	},
	cleanForm: function () {
		$('#kkopc-continue-button').show();
		app.hideSpinningIcon();
		app.clearPaymentFormFields();
		app.runiFrameHeight(0);
	},
	hideSpinningIcon: function () {
		$('#kkopc-confirm-order-spinning-icon').hide();
	},
	clearPaymentFormFields: function () {
		app.variables.formId.find('div > div').each(function () {
			$(this).find('input').val('');
		});
	},
	getHostName: function (url) {
		var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
		if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
			return match[2];
		}
		else {
			return null;
		}
	},
	getDomain: function (url) {
		var domain = app.getHostName(url);
		if (domain != null) {
			var parts = domain.split('.').reverse();

			if (parts != null && parts.length > 1) {
				domain = parts[1] + '.' + parts[0];
			}
		}
		return domain;
	},
	changeCssLink: function (parentWindowEvent) {
		var url = parentWindowEvent.originalEvent.data.cssUrl;
		var iframeStyles = app.setupIframeStyles();

		if (!url) {
			iframeStyles.attr('href', iframeStyles.data('href'));
			return;
		}

		var hostname = app.getDomain(url);
		app.variables.domainBody = app.buildConfigureEngineRequestBody();
		var domains = app.callKonaKartEngineAPI(app.variables.domainBody);
		domains.done(function (data) {
            app.variables.ALLOWED_HOST_NAMES = data.split(',');
            if ($.inArray(hostname, app.variables.ALLOWED_HOST_NAMES) >= 0) {
                app.variables.encodedUrl = encodeURI(url);
                iframeStyles.attr('href', app.variables.encodedUrl);
            } else {
                throw {message: 'Invalid Iframe Styles URL received.'};
            }
		});
	},
	setupIframeStyles: function () {
		var iframeStyles = $('#iframe-styles-js');
		iframeStyles.on('load', function () {
			app.sendCSSEvent();
		});
		iframeStyles.on('error', function (error) {
			throw {message: 'Iframe Styles URL: “' + iframeStyles.attr('src') + '” could not be loaded.', error: error};
		});
		return iframeStyles;
	},
	sendCSSEvent: function () {
		app.runiFrameHeight(0);
		app.variables.payload2 = {
			'type': 'iframeStyles',
			'isIframeStylesLoaded': true
		};
		var obj2 = JSON.parse(JSON.stringify(app.variables.payload2)); // creates json object and hands off to the parent via a post message
		window.parent.postMessage(obj2, "*");
	}
};
// Let's instantiate your init function
$(document).ready(function () {
	app.init();
});
//Event Listener Function
$(window).off('message onmessage').on('message onmessage', function (e) {
	/*
	 * We can remove origin validation as long as it doesn't expose us to unneeded risk.  Here we are only cleaning
	 * the form.
	*/
	if (typeof e.originalEvent.data.response != "undefined") {
		switch (e.originalEvent.data.response) {
			case 'errorThrown':
				app.cleanForm();
				break;
			case 'customCss':
				app.changeCssLink(e);
				break;
		}
	}
});
