import {decode} from './parser.js'
import {convert} from './converter.js'

let clickButton = document.getElementById('clickbutton')
clickButton.addEventListener('click', main, false)

function main() {
  let selectedFile = document.getElementById('inputopenvpn').files[0]
  let connName = document.getElementById('connname').value
  if (connName === '') {
    alert('Please specify a name for the connection.')
    return
  }
  console.log(selectedFile.size + ' bytes')
  let reader = new FileReader()
  // callback for when reader is done
  reader.onload = (e => {
    let content = e.target.result
    // remove windows-style newlines
    content = content.replace(/\r/g, '')
    let parsed = decode(content)
    console.log(parsed)
    let onc = convert(connName, parsed)
    let output = document.getElementById('output')
    output.value = JSON.stringify(onc, null, 2)
  });
  // start reading
  reader.readAsText(selectedFile)
}
