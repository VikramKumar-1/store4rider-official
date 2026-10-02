const crypto = require('crypto');
const key = 'gtKFFx';
const salt = '4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW';
const txnid = 'T' + Date.now() + 'ab12';
const amount = '500.00';
const productInfo = 'TestProduct';
const firstName = 'Test';
const email = 'test@example.com';
const hashString = key + '|' + txnid + '|' + amount + '|' + productInfo + '|' + firstName + '|' + email + '|||||||||||' + salt;
const hash = crypto.createHash('sha512').update(hashString).digest('hex');

const body = new URLSearchParams({
  key, txnid, amount, productinfo: productInfo, firstname: firstName, email, phone: '9876543210', hash, surl: 'https://store4riders.com/success', furl: 'https://store4riders.com/failure'
});

fetch('https://test.payu.in/_payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
  redirect: 'manual'
}).then(res => {
  console.log('Status:', res.status);
  console.log('Location:', res.headers.get('location'));
}).catch(console.error);
