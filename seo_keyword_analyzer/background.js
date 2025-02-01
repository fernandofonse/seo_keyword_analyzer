const STOP_WORDS = new Set([
  'the','and','for','your','with','that','this','they','have','from',
  'are','was','you','how','when','what','which','their','will','not'
]);

function calculateDensity(content) {
  const words = content
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));

  const totalWords = words.length;
  if (totalWords === 0) return [];

  const frequencies = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(frequencies)
    .map(([word, count]) => ({
      word,
      density: ((count / totalWords) * 100).toFixed(2)
    }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 20);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SERP_DATA") {
    chrome.storage.local.set({
      serpData: request.data
    });
  }
  
  if (request.type === "GET_DENSITY") {
    chrome.storage.local.get(['serpData'], ({ serpData }) => {
      const densityData = serpData?.content ? calculateDensity(serpData.content) : [];
      sendResponse(densityData);
    });
    return true;
  }
});