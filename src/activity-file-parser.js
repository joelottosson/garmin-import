const fs = require('fs');

const parseCsvFile = function (path) {
  const csv = fs.readFileSync(path, 'utf8');
  const lines = csv.split('\n');
  return lines.map(line => {
    const tokens = line.split(';');
    if (tokens.length < 2) {
      return null;
    }
    return {
      name: tokens[0],
      type: tokens[1],
      dateTime: new Date(tokens[2]),
      duration: Number(tokens[3]),
      distance: Number(tokens[4]),
      note: tokens[5]
    }
  }).filter(a => a !== null);
};

module.exports = parseCsvFile;