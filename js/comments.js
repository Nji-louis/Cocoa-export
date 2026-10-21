(function () {
    'use strict';

    /*
    |--------------------------------------------------------------------------
    | Comments Configuration
    |--------------------------------------------------------------------------
    */

const backend = window.AppBackend || {};
const backendConfig = backend.config || {};

const API_BASE =
    `${backendConfig.baseUrl || 'https://api.cocoabridge.com'}${backendConfig.apiPrefix || '/api'}/comments`;




    /*
    |--------------------------------------------------------------------------
    | Identify the current page
    |--------------------------------------------------------------------------
    */

   function getPageIdentifier() {
    const path = window.location.pathname;

    // Blog detail pages use the article slug as their comment page ID.
    if (
        path.endsWith('/blog_detail.html') ||
        path.endsWith('blog_detail.html')
    ) {
        try {
            const params = new URLSearchParams(window.location.search);
            const slug =
                (params.get('slug') || '').trim().toLowerCase();

            if (slug) {
                return `/blog/${slug}`;
            }
        } catch (error) {
            console.warn('Unable to read blog slug:', error);
        }

        return '/blog/unknown';
    }

    let normalizedPath =
        path.replace(/\/index\.html$/, '/');

    if (normalizedPath.length > 1) {
        normalizedPath =
            normalizedPath.replace(/\/$/, '');
    }

    return normalizedPath || '/';
}


    /*
    |--------------------------------------------------------------------------
    | Escape HTML
    |--------------------------------------------------------------------------
    | Prevents submitted comments from injecting HTML/JavaScript.
    |--------------------------------------------------------------------------
    */

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }


    /*
    |--------------------------------------------------------------------------
    | Format date
    |--------------------------------------------------------------------------
    */

    function formatDate(dateString) {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Create Comments Section
    |--------------------------------------------------------------------------
    */

    function createCommentsSection() {
    /*
     * Remove the old legacy Blog Detail reply section if it is
     * still present from cached/legacy markup.
     */
    const currentPath = window.location.pathname;
    const isBlogDetail =
        currentPath.endsWith('/blog_detail.html') ||
        currentPath.endsWith('blog_detail.html');

    if (isBlogDetail) {
        document
            .querySelectorAll('.blog_d_page_li3')
            .forEach((element) => element.remove());
    }

    if (document.getElementById('cocoabridge-comments')) {
        return;
    }

    const section = document.createElement('section');

    section.id = 'cocoabridge-comments';
    section.className = 'cocoabridge-comments-section';

    section.innerHTML = `
        <div class="container">

            <div class="comments-header">
                <h2>Comments</h2>
                <p>Share your thoughts, questions, or feedback.</p>
            </div>

            <div id="comments-list" class="comments-list">
                <div class="comments-loading">
                    Loading comments...
                </div>
            </div>

            <div class="comments-form-wrapper">
                <h3>Leave a Comment</h3>

                <form id="cocoabridge-comment-form"
                      class="cocoabridge-comment-form">

                    <div class="comments-form-row">

                        <div class="comments-field">
                            <label for="comment-name">Name</label>

                            <input
                                type="text"
                                id="comment-name"
                                name="name"
                                maxlength="100"
                                required
                                autocomplete="name"
                                placeholder="Your name"
                            >
                        </div>

                        <div class="comments-field">
                            <label for="comment-email">Email</label>

                            <input
                                type="email"
                                id="comment-email"
                                name="email"
                                maxlength="255"
                                required
                                autocomplete="email"
                                placeholder="Your email"
                            >
                        </div>

                    </div>

                    <div class="comments-field">
                        <label for="comment-message">Comment</label>

                        <textarea
                            id="comment-message"
                            name="comment"
                            rows="6"
                            maxlength="5000"
                            required
                            placeholder="Write your comment..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        id="comment-submit"
                        class="btn btn-primary"
                    >
                        Submit Comment
                    </button>

                    <div
                        id="comment-form-message"
                        class="comment-form-message"
                        role="alert"
                        aria-live="polite"
                    ></div>

                </form>

                <p class="comments-note">
                    Comments are reviewed before they are published.
                </p>
            </div>

        </div>
    `;

    /*
     * Blog detail page:
     * Put the common comment system inside
     * the existing blog comments area.
     */
    const blogComments = document.getElementById('blog-detail-comments');

    if (blogComments) {
        blogComments.innerHTML = '';
        blogComments.appendChild(section);
        return;
    }

    /*
     * Home page:
     * Put comments before the footer.
     */
    const path = window.location.pathname;
    const isHomePage =
        path === '/' ||
        path.endsWith('/index.html');

    if (isHomePage) {
        const footer = document.querySelector('footer');

        if (footer) {
            footer.parentNode.insertBefore(section, footer);
            return;
        }

        document.body.appendChild(section);
    }
}




    /*
    |--------------------------------------------------------------------------
    | Load Approved Comments
    |--------------------------------------------------------------------------
    */

    async function loadComments() {
        const list = document.getElementById('comments-list');

        if (!list) {
            return;
        }

        const page = getPageIdentifier();

        try {
            const response = await fetch(
                `${API_BASE}?page=${encodeURIComponent(page)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load comments.');
            }

            if (!data.comments || data.comments.length === 0) {
                list.innerHTML = `
                    <div class="no-comments">
                        <p>No comments yet. Be the first to comment.</p>
                    </div>
                `;

                return;
            }

            list.innerHTML = data.comments.map(item => `
                <article class="comment-item">
                    <div class="comment-avatar">
                        ${escapeHtml(item.name.charAt(0).toUpperCase())}
                    </div>

                    <div class="comment-content">
                        <div class="comment-meta">
                            <strong>${escapeHtml(item.name)}</strong>
                            <span>${escapeHtml(formatDate(item.created_at))}</span>
                        </div>

                        <p>${escapeHtml(item.comment)}</p>
                    </div>
                </article>
            `).join('');

        } catch (error) {
            console.error('Comments loading error:', error);

            list.innerHTML = `
                <div class="comments-error">
                    <p>Comments could not be loaded at the moment.</p>
                </div>
            `;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Submit Comment
    |--------------------------------------------------------------------------
    */

    async function submitComment(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = document.getElementById('comment-submit');
        const messageBox = document.getElementById('comment-form-message');

        const name = document.getElementById('comment-name').value.trim();
        const email = document.getElementById('comment-email').value.trim();
        const comment = document.getElementById('comment-message').value.trim();

        messageBox.textContent = '';
        messageBox.className = 'comment-form-message';

        if (!name || !email || !comment) {
            messageBox.textContent = 'Please complete all fields.';
            messageBox.classList.add('error');

            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    name,
                    email,
                    comment,
                    page: getPageIdentifier()
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || 'Failed to submit comment.'
                );
            }

            form.reset();

            messageBox.textContent =
                'Thank you. Your comment has been submitted for review.';

            messageBox.classList.add('success');

        } catch (error) {
            console.error('Comment submission error:', error);

            messageBox.textContent =
                error.message || 'Unable to submit your comment.';

            messageBox.classList.add('error');

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Comment';
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Add Basic Styles
    |--------------------------------------------------------------------------
    */

    function addCommentsStyles() {
        if (document.getElementById('cocoabridge-comments-styles')) {
            return;
        }

        const style = document.createElement('style');

        style.id = 'cocoabridge-comments-styles';

        style.textContent = `
            .cocoabridge-comments-section {
                padding: 60px 0;
                margin-top: 40px;
                background: #f8f9fa;
            }

            .cocoabridge-comments-section .comments-header {
                margin-bottom: 30px;
            }

            .cocoabridge-comments-section .comments-header h2 {
                margin-bottom: 8px;
            }

            .cocoabridge-comments-section .comments-header p {
                margin: 0;
                color: #666;
            }

            .comments-list {
                margin-bottom: 40px;
            }

            .comment-item {
                display: flex;
                gap: 15px;
                padding: 20px;
                margin-bottom: 15px;
                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
            }

            .comment-avatar {
                width: 45px;
                height: 45px;
                min-width: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #2c1810;
                color: #fff;
                font-weight: 600;
            }

            .comment-content {
                flex: 1;
            }

            .comment-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            }

            .comment-meta span {
                color: #888;
                font-size: 13px;
            }

            .comment-content p {
                margin: 0;
                line-height: 1.7;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .comments-form-wrapper {
                max-width: 850px;
                padding: 30px;
                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
            }

            .comments-form-wrapper h3 {
                margin-bottom: 20px;
            }

            .comments-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            .comments-field {
                margin-bottom: 20px;
            }

            .comments-field label {
                display: block;
                margin-bottom: 7px;
                font-weight: 600;
            }

            .comments-field input,
            .comments-field textarea {
                width: 100%;
                padding: 12px 14px;
                border: 1px solid #ddd;
                border-radius: 5px;
                box-sizing: border-box;
            }

            .comments-field textarea {
                resize: vertical;
            }

            .comment-form-message {
                margin-top: 15px;
                font-weight: 500;
            }

            .comment-form-message.success {
                color: #198754;
            }

            .comment-form-message.error {
                color: #dc3545;
            }

            .comments-note {
                margin-top: 15px;
                margin-bottom: 0;
                color: #777;
                font-size: 13px;
            }

            .comments-loading,
            .no-comments,
            .comments-error {
                padding: 20px;
                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                color: #666;
            }

            @media (max-width: 767px) {
                .comments-form-row {
                    grid-template-columns: 1fr;
                    gap: 0;
                }

                .comments-form-wrapper {
                    padding: 20px;
                }

                .comment-item {
                    padding: 15px;
                }
            }
        `;

        document.head.appendChild(style);
    }


    /*
    |--------------------------------------------------------------------------
    | Initialize
    |--------------------------------------------------------------------------
    */

    function initComments() {
        createCommentsSection();
        addCommentsStyles();

        const form = document.getElementById('cocoabridge-comment-form');

        if (form) {
            form.addEventListener('submit', submitComment);
        }

        loadComments();
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComments);
    } else {
        initComments();
    }

})();
