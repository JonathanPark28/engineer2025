document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSutWVZQUCnCrOxgWT7iPR_0imz1-L_KpfRhUwJmMEgK02nbQbLBUfS43hca8sPYMuM2obtlvrYSR-o/pub?gid=0&single=true&output=csv';

    const statusColors = {
        '대기': 'secondary',
        '진행중': 'primary',
        '완료': 'success',
        '보류': 'warning',
        '문제': 'danger'
    };

    // Function to parse CSV text into an array of objects
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i] || '';
            });
            return row;
        });
        return rows;
    }

    // Fetch data and render the schedule
    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            const tasks = parseCSV(csvText);
            renderSchedule(tasks);
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            app.innerHTML = '<div class="alert alert-danger">데이터를 불러오는 데 실패했습니다. 구글 시트가 "웹에 게시" 되었는지, 링크가 올바른지 확인해주세요.</div>';
        });

    function renderSchedule(tasks) {
        const startDate = new Date('2025-08-13');
        const endDate = new Date('2025-08-17');
        const days = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }

        let scheduleHtml = '';

        // Schedule Grid Header
        scheduleHtml += `
            <div class="schedule-grid">
                <div class="schedule-header">업무</div>
        `;
        days.forEach(day => {
            scheduleHtml += `<div class="schedule-header">${day.getMonth() + 1}/${day.getDate()}</div>`;
        });
        scheduleHtml += `</div>`;

        // Group tasks by 메인업무 for rows
        const groupedByMainTask = tasks.reduce((acc, task) => {
            const mainTaskName = task['메인업무'];
            if (!acc[mainTaskName]) {
                acc[mainTaskName] = [];
            }
            acc[mainTaskName].push(task);
            return acc;
        }, {});

        for (const mainTaskName in groupedByMainTask) {
            scheduleHtml += `<div class="schedule-grid">`;
            scheduleHtml += `<div class="schedule-cell">${mainTaskName}</div>`;

            days.forEach(day => {
                scheduleHtml += `<div class="schedule-cell">`;
                groupedByMainTask[mainTaskName].forEach(task => {
                    const taskDate = new Date(task['날짜']); // Assuming '날짜' is in YYYY-MM-DD format
                    if (taskDate.toDateString() === day.toDateString()) {
                        const statusClass = `status-${task['상태']}`;
                        scheduleHtml += `<div class="task-item ${statusClass}" title="${task['상세업무']} (${task['상태']})">${task['상세업무']}</div>`;
                    }
                });
                scheduleHtml += `</div>`;
            });
            scheduleHtml += `</div>`;
        }

        app.innerHTML = scheduleHtml;
    }
});