document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // Create containers for filters and table
    const filterWrapper = document.createElement('div');
    filterWrapper.id = 'filter-wrapper';
    app.appendChild(filterWrapper);

    const tableWrapper = document.createElement('div');
    tableWrapper.id = 'table-wrapper';
    app.appendChild(tableWrapper);
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
        const rows = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i] || '';
            });
            row.rowIndex = index + 2; // +2 because CSV data starts from row 2 (after header)
            return row;
        });
        return rows;
    }

    // Function to group tasks by '메인팀'
    function groupTasksByTeam(tasks) {
        return tasks.reduce((acc, task) => {
            const teamName = task['메인팀'];
            if (!acc[teamName]) {
                acc[teamName] = [];
            }
            acc[teamName].push(task);
            return acc;
        }, {});
    }

    const statusOrder = ['대기', '진행중', '완료', '보류', '문제'];

    // Placeholder for your Google Apps Script Web App URL
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw0t1PkJlzxMc8_8OLFJCs4PKN_karmorNTaVujWqYPPGIdObxvAw4I6ui_2KyrGGB5/exec'; 

    async function updateGoogleSheet(rowIndex, column, value) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Required for Apps Script web app
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: column === '상태' ? 'updateStatus' : 'addMemo',
                    rowIndex: rowIndex,
                    column: column,
                    value: value
                })
            });
            // Note: Due to 'no-cors', response.ok will always be true. 
            // You'll need to check Apps Script logs for actual success/failure.
            console.log(`Update request sent for row ${rowIndex}, column ${column}: ${value}`);
        } catch (error) {
            console.error('Error updating Google Sheet:', error);
        }
    }

    function changeStatus(element, rowIndex) {
        let currentStatus = element.textContent.trim();
        let currentIndex = statusOrder.indexOf(currentStatus);
        let nextIndex = (currentIndex + 1) % statusOrder.length;
        let nextStatus = statusOrder[nextIndex];

        element.textContent = nextStatus;
        element.className = `badge bg-${statusColors[nextStatus]}`;

        updateGoogleSheet(rowIndex, '상태', nextStatus);
    }

    function addMemo(button, rowIndex) {
        const newMemo = prompt("메모를 입력하세요:");
        if (newMemo) {
            const td = button.parentElement;
            td.textContent = newMemo;
            updateGoogleSheet(rowIndex, '메모', newMemo);
        }
    }

    // Render the data
    function render(tasks) {
        const tableWrapper = document.getElementById('table-wrapper');
        tableWrapper.innerHTML = ''; // Clear previous table content

        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover mb-0';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>메인팀</th>
                <th>작업팀</th>
                <th>담당자</th>
                <th>메인업무</th>
                <th>상세업무</th>
                <th>상태</th>
                <th>날짜/시간</th>
                <th>메모</th>
                <th>자료실</th>
            </tr>
        `;

        const tbody = document.createElement('tbody');
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            
            const statusColor = statusColors[task['상태']] || 'secondary';

            tr.innerHTML = `
                <td>${task['메인팀']}</td>
                <td>${task['작업팀']}</td>
                <td>${task['담당자']}</td>
                <td>${task['메인업무']}</td>
                <td>${task['상세업무']}</td>
                <td><span class="badge bg-${statusColor}" onclick="changeStatus(this, ${task.rowIndex})">${task['상태']}</span></td>
                <td>${task['날짜']} ${task['시간']}</td>
                <td>${task['메모']} <button class="btn btn-sm btn-outline-secondary" onclick="addMemo(this, ${task.rowIndex})">추가</button></td>
                <td>${task['링크'] ? `<a href="${task['링크']}" target="_blank">링크</a>` : ''}</td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        tableWrapper.appendChild(tableContainer);
    }

    window.addMemo = addMemo;
    window.changeStatus = changeStatus;

    let allTasks = []; // Store all tasks globally

    // Function to create and populate filter buttons
    function createFilters(tasks) {
        const mainTeams = [...new Set(tasks.map(task => task['메인팀']))];
        const workTeams = [...new Set(tasks.map(task => task['작업팀']))];

        const filterContainer = document.createElement('div');
        filterContainer.className = 'mb-3';

        filterContainer.innerHTML = `
            <div class="mb-2">
                <strong>메인팀:</strong>
                <div class="btn-group" role="group" id="mainTeamFilter">
                    <button type="button" class="btn btn-outline-primary btn-sm active" data-filter-value="">모두</button>
                    ${mainTeams.map(team => `<button type="button" class="btn btn-outline-primary btn-sm" data-filter-value="${team}">${team}</button>`).join('')}
                </div>
            </div>
            <div class="mb-2">
                <strong>작업팀:</strong>
                <div class="btn-group" role="group" id="workTeamFilter">
                    <button type="button" class="btn btn-outline-primary btn-sm active" data-filter-value="">모두</button>
                    ${workTeams.map(team => `<button type="button" class="btn btn-outline-primary btn-sm" data-filter-value="${team}">${team}</button>`).join('')}
                </div>
            </div>
        `;

        document.getElementById('filter-wrapper').appendChild(filterContainer);

        document.querySelectorAll('#mainTeamFilter .btn').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('#mainTeamFilter .btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                applyFilters();
            });
        });

        document.querySelectorAll('#workTeamFilter .btn').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('#workTeamFilter .btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                applyFilters();
            });
        });
    }

    // Function to apply filters and re-render
    function applyFilters() {
        const selectedMainTeam = document.querySelector('#mainTeamFilter .btn.active').dataset.filterValue;
        const selectedWorkTeam = document.querySelector('#workTeamFilter .btn.active').dataset.filterValue;

        let filteredTasks = allTasks;

        if (selectedMainTeam) {
            filteredTasks = filteredTasks.filter(task => task['메인팀'] === selectedMainTeam);
        }
        if (selectedWorkTeam) {
            filteredTasks = filteredTasks.filter(task => task['작업팀'] === selectedWorkTeam);
        }

        render(filteredTasks);
    }

    // Fetch data and render the page
    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            allTasks = parseCSV(csvText); // Store all tasks
            createFilters(allTasks); // Create filters based on all tasks
            applyFilters(); // Apply initial filters (none selected) and render
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            app.innerHTML = '<div class="alert alert-danger">데이터를 불러오는 데 실패했습니다. 구글 시트가 "웹에 게시" 되었는지, 링크가 올바른지 확인해주세요.</div>';
        });
});
});