import {decode} from './parser.js'
import {convert} from './converter.js'

let clickButton = document.getElementById('clickbutton')
clickButton.addEventListener('click', handler, false)

function handler() {
  let selectedFile = document.getElementById('inputopenvpn').files[0]
  let certificates = document.getElementById('inputcertificates').files
  let connName = document.getElementById('connname').value
  let output = document.getElementById('output')
  main(connName, selectedFile, certificates, output)
}

async function main(connName, selectedFile, certificateFiles, output) {
  if (connName === '') {
    alert('Please specify a name for the connection.')
    return
  }
  console.log(selectedFile.size + ' bytes')
  let content = await readFile(selectedFile)
  let [ovpn, keys] = decode(content)
  console.log(ovpn)
  for (const certificateFile of certificateFiles) {
    keys[certificateFile.name] = await readFile(certificateFile)
  }
  let onc = convert(connName, ovpn, keys)
  output.value = JSON.stringify(onc, null, 2)
}

function readFile(file) {
  return new Promise(resolve => {
    let reader = new FileReader()
    reader.onload = (e => {
      // callback and remove windows-style newlines
      resolve(e.target.result.replace(/\r/g, ''))
    })
    // start reading
    reader.readAsText(file)
  })
}
