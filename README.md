# SOAP Component OIH

The **SOAP component** is a component that allows you to connect to any SOAP web service without programming your own components. It expects an input already in XML format, located on the `xmlString` property of the incoming message and returns the response in XML format. See "Configuration Examples" for an example input and output message.

The SOAP component will perform a single HTTP call when executed. Incoming message data gets used to configure the API call made. The response from the API call will be the output message.

This document covers the following topics: 

- [Configuration Fields](#configuration)
- [Authorization](#authorization)
- [Configuration Examples](#examples)

## Full List of Configuration Fields {#configuration}
The following is a complete list of configuration fields that are available on this component. 

- **`auth`** - If you are embedding authorization directly into the flow, instead of using the Secret Service, authorization configuration goes here. See "Direct Authorization"

- **`endpointUrl`** - A JSONata expression that executes against the message passed into the component to define the URL for the HTTP request. Hint: To hardcode a static URL, simply wrap it in single quotes to make it a basic JSONata expression

- **`soapAction`** - The action you would like to take on the SOAP web service. If provided, this action is automatically added to the SOAP envelope headers.

- **`httpHeaders`** - An array of objects with `key` and `value` as the only properties on each. `key` is used to store the header name and `value` its value

- **`soapHeaders`** - Any additional headers needed for your SOAP envelope go in this field. `soapHeaders` accepts an array of strings. 

## Authorization {#authorization}

To use the SOAP component with any restricted access API, provide the authorization credentials directly into the component or use the secret service to inject them into the request at runtime. 

The SOAP component supports 4 authorization types: 

- **`No Auth`** - Use this method to work with any open SOAP web service
- **`Basic Auth`** - Use this method to provide login credentials like username/password
- **`API Key Auth`** - Use this method to provide `API Key` to access the web service
- **`OAuth2`** - Use this method to provide `Oauth2` credentials to access the web service. 

### Direct Authorization
You can add the authorization method directly into the flow steps using the SOAP component. Authorization configuration is placed under a field called `auth`. The following fields are available under `auth`. 

- **`type`** - Must be one of `No Auth`, `Basic Auth`, or `API Key Auth`
- **`basic`** - `basic.username` and `basic.password` are where to store the credentials for performing basic authorization. Only use these if `type` is `Basic Auth` 
- **`apiKey`** - `apiKey.headername` defines an authorization header name and `apiKey.headerValue` defines the API key value. Only use if `type` is `API Key Auth`. Note: to define a bearer token, you can set `apiKey.headerValue` to `Bearer XXXXX`. 

### Secret Service Integration for Authorization 

To securely retrieve credentials from the secret service, ferryman will inject a secret object by specifying the `credential_id` at the top level of a component configuration in a flow. The `credential_id` should be a secret service ID. 

The secret service can currently support these secret types: 
- **SIMPLE** - Constains a `username` and `passphrase` and will be used for `Basic Auth`
- **MIXED** - The `payload` of this type is a stringified JSON object. The `payload` string is parsed into an object before being added to the component config object. Because of the flexible nature of this type a JSONata transformation config is provided `secretAuthTransform`. The output of this transformation will replace the `config.auth` configuration.  The `secretAuthTransform` will work for tranforming the data for other types but isn't necessary since the other secret types have well-defined structure.
- **API_KEY** - Contains a `key` and `headerName` and will be used for `API Key Auth`
- **OA1_TWO_LEGGED** - Contains `expiresAt`
- **OA1_THREE_LEGGED** - Contains `accessToken` which will be sent as a Bearer Token in the request header
- **OA2_AUTHORIZATION_CODE** - Contains `accessToken` which will be sent as a Bearer Token in the request header
- **SESSION_AUTH** - Contains `accessToken` which will be sent as a Bearer Token in the request header

## Configuration Examples 

### Basic POST Request

**Flow Step Configuration**
```json
{
    "id": "soap-example",
    "componentId": "XXXX",
    "name": "Soap Component Example",
    "function": "httpRequestAction",
    "credentials_id": "XXXX",
    "fields": {
        "endpointUrl": "'https://someserver.com/api/thing'",
        "soapAction": "getAllOrders",
        "soapHeaders": [
            "<m:Trans xmlns:m=\"https://www.w3schools.com/transaction/\">123</m:Trans>"
        ]
    }
}
```
**Incoming Message**
```json
{
    "xmlString": "<ExampleSoapBody><MustBeInXML></MustBeInXML></ExampleSoapBody>"
}
```
**Output Message** 
```json
{
    "data": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Body>\r\n    <m:WebServiceResponse xmlns:m=\"http://www.sample.com \">\r\n      <m:Result>five hundred </m:Result>\r\n    </m:WebServiceResponse>\r\n  </soap:Body>\r\n</soap:Envelope>"
}
```

## License 
&copy; Apache-2.0 &copy; [Blended Edge](https://www.blendededge.com)