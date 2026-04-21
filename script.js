/**
 * ELIMU-CONNECT: CORE SYSTEM LOGIC
 * Optimized for KSEF 2026 - Rationalized CBC Curriculum
 */

// 1. DATASET: Organized by Rationalized CBC Learning Areas
const curriculumData = [
    // LOWER PRIMARY (GRADES 1-3)
    { name: "Indigenous Language", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "Kiswahili Activities", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "Mathematics Activities", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "English Activities", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "Religious Education", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "Environmental (Hygiene & Nutrition)", level: "Lower Primary", grades: [1, 2, 3] },
    { name: "Creative Activities", level: "Lower Primary", grades: [1, 2, 3] },

    // UPPER PRIMARY (GRADES 4-6)
    { name: "English", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Mathematics", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Kiswahili", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Religious Education", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Agriculture and Nutrition", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Social Studies", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Creative Arts (Music/PHE)", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },
    { name: "Science and Technology", level: "Upper Primary (G4-6)", grades: [4, 5, 6] },

    // JUNIOR SECONDARY (GRADES 7-9)
    { name: "Social Studies & Life Skills", level: "Junior School", grades: [7, 8, 9] },
    { name: "Agriculture & Home Science", level: "Junior School", grades: [7, 8, 9] },
    { name: "Integrated Science & Health Ed", level: "Junior School", grades: [7, 8, 9] },
    { name: "Pre-Tech, Computer & Business", level: "Junior School", grades: [7, 8, 9] },
    { name: "Creative Arts & Sports", level: "Junior School", grades: [7, 8, 9] },
    { name: "Mathematics", level: "Junior School", grades: [7, 8, 9] },
    { name: "English", level: "Junior School", grades: [7, 8, 9] },
    { name: "Kiswahili / KSL", level: "Junior School", grades: [7, 8, 9] },
    { name: "Religious Education", level: "Junior School", grades: [7, 8, 9] }
];

// 2. MAIN RENDERING ENGINE
function updateUI() {
    const display = document.getElementById('mainDisplay');
    const search = document.getElementById('searchBox').value.toLowerCase();
    const levelFilter = document.getElementById('levelSel').value;
    const gradeFilter = document.getElementById('gradeSel').value;

    // Clear display before rebuilding
    display.innerHTML = "";

    // Loop through all potential CBC grades (1 to 9)
    for (let g = 1; g <= 9; g++) {
        
        // Logic: Skip if user selected a specific grade that isn't this one
        if (gradeFilter !== "all" && gradeFilter != g) continue;

        // Filter subjects that belong in this Grade section
        const subjectsInGrade = curriculumData.filter(sub => {
            const matchesGrade = sub.grades.includes(g);
            const matchesLevel = (levelFilter === "all" || sub.level === levelFilter);
            const matchesSearch = sub.name.toLowerCase().includes(search);
            return matchesGrade && matchesLevel && matchesSearch;
        });

        // Only create a section if there are subjects to show
        if (subjectsInGrade.length > 0) {
            
            // Determine the "Beautiful Badge" color based on Grade
            let badgeClass = "badge-lower"; // Default G1-3
            let levelLabel = "Lower Primary";
            
            if (g >= 4 && g <= 6) {
                badgeClass = "badge-upper";
                levelLabel = "Upper Primary";
            } else if (g >= 7) {
                badgeClass = "badge-junior";
                levelLabel = "Junior School";
            }

            // Create Section Container
            const section = document.createElement('div');
            section.className = 'grade-section';
            
            // Create the Beautiful Header
            section.innerHTML = `
                <div class="grade-header-container">
                    <span class="grade-title">Grade ${g}</span>
                    <span class="grade-badge ${badgeClass}">${levelLabel}</span>
                    <hr class="beauty-hr">
                </div>
            `;
            
            // Create Subject Grid
            const grid = document.createElement('div');
            grid.className = 'subject-grid';

            // Add each subject card to the grid
            subjectsInGrade.forEach(item => {
                grid.innerHTML += `
                    <div class="card">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.2rem; font-weight: 700; color: #0f172a;">${item.name}</h3>
                        <div class="resource-links">
                            <a href="#" class="r-btn b-pdf" onclick="alert('Downloading ${item.name} PDF...')">PDF Notes</a>
                            <a href="#" class="r-btn b-vid" onclick="alert('Opening ${item.name} Video Lesson...')">Video</a>
                            <a href="#" class="r-btn b-aud" onclick="alert('Playing ${item.name} Audio...')">Audio</a>
                            <a href="#" class="r-btn b-qiz" onclick="alert('Starting ${item.name} Quiz...')">Quiz</a>
                            <a href="#" class="r-btn b-prj" onclick="alert('Opening ${item.name} Project Guide...')">Project Guide</a>
                        </div>
                    </div>
                `;
            });

            section.appendChild(grid);
            display.appendChild(section);
        }
    }

    // Edge Case: If no subjects found at all
    if (display.innerHTML === "") {
        display.innerHTML = `<div style="text-align:center; padding: 50px; color: #64748b;">
            <h3>No subjects found</h3>
            <p>Try adjusting your search or filters.</p>
        </div>`;
    }
}

// 3. SYSTEM EVENT LISTENERS
document.getElementById('searchBox').addEventListener('input', updateUI);
document.getElementById('levelSel').addEventListener('change', updateUI);
document.getElementById('gradeSel').addEventListener('change', updateUI);
/**
 * Elimu-Connect Frontend Filter Logic
 * This handles the Search bar and Dropdown filters without reloading the page.
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    const levelSel = document.getElementById('levelSel');
    const gradeSel = document.getElementById('gradeSel');
    const sections = document.querySelectorAll('.grade-section');
    const noResults = document.getElementById('noResults');

    function filterResources() {
        const query = searchBox.value.toLowerCase();
        const selectedLevel = levelSel.value;
        const selectedGrade = gradeSel.value;
        let visibleCount = 0;

        sections.forEach(section => {
            const sectionGrade = section.getAttribute('data-grade');
            const cards = section.querySelectorAll('.card');
            let hasVisibleCardsInSection = false;

            cards.forEach(card => {
                const subjectName = card.querySelector('h3').innerText.toLowerCase();
                const cardLevel = card.getAttribute('data-level');

                // Logic check for Search, Level, and Grade
                const matchesSearch = subjectName.includes(query);
                const matchesLevel = (selectedLevel === 'all') || (cardLevel === selectedLevel);
                const matchesGrade = (selectedGrade === 'all') || (sectionGrade === selectedGrade);

                if (matchesSearch && matchesLevel && matchesGrade) {
                    card.style.display = 'flex'; // Show card
                    hasVisibleCardsInSection = true;
                    visibleCount++;
                } else {
                    card.style.display = 'none'; // Hide card
                }
            });

            // If no cards match in this specific grade, hide the entire Grade header
            section.style.display = hasVisibleCardsInSection ? 'block' : 'none';
        });

        // Show "No Results Found" if everything is hidden
        if (noResults) {
            noResults.style.display = (visibleCount === 0) ? 'block' : 'none';
        }
    }

    // Event listeners to trigger filtering on user input
    searchBox.addEventListener('input', filterResources);
    levelSel.addEventListener('change', filterResources);
    gradeSel.addEventListener('change', filterResources);
});
// 4. INITIALIZE ON LOAD
window.onload = () => {
    console.log("Elimu-Connect: System Initialized Successfully.");
    updateUI();
};