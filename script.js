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

    function changeStatus(element) {
        let currentStatus = element.textContent.trim();
        let currentIndex = statusOrder.indexOf(currentStatus);
        let nextIndex = (currentIndex + 1) % statusOrder.length;
        let nextStatus = statusOrder[nextIndex];

        element.textContent = nextStatus;
        element.className = `badge bg-${statusColors[nextStatus]}`;
    }

    function addMemo(button) {
        const newMemo = prompt("메모를 입력하세요:");
        if (newMemo) {
            const td = button.parentElement;
            td.textContent = newMemo;
        }
    }

    // Render the data
    function render(teams) {
        app.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'row';

        for (const teamName in teams) {
            const tasks = teams[teamName];
            
            const col = document.createElement('div');
            col.className = 'col-12 mb-4';

            const card = document.createElement('div');
            card.className = 'card';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header fw-bold fs-5';
            cardHeader.textContent = teamName;

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body p-0'; // Remove padding to make table fit nicely

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
                    <td><span class="badge bg-${statusColor}" onclick="changeStatus(this)">${task['상태']}</span></td>
                    <td>${task['날짜']} ${task['시간']}</td>
                    <td>${task['메모']} <button class="btn btn-sm btn-outline-secondary" onclick="addMemo(this)">추가</button></td>
                    <td>${task['링크'] ? `<a href="${task['링크']}" target="_blank">링크</a>` : ''}</td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            cardBody.appendChild(tableContainer);
            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            col.appendChild(card);
            row.appendChild(col);
        }
        app.appendChild(row);
    }

    window.addMemo = addMemo;
    window.changeStatus = changeStatus;

    let allTasks = []; // Store all tasks globally

    // Function to create and populate filter dropdowns
    function createFilters(tasks) {
        const mainTeams = [...new Set(tasks.map(task => task['메인팀']))];
        const workTeams = [...new Set(tasks.map(task => task['작업팀']))];

        const filterContainer = document.createElement('div');
        filterContainer.className = 'mb-3';

        filterContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-md-6">
                    <select id="mainTeamFilter" class="form-select form-select-sm">
                        <option value="">모든 메인팀</option>
                        ${mainTeams.map(team => `<option value="${team}">${team}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <select id="workTeamFilter" class="form-select form-select-sm">
                        <option value="">모든 작업팀</option>
                        ${workTeams.map(team => `<option value="${team}">${team}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;

        app.prepend(filterContainer);

        document.getElementById('mainTeamFilter').addEventListener('change', applyFilters);
        document.getElementById('workTeamFilter').addEventListener('change', applyFilters);
    }

    // Function to apply filters and re-render
    function applyFilters() {
        const selectedMainTeam = document.getElementById('mainTeamFilter').value;
        const selectedWorkTeam = document.getElementById('workTeamFilter').value;

        let filteredTasks = allTasks;

        if (selectedMainTeam) {
            filteredTasks = filteredTasks.filter(task => task['메인팀'] === selectedMainTeam);
        }
        if (selectedWorkTeam) {
            filteredTasks = filteredTasks.filter(task => task['작업팀'] === selectedWorkTeam);
        }

        const groupedTasks = groupTasksByTeam(filteredTasks);
        render(groupedTasks);
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