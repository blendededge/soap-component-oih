export function createSoapEnvelope(input: string, action?: string, headers?: Array<string>): string {
    let soapHeaders;
    if (headers) {
      soapHeaders = generateSoapHeaders(headers)
    }

    return `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <soap:Header>
    ${action ? `<SOAPAction>${action}</SOAPAction>` : ''}
    ${soapHeaders ? soapHeaders : ''}
    </soap:Header>
    <soap:Body>${input}</soap:Body>
    </soap:Envelope>`;
  }

  export function generateSoapHeaders(headers: Array<string>): string {
    return headers.reduce((headerString, currentHeader) => {
        return currentHeader + headerString
    }, '');
  }