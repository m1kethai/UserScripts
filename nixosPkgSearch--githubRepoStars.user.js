// ==UserScript==
// @name         NixOS Package Search - GitHub repo stargazers badges for package search results
// @namespace    http://tampermonkey.net/
// @version      2024-07-29
// @description  Display the number of GitHub repo stars for every (applicable) Nix package returned in the search results.
// @author       m1kethai
// @match        https://search.nixos.org/packages*type=packages*query=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nixos.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const pkgHomepageLinkSelector = `div.search-page.success > div.search-results > div > ul > li.package > ul > li:nth-child(3) > a`;

    const getPkgGithubRepos = async () => {
        const allPkgHomepageLinks = document.querySelectorAll(pkgHomepageLinkSelector);
        const githubRepoLinks = Array.from(allPkgHomepageLinks).filter(link => link.href.includes("github.com"));
        console.table("🚀 ~ getPkgGithubRepos ~ githubRepoLinks:", githubRepoLinks);
        return githubRepoLinks;
    };

    const badgeStyles = `
        display: inherit;
        margin-left: 1em;
        padding: 0.08em 0.6em 0.08em 0.4em;
        background-color: rgba(255, 255, 255, 0.13);
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
        text-align: center;
    `;

    async function fetchGithubRepoStars(ghRepoLink) {
        const
            repoUrl = ghRepoLink.href,
            apiUrl = new URL(`https://api.github.com/repos${repoUrl.replace("https://github.com", "")}`),
            response = await fetch(apiUrl),
            data = await response.json(),
            gazers = data.stargazers_count;
        return `⭐️ ${gazers || "??"}`;
    };

    async function addGithubRepoStarBadgesToPkgResults() {
        const repoLinkList = await getPkgGithubRepos();

        for (const repoLinkEl of repoLinkList) {
            const
                starsBadgeText = await fetchGithubRepoStars(repoLinkEl),
                starsBadge = document.createElement("li"),
                starsLink = document.createElement("a");

            starsBadge.classList.add("repo-stars-badge");
            starsBadge.appendChild(starsLink);
            starsBadge.style = badgeStyles;

            starsLink.textContent = starsBadgeText;
            starsLink.style = "color: white;";
            starsLink.target = "_blank";
            starsLink.href = repoLinkEl.href;

            repoLinkEl.parentNode.appendChild(starsBadge);
        }
    };

    if (document.readyState === "complete") addGithubRepoStarBadgesToPkgResults();
    else document.addEventListener("DOMContentLoaded", addGithubRepoStarBadgesToPkgResults);
})();