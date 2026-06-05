import * as Notifications from 'expo-notifications';

// Cómo mostrar las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Solicita permisos al usuario (iOS los necesita explícitamente, Android 13+ también)
export const requestNotificationPermissions = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Parsea "DD/MM/YYYY" a un objeto Date a las 9 AM del día indicado
const parseDueDate = (due) => {
  const parts = due.split('/');
  if (parts.length !== 3) return null;
  const date = new Date(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[0], 10),
    9, 0, 0
  );
  return isNaN(date.getTime()) ? null : date;
};

// Programa una notificación local para el día de vencimiento a las 9 AM
// Retorna el ID de la notificación o null si la fecha ya pasó / es inválida
export const scheduleReminderNotification = async (name, due, amount) => {
  try {
    const date = parseDueDate(due);
    if (!date || date <= new Date()) return null;

    const body = amount > 0
      ? `Vence hoy · $${amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
      : 'Vence hoy';

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${name}`,
        body,
        sound: true,
      },
      trigger: { date },
    });

    return id;
  } catch (e) {
    return null;
  }
};

// Cancela una notificación programada por su ID
export const cancelReminderNotification = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {}
};
