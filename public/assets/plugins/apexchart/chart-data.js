$(document).ready(function() {
    // Fetch data from the server
    fetch('fetch_student_data')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data:", data); // Log fetched data for debugging

            // Calculate the total count for each program (E1, E2, E3, E4)
            const totalCounts = {
                'E1': 0,
                'E2': 0,
                'E3': 0,
                'E4': 0
            };

            data.forEach(student => {
                if (student.is_current && ['E1', 'E2', 'E3', 'E4'].includes(student.allocated_program)) {
                    totalCounts[student.allocated_program]++;
                }
            });

            console.log("Total Counts:", totalCounts); // Log total counts for debugging

            // Update the series data for the chart
            var options = {
                series: [totalCounts['E1'], totalCounts['E2'], totalCounts['E3'], totalCounts['E4']],
                chart: {
                    width: 400,
                    type: 'pie',
                },
                labels: ['E1', 'E2', 'E3', 'E4'],
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
