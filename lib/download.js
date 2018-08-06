const dgr = require('download-git-repo');

const download = (source, target) => {
  return new Promise((res, rej) => {
    dgr(source, target, err => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
};

module.exports = download;
