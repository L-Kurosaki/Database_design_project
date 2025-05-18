document.addEventListener('DOMContentLoaded', () => {
    // Search form handling
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fromLocation = document.getElementById('fromLocation').value;
            const toLocation = document.getElementById('toLocation').value;
            const journeyDate = document.getElementById('journeyDate').value;
            
            // Add API call here
            console.log('Searching for buses:', { fromLocation, toLocation, journeyDate });
        });
    }

    // Add animation classes
    const animatedElements = document.querySelectorAll('.card');
    animatedElements.forEach(element => {
        element.classList.add('fade-in');
    });
}); 