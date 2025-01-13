document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const fetchOrgsButton = document.getElementById("fetchOrgs");
  const fetchReposButton = document.getElementById("fetchRepos");
  const filterButton = document.getElementById("filterRepos");
  const organizationsSelect = document.getElementById("organizations");
  const filterInput = document.getElementById("filter");
  const repoList = document.getElementById("repoList");
  const commandsTextarea = document.getElementById("commands");
  const orgContainer = document.getElementById("orgContainer");
  const repoContainer = document.getElementById("repoContainer");
  const commandContainer = document.getElementById("commandContainer");

  let repos = []; // Stores fetched repositories

  // Fetch organizations
  fetchOrgsButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      alert("Please enter a valid GitHub token!");
      return;
    }

    try {
      const response = await fetch("https://api.github.com/user/orgs", {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      const orgs = await response.json();

      if (response.ok) {
        organizationsSelect.innerHTML = "";
        orgs.forEach((org) => {
          const option = document.createElement("option");
          option.value = org.login;
          option.textContent = org.login;
          organizationsSelect.appendChild(option);
        });
        orgContainer.style.display = "block"; // Show organization selection
      } else {
        throw new Error(orgs.message || "Failed to fetch organizations.");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });

  // Fetch repositories for selected organization with pagination
  fetchReposButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    const org = organizationsSelect.value;
    if (!token || !org) {
      alert("Please select an organization and ensure the token is valid!");
      return;
    }

    const reposData = [];
    let page = 1;
    let isNextPageAvailable = true;

    try {
      // Loop to fetch all pages until 1000 repositories are retrieved or no more pages
      while (isNextPageAvailable && reposData.length < 1000) {
        const response = await fetch(
          `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`,
          {
            headers: {
              Authorization: `token ${token}`,
            },
          }
        );
        const reposPage = await response.json();
        const linkHeader = response.headers.get("Link");
        const nextPageLink = linkHeader
          ? linkHeader.match(/<([^>]+)>;\s*rel="next"/)
          : null;

        if (response.ok) {
          reposData.push(...reposPage);
          isNextPageAvailable = nextPageLink !== null;
          page++; // Move to the next page
        } else {
          throw new Error(reposPage.message || "Failed to fetch repositories.");
        }
      }

      repos = reposData; // Save the complete list of repositories
      repoContainer.style.display = "block"; // Show repo list
      repoList.innerHTML = ""; // Clear previous list

      repos.forEach((repo) => {
        const li = document.createElement("li");
        li.textContent = repo.name;
        li.dataset.cloneUrl = repo.clone_url;
        repoList.appendChild(li);
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });

  // Filter repositories by part of the repo name
  filterButton.addEventListener("click", () => {
    const keyword = filterInput.value.trim().toLowerCase();
    if (!keyword) {
      alert("Please enter a keyword to filter repositories!");
      return;
    }

    const filteredRepos = repos.filter((repo) =>
      repo.name.toLowerCase().includes(keyword)
    );
    repoList.innerHTML = ""; // Clear previous filtered list

    if (filteredRepos.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No repositories found.";
      repoList.appendChild(li);
    } else {
      filteredRepos.forEach((repo) => {
        const li = document.createElement("li");
        li.textContent = repo.name;
        li.dataset.cloneUrl = repo.clone_url;
        repoList.appendChild(li);
      });

      // Generate Git clone commands separated by semicolons
      const commands = filteredRepos
        .map((repo) => `git clone ${repo.clone_url}`)
        .join(" ; ");
      commandsTextarea.value = commands;
      commandContainer.style.display = "block"; // Show commands
    }
  });
});
