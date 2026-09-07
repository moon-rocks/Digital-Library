const search = document.getElementById("semesterSearch");
const cards = document.querySelectorAll(".semester-card");

search.addEventListener("keyup", (e) => {
    const value = search.value.toLowerCase();
    const valuenumber =e.target.value;
    console.log(valuenumber,value);
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();

        if (text.includes(value)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
});