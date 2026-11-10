import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Настройка за поведението на нотификациите във Foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Искане на разрешения и създаване на Android Канал
export async function registerForPushNotificationsAsync() {
  // Нотификационните канали на Android не се поддържат в уеб браузър
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        sound: 'default',
      });
    }

    if (!Device.isDevice) {
      console.log('Нотификациите изискват реално устройство.');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notification setup warning:', error);
    return false;
  }
}

// Изпращане на локална нотификация за ново съобщение
export async function showMessageNotification(senderName: string, messageText: string) {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${senderName}`,
        body: messageText,
        sound: 'default',
        data: { type: 'chat' },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to show notification:', error);
  }
}