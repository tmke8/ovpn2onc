/**
 * Convert the parsed OpenVPN config to ONC.
 */

const oncBasics = {
  'Type': 'UnencryptedConfiguration',
  'Certificates': [],
  'NetworkConfigurations': []
}

export function convert(name, ovpn, keys) {
  if (!ovpn.client) {
    console.warn('Is this a server file?')
  }
  let params = {}

  // Add certificates
  let certs = []
  let [cas, caGuids] = createCerts(keys, ovpn['ca'], 'Authority')
  params['ServerCARefs'] = caGuids
  certs = certs.concat(cas)
  let [clientCerts, clientCertGuids] = createCerts(keys, ovpn['cert'], 'Client')
  if (clientCerts[0]) {
    params['ClientCertType'] = 'Ref'
    params['ClientCertRef'] = clientCertGuids[0]
    certs.push(clientCerts[0])
  } else {
    params['ClientCertType'] = 'None'
  }

  // Add parameters
  let remote = ovpn.remote.split(' ')
  const host = remote[0]
  if (remote[1]) params['Port'] = remote[1]
  if (ovpn['auth-user-pass']) params['UserAuthenticationType'] = 'Password'
  if (ovpn['comp-lzo'] && ovpn['comp-lzo'] !== 'no') {
    params['CompLZO'] = 'true'
  } else {
    params['CompLZO'] = 'false'
  }
  if (ovpn['persist-key']) params['SaveCredentials'] = true
  if (ovpn['tls-auth']) {
    let authKey = ovpn['tls-auth'].split(' ')
    params['TLSAuthContents'] = convertKey(keys[authKey[0]])
    if (authKey[1]) params['KeyDirection'] = authKey[1]
  }
  if (ovpn['verify-x509-name']) {
    params['VerifyX509'] = {
      'Name': ovpn['verify-x509-name']
    }
  }
  // set parameters if they exist in the ovpn config
  let conditionalSet = (ovpnName, oncName, type='str') => {
    if (ovpn[ovpnName]) {
      const raw = ovpn[ovpnName]
      let value
      switch (type) {
        case 'int':
          value = Number(raw)
          break
        default:
          value = raw
      }
      params[oncName] = value
    }
  }
  conditionalSet('port', 'Port', 'int')
  conditionalSet('proto', 'Proto')
  conditionalSet('key-direction', 'KeyDirection')
  conditionalSet('remote-cert-tls', 'RemoteCertTLS')
  conditionalSet('cipher', 'Cipher')
  conditionalSet('auth', 'Auth')
  conditionalSet('auth-retry', 'AuthRetry')
  conditionalSet('reneg-sec', 'RenegSec', 'int')

  // Put together network configuration
  let config = {
    'GUID': `{${uuidv4()}}`,
    'Name': name,
    'Type': 'VPN',
    'VPN': {
      'Type': 'OpenVPN',
      'Host': host,
      'OpenVPN': params
    }
  }

  // Put everything together
  let onc = Object.assign({}, oncBasics)  // create copy
  onc.NetworkConfigurations = [config]
  onc.Certificates = certs
  return onc
}

/**
 * Create UUID (from Stackoverflow).
 */
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

function convertKey(key) {
  let lines = key.split(/\n/g)
  let out = ''
  for (let line of lines) {
    // filter out empty lines and lines with comments
    if (!line || line.match(/^\s*[;#]/)) continue
    out += line + '\n'
  }
  return out
}

function extractCas(str) {
  let splits = str.replace(/\n/g, '').split('-----BEGIN CERTIFICATE-----')
  console.log(splits)
  let cas = []
  for (const s of splits) {
    if (s.includes('-----END CERTIFICATE-----')) {
      cas.push(s.split('-----END CERTIFICATE-----')[0])
    }
  }
  return cas
}

function createCerts(keys, certName, certType) {
  let certs = []
  let certGuids = []
  if (certName) {
    let rawCerts = extractCas(keys[certName])
    for (const cert of rawCerts) {
      const guid = `{${uuidv4()}}`
      certGuids.push(guid)
      certs.push({
        'GUID': guid,
        'Type': certType,
        'X509': cert
      })
    }
  }
  return [certs, certGuids]
}
