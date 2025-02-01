document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const domainInput = document.getElementById("domain");
  const savedWebsitesDropdown = document.getElementById("saved-websites");
  const saveButton = document.getElementById("save-website");
  const checkButton = document.getElementById("check-rank");
  const resultDiv = document.getElementById("result");
  const serpPreviewDiv = document.getElementById("serp-preview");
  const competitorsDiv = document.getElementById("competitors");
  const paaDiv = document.getElementById("people-also-ask");
  const toggleButton = document.getElementById("toggleNumbers");

  const loadSavedWebsites = () => {
    const savedWebsites = JSON.parse(localStorage.getItem("savedWebsites") || "[]");
    savedWebsitesDropdown.innerHTML = "<option value=''>Select a saved website</option>";
    savedWebsites.forEach(site => {
      const option = document.createElement("option");
      option.value = site;
      option.textContent = site;
      savedWebsitesDropdown.appendChild(option);
    });
  };

  saveButton.addEventListener("click", () => {
    const domain = domainInput.value.trim();
    if (!domain) return alert("Please enter a domain");
    
    const savedWebsites = JSON.parse(localStorage.getItem("savedWebsites") || "[]");
    if (!savedWebsites.includes(domain)) {
      savedWebsites.push(domain);
      localStorage.setItem("savedWebsites", JSON.stringify(savedWebsites));
      loadSavedWebsites();
    }
  });

  checkButton.addEventListener("click", () => {
    const domain = domainInput.value.trim() || savedWebsitesDropdown.value;
    if (!domain) return alert("Please enter/select a domain");

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (domain) => {
          function getDomain(url) {
            const a = document.createElement('a');
            a.href = url;
            return a.hostname.replace('www.', '');
          }

          const results = Array.from(document.querySelectorAll('div.g, div.tF2Cxc'));
          let position = 0;
          let found = false;
          const competitors = [];
          let yourWebsite = null;
          const peopleAlsoAsk = [];
          const seenDomains = new Set();

          results.forEach((result) => {
            if (result.closest('.related-question-pair, .ULSxyf, .MkXWrd')) return;

            const link = result.querySelector('a');
            if (!link) return;

            const url = link.getAttribute('href');
            if (!url || !url.startsWith('http')) return;

            const currentDomain = getDomain(url);
            if (seenDomains.has(currentDomain)) return;
            seenDomains.add(currentDomain);

            const titleElement = result.querySelector('h3, .LC20lb, .DKV0Md');
            const title = titleElement?.textContent?.trim() || '';

            const descriptionElement = result.querySelector('.VwiC3b, .BNeawe, .aCOpRe, .MUxGbd');
            const description = descriptionElement?.textContent?.trim() || '';

            const actualPosition = seenDomains.size;

            if (currentDomain.includes(domain) && !found) {
              position = actualPosition;
              found = true;
              yourWebsite = { title, domain: currentDomain, url, description };
            } else if (competitors.length < 3) {
              competitors.push({ title, domain: currentDomain, url, description });
            }
          });

          document.querySelectorAll('.related-question-pair').forEach((item) => {
            const question = item.querySelector('span')?.textContent?.trim();
            if (question) peopleAlsoAsk.push(question);
          });

          return { found, position, competitors, yourWebsite, peopleAlsoAsk };
        },
        args: [domain],
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        const { found, position, competitors, yourWebsite, peopleAlsoAsk } = results[0].result;
        
        resultDiv.classList.toggle('hidden', !found);
        serpPreviewDiv.classList.toggle('hidden', !found);
        competitorsDiv.classList.toggle('hidden', competitors.length === 0);
        paaDiv.classList.toggle('hidden', peopleAlsoAsk.length === 0);

        if (found) {
          resultDiv.innerHTML = `<strong>Position:</strong> #${position}`;
          serpPreviewDiv.innerHTML = `
            <a href="${yourWebsite.url}" class="competitor-title" target="_blank">${yourWebsite.title}</a>
            <div class="competitor-domain">${yourWebsite.domain}</div>
            <p class="competitor-description">${yourWebsite.description}</p>
          `;
          serpPreviewDiv.classList.add('my-website');
        }

        competitorsDiv.innerHTML = competitors.map(comp => `
          <div class="competitor">
            <a href="${comp.url}" class="competitor-title" target="_blank">${comp.title}</a>
            <div class="competitor-domain">${comp.domain}</div>
            <p class="competitor-description">${comp.description}</p>
          </div>
        `).join("");

        paaDiv.innerHTML = peopleAlsoAsk.length ? `
          <h3>People also ask</h3>
          ${peopleAlsoAsk.map(question => `<div>${question}</div>`).join("")}
        ` : '';
      });
    });
  });

  chrome.storage.local.get(['showNumbers'], (result) => {
    const showNumbers = result.showNumbers !== false;
    toggleButton.textContent = showNumbers ? 'Hide Position Numbers' : 'Show Position Numbers';
  });

  toggleButton.addEventListener('click', () => {
    chrome.storage.local.get(['showNumbers'], (result) => {
      const newState = !(result.showNumbers !== false);
      chrome.storage.local.set({ showNumbers: newState });
      toggleButton.textContent = newState ? 'Hide Position Numbers' : 'Show Position Numbers';
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_NUMBERS',
          show: newState
        });
      });
    });
  });

  loadSavedWebsites();
});

document.addEventListener('DOMContentLoaded', () => {
  const densityResults = document.getElementById('density-results');
  
  document.querySelector('[data-tab="keyword-density"]').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "GET_DENSITY" }, densityData => {
      densityResults.innerHTML = densityData.length ? densityData.map(item => `
        <div class="density-item">
          <span>${item.word}</span>
          <span class="density-value">${item.density}%</span>
        </div>
      `).join('') : '<div class="density-item">No keywords found. Perform a search first.</div>';
    });
  });
});