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

    // Fetch data and render the main page
    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            const tasks = parseCSV(csvText);
            renderMainPage(tasks);
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            app.innerHTML = '<div class="alert alert-danger">데이터를 불러오는 데 실패했습니다. 구글 시트가 "웹에 게시" 되었는지, 링크가 올바른지 확인해주세요.</div>';
        });

    function renderMainPage(tasks) {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task['상태'] === '완료').length;
        const problemTasks = tasks.filter(task => task['상태'] === '문제');
        const onHoldTasks = tasks.filter(task => task['상태'] === '보류');

        const completionPercentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

        let mainPageContent = `
            <div class="card mb-4">
                <div class="card-header">전체 진행률</div>
                <div class="card-body text-center">
                    <h2 class="card-title">${completionPercentage}% 완료</h2>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${completionPercentage}%" aria-valuenow="${completionPercentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            </div>
        `;

        if (problemTasks.length > 0 || onHoldTasks.length > 0) {
            mainPageContent += `
                <div class="card mb-4">
                    <div class="card-header">문제 또는 보류 중인 공정</div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>메인팀</th>
                                        <th>작업팀</th>
                                        <th>메인업무</th>
                                        <th>상세업무</th>
                                        <th>상태</th>
                                        <th>메모</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            [...problemTasks, ...onHoldTasks].forEach(task => {
                const statusColor = statusColors[task['상태']] || 'secondary';
                mainPageContent += `
                                    <tr>
                                        <td>${task['메인팀']}</td>
                                        <td>${task['작업팀']}</td>
                                        <td>${task['메인업무']}</td>
                                        <td>${task['상세업무']}</td>
                                        <td><span class="badge bg-${statusColor}">${task['상태']}</span></td>
                                        <td>${task['메모']}</td>
                                    </tr>
                `;
            });

            mainPageContent += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        app.innerHTML = mainPageContent;
    }
});