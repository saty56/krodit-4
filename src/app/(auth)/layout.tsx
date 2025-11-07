import { headers } from "next/headers";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function AuthCheck({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session?.user) {
		redirect("/");
	}
	return <>{children}</>;
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100vh',
				width: '100%',
				background: 'var(--background, #fff)'
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{
						width: '40px',
						height: '40px',
						border: '4px solid #f3f3f3',
						borderTop: '4px solid #3498db',
						borderRadius: '50%',
						animation: 'spin 1s linear infinite',
						margin: '0 auto 16px'
					}} />
				</div>
			</div>
		}>
			<AuthCheck>{children}</AuthCheck>
		</Suspense>
	);
}


