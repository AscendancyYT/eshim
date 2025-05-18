// APIS
const USER_API = CONFIG.USERS_API;
const OCOINS_API = "https://67c8964c0acf98d07087272b.mockapi.io/oCoins";
const NCOINS_API = "https://67c8964c0acf98d07087272b.mockapi.io/nCoins";
const TRANSACTIONS_API =
  "https://67c8964c0acf98d07087272b.mockapi.io/transaction";
const WITHDRAWS_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";

// functions
const characters = 'ABCDEFGHIJKLMNOPQRSTUVXYZ0123456789';

function generateCode(length) {
    let result = '';
    
    // Loop to generate characters for the specified length
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}
