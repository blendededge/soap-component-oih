export type GenericObject = Record<string, unknown>;

export interface Message {
    id: string,
    attachments: GenericObject,
    data: GenericObject,
    headers: GenericObject,
    metadata: GenericObject,
}

export interface Config {
    endpointUrl: string,
    soapAction: string,
    auth?: Auth,
    username?: string,
    passphrase?: string,
    key?: string,
    headerName?: string,
    accessToken?: string,
    secretAuthTransform?: string
}

export interface Auth {
    type?: string,
    basic?: Basic | GenericObject,
    apiKey?: ApiKey | GenericObject,
    oauth2?: OAuth2 | GenericObject
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

// export type OAuth2Keys = { access_token: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Self = any;