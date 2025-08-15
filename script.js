 // Authentication
        let isAuthenticated = false;
        const users = [
            { id: 1, username: 'admin', password: 'admin123', email: 'admin@coffee.com', status: 'active', firstName: 'Admin', lastName: 'Yöneticisi', department: 'Yönetim' },
            { id: 2, username: 'ahmet', password: '123456', email: 'ahmet@coffee.com', status: 'active', firstName: 'Ahmet', lastName: 'Kaya', department: 'Barista' },
            { id: 3, username: 'mehmet', password: '123456', email: 'mehmet@coffee.com', status: 'active', firstName: 'Mehmet', lastName: 'Güner', department: 'Kasa' },
            { id: 4, username: 'seda', password: '123456', email: 'seda@coffee.com', status: 'active', firstName: 'Seda', lastName: 'Yılmaz', department: 'Barista' },
            { id: 5, username: 'can', password: '123456', email: 'can@coffee.com', status: 'active', firstName: 'Can', lastName: 'Demir', department: 'Temizlik' },
            { id: 6, username: 'elif', password: '123456', email: 'elif@coffee.com', status: 'active', firstName: 'Elif', lastName: 'Aslan', department: 'Barista' }
        ];

        let selectedUser = null;
        let userChart = null;
        let currentChartPeriod = 'daily';

        function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                isAuthenticated = true;
                document.getElementById('loginContainer').classList.remove('active');
                document.getElementById('dashboardContainer').style.display = 'block';
                document.getElementById('adminName').textContent = `${user.firstName} ${user.lastName}`;
                showNotification('Giriş başarılı!', 'success');
                renderUsers();
                updateDashboardData();
                initCharts();
                generateNewQR(false);
            } else {
                showNotification('Geçersiz kullanıcı adı veya şifre!', 'error');
            }
        }

        function logout() {
            isAuthenticated = false;
            document.getElementById('dashboardContainer').style.display = 'none';
            document.getElementById('loginContainer').classList.add('active');
            document.getElementById('loginForm').reset();
            showNotification('Çıkış yapıldı!', 'info');
            document.getElementById('adminMenu').classList.remove('active');
        }

        function toggleAdminMenu() {
            if (!isAuthenticated) return;
            const menu = document.getElementById('adminMenu');
            menu.classList.toggle('active');
        }

        // Page Navigation
        function showPage(pageId) {
            if (!isAuthenticated) return;
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.querySelectorAll('.sidebar li').forEach(li => {
                li.classList.remove('active');
            });

            const selectedPage = document.getElementById(pageId);
            selectedPage.classList.add('active');

            document.querySelector(`.sidebar li[onclick="showPage('${pageId}')"]`).classList.add('active');
        }

        // Add User Modal Functions
        function openAddUserModal() {
            document.getElementById('addUserModal').classList.add('active');
        }

        function closeAddUserModal() {
            document.getElementById('addUserModal').classList.remove('active');
            document.getElementById('addUserForm').reset();
        }

        // User Management
        function addUser() {
            if (!isAuthenticated) return;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const email = document.getElementById('email').value;
            const department = document.getElementById('department').value;

            if (!firstName || !lastName || !username || !password || !email || !department) {
                showNotification('Lütfen tüm alanları doldurun!', 'error');
                return;
            }

            if (users.find(u => u.username === username)) {
                showNotification('Bu kullanıcı adı zaten mevcut!', 'error');
                return;
            }

            if (users.find(u => u.email === email)) {
                showNotification('Bu e-posta adresi zaten mevcut!', 'error');
                return;
            }

            const newId = Math.max(...users.map(u => u.id)) + 1;
            users.push({ 
                id: newId, 
                username, 
                password, 
                email, 
                firstName,
                lastName,
                department,
                status: 'active' 
            });
            renderUsers();
            closeAddUserModal();
            updateDashboardData();
            showNotification(`${firstName} ${lastName} kullanıcısı başarıyla eklendi!`, 'success');
        }

        function removeUser(index) {
            if (!isAuthenticated) return;
            if (index === 0) {
                showNotification('Admin kullanıcısı silinemez!', 'error');
                return;
            }
            
            const user = users[index];
            if (confirm(`${user.firstName} ${user.lastName} kullanıcısını silmek istediğinizden emin misiniz?`)) {
                users.splice(index, 1);
                renderUsers();
                updateDashboardData();
                showNotification(`${user.firstName} ${user.lastName} kullanıcısı silindi!`, 'success');
            }
        }

        function showUserDetail(index) {
            selectedUser = users[index];
            document.getElementById('editUserId').value = selectedUser.id;
            document.getElementById('editFirstName').value = selectedUser.firstName;
            document.getElementById('editLastName').value = selectedUser.lastName;
            document.getElementById('editUsername').value = selectedUser.username;
            document.getElementById('editEmail').value = selectedUser.email;
            document.getElementById('editDepartment').value = selectedUser.department;
            document.getElementById('editPassword').value = '';
            
            updateUserActivityList();
            document.getElementById('userDetailModal').classList.add('active');
            
            setTimeout(() => {
                initUserChart();
            }, 100);
        }

        function closeUserDetail() {
            document.getElementById('userDetailModal').classList.remove('active');
            selectedUser = null;
        }

        function updateUser() {
            if (!selectedUser) return;
            
            const firstName = document.getElementById('editFirstName').value;
            const lastName = document.getElementById('editLastName').value;
            const username = document.getElementById('editUsername').value;
            const email = document.getElementById('editEmail').value;
            const department = document.getElementById('editDepartment').value;
            const password = document.getElementById('editPassword').value;

            if (!firstName || !lastName || !username || !email || !department) {
                showNotification('Tüm alanlar zorunludur!', 'error');
                return;
            }

            // Check if username exists (except current user)
            const existingUser = users.find(u => u.username === username && u.id !== selectedUser.id);
            if (existingUser) {
                showNotification('Bu kullanıcı adı zaten mevcut!', 'error');
                return;
            }

            // Check if email exists (except current user)
            const existingEmail = users.find(u => u.email === email && u.id !== selectedUser.id);
            if (existingEmail) {
                showNotification('Bu e-posta adresi zaten mevcut!', 'error');
                return;
            }

            const userIndex = users.findIndex(u => u.id === selectedUser.id);
            if (userIndex !== -1) {
                users[userIndex].firstName = firstName;
                users[userIndex].lastName = lastName;
                users[userIndex].username = username;
                users[userIndex].email = email;
                users[userIndex].department = department;
                if (password) {
                    users[userIndex].password = password;
                }
                
                renderUsers();
                updateUsersSummary();
                showNotification('Kullanıcı bilgileri güncellendi!', 'success');
                closeUserDetail();
            }
        }

        function renderUsers() {
            const tbody = document.querySelector('#userTable tbody');
            tbody.innerHTML = '';
            users.forEach((user, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.department}</td>
                    <td><span style="color: #22c55e;">● ${user.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        <button class="detail-btn" onclick="showUserDetail(${index})">Detay</button>
                        <button class="delete-btn" onclick="removeUser(${index})" ${index === 0 ? 'disabled' : ''}>Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function updateUsersSummary() {
            const activeUsers = users.filter(u => u.status === 'active').length;
            const totalUsers = users.length;
            
            // Bölüm istatistikleri
            const departments = {};
            users.forEach(user => {
                if (departments[user.department]) {
                    departments[user.department]++;
                } else {
                    departments[user.department] = 1;
                }
            });
            
            let usersList = '<div style="max-height: 400px; overflow-y: auto;">';
            users.forEach(user => {
                usersList += `
                    <div style="background: #f0eee4; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 2px;">${user.firstName} ${user.lastName}</div>
                            <div style="font-size: 12px; color: #6b6b6b;">${user.department}</div>
                        </div>
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${user.status === 'active' ? '#22c55e' : '#ef4444'};"></div>
                    </div>
                `;
            });
            usersList += '</div>';
            
            let departmentStats = '<div style="margin-top: 15px;">';
            Object.entries(departments).forEach(([dept, count]) => {
                departmentStats += `
                    <div style="background: #f0eee4; padding: 10px; border-radius: 6px; margin-bottom: 5px; display: flex; justify-content: space-between;">
                        <span style="font-size: 14px;">${dept}</span>
                        <span style="font-weight: 600; color: #7a7a7a;">${count}</span>
                    </div>
                `;
            });
            departmentStats += '</div>';
            
            document.getElementById('usersSummary').innerHTML = `
                <div style="background: #f0eee4; padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: center;">
                    <div style="font-weight: 700; font-size: 28px; margin-bottom: 5px; color: #7a7a7a;">${totalUsers}</div>
                    <div style="color: #6b6b6b; font-weight: 500;">Toplam Kullanıcı</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <h4 style="margin-bottom: 10px; color: #7a7a7a;">👥 Tüm Kullanıcılar</h4>
                    ${usersList}
                </div>
                <div>
                    <h4 style="margin-bottom: 10px; color: #7a7a7a;">🏢 Bölümler</h4>
                    ${departmentStats}
                </div>
            `;
        }

        function updateUserActivityList() {
            if (!selectedUser) return;
            
            const activities = [
                { action: 'Giriş yaptı', time: '2 dakika önce' },
                { action: 'Çıkış yaptı', time: '4 saat önce' },
                { action: 'Giriş yaptı', time: '8 saat önce' },
                { action: 'Çıkış yaptı', time: '12 saat önce' },
                { action: 'Giriş yaptı', time: '1 gün önce' }
            ];

            const activityList = document.getElementById('userActivityList');
            activityList.innerHTML = activities.map(activity => `
                <div style="padding: 10px; background: #f0eee4; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>${activity.action}</span>
                    <span style="color: #6b6b6b; font-size: 12px;">${activity.time}</span>
                </div>
            `).join('');
        }

        // QR Code Management
        let qrData = {
            scanCount: 0,
            refreshCount: 0,
            currentId: '',
            lastUpdate: ''
        };

        const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

        function generateUniqueId() {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            return `QR-${timestamp}-${random}`;
        }

        function generateQRContent() {
            const id = generateUniqueId();
            const timestamp = new Date().toLocaleString('tr-TR');
            const randomNum = Math.floor(Math.random() * 999999) + 100000;
            
            const content = `☕ QR Kod #${randomNum}\n⏰ ${timestamp}\n🆔 ${id}\n📊 Tarama: ${qrData.scanCount}`;
            
            return { id, content, randomNum };
        }

        function generateNewQR(isManualRefresh = true) {
            if (!isAuthenticated) return;
            const qrImage = document.getElementById('qrImage');
            const loading = document.getElementById('loading');

            loading.style.display = 'block';
            qrImage.style.opacity = '0.5';

            if (isManualRefresh) {
                qrData.refreshCount++;
            }

            const qrInfo = generateQRContent();
            qrData.currentId = qrInfo.id;
            qrData.lastUpdate = new Date().toLocaleString('tr-TR');

            const qrUrl = `${QR_API_BASE}?size=300x300&data=${encodeURIComponent(qrInfo.content)}&bgcolor=f0eee4&color=7a7a7a&qzone=2&format=png&ecc=M`;

            setTimeout(() => {
                qrImage.src = qrUrl;
                qrImage.onload = function() {
                    loading.style.display = 'none';
                    qrImage.style.opacity = '1';
                    updateQRStats();
                    showNotification('Yeni QR kod oluşturuldu!', 'success');
                };
            }, 500);
        }

        function updateQRStats() {
            document.getElementById('scanCount').textContent = qrData.scanCount;
            document.getElementById('refreshCount').textContent = qrData.refreshCount;
            document.getElementById('lastUpdate').textContent = qrData.lastUpdate;
            document.getElementById('currentId').textContent = qrData.currentId;
        }

        // Dashboard Updates
        function updateDashboardData() {
            if (!isAuthenticated) return;
            
            // Update dashboard cards
            document.getElementById('totalUsers').textContent = users.length;
            document.getElementById('activeUsers').textContent = users.filter(u => u.status === 'active').length;
            
            const activities = [
                { name: 'Ahmet Kaya', action: 'Giriş yaptı', time: '2 dakika önce', avatar: 'AK' },
                { name: 'Mehmet Güner', action: 'Çıkış yaptı', time: '5 dakika önce', avatar: 'MG' },
                { name: 'Seda Yılmaz', action: 'Giriş yaptı', time: '12 dakika önce', avatar: 'SY' },
                { name: 'Can Demir', action: 'Çıkış yaptı', time: '18 dakika önce', avatar: 'CD' },
                { name: 'Elif Aslan', action: 'Giriş yaptı', time: '25 dakika önce', avatar: 'EA' }
            ];

            const activitiesContainer = document.getElementById('recentActivities');
            activitiesContainer.innerHTML = '';
            activities.forEach(activity => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                div.innerHTML = `
                    <div class="activity-avatar">${activity.avatar}</div>
                    <div class="activity-content">
                        <div class="activity-user">${activity.name}</div>
                        <div class="activity-action">${activity.action}</div>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                `;
                activitiesContainer.appendChild(div);
            });

            updateUsersSummary();
        }

        // Charts
        let dailyChart, personnelChart;

        function initCharts() {
            // Daily Entries/Exits
            const dailyCtx = document.getElementById('dailyChart').getContext('2d');
            dailyChart = new Chart(dailyCtx, {
                type: 'line',
                data: {
                    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                    datasets: [
                        {
                            label: 'Girişler',
                            data: [120, 150, 130, 170, 160, 140, 110],
                            borderColor: '#d4a574',
                            backgroundColor: 'rgba(212, 165, 116, 0.2)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Çıkışlar',
                            data: [100, 130, 110, 150, 140, 120, 90],
                            borderColor: '#8b4513',
                            backgroundColor: 'rgba(139, 69, 19, 0.2)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });

            // Personnel Distribution
            const personnelCtx = document.getElementById('personnelChart').getContext('2d');
            personnelChart = new Chart(personnelCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Aktif', 'Pasif'],
                    datasets: [{
                        data: [users.filter(u => u.status === 'active').length, users.filter(u => u.status !== 'active').length],
                        backgroundColor: ['#22c55e', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#f0eee4'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        function initUserChart() {
            if (!selectedUser) return;
            
            const ctx = document.getElementById('userChart').getContext('2d');
            
            if (userChart) {
                userChart.destroy();
            }

            const data = getChartData(currentChartPeriod);
            
            userChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Girişler',
                            data: data.entries,
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Çıkışlar',
                            data: data.exits,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { 
                            display: true, 
                            text: `${selectedUser.firstName} ${selectedUser.lastName} - ${getPeriodTitle(currentChartPeriod)} Giriş-Çıkış Grafiği`
                        }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        function changeChartPeriod(period) {
            currentChartPeriod = period;
            
            document.querySelectorAll('.chart-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            event.target.classList.add('active');
            
            initUserChart();
        }

        function getChartData(period) {
            switch(period) {
                case 'daily':
                    return {
                        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                        entries: [0, 1, 15, 3, 8, 2],
                        exits: [0, 0, 2, 12, 14, 1]
                    };
                case 'weekly':
                    return {
                        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                        entries: [8, 9, 7, 8, 9, 3, 1],
                        exits: [8, 9, 7, 8, 9, 3, 1]
                    };
                case 'monthly':
                    return {
                        labels: ['Hft 1', 'Hft 2', 'Hft 3', 'Hft 4'],
                        entries: [32, 35, 28, 30],
                        exits: [32, 35, 28, 30]
                    };
                default:
                    return getChartData('daily');
            }
        }

        function getPeriodTitle(period) {
            switch(period) {
                case 'daily': return 'Günlük';
                case 'weekly': return 'Haftalık';
                case 'monthly': return 'Aylık';
                default: return 'Günlük';
            }
        }

        // Notifications
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const bgColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 
                           type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 
                           'rgba(122, 122, 122, 0.95)';
            
            notification.style.cssText = `
                position: fixed;
                top: 30px;
                right: 30px;
                background: ${bgColor};
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                font-weight: 500;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            `;
            notification.textContent = `☕ ${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            if (!isAuthenticated) {
                document.getElementById('loginContainer').classList.add('active');
            }
        });

        // Close modals when clicking outside
        document.getElementById('userDetailModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeUserDetail();
            }
        });

        document.getElementById('addUserModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeAddUserModal();
            }
        });

        // Close admin menu when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.admin-profile')) {
                document.getElementById('adminMenu').classList.remove('active');
            }
        });

        // Initialize on page load
        if (isAuthenticated) {
            updateDashboardData();
        }