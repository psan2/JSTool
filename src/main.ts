// Main entry point for the family history application

import { UIManager } from './ui.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Family History Citizenship Tool - Starting...');

    try {
        // Initialize the UI manager
        new UIManager();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);

        // Show error message to user
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
            `;
            errorDiv.innerHTML = `
                <h3>Application Error</h3>
                <p>Failed to initialize the Family History Citizenship Tool. Please refresh the page and try again.</p>
                <p><small>Error: ${error instanceof Error ? error.message : 'Unknown error'}</small></p>
            `;
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
});

// Handle any unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
