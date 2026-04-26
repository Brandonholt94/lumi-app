// Lumi Service Worker — handles push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Lumi', body: event.data.text() }
  }

  const {
    title = 'Lumi',
    body = '',
    url = '/today',
    icon = '/icons/icon-192.png',
    test = false,  // test notifications always show, even when app is open
  } = payload

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Only suppress if this is NOT a test notification AND the app window is focused.
      // We check visibilityState via postMessage because c.focused is unreliable in PWAs.
      const appIsOpen = clientList.length > 0
      if (!test && appIsOpen) {
        // Ask the open window if it's visible — suppress only if it confirms focus
        // For simplicity: suppress only when there's a focused client (standard non-PWA).
        // In a PWA the window is rarely truly "focused" when a push arrives.
        const trulyFocused = clientList.some(c => c.focused && c.visibilityState === 'visible')
        if (trulyFocused) return
      }

      return self.registration.showNotification(title, {
        body,
        icon,
        badge: '/icons/icon-192.png',
        data: { url },
        vibrate: [100, 50, 100],
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/today'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
