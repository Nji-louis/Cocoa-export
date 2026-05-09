function getAppBackend() {
  return window.AppBackend || {}
}

function notify(message, isError) {
  const backend = getAppBackend()
  if (backend.notify) {
    backend.notify(message, isError)
    return
  }
  if (message) {
    window.alert(message)
  }
}

function getValue(root, selector) {
  const field = root ? root.querySelector(selector) : null
  return field && field.value ? field.value.trim() : ''
}

function getFieldValue(root, selectors) {
  for (const selector of selectors) {
    const value = getValue(root, selector)
    if (value) return value
  }
  return ''
}

function setButtonBusy(button, busy, label) {
  if (!button) return
  if (busy) {
    button.dataset.prevLabel = button.innerHTML
    button.innerHTML = label || 'Submitting...'
    button.disabled = true
    return
  }
  if (button.dataset.prevLabel) {
    button.innerHTML = button.dataset.prevLabel
  }
  button.disabled = false
}

function getNewsletterSourceChannel() {
  const page = (location.pathname.split('/').pop() || 'unknown').replace('.html', '').toLowerCase()
  return 'newsletter_' + (page || 'unknown')
}

function getBlogSlug() {
  const hidden = document.getElementById('blog-detail-post-slug')
  if (hidden && hidden.value) return hidden.value.trim()

  const root = document.querySelector('.blog_d_page_li3[data-post-slug]')
  if (root && root.dataset && root.dataset.postSlug) return root.dataset.postSlug.trim()

  try {
    const params = new URLSearchParams(location.search)
    const slug = (params.get('slug') || '').trim()
    if (slug) return slug
  } catch (error) {
    // Ignore malformed URLs and fall back below.
  }

  return 'cameroon-mid-crop-update'
}

async function submitNewsletterForm(form) {
  const backend = getAppBackend()
  if (!backend.subscriptionApi || typeof backend.subscriptionApi.subscribe !== 'function') {
    throw new Error('Subscription service is not available')
  }

  const emailField = form.querySelector("input[name='EMAIL'], input[type='email']")
  const firstNameField = form.querySelector("input[name='FNAME']")
  const email = emailField && emailField.value ? emailField.value.trim() : ''
  const fullName = firstNameField && firstNameField.value ? firstNameField.value.trim() : ''

  if (!email) {
    notify('Please enter an email address.', true)
    return
  }

  const submitButton = form.querySelector("button[type='submit'], .mc-submit")
  setButtonBusy(submitButton, true, 'Subscribing...')
  try {
    await backend.subscriptionApi.subscribe({
      fullName,
      email,
      sourceChannel: getNewsletterSourceChannel(),
    })
    form.reset()
    notify('Subscription updated successfully.')
  } catch (error) {
    notify(error && error.message ? error.message : 'Failed to subscribe', true)
  } finally {
    setButtonBusy(submitButton, false)
  }
}

async function submitBlogComment(root, trigger) {
  const backend = getAppBackend()
  if (!backend.blogApi || typeof backend.blogApi.submitComment !== 'function') {
    throw new Error('Blog comments are not available')
  }

  const authorName = getFieldValue(root, [
    'input[name="authorName"]',
    'input[name="name"]',
    'input[placeholder="Name"]'
  ])
  const authorEmail = getFieldValue(root, [
    'input[name="authorEmail"]',
    'input[name="email"]',
    'input[type="email"]',
    'input[placeholder="Email"]'
  ])
  const message = getFieldValue(root, [
    'textarea[name="message"]',
    'textarea[placeholder="Message"]'
  ])

  if (!authorName || !authorEmail || !message) {
    notify('Please complete Name, Email, and Message before submitting.', true)
    return
  }

  const submitButton = trigger || root.querySelector('a.button_1, button.button_1')
  setButtonBusy(submitButton, true, 'Sending...')
  try {
    const payload = {
      postSlug: getBlogSlug(),
      authorName,
      authorEmail,
      message,
    }

    const response = await backend.blogApi.submitComment(payload)

    const nameField = root.querySelector('input[placeholder="Name"]')
    const emailField = root.querySelector('input[placeholder="Email"]')
    const messageField = root.querySelector('textarea[placeholder="Message"]')
    if (nameField) nameField.value = ''
    if (emailField) emailField.value = ''
    if (messageField) messageField.value = ''

    if (response && response.status === 'approved' && backend.blogPages && typeof backend.blogPages.refreshDetailComments === 'function') {
      await backend.blogPages.refreshDetailComments(payload.postSlug)
      notify('Comment posted successfully.')
    } else {
      if (backend.blogPages && typeof backend.blogPages.prependPendingComment === 'function') {
        backend.blogPages.prependPendingComment({
          id: response && response.commentId ? response.commentId : null,
          author_name: authorName,
          author_avatar_url: response && response.authorAvatarUrl ? response.authorAvatarUrl : null,
          author_user_id: response && response.authorUserId ? response.authorUserId : null,
          message,
          created_at: response && response.createdAt ? response.createdAt : new Date().toISOString(),
          status: response && response.status ? response.status : 'pending',
        })
      }
      notify('Comment submitted and shown live (pending moderation).')
    }
  } catch (error) {
    notify(error && error.message ? error.message : 'Failed to submit comment', true)
  } finally {
    setButtonBusy(submitButton, false)
  }
}

function bindNewsletterForms() {
  document.querySelectorAll('form.mc-newsletter-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      void submitNewsletterForm(form)
    })
  })
}

function bindBlogCommentForm() {
  const root = document.querySelector('.blog_d_page_li3')
  if (!root) return

  const form = root.querySelector('form')
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const submitTrigger = root.querySelector('button.button_1, a.button_1')
      void submitBlogComment(root, submitTrigger)
    })
  } else {
    const submitTrigger = root.querySelector('a.button_1, button.button_1')
    if (submitTrigger) {
      submitTrigger.addEventListener('click', (event) => {
        event.preventDefault()
        void submitBlogComment(root, submitTrigger)
      })
    }
  }

  const messageField = root.querySelector('textarea[placeholder="Message"]')
  if (messageField) {
    messageField.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      const submitTrigger = root.querySelector('button.button_1, a.button_1')
      void submitBlogComment(root, submitTrigger)
    })
  }
}

function init() {
  bindNewsletterForms()
  bindBlogCommentForm()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
