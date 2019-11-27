export interface IHttpResponse<T> extends Response {
    parsedBody?: T;
}

export const http = <T>(request: RequestInfo): Promise<IHttpResponse<T>> => {
    return new Promise((resolve, reject) => {
        let response: IHttpResponse<T>;
        fetch(request)
        .then(res => {
            response = res;
            return res.json();
        })
        .then(body => {
            if (response.ok) {
                response.parsedBody = body;
                resolve(response);
            } else {
                reject(response);
            }
        })
        .catch(err => {
            reject(err);
        });
    });
};
