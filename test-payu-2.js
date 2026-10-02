const fetch = require('node-fetch'); // wait, native fetch is in node 18
fetch('https://apitest.payu.in/webcheckoutpro/%20re3-6HvLARZ2LKbt_h5Iwns3Xw/')
  .then(res => {
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
  })
  .catch(console.error);
