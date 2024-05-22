// Toggle for event 
// Values: true / false
async function gameff(){
    // Set flagKey to the feature flag key
    const flagKey = "game";
  
      // Create context
      let context = sessionStorage.getItem("userContext");
      // convert context to JSON
      context = JSON.parse(context);
  
      // Initialise the LaunchDarkly client
      const clientSideId = getClientSideId();
      const client = LDClient.initialize(clientSideId, context);
  
    // 'ready' event listener
    client.on("ready", async () => {
      // Retrieve the value of the feature flag
      // 'open' is the default value if the flag is not available or if an error occurs
      const DivFlagValue = await client.variation(flagKey, "open");

  
      // Expose the flagValue globally
      window.DivFlagValue = DivFlagValue;
  
      console.log("LD: Flag value is", DivFlagValue);
      // Check what of the 2 values is returned from the feature flag [true, false]
      if (DivFlagValue) {
        console.log("Event is closed");

      } else {

        console.log("Event is open");
  
      }
  
      // Close the LaunchDarkly client
      await client.close();
    });
  
    // 'error' event listener
    client.on("error", (err) => {
      console.error("LaunchDarkly initialisation error:", err);
    });    
  
  
  };
  
  export {gameff};
  