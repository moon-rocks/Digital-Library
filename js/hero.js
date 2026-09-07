

// const input = document.querySelector("#courseSearch");
// const container = document.querySelector("#coursesContainer");

// input.addEventListener("input", () => {

//     const search = input.value.trim().toLowerCase();

//     const cards = [...container.querySelectorAll(".course")];

//     cards.sort((a, b) => {

//         const titleA = a.querySelector("h2").textContent.toLowerCase();
//         const titleB = b.querySelector("h2").textContent.toLowerCase();

//         const matchA = titleA.includes(search);
//         const matchB = titleB.includes(search);

//         if (matchA && !matchB) return -1;
//         if (!matchA && matchB) return 1;

//         return 0;
//     });

//     cards.forEach(card => container.appendChild(card));

// });
// const state = Flip.getState(".course");

// // sort and append cards

// Flip.from(state, {
//     duration: 0.5,
//     ease: "power2.inOut",
//     absolute: true
// });

document.addEventListener("DOMContentLoaded", () => {

    const input = document.querySelector("#courseSearch");
    const searchButton = document.querySelector("#search");
    const container = document.querySelector("#coursesContainer");
    const noResults = document.querySelector("#noResults");
    const searchStatus = document.querySelector("#searchStatus");

    // Safety check
    if (!input || !container) {
        console.error("Search elements not found.");
        return;
    }

    function performSearch() {

        const searchText = input.value
            .trim()
            .toLowerCase();

        const cards = [...container.querySelectorAll(".course")];

        let visibleCount = 0;

        cards.forEach(card => {

            // Get all searchable text from the card
            const searchableText = card.textContent
                .toLowerCase()
                .replace(/\s+/g, " ");

            // Empty search = show everything
            const isMatch =
                searchText === "" ||
                searchableText.includes(searchText);

            if (isMatch) {

                card.classList.remove("hidden");

                // Small animation
                card.style.opacity = "0";
                card.style.transform = "translateY(10px)";

                requestAnimationFrame(() => {
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0)";
                });

                visibleCount++;

            } else {

                card.classList.add("hidden");

            }

        });


        // =========================
        // NO RESULT
        // =========================

        if (visibleCount === 0 && searchText !== "") {

            noResults.classList.remove("hidden");

            searchStatus.textContent =
                `No resources found for "${input.value.trim()}"`;

        } else {

            noResults.classList.add("hidden");

            if (searchText === "") {

                searchStatus.textContent = "";

            } else {

                searchStatus.textContent =
                    `${visibleCount} resource${visibleCount !== 1 ? "s" : ""} found`;

            }

        }

    }


    // =========================
    // LIVE SEARCH
    // =========================

    input.addEventListener("input", performSearch);


    // =========================
    // SEARCH BUTTON
    // =========================

    searchButton?.addEventListener("click", performSearch);


    // =========================
    // ENTER KEY
    // =========================

    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {
            performSearch();
        }

    });


    // =========================
    // ESCAPE = CLEAR SEARCH
    // =========================

    input.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            input.value = "";
            performSearch();
            input.blur();

        }

    });

});