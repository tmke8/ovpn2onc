/**
 * Convert the parsed OpenVPN config to ONC.
 */

const oncBasics = {
  'Type': 'UnencryptedConfiguration',
  'Certificates': [],
  'NetworkConfigurations': []
}

export function convert(name, ovpn) {
  if (!ovpn.client) {
    console.warn('Is this a server file?')
  }

  // Check parameters
  let params = {}
  let remote = ovpn.remote.split(' ')
  const host = remote[0]
  if (remote[1]) {
    params['Port'] = remote[1]
  }
  if (ovpn.proto) {
    params['Proto'] = ovpn.proto
  }
  if (ovpn['tls-auth']) {
    params['TLSAuthContents'] = convertKey(ovpn['tls-auth'])
  }

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
  let onc = Object.assign({}, oncBasics)  // create copy
  onc.NetworkConfigurations = [config]
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
  return key.replace(/\n/g, '\n') + '\n'
}
