class IdentityReconciliation {
    constructor() {
        this.baseUrl = window.location.origin;
        this.stats = {
            total: 0,
            successful: 0,
            errors: 0,
            totalResponseTime: 0
        };
        
        this.initializeEventListeners();
        this.loadStats();
    }

    initializeEventListeners() {
        // Form submission
        const form = document.getElementById('identifyForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Quick test buttons
        const testButtons = document.querySelectorAll('.test-btn');
        testButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickTest(e));
        });

        // Data control buttons
        document.getElementById('loadAllContacts').addEventListener('click', () => this.loadAllContacts());
        document.getElementById('loadStats').addEventListener('click', () => this.loadStats());
        document.getElementById('loadHierarchy').addEventListener('click', () => this.loadHierarchy());
        document.getElementById('refreshData').addEventListener('click', () => this.refreshAllData());

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Clear form on double click
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('dblclick', () => {
                input.value = '';
            });
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim();
        const phoneNumber = formData.get('phoneNumber').trim();
        
        // Validation
        if (!email && !phoneNumber) {
            this.showError('Please provide at least one field (email or phone number)');
            return;
        }

        const requestData = {};
        if (email) requestData.email = email;
        if (phoneNumber) requestData.phoneNumber = phoneNumber;

        await this.makeApiRequest(requestData);
    }

    handleQuickTest(event) {
        const button = event.target;
        const email = button.dataset.email;
        const phone = button.dataset.phone;
        
        // Fill form with test data
        document.getElementById('email').value = email || '';
        document.getElementById('phoneNumber').value = phone || '';
        
        // Submit automatically
        const requestData = {};
        if (email) requestData.email = email;
        if (phone) requestData.phoneNumber = phone;
        
        this.makeApiRequest(requestData);
    }

    async makeApiRequest(data) {
        const startTime = Date.now();
        
        try {
            this.showLoading(true);
            this.updateButtonState(true);
            
            const response = await fetch(`${this.baseUrl}/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const responseTime = Date.now() - startTime;
            const responseData = await response.json();
            
            this.updateStats(response.ok, responseTime);
            
            if (response.ok) {
                this.showSuccess(responseData, responseTime);
            } else {
                this.showError(responseData.error || 'Unknown error occurred', responseTime, response.status);
            }
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateStats(false, responseTime);
            this.showError(`Network error: ${error.message}`, responseTime);
        } finally {
            this.showLoading(false);
            this.updateButtonState(false);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        
        if (show) {
            loading.classList.remove('hidden');
            results.innerHTML = '';
        } else {
            loading.classList.add('hidden');
        }
    }

    updateButtonState(disabled) {
        const submitBtn = document.getElementById('submitBtn');
        const testBtns = document.querySelectorAll('.test-btn');
        
        submitBtn.disabled = disabled;
        testBtns.forEach(btn => btn.disabled = disabled);
        
        if (disabled) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            submitBtn.innerHTML = '<i class="fas fa-search"></i> Identify Contact';
        }
    }

    showSuccess(data, responseTime) {
        const results = document.getElementById('results');
        
        const html = `
            <div class="response-success">
                <div class="response-header">
                    <div class="response-status status-success">
                        <i class="fas fa-check-circle"></i>
                        Success (200 OK)
                    </div>
                    <div class="response-time">${responseTime}ms</div>
                </div>
                
                <div class="contact-details">
                    <h4 style="margin-bottom: 15px; color: #2d3748;">
                        <i class="fas fa-user"></i> Contact Information
                    </h4>
                    
                    <div class="contact-item">
                        <i class="fas fa-id-card"></i>
                        <strong>Primary Contact ID:</strong> ${data.contact.primaryContactId}
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <strong>Emails:</strong> ${data.contact.emails.join(', ') || 'None'}
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <strong>Phone Numbers:</strong> ${data.contact.phoneNumbers.join(', ') || 'None'}
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-link"></i>
                        <strong>Secondary Contact IDs:</strong> ${data.contact.secondaryContactIds.length > 0 ? data.contact.secondaryContactIds.join(', ') : 'None'}
                    </div>
                </div>
                
                <div class="response-body">${this.formatJson(data)}</div>
            </div>
        `;
        
        results.innerHTML = html;
    }

    showError(message, responseTime = null, status = null) {
        const results = document.getElementById('results');
        
        const statusText = status ? `Error (${status})` : 'Error';
        const timeText = responseTime ? `${responseTime}ms` : '';
        
        const html = `
            <div class="response-error">
                <div class="response-header">
                    <div class="response-status status-error">
                        <i class="fas fa-exclamation-circle"></i>
                        ${statusText}
                    </div>
                    ${timeText ? `<div class="response-time">${timeText}</div>` : ''}
                </div>
                
                <div style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
                    <strong>Error Message:</strong> ${message}
                </div>
                
                <div class="response-body">${JSON.stringify({ error: message }, null, 2)}</div>
            </div>
        `;
        
        results.innerHTML = html;
    }

    formatJson(data) {
        return JSON.stringify(data, null, 2);
    }

    updateStats(success, responseTime) {
        this.stats.total++;
        this.stats.totalResponseTime += responseTime;
        
        if (success) {
            this.stats.successful++;
        } else {
            this.stats.errors++;
        }
        
        this.saveStats();
        this.renderStats();
    }

    renderStats() {
        document.getElementById('totalRequests').textContent = this.stats.total;
        document.getElementById('successfulRequests').textContent = this.stats.successful;
        document.getElementById('errorRequests').textContent = this.stats.errors;
        
        const avgTime = this.stats.total > 0 
            ? Math.round(this.stats.totalResponseTime / this.stats.total)
            : 0;
        document.getElementById('avgResponseTime').textContent = `${avgTime}ms`;
    }

    saveStats() {
        localStorage.setItem('contacthub-stats', JSON.stringify(this.stats));
    }

    loadStats() {
        const saved = localStorage.getItem('contacthub-stats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
        }
        this.renderStats();
    }

    resetStats() {
        this.stats = {
            total: 0,
            successful: 0,
            errors: 0,
            totalResponseTime: 0
        };
        this.saveStats();
        this.renderStats();
    }

    // Data Loading Methods
    async loadAllContacts() {
        try {
            this.showTabLoading('contacts');
            const response = await fetch(`${this.baseUrl}/contacts`);
            const data = await response.json();
            
            if (response.ok) {
                this.renderContactsTable(data.contacts);
                this.switchTab('contacts');
            } else {
                this.showTabError('contacts', data.error || 'Failed to load contacts');
            }
        } catch (error) {
            this.showTabError('contacts', `Network error: ${error.message}`);
        }
    }

    async loadStats() {
        try {
            this.showTabLoading('stats');
            const response = await fetch(`${this.baseUrl}/stats`);
            const data = await response.json();
            
            if (response.ok) {
                this.renderStatsView(data);
                this.switchTab('stats');
            } else {
                this.showTabError('stats', data.error || 'Failed to load statistics');
            }
        } catch (error) {
            this.showTabError('stats', `Network error: ${error.message}`);
        }
    }

    async loadHierarchy() {
        try {
            this.showTabLoading('hierarchy');
            const response = await fetch(`${this.baseUrl}/hierarchy`);
            const data = await response.json();
            
            if (response.ok) {
                this.renderHierarchyView(data.hierarchy);
                this.switchTab('hierarchy');
            } else {
                this.showTabError('hierarchy', data.error || 'Failed to load hierarchy');
            }
        } catch (error) {
            this.showTabError('hierarchy', `Network error: ${error.message}`);
        }
    }

    async refreshAllData() {
        await Promise.all([
            this.loadAllContacts(),
            this.loadStats(),
            this.loadHierarchy()
        ]);
        showToast('Data refreshed successfully!');
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
    }

    showTabLoading(tabName) {
        const container = document.getElementById(`${tabName}Tab`) || 
                         document.querySelector(`#${tabName}-tab .data-table, #${tabName}-tab .stats-view, #${tabName}-tab .hierarchy-view`);
        
        if (container) {
            container.innerHTML = `
                <div class="loading-table">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div>Loading ${tabName}...</div>
                </div>
            `;
        }
    }

    showTabError(tabName, message) {
        const container = document.getElementById(`${tabName}Tab`) || 
                         document.querySelector(`#${tabName}-tab .data-table, #${tabName}-tab .stats-view, #${tabName}-tab .hierarchy-view`);
        
        if (container) {
            container.innerHTML = `
                <div class="table-placeholder">
                    <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
                    <div style="color: #e53e3e;">Error: ${message}</div>
                    <button onclick="window.identityApp.refreshAllData()" style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Rendering Methods
    renderContactsTable(contacts) {
        const container = document.getElementById('contactsTable');
        
        if (!contacts || contacts.length === 0) {
            container.innerHTML = `
                <div class="table-placeholder">
                    <i class="fas fa-inbox"></i>
                    <div>No contacts found in the database</div>
                </div>
            `;
            return;
        }

        const html = `
            <table class="contacts-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Phone Number</th>
                        <th>Precedence</th>
                        <th>Linked ID</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                    </tr>
                </thead>
                <tbody>
                    ${contacts.map(contact => `
                        <tr>
                            <td><strong>${contact.id}</strong></td>
                            <td>${contact.email || '<em>None</em>'}</td>
                            <td>${contact.phoneNumber || '<em>None</em>'}</td>
                            <td>
                                <span class="precedence-badge precedence-${contact.linkPrecedence}">
                                    ${contact.linkPrecedence}
                                </span>
                            </td>
                            <td>
                                ${contact.linkedId ? 
                                    `<a href="#" class="contact-link" onclick="window.identityApp.highlightContact(${contact.linkedId})">${contact.linkedId}</a>` : 
                                    '<em>None</em>'
                                }
                            </td>
                            <td>${new Date(contact.createdAt).toLocaleString()}</td>
                            <td>${new Date(contact.updatedAt).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }

    renderStatsView(stats) {
        const container = document.getElementById('statsView');
        
        const html = `
            <div class="stat-card">
                <h4>Total Contacts</h4>
                <div class="value">${stats.totalContacts}</div>
                <div class="description">All contacts in database</div>
            </div>
            
            <div class="stat-card">
                <h4>Primary Contacts</h4>
                <div class="value">${stats.primaryContacts}</div>
                <div class="description">Independent contact groups</div>
            </div>
            
            <div class="stat-card">
                <h4>Secondary Contacts</h4>
                <div class="value">${stats.secondaryContacts}</div>
                <div class="description">Linked to primary contacts</div>
            </div>
            
            <div class="stat-card">
                <h4>Unique Emails</h4>
                <div class="value">${stats.uniqueEmails}</div>
                <div class="description">Distinct email addresses</div>
            </div>
            
            <div class="stat-card">
                <h4>Unique Phones</h4>
                <div class="value">${stats.uniquePhones}</div>
                <div class="description">Distinct phone numbers</div>
            </div>
            
            <div class="stat-card">
                <h4>Contact Groups</h4>
                <div class="value">${stats.contactGroups}</div>
                <div class="description">${stats.avgContactsPerGroup} avg per group</div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderHierarchyView(hierarchy) {
        const container = document.getElementById('hierarchyView');
        
        if (!hierarchy || hierarchy.length === 0) {
            container.innerHTML = `
                <div class="table-placeholder">
                    <i class="fas fa-sitemap"></i>
                    <div>No contact hierarchies found</div>
                </div>
            `;
            return;
        }

        const html = hierarchy.map(group => `
            <div class="hierarchy-group">
                <div class="primary-contact">
                    <h4>
                        <i class="fas fa-crown"></i>
                        Primary Contact (ID: ${group.primaryContact.id})
                    </h4>
                    <div class="contact-details">
                        ${group.primaryContact.email ? `📧 ${group.primaryContact.email}` : ''}
                        ${group.primaryContact.email && group.primaryContact.phoneNumber ? ' • ' : ''}
                        ${group.primaryContact.phoneNumber ? `📞 ${group.primaryContact.phoneNumber}` : ''}
                        <br>
                        <small>Created: ${new Date(group.primaryContact.createdAt).toLocaleString()}</small>
                    </div>
                </div>
                
                ${group.secondaryContacts.length > 0 ? `
                    <div class="secondary-contacts">
                        ${group.secondaryContacts.map(secondary => `
                            <div class="secondary-contact">
                                <div class="secondary-info">
                                    <strong>Secondary Contact (ID: ${secondary.id})</strong>
                                    <div>
                                        ${secondary.email ? `📧 ${secondary.email}` : ''}
                                        ${secondary.email && secondary.phoneNumber ? ' • ' : ''}
                                        ${secondary.phoneNumber ? `📞 ${secondary.phoneNumber}` : ''}
                                    </div>
                                    <div class="secondary-meta">
                                        Created: ${new Date(secondary.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div style="padding: 15px 20px; color: #718096; font-style: italic;">No secondary contacts</div>'}
                
                <div class="consolidated-info">
                    <h5><i class="fas fa-compress-arrows-alt"></i> Consolidated Data</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <strong>Emails:</strong> ${group.consolidatedData.emails.join(', ') || 'None'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <strong>Phones:</strong> ${group.consolidatedData.phoneNumbers.join(', ') || 'None'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <strong>Total Contacts:</strong> ${group.consolidatedData.totalContacts}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    highlightContact(contactId) {
        // Find and highlight the contact in the table
        const rows = document.querySelectorAll('.contacts-table tbody tr');
        rows.forEach(row => {
            const idCell = row.querySelector('td:first-child');
            if (idCell && idCell.textContent.trim() === contactId.toString()) {
                row.style.background = '#fff3cd';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    row.style.background = '';
                }, 3000);
            }
        });
        
        // Switch to contacts tab if not already there
        this.switchTab('contacts');
    }
}

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('identifyForm');
        form.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        document.getElementById('email').value = '';
        document.getElementById('phoneNumber').value = '';
        document.getElementById('email').focus();
    }
});

// Add click-to-copy functionality for JSON responses
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('response-body')) {
        copyToClipboard(e.target.textContent);
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new IdentityReconciliation();
    
    // Make app globally available for debugging
    window.identityApp = app;
    
    console.log('ContactHub Identity Reconciliation GUI loaded successfully!');
    console.log('Keyboard shortcuts:');
    console.log('- Ctrl/Cmd + Enter: Submit form');
    console.log('- Escape: Clear form');
    console.log('- Double-click input: Clear field');
    console.log('- Click JSON response: Copy to clipboard');
});

// Service worker registration (optional, for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register service worker if available
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Add some developer utilities
window.devUtils = {
    resetStats: () => window.identityApp.resetStats(),
    exportStats: () => {
        const stats = localStorage.getItem('contacthub-stats');
        console.log('Current stats:', JSON.parse(stats || '{}'));
        return JSON.parse(stats || '{}');
    },
    testConnection: async () => {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            console.log('Health check:', data);
            return data;
        } catch (error) {
            console.error('Connection test failed:', error);
            return { error: error.message };
        }
    }
};
