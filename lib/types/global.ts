export type GenericObject = Record<string, unknown>;

export interface Message {
    id: string,
    attachments: GenericObject,
    data?: GenericObject,
    headers: GenericObject,
    metadata: GenericObject,
    body?: GenericObject
}

export interface Config {
    endpointUrl: string,
    soapAction?: string,
    soapHeaders?: Array<string>,
    httpHeaders?: Array<Headers>,
    auth?: Auth,
    username?: string,
    passphrase?: string,
    key?: string,
    headerName?: string,
    accessToken?: string,
    secretAuthTransform?: string
    dontThrowErrorFlag?: string
    namespaces?: Namespace[];
    saveReceivedData?: boolean
}

export interface Namespace {
    name: string;
    url: string;
}

export interface Headers {
    key?: string,
    value?: string
}

export interface Auth {
    type?: string,
    basic?: Basic,
    apiKey?: ApiKey
    oauth2?: OAuth2
}

export interface Basic {
    username: string,
    password: string
}

export interface ApiKey {
    headerName: string,
    headerValue: string
}

export interface OAuth2 {
    keys: OAuth2Keys
}

export interface OAuth2Keys {
    access_token: string
}

export enum AuthTypes {
    NO_AUTH = 'No Auth',
    BASIC = 'Basic Auth',
    API_KEY = 'API Key Auth',
    OAUTH2 = 'OAuth2'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Self = any;