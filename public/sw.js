// Lumi Service Worker — handles push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Lumi', body: event.data.text() }
  }

  const { title = 'Lumi', body = '', url = '/today', icon = '/icons/icon-192.png' } = payload

  // Suppress the notification if the user already has the app open and focused.
  // This prevents a redundant "Lumi replied" banner while they're actively chatting.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const appIsFocused = clientList.some(c => c.focused)
      if (appIsFocused) return // Swallow — user is already looking at the app

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
