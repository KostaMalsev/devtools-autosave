// GistHelper: Processes and structures files for Gist creation
class GistHelper {
    static prepareGistFiles(resources, pageUrl) {
        const files = {};
        const description = `DevTools Autosave: ${pageUrl}`;

        for (const key in resources) {
            const resource = resources[key];

            console.log('RESOURCE:',resource.content)
            let content = '';

            if(key == DevToolsAutosaveSavedResourceReader.pageHTMLKey){

                content = decodeUnicode(resource);
                files["current_page.html"] = { content };

            }else{

                content = decodeUnicode(resource.content);//in this case the key is the url, content is saved css properties, type="document"
                let filename = GistHelper.sanitizeFilename(resource.url.split("/").pop() || "resource");

                if(resource.type == 'document' && !filename.endsWith('.html')){
                    filename += '.html'
                }

                files[filename] = { content };
                
            }

        }

        return { description, files };
    }

    static sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9._-]/g, "_"); // Remove invalid characters
    }
    
}



class GitHubGistManager {
    constructor(token) {
        this.token = token;
    }

    async createGist(resources, pageUrl) {
        const { description, files } = GistHelper.prepareGistFiles(resources, pageUrl);
        const response = await fetch("https://api.github.com/gists", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ description, public: false, files })
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        return await response.json();
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    // Create the Save button
    const saveGistButton = document.createElement("button");
    saveGistButton.className = "gist-button";
    saveGistButton.textContent = "Save to GitHub Gist";
    document.body.insertBefore(saveGistButton, resourcesEl);

    saveGistButton.addEventListener("click", async () => {
        try {
            // Retrieve GitHub OAuth token
            const storage = await chrome.storage.local.get("github_auth_token");
            const token = storage.github_auth_token;
            if (!token) throw new Error("Please sign in with GitHub first");

            // Get the current page URL
            const pageUrl = await new Promise((resolve) => {
                chrome.devtools.inspectedWindow.eval("window.location.href", (result) => resolve(result));
            });

            saveGistButton.textContent = "Saving gist...";
            // Add animation of button processing
            saveGistButton.classList.add('in-process');


            // Retrieve saved resources
            const savedResources = await DevToolsAutosaveSavedResourceReader.getSavedResources();
            if (Object.keys(savedResources).length === 0) throw new Error("No resources to save");

            // Create the Gist
            const gistManager = new GitHubGistManager(token);
            const gist = await gistManager.createGist(savedResources, pageUrl);

            // Show success message & open the Gist in a new tab
            saveGistButton.classList.remove('in-process');
            saveGistButton.textContent = "Saved to Gist ✓";
            saveGistButton.classList.add("success");
            window.open(gist.html_url, "_blank");

            // Reset button after 3 seconds
            setTimeout(() => {
                saveGistButton.textContent = "Save to GitHub Gist";
                saveGistButton.classList.remove("success");
            }, 3000);

        } catch (error) {
            console.error("Failed to save gist:", error);
            saveGistButton.textContent = error.message;
            saveGistButton.classList.add("error");

            // Reset button after 3 seconds
            setTimeout(() => {
                saveGistButton.textContent = "Save to GitHub Gist";
                saveGistButton.classList.remove("error");
            }, 3000);
        }
    });
});
