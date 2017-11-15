export function decode (str) {
  let out = {}
  const re = /^([^ ]+)( (.*))?$/i
  const xmlOpen = /^<([^\/].*)>$/i
  const xmlClose = /^<\/(.*)>$/i
  let xmlTag = ''
  let inXml = false
  let xmlContent = ''
  let lines = str.split(/[\r\n]+/g)

  for (let line of lines) {
    if (!line || line.match(/^\s*[;#]/)) continue
    if (inXml) {
      const xmlMatch = line.match(xmlClose)
      if (!xmlMatch) {
        xmlContent += line + '\n'
        continue
      }
      const tag = xmlMatch[1]
      if (tag !== xmlTag) {
        throw 'bad xml tag'
      }
      const key = unsafe(xmlTag)
      const value = unsafe(xmlContent)
      out[key] = value
      xmlContent = ''
      inXml = false
      continue
    }
    const xmlMatch = line.match(xmlOpen)
    if (xmlMatch) {
      inXml = true
      xmlTag = xmlMatch[1]
      continue
    }
    const match = line.match(re)
    if (!match) continue
    const key = unsafe(match[1])
    const value = match[2] ? unsafe((match[3] || '')) : true
    out[key] = value
  }

  return out
}

function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

function unsafe (val, doUnesc) {
  val = (val || '').trim()
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2)
    }
    try { val = JSON.parse(val) } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false
    var unesc = ''
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i)
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c
        } else {
          unesc += '\\' + c
        }
        esc = false
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true
      } else {
        unesc += c
      }
    }
    if (esc) {
      unesc += '\\'
    }
    return unesc
  }
  return val
}
