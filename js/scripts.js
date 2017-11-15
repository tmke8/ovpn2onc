import {decode} from '/js/parser.js';
import {convert} from '/js/converter.js';

let clickButton = document.getElementById('clickbutton');
clickButton.addEventListener("click", main, false);

function main() {
  let selectedFile = document.getElementById('inputopenvpn').files[0];
  console.log(selectedFile.size + " bytes");
  let reader = new FileReader();
  reader.onload = (e => {
    let content = e.target.result;
    // remove windows-style newlines
    content = content.replace(/\r/g, "");
    let parsed = decode(content);
    console.log(parsed);
    let onc = convert(parsed);
    let output = document.getElementById('output');
    output.value = JSON.stringify(onc);
  });
  // start reading
  reader.readAsText(selectedFile);
}
