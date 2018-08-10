const WebDriver = require('selenium-webdriver')
const AxeBuilder = require('axe-webdriverjs')
const moment = require('moment')
const fs = require('fs');

class AxeCronos {
  constructor() {
    /** @public {string} */
    this.urlFileName = 'urls.json'

    /** @public {string} */
    this.resultsDir = 'axecronos-results'

    /** @public {array} */
    this.axeTags = ['wcag2a', 'wcag2aa', 'section508', 'best-practice']

    /** @private {string} */
    this.resultsDirDateTime_ = ''

    /** @private {string} */
    this.output_ = ''
  }

  /**
   * Validate the URLs through the Axe API using selenium webdriver.
   */
  start() {
    // Import array of URLs
    let urlsContent = fs.readFileSync(this.urlFileName, 'utf8');
    let urls = JSON.parse(urlsContent);

    // Make sure results directory exists.
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir);
    }

    // Make sure this specific results datetime directory exists.
    let datetime = moment().format('YYYY-MM-DDTHHmmss')
    this.resultsDirDateTime_ = this.resultsDir + '/' + datetime
    if (!fs.existsSync(this.resultsDirDateTime_)) {
      fs.mkdirSync(this.resultsDirDateTime_)
    }

    let driver = new WebDriver.Builder()
      .forBrowser('firefox')
      .build()

    urls.forEach((url, index) => {
      driver
        .get(url)
        .then(() => {

          AxeBuilder(driver)
            .withTags(this.axeTags)
            .analyze((results) => {

              // Save results to file.
              let dateTime = moment(results.timestamp);
              let fileName = 'axe-results_'
                + index + '_'
                + url.replace(/[^a-z0-9]/gi, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase() + '_'
                + dateTime.format('YYYY-MM-DDTHHmmss')
                + '.json'
              let jsonString = JSON.stringify(results, null, '  ')
              fs.writeFile(this.resultsDirDateTime_ + '/' + fileName, jsonString, 'utf8', (err) => {
                if (err) {
                  console.log('ERROR: ' . err)
                }
              });

              if (results.inapplicable.length > 0 || results.incomplete.length > 0 || results.violations.length > 0) {
                this.output_ += fileName
                this.output_ += ' | inapplicable ' + results.inapplicable.length
                this.output_ += ' | incomplete ' + results.incomplete.length
                this.output_ += ' | violations ' + results.violations.length
                this.output_ += ' | passes ' + results.passes.length
                this.output_ += '\n'
              }

              if (this.output_ === '') {
                this.output_ += fileName
                this.output_ += ' | SUCCESS | passes ' + results.passes.length
                this.output_ += '\n'
              }

              // Close the driver and output results at the end of the loop.
              if (index+1 === urls.length) {
                driver.quit()
                console.log(this.output_)
              }
            })

        }).catch ((err) => {
          console.log(err)
        })
    })
  }
}

exports.AxeCronos = AxeCronos
