fetch('https://apitest.payu.in/webcheckoutpro/')
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(text => console.log('Body:', text.slice(0, 100)))
  .catch(console.error);
