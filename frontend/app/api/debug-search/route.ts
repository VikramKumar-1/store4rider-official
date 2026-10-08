import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
    try {
        const out = execSync('findstr /s /i "IStoreReview" c:\\Users\\vikur\\Downloads\\store4riders\\frontend\\*.ts c:\\Users\\vikur\\Downloads\\store4riders\\frontend\\*.tsx').toString();
        return NextResponse.json({ success: true, out });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stdout: e.stdout?.toString() });
    }
}
