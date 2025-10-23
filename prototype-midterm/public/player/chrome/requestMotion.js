function requestMotion () {
    if ( typeof( DeviceMotionEvent ) !== "undefined" && typeof( DeviceMotionEvent.requestPermission ) === "function" ) {
        // (optional) Do something before API request prompt.
        DeviceMotionEvent.requestPermission()
            .then( response => {
            // (optional) Do something after API prompt dismissed.
            if ( response == "granted" ) {
                window.addEventListener( "devicemotion", handleMotion, true );  
            }
        })
            .catch( console.error )
    } else {
        alert( "DeviceMotionEvent is not defined" );
    }
  }

