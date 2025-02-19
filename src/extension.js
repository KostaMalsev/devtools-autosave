// Creates a new panel in the Chrome DevTools with the specified title, icon, and HTML file.
chrome.devtools.panels.create('Autosave', 'icon.png', 'panel.html', (panel) => {
  
  // Listens for the panel to be shown and sets a storage value to mark the tab change.
  panel.onShown.addListener(() => {
    
    // re-render saved resources whenever the panel is shown (see panel.js)

    chrome.storage.local.set({ "tabChangePing": Date.now() });
    
  });
  
});

// Script to be injected into the inspected window to handle resource saving.
const resourceSaverScript = `

__DevToolsAutosaveResourceSaver__ = new class __DevToolsAutosaveResourceSaver__ {
  
  // Key for storing saved resources in local storage.
  localStorageKey = '__devToolsAutosaveSavedResources__';
  
  // Key for storing the page HTML in saved resources.
  pageHTMLKey = '__pageHTML__';
  
  
  // Retrieves saved resources from local storage.
  getSavedResources() {
    
    const data = localStorage[this.localStorageKey];
    
    if (!data) return {};
    
    return JSON.parse(data);
    
  }
  
  // Saves resources to local storage.
  saveSavedResources(data) {
    localStorage[this.localStorageKey] = JSON.stringify(data);
  }
  
  
  // Saves a single resource to the saved resources.
  saveResource(resource) {
    
    let savedResources = this.getSavedResources();
    
    
    let key = resource.url;
    
    if (key === this.pageHTMLKey) key += '_';
    
    
    savedResources[key] = resource;
    
    this.saveSavedResources(savedResources);
    
  }
  
  // Saves the page HTML to the saved resources.
  savePageHTML(html) {
    
    let savedResources = this.getSavedResources();
    
    savedResources[this.pageHTMLKey] = html;
    
    this.saveSavedResources(savedResources);
    
  }
  
  
  // Represents a resource to be saved.
  Resource = class Resource {
    
    url;
    type;
    content;
    
    constructor({ url, type, content }) {
      this.url = url;
      this.type = type;
      this.content = content;
    }
    
  }
  
}

`;

// Injects the resource saver script into the inspected window.
chrome.devtools.inspectedWindow.eval(
  resourceSaverScript,
  function(result, isException) { }
);



// called when a page resource is modified 
// - stylesheet change including inspector-stylesheets, JS or document change.
// - does not get called when modifying a resource through the sources tab, you have to save (Ctrl/Cmd+S, removes the asterisk next to the resource's name) the resource for this to get called.

function onResourceContentCommitted(resource, content) {
      
  // Encodes the URL and content for safe injection into the script.
  const encodedURL = resource.url.replaceAll('`', '%60');
  const encodedContent = encodeUnicode(content);
  
  // Script to execute in the inspected window to save the resource.
  const script = `
  (() => {
    
  const saver = __DevToolsAutosaveResourceSaver__;
  
  const resource = new saver.Resource({
    url: \`${ encodedURL }\`,
    type: \`${ resource.type }\`,
    content: \`${ encodedContent }\`
  });
  
  saver.saveResource(resource);
    
  })();
  `;
  
  // Executes the script in the inspected window.
  chrome.devtools.inspectedWindow.eval(script);
  
}

// Listens for resource content changes in the inspected window.
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(
  onResourceContentCommitted
);

// Script to observe and save HTML changes in the inspected window.
const htmlObserverScript = `
(() => {
  
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed:


// called when the page's HTML is modified
// - elements added/deleted, attribute changes including inline style changes, etc.

const callback = (mutationList, observer) => {
  
  const encodedHTML = encodeUnicode(
    document.documentElement.outerHTML
  );
  
  const saver = __DevToolsAutosaveResourceSaver__;
    
  saver.savePageHTML(encodedHTML);
  
};

// Creates a MutationObserver to observe changes in the document.
const observer = new MutationObserver(callback);

// Starts observing the document for configured mutations.
observer.observe(document, config);

// Util function to base64 encode Unicode characters.
let encodeUnicode = (str) => {

  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
  }));

}

})();
`;

// Injects the HTML observer script into the inspected window.
chrome.devtools.inspectedWindow.eval(
  htmlObserverScript,
  function(result, isException) { }
);

// Util function to base64 encode Unicode characters.
let encodeUnicode = (str) => {

  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
  }));

}
