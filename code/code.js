/**
 * La función almacenará en un Array las keywords de la tabla de GSC
 * @returns Array de keywords
 */
function getKeywordsFromTable() {
  // Array donde guardaremos las keywords
  const arr = [];
  // Seleccionar tabla de GSC
  // Encontramos varias tablas con la misma clase
  const oTable = document.querySelector('.i3WFpf');
  // Seleccionar filas de la tabla
  const rowLength = oTable.rows.length;

  // Iteración por las filas de la tabla
  for (i = 1; i < rowLength; i++) {
    // Seleccionamos las celdas de cada fila
    var oCells = oTable.rows.item(i).cells;
    // Seleccionamos la primera celda y hacemos push en el Array de keywords
    arr.push(oCells.item(0).innerText.replace(/"|&/g, ''));
  }
  return arr;
}

/**
 * La función delvolverá un objeto con los volúmenes de búsqueda de las keywords extraidas en la función getKeywords()
 * @param {*} chunk 
 * @param {string} urlRequest 
 * @returns Object
 */
async function getSearchVolume(chunk, urlRequest) {
  const response = await fetch(urlRequest); // Petición
  const json = await response.json(); // Transformamos los datos en un JSON
  // Iteramos los el JSON y devolvemos un Array con los volúmenes de búsqueda
  const keywords = {};
  for (i = 0; i < chunk.length; i++) {
    // Sí la keyword tiene datos, guardamos sus datos, si no delvolvemos un 0 (operador de encadenamiento opcional (?.) + Operador de fusión nulo (??))
    keywords[chunk[i]] = json[chunk[i]]?.search_volume ?? 0;
  }
  return keywords;
}

/**
 * Función para dividir un Array en X Arrays
 * @see Source: https://ourcodeworld.com/articles/read/278/how-to-split-an-array-into-chunks-of-the-same-size-easily-in-javascript
 * @param {Array} myArray Array con todas las completo
 * @param {Number} chunkSize Número de veces en el que se quiere dividir
 * @returns Array con sub arrays
 */
function chunkArray(myArray, chunkSize) {
  const arrayLength = myArray.length; // Número de elementos del Array padre
  const tempArray = []; // Array que almacenará todas las divisiones del Array padre

  for (i = 0; i < arrayLength; i += chunkSize) {
    const myChunk = myArray.slice(i, i + chunkSize);
    tempArray.push(myChunk);
  }

  return tempArray;
}

/**
 * Generar URLs para los diferentes Arrays de keywords
 * @param {Array} chunks 
 * @param {String} country 
 * @returns Array
 */
function generateUrls(chunks, country) {
  const arr = [];

  // Iteración de los arrays para generar URL con las keywords a solicitar
  for (i = 0; i < chunks.length; i++) {
    const url = `https://db2.keywordsur.fr/keyword_surfer_keywords?country=${country}&keywords=[%22${chunks[i].join('%22,%22')}%22]`;
    arr.push(url);
  }
  return arr;
}

/**
 * 
 * @param {String} country 
 * @returns Object
 */
async function getData(country) {
  const kws = getKeywordsFromTable(); // Todas las keywords de GSC
  const chunks = chunkArray(kws, 50); // Dividir Array en X arrays de 50 items
  const urls = generateUrls(chunks, country); // Construir URLs
  const allKeywords = {}; // Objeto para almacenar el resultado

  // Iteración de URLs y solicitud de volúmenes de búsqueda
  for (let i = 0; i < urls.length; i++) {
    var sv = await getSearchVolume(chunks[i], urls[i]);
    var keys = Object.keys(sv);

    for (let y = 0; y < keys.length; y++) {
      allKeywords[Object.keys(sv)[y]] = sv[Object.keys(sv)[y]];
    }
  }

  return allKeywords;
}

function createCell(text, rowHeader) {
  if (rowHeader) {
    const newChild = rowHeader.lastElementChild.cloneNode(true);
    newChild.style.display = 'block';
    newChild.dataset.sortlabel = 5;
    newChild.dataset.columnToggleLabel = 'SV'
    newChild.querySelector('.npD1Gc').innerText = 'Search Volumes'

    return rowHeader.appendChild(newChild);
  }
  // Creamos la celda donde incluiremos el volumen de búsqueda
  const cell = document.createElement('td');
  cell.classList = 'XgRaPc QNcORc HSWdnb ulSJec XL1mme';
  cell.style = 'font-size:12px;font-weight:bold;text-align:center;padding:18px 28px;display:block;';
  cell.dataset['columnToggleLabel'] = 'SV';
  cell.dataset['numericValue'] = text;
  const cellText = document.createTextNode(text);
  cell.appendChild(cellText);

  return cell;
}

function createDownloadButton(file) {
  // Select parent div
  const parent = document.querySelector('.sVgexf');
  // Create div
  const div = document.createElement('div');
  div.setAttribute('style', 'font-weight: bold;margin:5px');

  const button = document.createElement('a');
  const buttonText = document.createTextNode(
    'Download Performance + Search Volume'
  );
  button.setAttribute('class', 'gIhoZ');
  button.setAttribute(
    'style',
    'padding: 10px;background-color: #f5f5f5;border-radius: 5px;'
  );

  // Credit to isherwood & Default (https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side)
  button.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURI(file));
  button.setAttribute('download', 'gsc_volumes_data.csv');

  button.appendChild(buttonText);
  div.appendChild(button);
  parent.appendChild(div);

  return `Downloading all data + volumes to CSV...`;
}

async function addVolumes(country) {
  const volumes = await getData(country); // Wait to get hasmap of search volumes
  const tbl = document.querySelector('.i3WFpf'); // Selector de la tabla
  // Future CSV
  let csvExport = '';

  // Loop through rows
  for (let i in tbl.rows) {
    // For some reason there is an undefined row at the end
    if (i === 'length') {
      break;
    }

    // Variable de fila
    let row = tbl.rows[i];
    // Creación de línea para CSV
    const line = [];
    // Variable de primera fila (query)
    const query = row.cells[0].textContent;

    // Añadir cabecera
    if (i === '0') {
      const cabecera = createCell('Search Volumes', row)
      row.appendChild(cabecera);
      continue;
    }

    // Añadir a la fila el volumen de búsqueda
    row.appendChild(createCell(volumes[query] !== undefined ? volumes[query] : 0));

    // Loop through cells
    for (const cell of row.cells) {
      const text = cell.textContent;
      line.push(text.replace(/,/g, ''));
    }

    // Create each filled line for future CSV
    csvExport = csvExport.concat(line.join(','), '\n');
  }

  createDownloadButton(csvExport);
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  document.body.appendChild(div);

  return div;
}


async function runSv() {
  // Extraer país para consultar los volúmenes de búsqueda
  chrome.storage.local.get('country', async (savedOption) => {
    // Usaremos "España" ('es') por defecto si el usuario no seleccionó ninguno.
    const country = savedOption.country || 'es';
    console.log(`Getting Search Volume from country "${country}"...`);

    // Establecemos políticas de GCP
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      window.trustedTypes.createPolicy('default', {
        createHTML: (string, sink) => string
      });
    }

    const html = `
    <div>
      <style>
          .fondo-negro {
              position: absolute;
              width: 100%;
              height: 100vh;
              top: 0;
              left: 0;
              z-index: 9;
              background-color: #00000069;
              display: flex;
              justify-content: center;
              align-items: center;
          }
      </style>
      <div class="fondo-negro">
          <img src="https://c.tenor.com/XK37GfbV0g8AAAAi/loading-cargando.gif" alt="Cargando gif">
      </div>
    </div>`;

    const over = createElementFromHTML(html);
    await addVolumes(country);

    over.remove()
  });
}

runSv();