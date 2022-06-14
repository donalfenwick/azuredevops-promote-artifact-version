import * as tl from 'azure-pipelines-task-lib/task';
import { IHttpClient, IHttpClientResponse, IRequestHandler, IRequestInfo } from 'typed-rest-client/Interfaces';

export class BasicAuthHandler implements IRequestHandler{
    prepareRequest(options:any): void {
        let personalAccessToken = tl.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false);
        options.headers['Authorization'] = `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`;
    }

    // This handler cannot handle 401
    canHandleAuthentication(response: IHttpClientResponse): boolean {
        return false;
    }

    handleAuthentication(httpClient: IHttpClient, requestInfo: IRequestInfo, objs:any): Promise<IHttpClientResponse> {
        return Promise.resolve(null as unknown as IHttpClientResponse);
    }

}