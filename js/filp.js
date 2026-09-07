const searchInput = document.getElementById("semesterSearch");
const semesterGrid = document.getElementById("semesterGrid");

searchInput.addEventListener("input", function () {

    const value = this.value.toLowerCase().trim();

    const cards = [...document.querySelectorAll(".note-row")];

    cards.sort((a, b) => {
        const aMatch = a.querySelector("h3").textContent.toLowerCase().includes(value);
        const bMatch = b.querySelector("h3").textContent.toLowerCase().includes(value);
        return bMatch - aMatch;
    });

    cards.forEach(card => {

        const title = card.querySelector("h3").textContent.toLowerCase();

        if (title.includes(value) || value === "") {

            card.style.display = "";

            semesterGrid.appendChild(card);

            gsap.fromTo(
                card,
                {
                    y: 20,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out"
                }
            );

        } else {

            card.style.display = "none";

        }

    });

});