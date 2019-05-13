# garmin-import
A tool for importing manual activities from csv-files to Garmin Connect.
This tool does not use any existing official Garmin API. Instead it uploads activities manually from the UI.
The tool is built with Node.js and Puppeteer and can be run headless or with a visible Chrome browser.

# Usage
* Run `npm install` to get all dependencies.
* Then start the import with: `node garmin-import.js -u garmin_username -p garmin_password -f /path/to/file.csv`
