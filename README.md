# 🚀 Azure pipelines promote artifact version build task

A plugin for azure devops build pipelines to allow the automatic promotion of packages as part of a build/release automation.

**Example yaml config**
```yaml
- task: promote-artifact-version@1
  inputs:
    packageName: '@donalfenwick/my-test-pkg'
    packageFeedName: 'df-package-feed'
    packageVersion: '1.0.0'
    viewName: 'Release'
```

## Building the project

Install npm packages
```
npm install
```

Build the task with webpack
```
npm run build
```

## Running the task localy

The task can be run localy but first you must set a few environment variables that would normally come from the azure devops environment.

### Populate inputs before running task
Set environment vars to simulate input from the YAML file
```
$env:INPUT_PACKAGENAME="@mypackage/packagename"
$env:INPUT_PACKAGEFEEDNAME="feedname"
$env:INPUT_PACKAGEVERSION="1.2.0"
$env:INPUT_VIEWNAME="Release"
```

Set an envionment variable for your personal access token (generated from the azure portal).
This is only required for running localy, a short lived token is automatically generated when running in the pipeline itself.

```
$env:ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN="<PAT>"
```

## Run the task
```
cd dist/promote-artifact-version
node ./index.js
```


### Generating a VISX package for upload to azure deops

**Increment version**
```
npm version {major/minor/patch}
```
**Create build with new version number**
```
npm run build
```
**Generate VISX package in the dist dir**
```
npm run package
```

