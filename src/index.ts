import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SERVER_URL = 'http://localhost:12347'; // Change this to your server's URL

function authenticate(username:string, password:string) {
  return axios.post(`${SERVER_URL}/authenticate`, { username, password })
      .then(response => response.data)
      .catch(error => {
        console.error('Authentication failed:', error.message);
        return null;
      });
}

function updateServerKey() {
  console.log('Server key update logic not implemented yet.');
  // Implement server key update logic here
}

function updateClientKey() {
  console.log('Client key update logic not implemented yet.');
  // Implement client key update logic here
}

function main() {
  rl.question('Username: ', username => {
    rl.question('Password: ', async password => {
      const authResponse = await authenticate(username, password);
      if (authResponse && authResponse.ticket) {
        console.log('Authentication Successful:', authResponse);
        rl.question('Update server key or client key? (server/client): ', answer => {
          if (answer === 'server') {
            updateServerKey();
          } else if (answer === 'client') {
            updateClientKey();
          } else {
            console.log('Invalid option');
          }
          rl.close();
        });
      } else {
        console.log('Authentication Failed');
        rl.close();
      }
    });
  });
}

main();
