function addPositionNumbers() {
  const existingNumbers = document.querySelectorAll('.serp-position-number');
  if (existingNumbers.length > 0) return;

  function getDomain(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.hostname.replace('www.', '');
  }

  const results = Array.from(document.querySelectorAll('div.g, div.tF2Cxc'));
  const seenDomains = new Set();
  let position = 1;

  results.forEach(result => {
    if (result.closest('.related-question-pair, .ULSxyf, .MkXWrd')) return;

    const link = result.querySelector('a');
    if (!link) return;

    const url = link.getAttribute('href');
    if (!url || !url.startsWith('http')) return;

    const domain = getDomain(url);
    if (seenDomains.has(domain)) return;
    seenDomains.add(domain);

    const titleElement = result.querySelector('h3, .LC20lb, .DKV0Md');
    if (!titleElement) return;

    const positionElement = document.createElement('span');
    positionElement.className = 'serp-position-number';
    positionElement.textContent = `${position}. `;
    positionElement.style.cssText = `
      color: #1a0dab;
      font-weight: bold;
      margin-right: 8px;
      display: inline-block;
      min-width: 25px;
    `;

    titleElement.insertBefore(positionElement, titleElement.firstChild);
    position++;
  });
}

function removePositionNumbers() {
  document.querySelectorAll('.serp-position-number').forEach(el => el.remove());
}

chrome.storage.local.get(['showNumbers'], (result) => {
  if (result.showNumbers !== false) addPositionNumbers();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'TOGGLE_NUMBERS') {
    request.show ? addPositionNumbers() : removePositionNumbers();
  }
});

function collectSerpData() {
  function getDomain(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.hostname.replace('www.', '');
  }

  const results = Array.from(document.querySelectorAll('div.g, div.tF2Cxc'));
  const seenDomains = new Set();
  const organicResults = [];
  let position = 1;

  results.forEach(result => {
    if (result.closest('.related-question-pair, .ULSxyf, .MkXWrd')) return;

    const link = result.querySelector('a');
    if (!link) return;

    const url = link.getAttribute('href');
    if (!url || !url.startsWith('http')) return;

    const domain = getDomain(url);
    if (seenDomains.has(domain)) return;
    seenDomains.add(domain);

    const titleElement = result.querySelector('h3, .LC20lb, .DKV0Md');
    const title = titleElement?.textContent?.trim() || '';

    const descriptionElement = result.querySelector('.VwiC3b, .BNeawe, .aCOpRe, .MUxGbd');
    const description = descriptionElement?.textContent?.trim() || '';

    organicResults.push({
      position: position++,
      url,
      title,
      domain,
      description
    });
  });

  const content = organicResults
    .map(result => `${result.title} ${result.description}`.toLowerCase().replace(/[^\w\s]/g, ''))
    .join(' ');

  chrome.runtime.sendMessage({
    type: "SERP_DATA",
    data: {
      results: organicResults,
      content: content
    }
  });
}

window.addEventListener('load', collectSerpData);