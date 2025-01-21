import * as task from 'azure-pipelines-task-lib/task';
import { IRestResponse, RestClient } from 'typed-rest-client';
import { BasicAuthHandler } from './auth/basic-auth-handler';

async function run() {
    try {
        const packageFeedName: string | undefined = task.getInput('packageFeedName', true);
        const packageName: string | undefined = task.getInput('packageName', true);
        const packageVersion: string | undefined = task.getInput('packageVersion', true)?.trim();
        const viewName: string | undefined = task.getInput('viewName', true);

        if (!packageFeedName || packageFeedName.trimEnd() == '') {
            task.setResult(task.TaskResult.Failed, 'A value for "packageFeedName" was not supplied');
            return;
        }
        if (!packageName || packageName.trimEnd() == '') {
            task.setResult(task.TaskResult.Failed, 'A value for "packageName" was not supplied');
            return;
        }
        if (!packageVersion || packageVersion.trimEnd() == '') {
            task.setResult(task.TaskResult.Failed, 'A value for "packageVersion" was not supplied');
            return;
        }
        if (!viewName || viewName.trimEnd() == '') {
            task.setResult(task.TaskResult.Failed, 'A value for "viewName" was not supplied');
            return;
        }

        const tfsServiceUri = task.getVariable('system.TeamFoundationServerUri');
        var uri = new URL(tfsServiceUri);
       
        const hostName = uri.hostname;
        let devopsOrgAccountName = '';
        
        let useNewUrlFormat = false;

        let feedsApiBaseUrl = '';
        let packagesApiBaseUrl = '';

        if ((hostName === "dev.azure.com") || (hostName === "vsdev.azure.com")) {
            // new style
            useNewUrlFormat = true;
            const pathSegments = uri.pathname.replace(/^\/|\/$/g, '').split('/')
            devopsOrgAccountName = pathSegments[0]; // https://dev.azure.com/myorg will get the value "myorg"
            
            feedsApiBaseUrl = 'https://feeds.dev.azure.com';
            packagesApiBaseUrl = 'https://pkgs.dev.azure.com';

        } else if (hostName.endsWith("visualstudio.com")) {
            // old style
            useNewUrlFormat = false;
            devopsOrgAccountName = hostName.split('.')[0] // First subdomain of hostname

            feedsApiBaseUrl = `https://${devopsOrgAccountName}.feeds.visualstudio.com`;
            packagesApiBaseUrl = `https://${devopsOrgAccountName}.pkgs.visualstudio.com`;
        } else {		
            task.setResult(task.TaskResult.Failed, `Unsupported domain type for domain "${hostName}"`);
            return;
        }

        // setup a HTTP client for accessing the feed api
        let feedsApiHttpClient: RestClient = new RestClient('feeds-client', feedsApiBaseUrl, [new BasicAuthHandler()]);
        
        let urlPrefixSegment = (useNewUrlFormat === true) ? devopsOrgAccountName : 'DefaultCollection';
        // call the API to get all feeds in the org to search for the feed ID
        let feedUrl = `/${urlPrefixSegment}/_apis/packaging/feeds`;
        let feedResponse: IRestResponse<ApiResults<PackageFeedRef>> = await feedsApiHttpClient.get<ApiResults<PackageFeedRef>>(feedUrl);
        if(feedResponse.statusCode !== 200 || !feedResponse.result){
            task.setResult(task.TaskResult.Failed, `Package feed with name "${packageFeedName}" was not found`);
            return;
        }
        const packageFeed = feedResponse.result.value.find(x => x.name === packageFeedName);;
        if(!packageFeed){
            task.setResult(task.TaskResult.Failed, `Package feed with name "${packageFeedName}" was not found`);
            return;
        }
        // if the discovered feed is project specific then the prefix becomes a combination of the org and the project id
        if(packageFeed.project){
            urlPrefixSegment += `/${packageFeed.project.id}`;
        }

        let feedViewUrl = `/${urlPrefixSegment}/_apis/packaging/feeds/${packageFeedName}/views/${viewName}`;
        let feedViewResponse: IRestResponse<PackageFeedRef> = await feedsApiHttpClient.get<PackageFeedRef>(feedViewUrl);
        if(feedViewResponse.statusCode !== 200 || !feedViewResponse.result){
            task.setResult(task.TaskResult.Failed, `A view with the name "${viewName}" was not found in feed "${packageFeedName}"`);
            return;
        }
        const packageFeedView = feedViewResponse.result;

        // find the package in the feed to get its packageId guid
        const packagesUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/Packages?packageNameQuery=${packageName}`;
        let pkgsResponse: IRestResponse<ApiResults<ApiResultBase>> = await feedsApiHttpClient.get<ApiResults<ApiResultBase>>(packagesUrl);
        var pkgResult = pkgsResponse.result.value.find(x => x.name === packageName);
        if(!pkgResult){
            task.setResult(task.TaskResult.Failed, `Package with name "${packageName}" was not found within the feed "${packageFeedName}"`);
            return;
        }
        // now get the package again by URL as the get package detail endpoint is the only one that returns the protocolType for the package
        let pkgDetailResponse: IRestResponse<PackageRef> = await feedsApiHttpClient.get<PackageRef>(pkgResult.url);
        const pkg = pkgDetailResponse.result;
        if(!pkg){
            task.setResult(task.TaskResult.Failed, `Package with name "${packageName}" was not found within the feed "${packageFeedName}"`);
            return;
        }

        var pkgVersionsUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/Packages/${pkg.id}/Versions`;
        let pkgVersionsResponse: IRestResponse<ApiResults<PackageVersionRef>> = await feedsApiHttpClient.get<ApiResults<PackageVersionRef>>(pkgVersionsUrl);
        var pkgVersion = pkgVersionsResponse.result.value.find(x => x.version === packageVersion);
        if(!pkgVersion){
            task.setResult(task.TaskResult.Failed, `Package version ${packageVersion} was not found for package ${packageName} in the feed ${packageFeedName}`);
            return;
        }
        
        // setup a HTTP client for accessing the feed api
        let packagesApiHttpClient: RestClient = new RestClient('packages-client', packagesApiBaseUrl, [new BasicAuthHandler()]);
        let updateUrl = '';
        const feedType = pkg.protocolType.toLocaleLowerCase();
        switch(feedType) {
            case 'npm': 
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/${feedType}/${pkg.name}/versions/${pkgVersion.version}?api-version=5.0-preview.1`;
                break;
            case 'nuget': 
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/${feedType}/packages/${pkg.name}/versions/${pkgVersion.version}?api-version=5.0-preview.1`;
                break;
            case 'upack': 
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/${feedType}/packages/${pkg.name}/versions/${pkgVersion.version}?api-version=5.0-preview.1`;
                break;
            case 'pypi': 
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/${feedType}/packages/${pkg.name}/versions/${pkgVersion.version}?api-version=5.0-preview.1`;
                break;
            case 'maven':
                let groupId = pkg.name.split(':')[0]
                let artifactId = pkg.name.split(':')[1]
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/maven/groups/${groupId}/artifacts/${artifactId}/versions/${pkgVersion.version}?api-version=5.0-preview.1`
                break;
            default: 
                updateUrl = `/${urlPrefixSegment}/_apis/Packaging/Feeds/${packageFeed.id}/${feedType}/packages/${pkg.name}/versions/${pkgVersion.version}?api-version=5.0-preview.1`;
        }

        var body = {
            views: {
                op: "add",
                path: "/views/-",
                value: packageFeedView.id
            }
        };
        let updatePackageResponse: IRestResponse<ApiResults<PackageVersionRef>> = await packagesApiHttpClient.update(updateUrl, body);

        if(updatePackageResponse.statusCode === 200 || updatePackageResponse.statusCode === 202){
            task.setResult(task.TaskResult.Succeeded, `Package promotion succeeded`);
            return;
        }else {
            task.setResult(task.TaskResult.Failed, `Package promotion request failed`);
            console.error(updatePackageResponse.statusCode, updatePackageResponse.result);
            return;
        }
    }
    catch (err:any) {
        task.setResult(task.TaskResult.Failed, err.message);
    }
}

run();

export interface ApiResults<T>{
    count: number;
    value: T[];
}
export interface ApiResultBase{
    id: string;
    name: string;
    description: string;
    url: string;
}
export interface PackageRef extends ApiResultBase {
    protocolType: string;
}
export interface PackageFeedRef  extends ApiResultBase {
    project?: ProjectRef;
}
export interface ProjectRef{
    id: string;
    name: string;
    visibility: string;
}
export interface PackageVersionRef  extends ApiResultBase {
    version: string;
    normalizedVersion: string;
    isLatest: boolean;
    isListed: boolean;
    views: any[];
}


