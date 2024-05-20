async function getUserContext() {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobi/i.test(userAgent);
    const isTablet = /Tablet/i.test(userAgent);
    const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

    // Create a new userKey if one does not exist on the session storage
    let userKey = sessionStorage.getItem('userKey');
    if (!userKey) {
      userKey = "user-" + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('userKey', userKey);
    }
    
    let osType = 'Unknown';
    if (/Android/i.test(userAgent)) {
      osType = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      osType = 'iOS';
    }

    const context = {
        kind: "user",
        key: userKey,
        device: deviceType,
        os: osType,
    };
  
    // Store the context in session storage
    sessionStorage.setItem('userContext', JSON.stringify(context));
  }

// Export the function for import in other files
module.exports = { getUserContext };