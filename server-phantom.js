/*global window, phantom */
var PATH_TO_AXE = 'node_modules/axe-core/axe.min.js';

var args = require('system').args;
var fs = require('fs');
var page = require('webpage').create();

if (args.length < 2) {
	console.log('axe-phantomjs.js accepts 1 argument, the URL to test');
	phantom.exit(1);
}

page.open(args[1], function (status) {
	// Check for page load success
	if (status !== 'success') {
		console.log('Unable to access network');
		return;
	}

	page.injectJs(PATH_TO_AXE);
	page.framesName.forEach(function (name) {
		page.switchToFrame(name);
		page.injectJs(PATH_TO_AXE);
	});
	page.switchToMainFrame();
	page.evaluateAsync(function () {
    // Configure axe to use specific rule sets.
    var options = {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "section508", "best-practice"]
      }
    }

		axe.run(document, options, function (err, results) {
			if (err)  {
				throw err;
      }
			window.callPhantom(results);
		});
	});

	page.onCallback = function (msg) {
		if (args[2]) {
      fs.write(args[2], JSON.stringify(msg, null, '  '), 'w');
    }
    else {
      // console.log(JSON.stringify(msg, null, '  '));

      var responseData = {}

      responseData['counts'] = {
        inapplicable: msg['inapplicable'].length,
        incomplete: msg['incomplete'].length,
        passes: msg['passes'].length,
        violations: msg['violations'].length
      }

           // if (msg['inapplicable'] !== undefined && msg['inapplicable'].length > 0) {
            // responseData['counts']['inapplicable'] = msg['inapplicable'].length
            // responseData['inapplicable'] = msg['inapplicable']
          // }
          // if (msg['incomplete'] !== undefined && msg['incomplete'].length > 0) {
          //   responseData['counts']['incomplete'] = msg['incomplete'].length
          //   responseData['incomplete'] = msg['incomplete']
          // }
          // if (msg['passes'] !== undefined && msg['passes'].length > 0) {
          //   responseData['counts']['passes'] = msg['passes'].length
          //   responseData['passes'] = msg['passes']
          // }
          // if (msg['violations'] !== undefined && msg['violations'].length > 0) {
          //   responseData['counts']['violations'] = msg['violations'].length
          //   responseData['violations'] = msg['violations']
          // }

      console.log(JSON.stringify(responseData))
      console.log(JSON.stringify(msg['violations']))
		}

    phantom.exit();
	};
});
