const fs = require("fs");
const path = require("path");

const mergeJSON = (a, b) => {
  Object.keys(b).forEach(k => {
    if (a[k]) {
      if (Array.isArray(a[k])) {
        if (!Array.isArray(b[k])) {
          throw new Error(`${k} in two object has different type`);
        }
        a[k] = [...a[k], ...b[k]];
        return;
      } else if (typeof a[k] === "object") {
        if (typeof b[k] !== "object") {
          throw new Error(`${k} in two object has different type`);
        }
        a[k] = mergeJSON(a[k], b[k]);
        return;
      }
    }
    a[k] = b[k];
  });
  return a;
};

class EslintHandler {
  constructor(appDir, results) {
    this.baseDir = appDir;
    this.results = results;
  }
  renderTemplate() {
    fs.renameSync(
      path.join(__dirname, "./template/.eslintrc.js"),
      path.join(this.baseDir, ".eslintrc.js")
    );
  }
  configurePackage(pkg) {

    const _pkg = {
      dependencies: {
        "babel-eslint": "7.2.3",
        eslint: "4.10.0",
        "eslint-config-airbnb": "16.1.0",
        "eslint-config-prettier": "2.9.0",
        "eslint-config-react-app": "2.1.0",
        "eslint-import-resolver-webpack-alias": "0.1.0",
        "eslint-loader": "1.9.0",
        "eslint-plugin-flowtype": "2.39.1",
        "eslint-plugin-import": "2.8.0",
        "eslint-plugin-jsx-a11y": "5.1.1",
        "eslint-plugin-prettier": "2.6.0",
        "eslint-plugin-react": "7.4.0"
      },
      scripts: {
        lint: "eslint ./src/ --ext .js --ignore-path .gitignore "
      }
    };
    return mergeJSON(pkg, _pkg);
  }
  configureCompileInfo(config) {}
}

module.exports = EslintHandler;
