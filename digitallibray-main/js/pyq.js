const pyqs = [

    {
        name: `Sem-1 OBE 2025 (Odd)
                Fundamental of IT System (C.S.E)
                (T2418104)`,
        link: `./Pyq pdf/fudamental of itsystem 2025 sem1 odd.pdf`
    },

    {
        name: `Sem-1 OBE Diploma Exam 2025 (Odd)
                Fund. of Elect & Electro Engg. (C.S.E)
                (T2420103)`,
        link: `./Pyq pdf/fund elect elctro 2025 odd sem1.pdf`
    },

    {
        name: `Sem-1 OBE Diploma Exam 2025 (Odd)
                Applied Physics-B (C.S.E)
                (T2400102B)`,
        link: `./Pyq pdf/physic b 2025 sem1.pdf`
    },

    {
        name: `Sem-1_2 Diploma Exam 2025 (Odd)
                Applied Physics-I (C.S.E)
                (P2001102)`,
        link: `./Pyq pdf/applied physics 1 2025 sem1.pdf`
    },

    {
        name: `Sem-1_2 Diploma Exam 2025 (Odd)
                Mathematics-II (C.S.E)
                (P2002201)`,
        link: `./Pyq pdf/mathmatics 11 2025 sem 1.pdf`
    },

    {
        name: `Sem-1_2 Diploma Exam 2025 (Odd)
                Mathematics-I (C.S.E)
                (2001101)`,
        link: `./Pyq pdf/mathmatics 1 2025 sem 1.pdf`
    },

    {
        name: `(Sem-II (OBE)) Diploma Exam 2025 (Even)
                Python Programming (T2418103)`,
        link: `./Pyq pdf/2025 sem 2 python.pdf`
    }, 
     {
        name: `(Sem-II (OBE)) Diploma Exam 2025 (Even)
                (Computer Science & Engineering) (Theory)
                 Programming with C (T2418101) `, 
        link: `./Pyq pdf/programingwith c2025 sem 11.pdf`
    }

];


const pyqList = document.getElementById("pyqList");

pyqs.forEach((pyq, index) => {

    const row = document.createElement("div");

    row.className = `
        grid grid-cols-1 md:grid-cols-12
        items-center gap-4 md:gap-0
        px-5 py-5
        border-b
        hover:bg-blue-50
        transition
    `;

    row.innerHTML = `

        <!-- PYQ Name -->
        <div class="md:col-span-9">

            <p class="text-xs text-gray-500 md:hidden mb-1">
                PYQ Name
            </p>

            <h3 class="font-medium text-slate-800 whitespace-pre-line">
                ${pyq.name}
            </h3>

        </div>


        <!-- Download -->
        <div class="md:col-span-3 md:text-center">

            <a href="${pyq.link}"
               download
               class="inline-block w-full md:w-auto
                      text-center
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-5 py-2
                      rounded-lg
                      transition">

                <i class="fa-solid fa-download mr-2"></i>

                Download PDF

            </a>

        </div>

    `;

    pyqList.appendChild(row);

});