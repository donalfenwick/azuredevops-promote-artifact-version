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


### Task parameters

| Param name      | Required | Description                                                               |
|-----------------|----------|---------------------------------------------------------------------------|
| packageName     | Y        | The name of the package to be promoted                                    |
| packageFeedName | Y        | The name of the feed the package exists in (can be project or org scope)  |
| packageVersion  | Y        | The version of the package that should be promoted to the target view     |
| packageFeedName | Y        | The name of the view to promote the package to                            |
