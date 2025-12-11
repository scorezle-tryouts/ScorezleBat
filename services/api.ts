
export const subscribeToNewsletter = async (email: string, sport: string, batSize: string) => {
  // Check if we are in a development environment
  // @ts-ignore - import.meta is available in Vite
  const isDev = import.meta.env && import.meta.env.DEV;

  if (isDev) {
    console.log("DEV MODE: Simulating Subscription (No API call):", { email, sport, batSize });
    return;
  }

  try {
    // Call our own secure backend route
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        sport: sport,
        bat_recommendation: batSize
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Subscription Error:', result);
    } else {
      console.log('Success: Subscriber added securely via API');
    }
  } catch (error) {
    console.error('Failed to connect to subscription service:', error);
  }
};
