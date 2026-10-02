const fs = require('fs');

const path = 'frontend/src/modules/checkout/components/CheckoutPaymentStep.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const GooglePayLogo = \(\) => \([\s\S]*?const RuPayLogo = \(\) => \([\s\S]*?<\/div>\s*\);\s*/;
content = content.replace(regex, '');

const newIconBlock = `      icon: (
        <div className="flex items-center gap-2 mt-2 flex-wrap opacity-90">
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/gpay.svg?v=3" alt="GPay" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/phonepe.svg?v=3" alt="PhonePe" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/paytm.svg?v=3" alt="Paytm" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/visa.svg?v=6" alt="VISA" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/mastercard.svg?v=5" alt="Mastercard" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/rupay.svg?v=4" alt="RuPay" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
        </div>
      )`;

const oldIconBlock = /icon:\s*\(\s*<div className="flex items-center gap-2 mt-2 flex-wrap opacity-90">\s*<GooglePayLogo \/>[\s\S]*?<\/div>\s*\)/;
content = content.replace(oldIconBlock, newIconBlock);

fs.writeFileSync(path, content);
console.log('Fixed icon rendering');
