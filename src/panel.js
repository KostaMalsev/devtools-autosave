

window.resourcesEl = document.querySelector('.resources');


// Class to read saved resources from local storage in DevTools
DevToolsAutosaveSavedResourceReader = new class DevToolsAutosaveSavedResourceReader {

  // Key to access saved resources in local storage
  localStorageKey = '__devToolsAutosaveSavedResources__';

  // Key to access the page HTML in saved resources
  pageHTMLKey = '__pageHTML__';


  // Retrieves saved resources from local storage
  getSavedResources() {

    return new Promise(resolve => {

      // Script to execute in the inspected window to retrieve saved resources
      const script = `localStorage[\`${this.localStorageKey}\`]`;

      // Evaluates the script in the inspected window and handles the result
      chrome.devtools.inspectedWindow.eval(
        script,
        function (result, isException) {

          const data = result;

          // If no data is found, resolves the promise with an empty object
          if (!data) {

            resolve({});

          } else {

            // Parses the data from JSON string to an object and resolves the promise
            resolve(JSON.parse(data));

          }

        }
      );

    });

  }

}





const resourcesEl = document.querySelector('.resources');

async function renderSavedResources() {

  // Creates an instance of the saved resource reader
  const savedResourceReader = DevToolsAutosaveSavedResourceReader;

  // Retrieves saved resources
  const savedResources = await savedResourceReader.getSavedResources();


  let outHTML = '';

  // Iterates through each saved resource
  for (let key in savedResources) {

    const resource = savedResources[key];


    // Handles the page HTML resource
    if (key === savedResourceReader.pageHTMLKey) {

      let resourceContent = decodeUnicode(resource);
      resourceContent = escapeHTML(resourceContent);

      outHTML += `
      <div class="resource">
        <div class="header">
          <div class="title">Page HTML</div>
          <div class="subtitle">document</div>
          ${arrowIcon}
        </div>
        <div class="content">${resourceContent}</div>
      </div>
      `;

      continue;

    }


    // Handles other resources
    let resourceUrl = decodeURIComponent(resource.url);
    resourceUrl = escapeHTML(resourceUrl);

    let resourceContent = decodeUnicode(resource.content);
    resourceContent = escapeHTML(resourceContent);


    let resourceType = resource.type;

    // Adjusts the resource type for inspector resources
    if (resource.url.startsWith('inspector://')) {

      resourceType = 'inspector-' + resourceType;

    }


    outHTML += `
    <div class="resource">
      <div class="header">
        <div class="title">${resourceUrl}</div>
        <div class="subtitle">${resourceType}</div>
        ${arrowIcon}
      </div>
      <div class="content">${resourceContent}</div>
    </div>
    `;

  }

  // If no resources are found, displays a message
  if (outHTML === '') {

    outHTML = '<div class="empty">No saved resources. To save a resource, edit it in DevTools.</div>';

  }


  // Updates the resources element with the generated HTML
  resourcesEl.innerHTML = outHTML;


  // Adds event listeners to each resource to toggle expansion
  resourcesEl.querySelectorAll('.resource').forEach(resourceEl => {

    const headerEl = resourceEl.querySelector('.header');

    headerEl.addEventListener('click', () => {

      resourceEl.classList.toggle('expanded');

    });

  });

}

// Re-renders saved resources whenever the panel is shown (see extension.js)
chrome.storage.local.onChanged.addListener(
  renderSavedResources
);

// Function to check the theme and adjust the panel accordingly
function checkTheme() {

  // Checks if the current theme is dark and adjusts the panel
  if (chrome.devtools.panels.themeName === 'dark') {

    document.body.classList.add('dark');

  }

}

// Calls the theme check function
checkTheme();

// Util functions for decoding Unicode and escaping HTML

// Decodes Unicode characters in a string
let decodeUnicode = (str) => {

  // going backwards: from bytestream, to percent-encoding, to original string
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

}

// Escapes HTML characters in a string
let escapeHTML = (str) => {

  const p = document.createElement('p');
  p.appendChild(document.createTextNode(str));

  let resp = p.innerHTML;
  resp = resp.replaceAll(/"/g, "&quot;").replaceAll(/'/g, "&#039;");

  return resp;

}

// Icon for the arrow in the resources list
const arrowIcon = `<svg class="arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>`;


document.addEventListener('DOMContentLoaded', async () => {
  // Remove any existing auth buttons first
  const existingButtons = document.querySelectorAll('.auth-button');
  existingButtons.forEach(button => button.remove());

  // Create new button
  const authButton = document.createElement('button');
  authButton.className = 'auth-button';
  authButton.textContent = 'Sign in with GitHub';
  document.body.insertBefore(authButton, resourcesEl);

  const githubAuth = new GitHubAuth();

  async function updateAuthButtonState() {
    try {
      const isAuthenticated = await githubAuth.isAuthenticated();
      authButton.textContent = isAuthenticated ? 'Sign Out of GitHub' : 'Sign in with GitHub';
      authButton.classList.toggle('signed-in', isAuthenticated);
    } catch (error) {
      console.error('Error updating button state:', error);
    }
  }
  
  authButton.addEventListener('click', async () => {
    try {
      const isAuthenticated = await githubAuth.isAuthenticated();
      if (isAuthenticated) {
        await githubAuth.logout();
      } else {
        await githubAuth.authenticate();
      }
      setTimeout(() => {
        console.log('updating the auth state')
        updateAuthButtonState();
      }, 5000);
    } catch (error) {
      console.error('Auth action failed:', error);
      authButton.textContent = 'Auth Error - Try Again';
    }
  });


  // Initial state update
  await updateAuthButtonState();
  
});