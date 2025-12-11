// UI management for the family history application

import { Ancestor, AncestorFormData, PartialDate, LocationEvent, MarriageFormData, DivorceFormData, NaturalizationFormData } from './types.js';
import { StorageManager } from './storage.js';

export class UIManager {
    private storage: StorageManager;
    private currentEditingId: string | null = null;
    private marriageCounter = 0;
    private divorceCounter = 0;
    private naturalizationCounter = 0;

    constructor() {
        this.storage = StorageManager.getInstance();
        this.initializeEventListeners();
        this.renderAncestors();

        // Try to load data from URL on initialization
        if (this.storage.loadFromUrlOnInit()) {
            this.renderAncestors();
            this.showNotification('Data loaded from URL successfully!', 'success');
        }
    }

    private initializeEventListeners(): void {
        // Main control buttons
        document.getElementById('add-ancestor-btn')?.addEventListener('click', () => this.openAncestorModal());
        document.getElementById('import-btn')?.addEventListener('click', () => this.openImportExportModal());
        document.getElementById('export-btn')?.addEventListener('click', () => this.openImportExportModal());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.confirmClearAll());

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = (e.target as Element).closest('.modal') as HTMLElement;
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    (modal as HTMLElement).style.display = 'none';
                }
            });
        });

        // Ancestor form
        document.getElementById('ancestor-form')?.addEventListener('submit', (e) => this.handleAncestorFormSubmit(e));
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.closeAncestorModal());

        // Dynamic event buttons
        document.getElementById('add-marriage-btn')?.addEventListener('click', () => this.addMarriageEntry());
        document.getElementById('add-divorce-btn')?.addEventListener('click', () => this.addDivorceEntry());
        document.getElementById('add-naturalization-btn')?.addEventListener('click', () => this.addNaturalizationEntry());

        // Import/Export functionality
        document.getElementById('copy-url-btn')?.addEventListener('click', () => this.copyShareableUrl());
        document.getElementById('copy-data-btn')?.addEventListener('click', () => this.copyDataString());
        document.getElementById('import-data-btn')?.addEventListener('click', () => this.handleImportData());
    }

    private openAncestorModal(ancestor?: Ancestor): void {
        const modal = document.getElementById('ancestor-modal') as HTMLElement;
        const title = document.getElementById('modal-title') as HTMLElement;

        if (ancestor) {
            title.textContent = 'Edit Ancestor';
            this.currentEditingId = ancestor.id;
            this.populateForm(ancestor);
        } else {
            title.textContent = 'Add Ancestor';
            this.currentEditingId = null;
            this.clearForm();
        }

        modal.style.display = 'block';
    }

    private closeAncestorModal(): void {
        const modal = document.getElementById('ancestor-modal') as HTMLElement;
        modal.style.display = 'none';
        this.currentEditingId = null;
        this.clearForm();
    }

    private openImportExportModal(): void {
        const modal = document.getElementById('import-export-modal') as HTMLElement;
        const exportData = document.getElementById('export-data') as HTMLTextAreaElement;

        // Populate export data
        exportData.value = this.storage.exportAsBase64();

        modal.style.display = 'block';
    }

    private populateForm(ancestor: Ancestor): void {
        // Basic info
        (document.getElementById('first-name') as HTMLInputElement).value = ancestor.firstName || '';
        (document.getElementById('last-name') as HTMLInputElement).value = ancestor.lastName || '';
        (document.getElementById('relationship') as HTMLSelectElement).value = ancestor.relationship;

        // Birth info
        this.populateEventFields('birth', ancestor.birth);

        // Clear and populate marriages
        this.clearEventContainer('marriages');
        if (ancestor.marriages) {
            ancestor.marriages.forEach(marriage => this.addMarriageEntry(marriage));
        }

        // Clear and populate divorces
        this.clearEventContainer('divorces');
        if (ancestor.divorces) {
            ancestor.divorces.forEach(divorce => this.addDivorceEntry(divorce));
        }

        // Clear and populate naturalizations
        this.clearEventContainer('naturalizations');
        if (ancestor.naturalizations) {
            ancestor.naturalizations.forEach(naturalization => this.addNaturalizationEntry(naturalization));
        }

        // Death info
        this.populateEventFields('death', ancestor.death);
    }

    private populateEventFields(eventType: string, event?: LocationEvent): void {
        const yearField = document.getElementById(`${eventType}-year`) as HTMLInputElement;
        const monthField = document.getElementById(`${eventType}-month`) as HTMLInputElement;
        const dayField = document.getElementById(`${eventType}-day`) as HTMLInputElement;
        const countryField = document.getElementById(`${eventType}-country`) as HTMLInputElement;

        if (event) {
            yearField.value = event.date?.year?.toString() || '';
            monthField.value = event.date?.month?.toString() || '';
            dayField.value = event.date?.day?.toString() || '';
            countryField.value = event.country || '';
        } else {
            yearField.value = '';
            monthField.value = '';
            dayField.value = '';
            countryField.value = '';
        }
    }

    private clearForm(): void {
        const form = document.getElementById('ancestor-form') as HTMLFormElement;
        form.reset();
        this.clearEventContainer('marriages');
        this.clearEventContainer('divorces');
        this.clearEventContainer('naturalizations');
        this.marriageCounter = 0;
        this.divorceCounter = 0;
        this.naturalizationCounter = 0;
    }

    private clearEventContainer(eventType: string): void {
        const container = document.getElementById(`${eventType}-container`);
        if (container) {
            container.innerHTML = '';
        }
    }

    private addMarriageEntry(marriage?: LocationEvent): void {
        const container = document.getElementById('marriages-container');
        if (!container) return;

        const entryId = `marriage-${this.marriageCounter++}`;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'event-entry';
        entryDiv.id = entryId;

        entryDiv.innerHTML = `
            <div class="event-entry-header">
                <span class="event-entry-title">Marriage ${this.marriageCounter}</span>
                <button type="button" class="remove-event-btn" onclick="this.closest('.event-entry').remove()">Remove</button>
            </div>
            <div class="date-input-group">
                <label>Year:</label>
                <input type="number" name="marriage-year" min="1800" max="2024" value="${marriage?.date?.year || ''}">
                <label>Month:</label>
                <input type="number" name="marriage-month" min="1" max="12" value="${marriage?.date?.month || ''}">
                <label>Day:</label>
                <input type="number" name="marriage-day" min="1" max="31" value="${marriage?.date?.day || ''}">
            </div>
            <div class="form-group">
                <label>Country:</label>
                <input type="text" name="marriage-country" value="${marriage?.country || ''}">
            </div>
        `;

        container.appendChild(entryDiv);
    }

    private addDivorceEntry(divorce?: LocationEvent): void {
        const container = document.getElementById('divorces-container');
        if (!container) return;

        const entryId = `divorce-${this.divorceCounter++}`;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'event-entry';
        entryDiv.id = entryId;

        entryDiv.innerHTML = `
            <div class="event-entry-header">
                <span class="event-entry-title">Divorce ${this.divorceCounter}</span>
                <button type="button" class="remove-event-btn" onclick="this.closest('.event-entry').remove()">Remove</button>
            </div>
            <div class="date-input-group">
                <label>Year:</label>
                <input type="number" name="divorce-year" min="1800" max="2024" value="${divorce?.date?.year || ''}">
                <label>Month:</label>
                <input type="number" name="divorce-month" min="1" max="12" value="${divorce?.date?.month || ''}">
                <label>Day:</label>
                <input type="number" name="divorce-day" min="1" max="31" value="${divorce?.date?.day || ''}">
            </div>
            <div class="form-group">
                <label>Country:</label>
                <input type="text" name="divorce-country" value="${divorce?.country || ''}">
            </div>
        `;

        container.appendChild(entryDiv);
    }

    private addNaturalizationEntry(naturalization?: LocationEvent): void {
        const container = document.getElementById('naturalizations-container');
        if (!container) return;

        const entryId = `naturalization-${this.naturalizationCounter++}`;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'event-entry';
        entryDiv.id = entryId;

        entryDiv.innerHTML = `
            <div class="event-entry-header">
                <span class="event-entry-title">Naturalization ${this.naturalizationCounter}</span>
                <button type="button" class="remove-event-btn" onclick="this.closest('.event-entry').remove()">Remove</button>
            </div>
            <div class="date-input-group">
                <label>Year:</label>
                <input type="number" name="naturalization-year" min="1800" max="2024" value="${naturalization?.date?.year || ''}">
                <label>Month:</label>
                <input type="number" name="naturalization-month" min="1" max="12" value="${naturalization?.date?.month || ''}">
                <label>Day:</label>
                <input type="number" name="naturalization-day" min="1" max="31" value="${naturalization?.date?.day || ''}">
            </div>
            <div class="form-group">
                <label>Country:</label>
                <input type="text" name="naturalization-country" value="${naturalization?.country || ''}">
            </div>
        `;

        container.appendChild(entryDiv);
    }

    private handleAncestorFormSubmit(e: Event): void {
        e.preventDefault();

        const formData = this.getFormData();
        if (!formData) {
            return;
        }

        const ancestorData = this.formDataToAncestor(formData);

        try {
            if (this.currentEditingId) {
                // Update existing ancestor
                const updated = this.storage.updateAncestor(this.currentEditingId, ancestorData);
                if (updated) {
                    this.showNotification('Ancestor updated successfully!', 'success');
                } else {
                    this.showNotification('Failed to update ancestor.', 'error');
                }
            } else {
                // Add new ancestor
                this.storage.addAncestor(ancestorData);
                this.showNotification('Ancestor added successfully!', 'success');
            }

            this.renderAncestors();
            this.closeAncestorModal();
        } catch (error) {
            console.error('Error saving ancestor:', error);
            this.showNotification('Failed to save ancestor.', 'error');
        }
    }

    private getFormData(): AncestorFormData | null {
        const firstName = (document.getElementById('first-name') as HTMLInputElement).value.trim();
        const lastName = (document.getElementById('last-name') as HTMLInputElement).value.trim();
        const relationship = (document.getElementById('relationship') as HTMLSelectElement).value;

        if (!relationship) {
            this.showNotification('Please select a relationship.', 'error');
            return null;
        }

        // Collect marriages
        const marriages: MarriageFormData[] = [];
        document.querySelectorAll('#marriages-container .event-entry').forEach(entry => {
            const year = (entry.querySelector('input[name="marriage-year"]') as HTMLInputElement)?.value;
            const month = (entry.querySelector('input[name="marriage-month"]') as HTMLInputElement)?.value;
            const day = (entry.querySelector('input[name="marriage-day"]') as HTMLInputElement)?.value;
            const country = (entry.querySelector('input[name="marriage-country"]') as HTMLInputElement)?.value;
            marriages.push({ year, month, day, country });
        });

        // Collect divorces
        const divorces: DivorceFormData[] = [];
        document.querySelectorAll('#divorces-container .event-entry').forEach(entry => {
            const year = (entry.querySelector('input[name="divorce-year"]') as HTMLInputElement)?.value;
            const month = (entry.querySelector('input[name="divorce-month"]') as HTMLInputElement)?.value;
            const day = (entry.querySelector('input[name="divorce-day"]') as HTMLInputElement)?.value;
            const country = (entry.querySelector('input[name="divorce-country"]') as HTMLInputElement)?.value;
            divorces.push({ year, month, day, country });
        });

        // Collect naturalizations
        const naturalizations: NaturalizationFormData[] = [];
        document.querySelectorAll('#naturalizations-container .event-entry').forEach(entry => {
            const year = (entry.querySelector('input[name="naturalization-year"]') as HTMLInputElement)?.value;
            const month = (entry.querySelector('input[name="naturalization-month"]') as HTMLInputElement)?.value;
            const day = (entry.querySelector('input[name="naturalization-day"]') as HTMLInputElement)?.value;
            const country = (entry.querySelector('input[name="naturalization-country"]') as HTMLInputElement)?.value;
            naturalizations.push({ year, month, day, country });
        });

        return {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            relationship: relationship as any,
            birthYear: (document.getElementById('birth-year') as HTMLInputElement).value,
            birthMonth: (document.getElementById('birth-month') as HTMLInputElement).value,
            birthDay: (document.getElementById('birth-day') as HTMLInputElement).value,
            birthCountry: (document.getElementById('birth-country') as HTMLInputElement).value,
            marriages,
            divorces,
            naturalizations,
            deathYear: (document.getElementById('death-year') as HTMLInputElement).value,
            deathMonth: (document.getElementById('death-month') as HTMLInputElement).value,
            deathDay: (document.getElementById('death-day') as HTMLInputElement).value,
            deathCountry: (document.getElementById('death-country') as HTMLInputElement).value,
        };
    }

    private formDataToAncestor(formData: AncestorFormData): Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            firstName: formData.firstName,
            lastName: formData.lastName,
            relationship: formData.relationship,
            birth: this.createLocationEvent(
                formData.birthYear, formData.birthMonth, formData.birthDay, formData.birthCountry
            ),
            marriages: formData.marriages.map(m => this.createLocationEvent(m.year, m.month, m.day, m.country)).filter(Boolean) as LocationEvent[],
            divorces: formData.divorces.map(d => this.createLocationEvent(d.year, d.month, d.day, d.country)).filter(Boolean) as LocationEvent[],
            naturalizations: formData.naturalizations.map(n => this.createLocationEvent(n.year, n.month, n.day, n.country)).filter(Boolean) as LocationEvent[],
            death: this.createLocationEvent(
                formData.deathYear, formData.deathMonth, formData.deathDay, formData.deathCountry
            ),
        };
    }

    private createLocationEvent(year?: string, month?: string, day?: string, country?: string): LocationEvent | undefined {
        const hasDate = year || month || day;
        const hasCountry = country && country.trim();

        if (!hasDate && !hasCountry) {
            return undefined;
        }

        const event: LocationEvent = {};

        if (hasDate) {
            const date: PartialDate = {};
            if (year) date.year = parseInt(year);
            if (month) date.month = parseInt(month);
            if (day) date.day = parseInt(day);
            event.date = date;
        }

        if (hasCountry) {
            event.country = country.trim();
        }

        return event;
    }

    private renderAncestors(): void {
        const container = document.getElementById('ancestors-list') as HTMLElement;
        const ancestors = this.storage.getAllAncestors();

        if (ancestors.length === 0) {
            container.innerHTML = '<p class="empty-state">No ancestors added yet. Click "Add Ancestor" to get started.</p>';
            return;
        }

        // Sort ancestors by relationship hierarchy
        const relationshipOrder = ['self', 'parent', 'grandparent', 'great-grandparent', 'great-great-grandparent'];
        const sortedAncestors = ancestors.sort((a, b) => {
            const aIndex = relationshipOrder.indexOf(a.relationship);
            const bIndex = relationshipOrder.indexOf(b.relationship);
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
            // Secondary sort by creation date
            return a.createdAt - b.createdAt;
        });

        container.innerHTML = sortedAncestors.map(ancestor => this.createAncestorCard(ancestor)).join('');

        // Add event listeners to action buttons
        container.querySelectorAll('.edit-ancestor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.target as HTMLElement).dataset.id;
                const ancestor = ancestors.find(a => a.id === id);
                if (ancestor) {
                    this.openAncestorModal(ancestor);
                }
            });
        });

        container.querySelectorAll('.delete-ancestor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.target as HTMLElement).dataset.id;
                this.confirmDeleteAncestor(id!);
            });
        });
    }

    private createAncestorCard(ancestor: Ancestor): string {
        const displayName = this.getDisplayName(ancestor);

        return `
            <div class="ancestor-card">
                <div class="ancestor-header">
                    <div class="ancestor-name">${displayName}</div>
                    <div class="ancestor-relationship">${ancestor.relationship.replace('-', ' ')}</div>
                    <div class="ancestor-actions">
                        <button class="btn btn-small btn-secondary edit-ancestor" data-id="${ancestor.id}">Edit</button>
                        <button class="btn btn-small btn-danger delete-ancestor" data-id="${ancestor.id}">Delete</button>
                    </div>
                </div>
                <div class="ancestor-details">
                    ${this.createEventDetail('Birth', ancestor.birth)}
                    ${this.createMultipleEventDetails('Marriages', ancestor.marriages)}
                    ${this.createMultipleEventDetails('Divorces', ancestor.divorces)}
                    ${this.createMultipleEventDetails('Naturalizations', ancestor.naturalizations)}
                    ${this.createEventDetail('Death', ancestor.death)}
                </div>
            </div>
        `;
    }

    private getDisplayName(ancestor: Ancestor): string {
        if (ancestor.firstName || ancestor.lastName) {
            return `${ancestor.firstName || ''} ${ancestor.lastName || ''}`.trim();
        }
        // Default to relationship name if no name provided
        return ancestor.relationship.charAt(0).toUpperCase() + ancestor.relationship.slice(1).replace('-', ' ');
    }

    private createEventDetail(eventName: string, event?: LocationEvent): string {
        if (!event) {
            return '';
        }

        const dateStr = this.formatPartialDate(event.date);
        const countryStr = event.country || '';

        if (!dateStr && !countryStr) {
            return '';
        }

        return `
            <div class="detail-group">
                <h4>${eventName}</h4>
                ${dateStr ? `<div class="detail-item">Date: ${dateStr}</div>` : ''}
                ${countryStr ? `<div class="detail-item">Country: ${countryStr}</div>` : ''}
            </div>
        `;
    }

    private createMultipleEventDetails(eventName: string, events?: LocationEvent[]): string {
        if (!events || events.length === 0) {
            return '';
        }

        const eventItems = events.map((event, index) => {
            const dateStr = this.formatPartialDate(event.date);
            const countryStr = event.country || '';

            if (!dateStr && !countryStr) {
                return '';
            }

            return `
                <div class="detail-item">
                    <strong>${eventName.slice(0, -1)} ${index + 1}:</strong>
                    ${dateStr ? ` ${dateStr}` : ''}
                    ${countryStr ? ` (${countryStr})` : ''}
                </div>
            `;
        }).filter(Boolean).join('');

        if (!eventItems) {
            return '';
        }

        return `
            <div class="detail-group">
                <h4>${eventName}</h4>
                ${eventItems}
            </div>
        `;
    }

    private formatPartialDate(date?: PartialDate): string {
        if (!date) {
            return '';
        }

        const parts: string[] = [];
        if (date.year) parts.push(date.year.toString());
        if (date.month) parts.push(date.month.toString().padStart(2, '0'));
        if (date.day) parts.push(date.day.toString().padStart(2, '0'));

        return parts.join('-');
    }

    private confirmDeleteAncestor(id: string): void {
        if (confirm('Are you sure you want to delete this ancestor? This action cannot be undone.')) {
            if (this.storage.deleteAncestor(id)) {
                this.showNotification('Ancestor deleted successfully.', 'success');
                this.renderAncestors();
            } else {
                this.showNotification('Failed to delete ancestor.', 'error');
            }
        }
    }

    private confirmClearAll(): void {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.storage.clearAllData();
            this.renderAncestors();
            this.showNotification('All data cleared.', 'success');
        }
    }

    private copyShareableUrl(): void {
        const url = this.storage.exportAsUrl();
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('Shareable URL copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy URL to clipboard.', 'error');
        });
    }

    private copyDataString(): void {
        const data = this.storage.exportAsBase64();
        navigator.clipboard.writeText(data).then(() => {
            this.showNotification('Data string copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy data to clipboard.', 'error');
        });
    }

    private handleImportData(): void {
        const importField = document.getElementById('import-data') as HTMLTextAreaElement;
        const data = importField.value.trim();

        if (!data) {
            this.showNotification('Please enter data to import.', 'error');
            return;
        }

        let success = false;

        // Try to import as URL first
        if (data.includes('://')) {
            success = this.storage.importFromUrl(data);
        } else {
            // Try as base64 encoded data
            success = this.storage.importFromBase64(data);
        }

        if (success) {
            this.showNotification('Data imported successfully!', 'success');
            this.renderAncestors();
            importField.value = '';
            const modal = document.getElementById('import-export-modal') as HTMLElement;
            modal.style.display = 'none';
        } else {
            this.showNotification('Failed to import data. Please check the format.', 'error');
        }
    }

    private showNotification(message: string, type: 'success' | 'error'): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}
