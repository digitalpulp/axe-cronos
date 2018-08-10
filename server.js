let WebDriver = require('selenium-webdriver')
let AxeBuilder = require('axe-webdriverjs')
let moment = require('moment')
let fs = require('fs');

let driver = new WebDriver.Builder()
  .forBrowser('firefox')
  .build()

// Import array of URLs
let urlsContent = fs.readFileSync(__dirname + '/urls.json', 'utf8');
let urls = JSON.parse(urlsContent);

// Make sure results directory exists.
let datetime = moment().format('YYYY-MM-DDTHHmmss')
let dir = './axe-results/' + datetime;
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

var output = '';

urls.forEach(function(url, index) {
  driver
    .get(url)
    .then(function () {

      AxeBuilder(driver)
        .withTags(['wcag2a', 'wcag2aa', 'section508', 'best-practice'])
        .analyze(function (results) {

          // Save results to file.
          let dateTime = moment(results.timestamp);
          let fileName = 'axe-results_'
            + index + '_'
            + url.replace(/[^a-z0-9]/gi, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase() + '_'
            + dateTime.format('YYYY-MM-DDTHHmmss')
            + '.json'
          let jsonString = JSON.stringify(results, null, '  ')
          fs.writeFile(dir + '/' + fileName, jsonString, 'utf8', (err) => {
            if (err) {
              console.log('ERROR: ' . err)
            }
          });

          if (results.inapplicable.length > 0 || results.incomplete.length > 0 || results.violations.length > 0) {
            output += fileName
            output += ' | inapplicable ' + results.inapplicable.length
            output += ' | incomplete ' + results.incomplete.length
            output += ' | violations ' + results.violations.length
            output += ' | passes ' + results.passes.length
            output += '\n'
          }

          if (output === '') {
            output += fileName
            output += ' | SUCCESS | passes ' + results.passes.length
            output += '\n'
          }

          // Close the driver and output results at the end of the loop.
          if (index+1 === urls.length) {
            driver.quit()
            console.log(output)
          }
        })

    }).catch ((err) => {
      console.log(err)
    })
})
