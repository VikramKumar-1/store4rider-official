fetch('https://test.payu.in/_payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'test=1',
  redirect: 'manual'
}).then(res => {
  console.log('Status:', res.status);
  console.log('Type:', res.type);
  console.log('Location:', res.headers.get('location'));
}).catch(console.error);
