// admin-dashboard.js - Tableau de bord administrateur

// Vérification de la connexion
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboardData();
    setupEventListeners();
});

// Vérifier si l'admin est connecté
function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Afficher le nom de l'admin
    const adminName = sessionStorage.getItem('adminUsername') || 'admin';
    document.getElementById('adminName').textContent = adminName;
}

// Déconnexion
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    window.location.href = 'admin-login.html';
}

// Navigation entre sections
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les boutons du menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Afficher la section sélectionnée
    document.getElementById(sectionId).classList.add('active');
    
    // Activer le bouton du menu correspondant
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Charger les données spécifiques à la section
    switch(sectionId) {
        case 'affiliates':
            loadAffiliatesData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Charger les données du dashboard
function loadDashboardData() {
    const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
    const adminData = JSON.parse(localStorage.getItem('adminData')) || {};
    
    // Statistiques principales
    document.getElementById('totalAffiliates').textContent = affiliates.length;
    
    const totalCommissions = affiliates.reduce((sum, aff) => sum + (aff.sales || 0) * 0.15, 0);
    document.getElementById('totalCommissions').textContent = totalCommissions.toFixed(2) + '€';
    
    const pendingPayments = affiliates.filter(aff => (aff.sales || 0) * 0.15 >= 50).length;
    document.getElementById('pendingPayments').textContent = pendingPayments;
    
    document.getElementById('monthlyRevenue').textContent = (totalCommissions * 0.3).toFixed(2) + '€';
    
    // Affiliés récents
    displayRecentAffiliates(affiliates.slice(-5));
}

// Afficher les affiliés récents
function displayRecentAffiliates(affiliates) {
    const container = document.getElementById('recentAffiliatesList');
    container.innerHTML = '';
    
    if (affiliates.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun affilié pour le moment</p>';
        return;
    }
    
    affiliates.forEach(affiliate => {
        const div = document.createElement('div');
        div.className = 'affiliate-item';
        div.innerHTML = `
            <strong>${affiliate.fullName}</strong>
            <span>${affiliate.email}</span>
            <small>Inscrit le ${new Date(affiliate.registrationDate).toLocaleDateString()}</small>
        `;
        container.appendChild(div);
    });
}

// Charger les données des affiliés
function loadAffiliatesData() {
    const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
    const tbody = document.getElementById('affiliatesTableBody');
    tbody.innerHTML = '';
    
    affiliates.forEach((affiliate, index) => {
        const commission = (affiliate.sales || 0) * 0.15;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${affiliate.id || 'AFF' + (index + 1)}</td>
            <td>${affiliate.fullName}</td>
            <td>${affiliate.email}</td>
            <td>${affiliate.sales || 0}</td>
            <td>${commission.toFixed(2)}€</td>
            <td>
                <span class="status ${commission >= 50 ? 'pending' : 'active'}">
                    ${commission >= 50 ? 'À payer' : 'Actif'}
                </span>
            </td>
            <td>
                <button onclick="editAffiliate(${index})" class="action-btn small">✏️</button>
                <button onclick="deleteAffiliate(${index})" class="action-btn small danger">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Charger les données des paiements
function loadPaymentsData() {
    const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
    const container = document.getElementById('paymentsContainer');
    container.innerHTML = '';
    
    let totalAmount = 0;
    let hasPayments = false;
    
    affiliates.forEach((affiliate, index) => {
        const commission = (affiliate.sales || 0) * 0.15;
        if (commission >= 50) {
            hasPayments = true;
            totalAmount += commission;
            
            const paymentDiv = document.createElement('div');
            paymentDiv.className = 'payment-item';
            paymentDiv.innerHTML = `
                <div class="payment-info">
                    <strong>${affiliate.fullName}</strong>
                    <span>${affiliate.email}</span>
                    <small>${affiliate.paymentMethod || 'PayPal'}: ${affiliate.paymentDetails}</small>
                </div>
                <div class="payment-amount">
                    <strong>${commission.toFixed(2)}€</strong>
                    <button onclick="processPayment(${index})" class="action-btn primary small">Payer</button>
                </div>
            `;
            container.appendChild(paymentDiv);
        }
    });
    
    if (!hasPayments) {
        container.innerHTML = '<p class="no-data">Aucun paiement en attente</p>';
    }
}

// Traiter un paiement
function processPayment(affiliateIndex) {
    const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
    if (affiliates[affiliateIndex]) {
        // Réinitialiser les ventes après paiement
        affiliates[affiliateIndex].sales = 0;
        affiliates[affiliateIndex].lastPayment = new Date().toISOString();
        
        localStorage.setItem('affiliates', JSON.stringify(affiliates));
        alert(`✅ Paiement effectué pour ${affiliates[affiliateIndex].fullName}`);
        
        // Recharger les données
        loadPaymentsData();
        loadDashboardData();
    }
}

// Calculer les paiements mensuels
function calculateMonthlyPayments() {
    loadPaymentsData();
    alert('🧮 Calcul des paiements terminé !');
}

// Exporter les données
function exportAffiliates() {
    const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
    if (affiliates.length === 0) {
        alert('❌ Aucune donnée à exporter');
        return;
    }
    
    let csv = 'ID,Nom,Email,Ventes,Commission,Méthode de paiement\n';
    affiliates.forEach(aff => {
        const commission = (aff.sales || 0) * 0.15;
        csv += `${aff.id || 'N/A'},${aff.fullName},${aff.email},${aff.sales || 0},${commission},${aff.paymentMethod || 'N/A'}\n`;
    });
    
    downloadCSV(csv, 'affilies_helloreplayfx.csv');
}

function exportPayments() {
    alert('📄 Fonction d\'export des paiements');
}

// Télécharger CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Gestion des paramètres
function loadSettings() {
    const adminData = JSON.parse(localStorage.getItem('adminData')) || {};
    
    // Logo actuel
    const currentLogo = document.getElementById('currentLogo');
    if (adminData.logo && adminData.logo !== 'images/logo.png') {
        currentLogo.src = adminData.logo;
    }
    
    // Annonces actives
    displayAnnouncements(adminData.annonces || []);
}

// Afficher les annonces
function displayAnnouncements(annonces) {
    const container = document.getElementById('activeAnnouncements');
    container.innerHTML = '';
    
    annonces.forEach(annonce => {
        const div = document.createElement('div');
        div.className = 'announcement-item';
        div.style.background = annonce.color;
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.margin = '5px 0';
        div.style.borderRadius = '5px';
        
        div.innerHTML = `
            <p>${annonce.text}</p>
            <small>Publié le ${annonce.date}</small>
            <button onclick="deleteAnnouncement(${annonce.id})" style="float: right; background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer;">×</button>
        `;
        container.appendChild(div);
    });
}

// Publier une annonce
function publishAnnouncement() {
    const text = document.getElementById('announcementText').value;
    const color = document.getElementById('announcementColor').value;
    
    if (!text.trim()) {
        alert('❌ Veuillez saisir une annonce');
        return;
    }
    
    const adminData = JSON.parse(localStorage.getItem('adminData')) || { annonces: [] };
    const annonce = {
        id: Date.now(),
        text: text,
        color: color,
        date: new Date().toLocaleDateString()
    };
    
    adminData.annonces = adminData.annonces || [];
    adminData.annonces.push(annonce);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    
    document.getElementById('announcementText').value = '';
    displayAnnouncements(adminData.annonces);
    alert('✅ Annonce publiée !');
}

// Supprimer une annonce
function deleteAnnouncement(id) {
    const adminData = JSON.parse(localStorage.getItem('adminData')) || {};
    if (adminData.annonces) {
        adminData.annonces = adminData.annonces.filter(a => a.id !== id);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        displayAnnouncements(adminData.annonces);
    }
}

// Upload logo
function uploadLogo() {
    const fileInput = document.getElementById('logoUpload');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const adminData = JSON.parse(localStorage.getItem('adminData')) || {};
            adminData.logo = e.target.result;
            localStorage.setItem('adminData', JSON.stringify(adminData));
            
            document.getElementById('currentLogo').src = e.target.result;
            alert('✅ Logo mis à jour !');
        };
        reader.readAsDataURL(file);
    }
}

// Sauvegarder les paramètres
function saveSettings() {
    const commissionRate = document.getElementById('commissionRate').value;
    const payoutThreshold = document.getElementById('payoutThreshold').value;
    
    const adminData = JSON.parse(localStorage.getItem('adminData')) || {};
    adminData.settings = {
        commissionRate: parseInt(commissionRate),
        payoutThreshold: parseInt(payoutThreshold)
    };
    
    localStorage.setItem('adminData', JSON.stringify(adminData));
    alert('✅ Paramètres sauvegardés !');
}

// Événements
function setupEventListeners() {
    // Recherche d'affiliés
    const searchInput = document.getElementById('searchAffiliate');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterAffiliates(this.value);
        });
    }
}

// Filtrer les affiliés
function filterAffiliates(searchTerm) {
    const rows = document.querySelectorAll('#affiliatesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

// Éditer un affilié
function editAffiliate(index) {
    alert(`✏️ Édition de l'affilié #${index + 1} (fonctionnalité avancée)`);
}

// Supprimer un affilié
function deleteAffiliate(index) {
    if (confirm('❌ Supprimer cet affilié ?')) {
        const affiliates = JSON.parse(localStorage.getItem('affiliates')) || [];
        affiliates.splice(index, 1);
        localStorage.setItem('affiliates', JSON.stringify(affiliates));
        loadAffiliatesData();
        loadDashboardData();
        alert('✅ Affilié supprimé');
    }
}

// Styles pour les états
const style = document.createElement('style');
style.textContent = `
    .affiliate-item, .payment-item {
        background: white;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 8px;
        border-left: 4px solid #3498db;
    }
    
    .status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .status.pending { background: #fff3cd; color: #856404; }
    .status.active { background: #d1ecf1; color: #0c5460; }
    
    .no-data {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
        font-style: italic;
    }
    
    .action-btn.small {
        padding: 5px 10px;
        font-size: 0.8rem;
        margin: 0 2px;
    }
    
    .action-btn.danger {
        background: #e74c3c;
    }
    
    .action-btn.danger:hover {
        background: #c0392b;
    }
`;
document.head.appendChild(style);
