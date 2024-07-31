// ==UserScript==
// @name         NixOS Package Search - GitHub repo stargazers badges for package search results
// @namespace    https://github.com/m1kethai/UserScripts
// @supportURL   https://github.com/m1kethai/UserScripts
// @version      1.1
// @description  Adds a badge displaying the number of GitHub repo stars for every Nix package (with a GitHub repo "Homepage") returned in the package search results.
// @author       m1kethai
// @match        https://search.nixos.org/packages*type=packages*query=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nixos.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const styles = {
        badgeEl: `
            display: inherit;
            margin-left: 1em;
            padding: 0.04em 0.6em 0.04em 0.4em;
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-align: center;
            transition: all 0.2s;
        `,
        badgeText: `
            color: white;
            text-decoration: none !important;
            transition: all 0.2s;
        `
    };

    async function pkgsWithGhRepoHomepages() {
        const homepageLinkSelector = `div.search-page.success > div.search-results > div > ul > li.package > ul > li > a`;
        const homepageLinks = document.querySelectorAll(homepageLinkSelector);
        const githubRepoHomepages = Array.from(homepageLinks).filter(link => link.innerText.includes("Homepage") && link.href.includes ("github.com") && !link.href.includes("blob"));

        console.info(`🚀 ~ githubRepoHomepages:`, githubRepoHomepages)
        return githubRepoHomepages;
    };

    async function fetchRepoStars(ghRepoLink) {
        const
            repoUrl = ghRepoLink.href,
            apiUrl = new URL(`https://api.github.com/repos${repoUrl.replace("https://github.com", "")}`),
            response = await fetch(apiUrl),
            data = await response.json();

        return `⭐️ ${data.stargazers_count||"???"}`;
    };

    async function getAllStars(repoLinkList, batchSize = 3) {
        const stars = [];
        for (let i = 0; i < repoLinkList.length; i += (i + batchSize < repoLinkList.length) ? batchSize : (i + batchSize - repoLinkList.length)) {
            const batch = repoLinkList.slice(i, i + batchSize);
            const batchStars = await Promise.all(batch.map(async repoLink => await fetchRepoStars(repoLink)));
            stars.push(...batchStars);
        }
        return stars;
    }

    const createBadgeElements = repoLinkList => repoLinkList.map(repoLink => {
        const starsBadge = document.createElement("li"), starsLink = document.createElement("a");
        starsBadge.appendChild(starsLink);
        starsBadge.style = styles.badgeEl;
        starsLink.style = styles.badgeText;
        starsLink.target = "_blank";
        starsLink.href = repoLink.href;
        return starsBadge;
    });

    async function main() {
        const repoLinkList = await pkgsWithGhRepoHomepages();
        const badgeElements = createBadgeElements(repoLinkList);
        const starsList = await getAllStars(repoLinkList);

        badgeElements.map((badge, i) => {
            badge.querySelector("a").innerText = starsList[i]
        });
        repoLinkList.forEach((repoLink, i) => repoLink.parentElement.appendChild(badgeElements[i]));
    };

    main();
})();
