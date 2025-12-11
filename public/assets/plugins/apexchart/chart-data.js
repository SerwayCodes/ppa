$(document).ready(function() {
    // Fetch data from the server
    fetch('fetch_student_data')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data:", data); // Log fetched data for debugging

            // Calculate the total count for each program (E1, E2, E3, E4)
            const totalCounts = {
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0
            };

            data.forEach(student => {
                if (student.is_current && ['1', '2', '3', '4'].includes(student.form_level)) {
                    totalCounts[student.form_level]++;
                }
            });

            console.log("Total Counts:", totalCounts); // Log total counts for debugging

            // Update the series data for the chart
            var options = {
                series: [totalCounts['1'], totalCounts['2'], totalCounts['3'], totalCounts['4']],
                chart: {
                    width: 400,
                    type: 'pie',
                },
                labels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }]
            };

            // Render the updated chart
            var chart = new ApexCharts(document.querySelector("#chart"), options);
            chart.render();
        })
        .catch(error => {
            console.error("Error fetching student data:", error);
        });
});
