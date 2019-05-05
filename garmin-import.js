const program = require('commander');
const actImp = require('./src/activity-importer.js');
const fileParse = require('./src/activity-file-parser.js');

// Command line parsing
program
  .version('1.0')
  .option('-u, --username, <username>', 'Garmin Connect username.')
  .option('-p, --password <password>', 'Garmin Connect password')
  .option('-f, --file <file>', 'Path to activity csv-file')
  .option('-b, --browser', 'Run in visible brower. Default is headless mode.')
  .parse(process.argv);
if (!program.username || !program.password || !program.file) {
  console.log('Missing parameters!');
  program.help();
  console.log('Example: node garmin-import.js -u myusername -p mypasswor -f /path/to/file.csv');
}

// Parse csv file
const activities = fileParse(program.file);

// Import activities
const activityImporter = new actImp.ActivityImporter(program.username, program.password, program.browser);
activityImporter.import(activities).then(_ => console.log('Finished!'));
