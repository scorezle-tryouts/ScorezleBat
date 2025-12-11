// MailerLite Integration
// NOTE: In a production environment, this key should be managed via environment variables 
// and calls should ideally be routed through a backend proxy to prevent CORS issues and key exposure.

const MAILERLITE_API_KEY = 'REPLACE_WITH_YOUR_MAILERLITE_KEY'; 
const GROUP_ID = '173526065051862853';

export const subscribeToNewsletter = async (email: string, sport: string, batSize: string) => {
  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: email,
        groups: [GROUP_ID],
        fields: {
          sport: sport,
          bat_recommendation: batSize
        }
      })
    });

    if (!response.ok) {
      console.error('MailerLite Error:', await response.text());
    } else {
      console.log('Success: Subscriber added to MailerLite');
    }
  } catch (error) {
    // Prevent app crash on network failure
    console.error('Failed to subscribe:', error);
  }
};