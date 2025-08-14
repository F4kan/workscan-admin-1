
        // Authentication
        let isAuthenticated = false;
        const users = [
            { username: 'admin', password: 'admin123', email: 'admin@coffee.com', status: 'active' }
        ];

        function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                isAuthenticated = true;
                document.getElementById('loginContainer').classList.remove('active');
                document.getElementById('dashboardContainer').style.display = 'block';
                document.getElementById('adminName').textContent = username;
                showNotification('Giriş başarılı!', 'success');
                renderUsers();
                updateDashboardData();
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

        function checkAuth() {
            if (!isAuthenticated) {
                document.getElementById('loginContainer').classList.add('active');
                document.getElementById('dashboardContainer').style.display = 'none';
            } else {
                document.getElementById('loginContainer').classList.remove('active');
                document.getElementById('dashboardContainer').style.display = 'block';
            }
        }

        // Page Navigation
        function showPage(pageId) {
            if (!isAuthenticated) return;
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
                page.classList.add('hidden');
            });
            document.querySelectorAll('.sidebar li').forEach(li => {
                li.classList.remove('active');
            });

            const selectedPage = document.getElementById(pageId);
            selectedPage.classList.remove('hidden');
            setTimeout(() => {
                selectedPage.classList.add('active');
            }, 10);

            document.querySelector(`.sidebar li[onclick="showPage('${pageId}')"]`).classList.add('active');
        }

        // User Management
        function addUser() {
            if (!isAuthenticated) return;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const email = document.getElementById('email').value;

            if (!username || !password || !email) {
                showNotification('Lütfen tüm alanları doldurun!', 'error');
                return;
            }

            if (users.find(u => u.username === username)) {
                showNotification('Bu kullanıcı adı zaten mevcut!', 'error');
                return;
            }

            users.push({ username, password, email, status: 'active' });
            renderUsers();
            document.getElementById('addUserForm').reset();
            document.getElementById('totalUsers').textContent = users.length.toLocaleString();
            showNotification(`${username} kullanıcısı eklendi!`, 'success');
            updatePersonnelChart();
        }

        function removeUser(index) {
            if (!isAuthenticated) return;
            if (index === 0) {
                showNotification('Admin kullanıcısı silinemez!', 'error');
                return;
            }
            const user = users[index];
            users.splice(index, 1);
            renderUsers();
            document.getElementById('totalUsers').textContent = users.length.toLocaleString();
            showNotification(`${user.username} kullanıcısı silindi!`, 'success');
            updatePersonnelChart();
        }

        function renderUsers() {
            const tbody = document.querySelector('#userTable tbody');
            tbody.innerHTML = '';
            users.forEach((user, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span style="color: #daa520;">● ${user.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
                    <td><button onclick="removeUser(${index})" ${index === 0 ? 'disabled' : ''}>Sil</button></td>
                `;
                tbody.appendChild(tr);
            });
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
            const sessionId = Date.now() + Math.random().toString(36).substr(2, 9);

            const formats = [
                `☕ QR Kod #${randomNum}\n⏰ ${timestamp}\n🆔 ${id}\n📊 Tarama: ${qrData.scanCount}\n🔄 Yenileme: ${qrData.refreshCount}\n🎲 Rastgele: ${sessionId}`,
                `🌟 Dinamik QR - ${randomNum}\n📅 Tarih: ${timestamp}\n🔑 Kimlik: ${id}\n📈 İstatistik: T${qrData.scanCount}/Y${qrData.refreshCount}\n⚡ Oturum: ${sessionId}`,
                `🚀 QR-${randomNum}\n${timestamp}\nID: ${id}\nTarama/Yenileme: ${qrData.scanCount}/${qrData.refreshCount}\nToken: ${sessionId}`,
                `📱 QR Kodu\nNumara: ${randomNum}\nZaman: ${timestamp}\nBenzersiz ID: ${id}\nSayaçlar: ${qrData.scanCount}+${qrData.refreshCount}\nHash: ${sessionId}`
            ];

            const selectedFormat = formats[Math.floor(Math.random() * formats.length)];
            const scanUrl = `${window.location.origin}${window.location.pathname}?scan=${id}&r=${randomNum}&t=${Date.now()}`;

            return {
                id: id,
                content: selectedFormat,
                url: scanUrl,
                randomNum: randomNum,
                sessionId: sessionId
            };
        }

        function generateNewQR(isManualRefresh = true) {
            if (!isAuthenticated) return;
            const qrImage = document.getElementById('qrImage');
            const loading = document.getElementById('loading');
            const qrContainer = document.getElementById('qrContainer');

            loading.style.display = 'block';
            qrImage.style.opacity = '0.5';

            if (isManualRefresh) {
                qrData.refreshCount++;
            }

            const qrInfo = generateQRContent();
            qrData.currentId = qrInfo.id;
            qrData.lastUpdate = new Date().toLocaleString('tr-TR');

            const size = 280;
            const qzone = 2;

            const qrUrl = `${QR_API_BASE}?size=${size}x${size}&data=${encodeURIComponent(qrInfo.content)}&bgcolor=f0eee4&color=7a7a7a&qzone=${qzone}&format=png&ecc=M&margin=0&v=${Date.now()}`;

            qrImage.src = '';

            setTimeout(() => {
                qrImage.src = qrUrl;
                qrImage.onload = function() {
                    loading.style.display = 'none';
                    qrImage.style.opacity = '1';
                    qrContainer.classList.add('qr-changing');
                    setTimeout(() => {
                        qrContainer.classList.remove('qr-changing');
                    }, 500);
                    updateStats();
                    showNotification('Yeni QR kod oluşturuldu!', 'success');
                };

                qrImage.onerror = function() {
                    const fallbackUrl = `${QR_API_BASE}?size=280x280&data=${encodeURIComponent(qrInfo.id + ' - ' + Date.now())}&format=png&color=7a7a7a&bgcolor=f0eee4&v=${Date.now()}`;
                    qrImage.src = fallbackUrl;
                    showNotification('QR kod yüklenemedi, yedek oluşturuldu!', 'error');
                };
            }, 500);
        }

        function updateStats() {
            document.getElementById('scanCount').textContent = qrData.scanCount;
            document.getElementById('refreshCount').textContent = qrData.refreshCount;
            document.getElementById('lastUpdate').textContent = qrData.lastUpdate;
            document.getElementById('currentId').textContent = qrData.currentId;

            const qrInfo = generateQRContent();
            const preview = qrInfo.content.split('\n')[0];
            document.getElementById('qrPreview').textContent = preview;
        }

        function checkForScan() {
            if (!isAuthenticated) return;
            const urlParams = new URLSearchParams(window.location.search);
            const scanId = urlParams.get('scan');
            if (scanId && scanId !== qrData.currentId) {
                qrData.scanCount++;
                generateNewQR(false);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        // Dashboard Updates
        function updateDashboardData() {
            if (!isAuthenticated) return;
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
        }

        // Charts
        let dailyChart, personnelChart, monthlyChart;

        function initCharts() {
            // Daily Entries/Exits
            dailyChart = new Chart(document.getElementById('dailyChart'), {
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
                        legend: { position: 'top' },
                        title: { display: true, text: 'Günlük Giriş-Çıkışlar', color: '#7a7a7a' }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#7a7a7a' } },
                        x: { ticks: { color: '#7a7a7a' } }
                    }
                }
            });

            // Active Personnel
            personnelChart = new Chart(document.getElementById('personnelChart'), {
                type: 'pie',
                data: {
                    labels: ['Aktif', 'Pasif'],
                    datasets: [{
                        data: [users.filter(u => u.status === 'active').length, users.filter(u => u.status !== 'active').length],
                        backgroundColor: ['#d4a574', '#dcdad1'],
                        borderColor: '#d0cec4'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Personel Dağılımı', color: '#7a7a7a' }
                    }
                }
            });

            // Monthly Statistics
            monthlyChart = new Chart(document.getElementById('monthlyChart'), {
                type: 'bar',
                data: {
                    labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
                    datasets: [{
                        label: 'Aylık Aktivite',
                        data: [300, 350, 400, 380, 420, 390],
                        backgroundColor: '#d4a574',
                        borderColor: '#d0cec4',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Aylık İstatistikler', color: '#7a7a7a' }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#7a7a7a' } },
                        x: { ticks: { color: '#7a7a7a' } }
                    }
                }
            });
        }

        function updatePersonnelChart() {
            personnelChart.data.datasets[0].data = [
                users.filter(u => u.status === 'active').length,
                users.filter(u => u.status !== 'active').length
            ];
            personnelChart.update();
        }

        // Notifications
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const bgColor = type === 'success' ? 'rgba(44, 160, 44, 0.95)' : type === 'error' ? 'rgba(214, 40, 40, 0.95)' : 'rgba(44, 24, 16, 0.95)';
            notification.style.cssText = `
                position: fixed;
                top: 90px;
                right: 30px;
                background: ${bgColor};
                color: #f5deb3;
                padding: 15px 20px;
                border-radius: 10px;
                border: 2px solid rgba(210, 180, 140, 0.5);
                z-index: 9999;
                backdrop-filter: blur(20px);
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = `☕ ${message}`;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Admin Menu Toggle
        function toggleAdminMenu() {
            if (!isAuthenticated) return;
            const menu = document.getElementById('adminMenu');
            menu.classList.toggle('active');
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            if (isAuthenticated) {
                updateDashboardData();
                initCharts();
                generateNewQR(false);
                renderUsers();
                setInterval(checkForScan, 1500);
                setInterval(updateDashboardData, 30000);
            }
            console.log('☕ Coffee Admin Panel loaded successfully!');
        });

        document.addEventListener('keydown', function(e) {
            if ((e.key === 'r' || e.key === 'R') && isAuthenticated && document.getElementById('qr').classList.contains('active')) {
                e.preventDefault();
                generateNewQR(true);
            }
        });

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && isAuthenticated) {
                checkForScan();
            }
        });
  