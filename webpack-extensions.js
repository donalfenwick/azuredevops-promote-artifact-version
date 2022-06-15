const path = require("path");
const npmPackageConfig = require('./package.json')
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");

// This helps in obtaining a timestamp based version string for local development.
const VersionStringReplacer = (dir, files) => {

    const version = npmPackageConfig.version;
    const versionComponents = version.split('.');
    const major =versionComponents[0];
    const minor =versionComponents[1];
    const patch =versionComponents[2];

    console.log(`Version: ${version} - major:${major},minor:${minor},patch:${patch}`);

    return new ReplaceInFileWebpackPlugin([
        {
            dir,
            files,
            rules: [
                {
                    search: /{{version}}/ig,
                    replace: version
                },
                {
                    search: /({{major}}|\"{{major}}\")/ig,
                    replace: major
                },
                {
                    search: /({{minor}}|\"{{minor}}\")/ig,
                    replace: minor
                },
                {
                    search: /({{patch}}|\"{{patch}}\")/ig,
                    replace: patch
                }
            ]
        }
    ]);
};

module.exports = {
    VersionStringReplacer
}