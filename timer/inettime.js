/* 
   jshint esversion: 8
*/

class InternetTimeProvider {
  constructor() {
    this.lastFetchTime = null;
    this.localTimeAtFetch = null;
    this.serverTimeAtFetch = null;
    const cached = localStorage.getItem('internetTimeError');
    if (cached) {
        this.error = Number.parseInt(cached);
        console.log("reloaded internet time error at",this.error);

    } else {
        this.error = 0;
        this.fetchInternetTime().then(function(){
            location.reload();
        });
    }
  }

  async fetchInternetTime() {
    try {
      const response = await fetch('https://worldtimeapi.org/api/ip');
      const data = await response.json();
      this.serverTimeAtFetch = new Date(data.utc_datetime);
      this.localTimeAtFetch = new Date();
      this.lastFetchTime = Date.now();
      this.error = this.serverTimeAtFetch - this.localTimeAtFetch;
      localStorage.setItem('internetTimeError',this.error.toString());
      console.log("calculated internet time error at",this.error);
    } catch (error) {
      console.error('Error fetching internet time:', error);
    }
  }

  async getTime() {
    if (!this.lastFetchTime || (Date.now() - this.lastFetchTime > 3600000)) {
      await this.fetchInternetTime();
    }

    if (!this.serverTimeAtFetch || !this.localTimeAtFetch) {
      return new Date(); // Fallback to local time if fetching failed
    }

    const correctedTime = new Date(Date.now() + this.error);
    return correctedTime;
  }
  
  date(when) {
         if (this.error===undefined) {
          return new Date(when); 
        }
        if (when === undefined) {
            return new Date(Date.now() + this.error);
        } else {
            return new Date(when);
        }
      
  }
  
  now() {
        if (this.error===undefined) {
          return Date.now(); 
        } 
        
    return Date.now() + this.error;
  }
  
  resync () {
       localStorage.removeItem('internetTimeError');
       location.reload();
  }
  
  useLocal () {

     localStorage.setItem('internetTimeError','0');
     location.reload();
  }
  
}

// Example usage:
const timeProvider = new InternetTimeProvider();

console.log(timeProvider.date());
