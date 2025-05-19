export type Result<T, E> = [true, T] | [false, E];

type Option<T> = [true, T] | [false];

export interface Setup {
    digits: string;
    deviceType: string;
}

export interface TimeoutError {
    type: 'timeout';
}

export interface HttpError {
    type: 'http',
    response: Response,
}

export interface UnknownError {
    type: 'unknown';
    error: unknown
}

export type LockError = TimeoutError | HttpError | UnknownError;

export async function setup(url: string): Promise<Result<Setup, LockError>> {
    return await _fetch_loop(url, (status, value) => {
        switch (status) {
            case 'done':
                return [true, {digits: value.digits, deviceType: value.device_type}];
            default:
                return [false];
        }
    });
}

export interface Accepted {
    result: 'accepted';
    digits: string;
}

export interface Rejected {
    result: 'rejected';
}

export type Auth = Accepted | Rejected;

export async function auth(url: string): Promise<Result<Auth, LockError>> {
    return await _fetch_loop<Auth>(url, (status, value) => {
        switch (status) {
            case 'done':
                return [true, {result: 'accepted', digits: value.digits}];
            case 'rejected':
                return [true, {result: 'rejected'}];
            default:
                return [false];
        }
    });
}

async function _fetch_loop<T>(url: string, handler: (status: any, value: any) => Option<T>): Promise<Result<T, LockError>> {
    while (true) {
        const [ok, data] = await _fetch(url);
        if (!ok) {
            return [false, data];
        }
        const status = data.status;
        if (status === 'pending') {
            continue;
        }
        if (status === 'timeout') {
            return [false, {type: 'timeout'}];
        }
        const [isSome, value] = handler(status, data);
        if (!isSome) {
            return [false, {type: 'unknown', error: data}];
        }
        return [true, value];
    }
}

async function _fetch(url: string): Promise<Result<any, LockError>> {
    try {
        const response = await fetch(url);
        if (response.status !== 200) {
            return [false, {type: 'http', response}]
        }
        const data = await response.json();
        return [true, data];
    } catch (error) {
        return [false, {type: 'unknown', error}]
    }
}
